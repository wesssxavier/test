import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface SeatingWarning {
  type: 'OVER_CAPACITY' | 'AVOID_CONFLICT' | 'SEPARATED_COUPLE' | 'SEPARATED_GROUP' | 'VIP_PLACEMENT' | 'RULE_VIOLATION';
  severity: 'error' | 'warning' | 'info';
  message: string;
  tableId?: string;
  guestIds?: string[];
}

@Injectable()
export class SeatingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getAssignments(eventId: string) {
    return this.prisma.seatingAssignment.findMany({
      where: { eventId },
      include: {
        guest: true,
        table: true,
      },
    });
  }

  async assignGuest(eventId: string, data: { guestId: string; tableId: string; seatNumber?: number }, userId: string) {
    const table = await this.prisma.roomTable.findUnique({
      where: { id: data.tableId },
      include: { _count: { select: { seatingAssignments: true } } },
    });
    if (!table) throw new NotFoundException('Table not found');

    // Check capacity
    const currentCount = table._count.seatingAssignments;
    if (currentCount >= table.capacity) {
      throw new BadRequestException(`Table "${table.tableName}" is at full capacity (${table.capacity})`);
    }

    // Upsert the assignment
    const assignment = await this.prisma.seatingAssignment.upsert({
      where: { eventId_guestId: { eventId, guestId: data.guestId } },
      update: { tableId: data.tableId, seatNumber: data.seatNumber },
      create: {
        eventId,
        guestId: data.guestId,
        tableId: data.tableId,
        seatNumber: data.seatNumber,
      },
      include: { guest: true, table: true },
    });

    await this.audit.log(userId, eventId, 'SeatingAssignment', assignment.id, 'SEAT_ASSIGNED',
      `Assigned ${assignment.guest.convidado} to table ${assignment.table.tableName}`);

    return assignment;
  }

  async unassignGuest(eventId: string, guestId: string, userId: string) {
    const assignment = await this.prisma.seatingAssignment.findUnique({
      where: { eventId_guestId: { eventId, guestId } },
      include: { guest: true, table: true },
    });
    if (!assignment) throw new NotFoundException('Seating assignment not found');

    await this.prisma.seatingAssignment.delete({
      where: { id: assignment.id },
    });

    await this.audit.log(userId, eventId, 'SeatingAssignment', assignment.id, 'SEAT_UNASSIGNED',
      `Removed ${assignment.guest.convidado} from table ${assignment.table.tableName}`);

    return { success: true };
  }

  async moveGuest(eventId: string, data: { guestId: string; fromTableId: string; toTableId: string; seatNumber?: number }, userId: string) {
    return this.assignGuest(eventId, { guestId: data.guestId, tableId: data.toTableId, seatNumber: data.seatNumber }, userId);
  }

  async bulkAssign(eventId: string, assignments: { guestId: string; tableId: string; seatNumber?: number }[], userId: string) {
    const results = [];
    for (const assignment of assignments) {
      const result = await this.assignGuest(eventId, assignment, userId);
      results.push(result);
    }
    return results;
  }

  async clearAllAssignments(eventId: string, userId: string) {
    const count = await this.prisma.seatingAssignment.count({ where: { eventId } });
    await this.prisma.seatingAssignment.deleteMany({ where: { eventId } });
    await this.audit.log(userId, eventId, 'SeatingAssignment', eventId, 'SEATS_CLEARED', `Cleared all ${count} seating assignments`);
    return { success: true, count };
  }

  async getWarnings(eventId: string): Promise<SeatingWarning[]> {
    const warnings: SeatingWarning[] = [];

    // Get all tables with assignments
    const tables = await this.prisma.roomTable.findMany({
      where: { eventId },
      include: {
        seatingAssignments: { include: { guest: true } },
      },
    });

    // Get all relationships for this event
    const relationships = await this.prisma.guestRelationship.findMany({
      where: { eventId },
      include: { guest: true, relatedGuest: true },
    });

    // Get rules for this event
    const rules = await this.prisma.rule.findMany({
      where: { eventId, isActive: true },
    });

    // Check over-capacity tables
    for (const table of tables) {
      if (table.seatingAssignments.length > table.capacity) {
        warnings.push({
          type: 'OVER_CAPACITY',
          severity: 'error',
          message: `Table "${table.tableName}" has ${table.seatingAssignments.length} guests but capacity is ${table.capacity}`,
          tableId: table.id,
        });
      }
    }

    // Check AvoidTable relationships - guests who should not be at the same table
    const avoidRelationships = relationships.filter(r => r.relationshipType === 'AvoidTable');
    for (const rel of avoidRelationships) {
      const guestTable = tables.find(t => t.seatingAssignments.some(a => a.guestId === rel.guestId));
      const relatedTable = tables.find(t => t.seatingAssignments.some(a => a.guestId === rel.relatedGuestId));
      if (guestTable && relatedTable && guestTable.id === relatedTable.id) {
        warnings.push({
          type: 'AVOID_CONFLICT',
          severity: 'error',
          message: `"${rel.guest.convidado}" and "${rel.relatedGuest.convidado}" should not be at the same table ("${guestTable.tableName}")`,
          tableId: guestTable.id,
          guestIds: [rel.guestId, rel.relatedGuestId],
        });
      }
    }

    // Check Spouse/Companion relationships - should be at the same table
    const keepTogetherTypes = ['Spouse', 'Companion', 'SameTable', 'KeepClose'];
    const keepTogether = relationships.filter(r => keepTogetherTypes.includes(r.relationshipType));
    for (const rel of keepTogether) {
      const guestTable = tables.find(t => t.seatingAssignments.some(a => a.guestId === rel.guestId));
      const relatedTable = tables.find(t => t.seatingAssignments.some(a => a.guestId === rel.relatedGuestId));
      if (guestTable && relatedTable && guestTable.id !== relatedTable.id) {
        const severity = (rel.relationshipType === 'Spouse' || rel.relationshipType === 'Companion') ? 'warning' : 'info';
        warnings.push({
          type: rel.relationshipType === 'Spouse' ? 'SEPARATED_COUPLE' : 'SEPARATED_GROUP',
          severity,
          message: `"${rel.guest.convidado}" (${rel.relationshipType}) "${rel.relatedGuest.convidado}" are at different tables: "${guestTable.tableName}" and "${relatedTable.tableName}"`,
          guestIds: [rel.guestId, rel.relatedGuestId],
        });
      }
    }

    // Check avoidWith field on guests
    const allAssignedGuests = tables.flatMap(t => t.seatingAssignments.map(a => ({ ...a.guest, tableId: t.id, tableName: t.tableName })));
    for (const guest of allAssignedGuests) {
      if (guest.avoidWith) {
        const avoidNames = guest.avoidWith.split(',').map((n: string) => n.trim().toLowerCase());
        const sameTableGuests = allAssignedGuests.filter(g => g.tableId === guest.tableId && g.id !== guest.id);
        for (const tablemate of sameTableGuests) {
          if (avoidNames.some((name: string) => tablemate.convidado.toLowerCase().includes(name))) {
            warnings.push({
              type: 'AVOID_CONFLICT',
              severity: 'warning',
              message: `"${guest.convidado}" should avoid "${tablemate.convidado}" but they are at the same table "${guest.tableName}"`,
              tableId: guest.tableId,
              guestIds: [guest.id, tablemate.id],
            });
          }
        }
      }
    }

    // Check custom rules
    for (const rule of rules) {
      const config = rule.config as any;
      if (rule.ruleType === 'MAX_VIP_PER_TABLE' && config.maxVip) {
        for (const table of tables) {
          const vipCount = table.seatingAssignments.filter(
            a => a.guest.vipLevel === 'VIP' || a.guest.vipLevel === 'VVIP'
          ).length;
          if (vipCount > config.maxVip) {
            warnings.push({
              type: 'RULE_VIOLATION',
              severity: 'warning',
              message: `Table "${table.tableName}" has ${vipCount} VIP guests (max: ${config.maxVip})`,
              tableId: table.id,
            });
          }
        }
      }

      if (rule.ruleType === 'SAME_COMPANY_TABLE' && config.maxSameCompany) {
        for (const table of tables) {
          const companies: Record<string, number> = {};
          for (const a of table.seatingAssignments) {
            if (a.guest.empresa) {
              companies[a.guest.empresa] = (companies[a.guest.empresa] || 0) + 1;
            }
          }
          for (const [company, count] of Object.entries(companies)) {
            if (count > config.maxSameCompany) {
              warnings.push({
                type: 'RULE_VIOLATION',
                severity: 'info',
                message: `Table "${table.tableName}" has ${count} guests from "${company}" (max: ${config.maxSameCompany})`,
                tableId: table.id,
              });
            }
          }
        }
      }
    }

    return warnings;
  }

  // Rules CRUD
  async getRules(eventId: string) {
    return this.prisma.rule.findMany({ where: { eventId }, orderBy: { createdAt: 'asc' } });
  }

  async createRule(eventId: string, data: { ruleType: string; config: any }) {
    return this.prisma.rule.create({ data: { ...data, eventId } });
  }

  async updateRule(id: string, data: { config?: any; isActive?: boolean }) {
    return this.prisma.rule.update({ where: { id }, data });
  }

  async deleteRule(id: string) {
    await this.prisma.rule.delete({ where: { id } });
    return { success: true };
  }
}
