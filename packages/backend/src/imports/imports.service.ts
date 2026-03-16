import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

// Known field mappings for auto-detection
const FIELD_ALIASES: Record<string, string[]> = {
  convidado: ['convidado', 'guest', 'name', 'nome', 'full name', 'fullname', 'guest name', 'nome completo', 'invitado'],
  empresa: ['empresa', 'company', 'organization', 'org', 'companhia', 'empresa/org', 'institution'],
  telephone: ['telephone', 'phone', 'tel', 'telefone', 'mobile', 'cell', 'celular', 'phone number'],
  email: ['email', 'e-mail', 'email address', 'correo'],
  guestType: ['guest type', 'type', 'tipo', 'guest_type', 'guesttype', 'category'],
  status: ['status', 'estado', 'invitation status'],
  rsvpStatus: ['rsvp', 'rsvp status', 'rsvp_status', 'rsvpstatus', 'response', 'resposta'],
  vipLevel: ['vip', 'vip level', 'vip_level', 'viplevel', 'priority'],
  dietaryRestrictions: ['dietary', 'dietary restrictions', 'diet', 'food restrictions', 'restricoes alimentares', 'dietary_restrictions'],
  notes: ['notes', 'note', 'comments', 'observations', 'observacoes', 'notas'],
  linkedGroupName: ['group', 'group name', 'linked group', 'grupo', 'linked_group_name'],
  seatPreference: ['seat preference', 'seat pref', 'table preference', 'seat_preference', 'preferencia'],
  avoidWith: ['avoid', 'avoid with', 'keep apart', 'avoid_with', 'evitar'],
};

@Injectable()
export class ImportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  parseFile(buffer: Buffer, fileName: string): { headers: string[]; rows: Record<string, any>[] } {
    const ext = fileName.toLowerCase().split('.').pop();

    if (ext === 'csv' || ext === 'txt') {
      const content = buffer.toString('utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      return { headers, rows: records };
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { headers, rows };
    }

    throw new BadRequestException(`Unsupported file format: ${ext}. Use .csv, .xlsx, or .xls`);
  }

  autoMapColumns(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    for (const header of headers) {
      const normalized = header.toLowerCase().trim().replace(/[_\-\.]/g, ' ');
      let matched = false;

      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
          mapping[header] = field;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Mark as custom field candidate
        mapping[header] = `custom:${header}`;
      }
    }

    return mapping;
  }

  async preview(eventId: string, buffer: Buffer, fileName: string) {
    const { headers, rows } = this.parseFile(buffer, fileName);
    const autoMapping = this.autoMapColumns(headers);
    const previewRows = rows.slice(0, 10);

    return {
      headers,
      autoMapping,
      previewRows,
      totalRows: rows.length,
      fileName,
    };
  }

  async detectDuplicates(eventId: string, rows: Record<string, any>[], mapping: Record<string, string>) {
    const duplicates: { rowIndex: number; existingGuestId: string; matchField: string; matchValue: string }[] = [];

    const existingGuests = await this.prisma.guest.findMany({
      where: { eventId },
      select: { id: true, convidado: true, email: true, telephone: true },
    });

    const nameIndex = new Map(existingGuests.map((g: any) => [g.convidado.toLowerCase().trim(), g.id]));
    const emailIndex = new Map(existingGuests.filter((g: any) => g.email).map((g: any) => [g.email!.toLowerCase().trim(), g.id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const mappedRow = this.applyMapping(row, mapping);

      // Check by email first (higher confidence)
      if (mappedRow.email) {
        const existingId = emailIndex.get(mappedRow.email.toLowerCase().trim());
        if (existingId) {
          duplicates.push({ rowIndex: i, existingGuestId: existingId as string, matchField: 'email', matchValue: mappedRow.email });
          continue;
        }
      }

      // Check by name
      if (mappedRow.convidado) {
        const existingId = nameIndex.get(mappedRow.convidado.toLowerCase().trim());
        if (existingId) {
          duplicates.push({ rowIndex: i, existingGuestId: existingId as string, matchField: 'convidado', matchValue: mappedRow.convidado });
        }
      }
    }

    return duplicates;
  }

  private applyMapping(row: Record<string, any>, mapping: Record<string, string>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [sourceCol, targetField] of Object.entries(mapping)) {
      if (!targetField.startsWith('custom:') && targetField !== 'skip') {
        result[targetField] = row[sourceCol] !== undefined ? String(row[sourceCol]).trim() : null;
      }
    }
    return result;
  }

  async executeImport(
    eventId: string,
    buffer: Buffer,
    fileName: string,
    fileSize: number,
    mapping: Record<string, string>,
    duplicateStrategy: 'skip' | 'update' | 'create',
    userId: string,
  ) {
    const { rows } = this.parseFile(buffer, fileName);

    // Create the import job
    const importJob = await this.prisma.importJob.create({
      data: {
        eventId,
        fileName,
        fileSize,
        totalRows: rows.length,
        status: 'PROCESSING',
        columnMapping: mapping,
        importedBy: userId,
      },
    });

    let importedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;

    // Detect duplicates
    const duplicates = await this.detectDuplicates(eventId, rows, mapping);
    const duplicateMap = new Map(duplicates.map(d => [d.rowIndex, d]));

    // Get custom field mappings
    const customMappings = Object.entries(mapping)
      .filter(([_, target]) => target.startsWith('custom:'))
      .map(([source, target]) => ({ source, fieldName: target.replace('custom:', '') }));

    for (let i = 0; i < rows.length; i++) {
      try {
        const mappedData = this.applyMapping(rows[i], mapping);
        const duplicate = duplicateMap.get(i);

        if (!mappedData.convidado) {
          // Create import row record for tracking
          await this.prisma.importRow.create({
            data: {
              importJobId: importJob.id,
              rowNumber: i + 1,
              rawData: rows[i],
              mappedData,
              status: 'ERROR',
              errorMessage: 'Missing required field: convidado (guest name)',
            },
          });
          errorRows++;
          continue;
        }

        if (duplicate) {
          if (duplicateStrategy === 'skip') {
            await this.prisma.importRow.create({
              data: {
                importJobId: importJob.id,
                rowNumber: i + 1,
                rawData: rows[i],
                mappedData,
                status: 'SKIPPED',
                duplicateGuestId: duplicate.existingGuestId,
              },
            });
            skippedRows++;
            continue;
          }

          if (duplicateStrategy === 'update') {
            await this.prisma.guest.update({
              where: { id: duplicate.existingGuestId },
              data: {
                ...this.sanitizeGuestData(mappedData),
                importedFileName: fileName,
                importedRowNumber: i + 1,
              },
            });
            await this.prisma.importRow.create({
              data: {
                importJobId: importJob.id,
                rowNumber: i + 1,
                rawData: rows[i],
                mappedData,
                status: 'IMPORTED',
                duplicateGuestId: duplicate.existingGuestId,
              },
            });
            importedRows++;
            continue;
          }
        }

        // Create new guest
        const guest = await this.prisma.guest.create({
          data: {
            eventId,
            ...this.sanitizeGuestData(mappedData),
            importedFileName: fileName,
            importedRowNumber: i + 1,
          },
        });

        // Handle custom field values
        for (const cm of customMappings) {
          const value = rows[i][cm.source];
          if (value !== undefined && value !== null && value !== '') {
            // Find or create the custom field
            let field = await this.prisma.customField.findFirst({
              where: { eventId, fieldName: cm.fieldName },
            });
            if (!field) {
              field = await this.prisma.customField.create({
                data: { eventId, fieldName: cm.fieldName, fieldType: 'TEXT' },
              });
            }
            await this.prisma.customFieldValue.create({
              data: { guestId: guest.id, fieldId: field.id, value: String(value) },
            });
          }
        }

        await this.prisma.importRow.create({
          data: {
            importJobId: importJob.id,
            rowNumber: i + 1,
            rawData: rows[i],
            mappedData,
            status: 'IMPORTED',
          },
        });
        importedRows++;
      } catch (err: any) {
        await this.prisma.importRow.create({
          data: {
            importJobId: importJob.id,
            rowNumber: i + 1,
            rawData: rows[i],
            mappedData: this.applyMapping(rows[i], mapping),
            status: 'ERROR',
            errorMessage: err.message || 'Unknown error',
          },
        });
        errorRows++;
      }
    }

    // Update import job status
    const finalStatus = errorRows === rows.length ? 'FAILED' : errorRows > 0 ? 'PARTIAL' : 'COMPLETED';
    const updatedJob = await this.prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        importedRows,
        skippedRows,
        errorRows,
        status: finalStatus,
        completedAt: new Date(),
      },
    });

    await this.audit.log(userId, eventId, 'ImportJob', importJob.id, 'IMPORT_COMPLETED',
      `Imported ${importedRows} guests from "${fileName}" (${skippedRows} skipped, ${errorRows} errors)`);

    return updatedJob;
  }

  private sanitizeGuestData(data: Record<string, any>) {
    const sanitized: Record<string, any> = {};
    const validFields = [
      'convidado', 'empresa', 'telephone', 'email', 'notes',
      'dietaryRestrictions', 'linkedGroupName', 'seatPreference', 'avoidWith',
    ];
    const enumFields: Record<string, string[]> = {
      guestType: ['Guest', 'Spouse', 'Officer', 'Other'],
      status: ['Invited', 'Confirmed', 'Declined', 'Waitlist', 'No_Response', 'Checked_In'],
      rsvpStatus: ['Pending', 'Confirmed', 'Declined'],
      vipLevel: ['None', 'VIP', 'VVIP'],
    };

    for (const field of validFields) {
      if (data[field] !== undefined && data[field] !== null) {
        sanitized[field] = data[field];
      }
    }

    for (const [field, validValues] of Object.entries(enumFields)) {
      if (data[field]) {
        const normalized = String(data[field]).trim();
        const match = validValues.find(v => v.toLowerCase() === normalized.toLowerCase());
        if (match) sanitized[field] = match;
      }
    }

    return sanitized;
  }

  async getImportJobs(eventId: string) {
    return this.prisma.importJob.findMany({
      where: { eventId },
      include: { user: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getImportJobDetails(id: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id },
      include: {
        rows: { orderBy: { rowNumber: 'asc' } },
        user: { select: { displayName: true } },
      },
    });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  // Mapping templates
  async getMappingTemplates() {
    return this.prisma.mappingTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async saveMappingTemplate(data: { templateName: string; mappings: any; createdBy: string }) {
    return this.prisma.mappingTemplate.create({ data });
  }

  async deleteMappingTemplate(id: string) {
    await this.prisma.mappingTemplate.delete({ where: { id } });
    return { success: true };
  }
}
