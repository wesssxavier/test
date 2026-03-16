import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportGuests(eventId: string, format: 'xlsx' | 'csv', options?: {
    columns?: string[];
    filters?: Record<string, any>;
    includeCustomFields?: boolean;
  }): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const guests = await this.prisma.guest.findMany({
      where: { eventId, ...this.buildFilters(options?.filters) },
      include: {
        seatingAssignment: { include: { table: true } },
        customFieldValues: { include: { field: true } },
      },
      orderBy: { convidado: 'asc' },
    });

    // Build rows
    const defaultColumns = [
      'convidado', 'empresa', 'telephone', 'email',
      'guestType', 'status', 'rsvpStatus', 'vipLevel',
      'dietaryRestrictions', 'notes', 'linkedGroupName',
      'tableName', 'seatNumber', 'checkedIn',
    ];

    const columns = options?.columns || defaultColumns;

    const rows = guests.map((guest: any) => {
      const row: Record<string, any> = {};

      for (const col of columns) {
        switch (col) {
          case 'tableName':
            row['Table'] = guest.seatingAssignment?.table?.tableName || '';
            break;
          case 'seatNumber':
            row['Seat #'] = guest.seatingAssignment?.seatNumber || '';
            break;
          case 'checkedIn':
            row['Checked In'] = guest.checkedIn ? 'Yes' : 'No';
            break;
          case 'checkedInAt':
            row['Checked In At'] = guest.checkedInAt ? guest.checkedInAt.toISOString() : '';
            break;
          default:
            row[this.formatColumnHeader(col)] = (guest as any)[col] ?? '';
        }
      }

      // Include custom field values
      if (options?.includeCustomFields !== false) {
        for (const cfv of guest.customFieldValues) {
          row[cfv.field.fieldName] = cfv.value;
        }
      }

      return row;
    });

    const eventName = event?.eventName || 'export';
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return {
        buffer: Buffer.from(csv, 'utf-8'),
        fileName: `${eventName}_guests_${timestamp}.csv`,
        mimeType: 'text/csv',
      };
    }

    // XLSX
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || '').length).slice(0, 100)) + 2,
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');

    // Add summary sheet
    const summaryData = [
      { Metric: 'Total Guests', Value: guests.length },
      { Metric: 'Confirmed', Value: guests.filter((g: any) => g.rsvpStatus === 'Confirmed').length },
      { Metric: 'Pending', Value: guests.filter((g: any) => g.rsvpStatus === 'Pending').length },
      { Metric: 'Declined', Value: guests.filter((g: any) => g.rsvpStatus === 'Declined').length },
      { Metric: 'Checked In', Value: guests.filter((g: any) => g.checkedIn).length },
      { Metric: 'VIP', Value: guests.filter((g: any) => g.vipLevel === 'VIP').length },
      { Metric: 'VVIP', Value: guests.filter((g: any) => g.vipLevel === 'VVIP').length },
      { Metric: 'Seated', Value: guests.filter((g: any) => g.seatingAssignment).length },
      { Metric: 'Unseated', Value: guests.filter((g: any) => !g.seatingAssignment).length },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    return {
      buffer,
      fileName: `${eventName}_guests_${timestamp}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  async exportSeatingChart(eventId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const tables = await this.prisma.roomTable.findMany({
      where: { eventId },
      include: {
        seatingAssignments: {
          include: { guest: true },
          orderBy: { seatNumber: 'asc' },
        },
      },
      orderBy: { tableName: 'asc' },
    });

    const workbook = XLSX.utils.book_new();

    // Create a sheet per table
    const allRows: any[] = [];
    for (const table of tables) {
      for (const assignment of table.seatingAssignments) {
        allRows.push({
          'Table': table.tableName,
          'Seat #': assignment.seatNumber || '',
          'Guest Name': assignment.guest.convidado,
          'Company': assignment.guest.empresa || '',
          'VIP': assignment.guest.vipLevel !== 'None' ? assignment.guest.vipLevel : '',
          'Dietary': assignment.guest.dietaryRestrictions || '',
          'Notes': assignment.guest.notes || '',
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(allRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seating Chart');

    const timestamp = new Date().toISOString().split('T')[0];
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

    return {
      buffer,
      fileName: `${event?.eventName || 'event'}_seating_${timestamp}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private formatColumnHeader(col: string): string {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }

  private buildFilters(filters?: Record<string, any>) {
    if (!filters) return {};
    const where: Record<string, any> = {};
    if (filters.status) where.status = filters.status;
    if (filters.rsvpStatus) where.rsvpStatus = filters.rsvpStatus;
    if (filters.vipLevel) where.vipLevel = filters.vipLevel;
    if (filters.guestType) where.guestType = filters.guestType;
    return where;
  }
}
