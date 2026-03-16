import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedViewsService {
  constructor(private prisma: PrismaService) {}

  async findByEvent(eventId: string) {
    return this.prisma.savedView.findMany({
      where: { OR: [{ eventId }, { eventId: null }] },
      orderBy: [{ isDefault: 'desc' }, { viewName: 'asc' }],
    });
  }

  async create(data: any, userId: string) {
    return this.prisma.savedView.create({
      data: { ...data, createdBy: userId },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.savedView.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.savedView.delete({ where: { id } });
  }
}
