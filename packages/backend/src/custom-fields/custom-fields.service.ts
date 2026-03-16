import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PrismaService) {}

  async findByEvent(eventId: string) {
    return this.prisma.customField.findMany({
      where: { OR: [{ eventId }, { eventId: null }] },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.customField.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.customField.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.customField.delete({ where: { id } });
    return { success: true };
  }

  async reorder(fieldIds: string[]) {
    const updates = fieldIds.map((id, index) =>
      this.prisma.customField.update({ where: { id }, data: { sortOrder: index } })
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }

  async setFieldValue(guestId: string, fieldId: string, value: string) {
    return this.prisma.customFieldValue.upsert({
      where: { guestId_fieldId: { guestId, fieldId } },
      update: { value },
      create: { guestId, fieldId, value },
    });
  }

  async getFieldValues(guestId: string) {
    return this.prisma.customFieldValue.findMany({
      where: { guestId },
      include: { field: true },
    });
  }

  async bulkSetFieldValues(guestIds: string[], fieldId: string, value: string) {
    const operations = guestIds.map(guestId =>
      this.prisma.customFieldValue.upsert({
        where: { guestId_fieldId: { guestId, fieldId } },
        update: { value },
        create: { guestId, fieldId, value },
      })
    );
    await this.prisma.$transaction(operations);
    return { success: true, count: guestIds.length };
  }
}
