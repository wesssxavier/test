import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findByEvent(eventId: string) {
    return this.prisma.roomTable.findMany({
      where: { eventId },
      include: {
        seatingAssignments: {
          include: { guest: true },
        },
        _count: { select: { seatingAssignments: true } },
      },
      orderBy: { tableName: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.roomTable.findUnique({
      where: { id },
      include: {
        seatingAssignments: {
          include: { guest: true },
          orderBy: { seatNumber: 'asc' },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async create(data: any) {
    return this.prisma.roomTable.create({
      data,
      include: {
        seatingAssignments: { include: { guest: true } },
        _count: { select: { seatingAssignments: true } },
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.roomTable.update({
      where: { id },
      data,
      include: {
        seatingAssignments: { include: { guest: true } },
        _count: { select: { seatingAssignments: true } },
      },
    });
  }

  async remove(id: string) {
    await this.prisma.roomTable.delete({ where: { id } });
    return { success: true };
  }

  async bulkCreate(eventId: string, tables: any[]) {
    const created = [];
    for (const table of tables) {
      const result = await this.prisma.roomTable.create({
        data: { ...table, eventId },
        include: { _count: { select: { seatingAssignments: true } } },
      });
      created.push(result);
    }
    return created;
  }

  async bulkUpdatePositions(updates: { id: string; xPosition: number; yPosition: number; rotation?: number }[]) {
    const results = [];
    for (const update of updates) {
      const result = await this.prisma.roomTable.update({
        where: { id: update.id },
        data: {
          xPosition: update.xPosition,
          yPosition: update.yPosition,
          ...(update.rotation !== undefined && { rotation: update.rotation }),
        },
      });
      results.push(result);
    }
    return results;
  }
}
