import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomElementsService {
  constructor(private prisma: PrismaService) {}

  async findByEvent(eventId: string) {
    return this.prisma.roomElement.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.roomElement.create({ data });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.roomElement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Room element not found');
    return this.prisma.roomElement.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.roomElement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Room element not found');
    await this.prisma.roomElement.delete({ where: { id } });
    return { success: true };
  }
}
