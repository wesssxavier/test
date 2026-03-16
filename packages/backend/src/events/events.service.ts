import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.event.findMany({
      include: { _count: { select: { guests: true, roomTables: true } } },
      orderBy: { eventDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { guests: true, roomTables: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(data: any, userId: string) {
    return this.prisma.event.create({
      data: { ...data, eventDate: new Date(data.eventDate), createdBy: userId },
      include: { _count: { select: { guests: true, roomTables: true } } },
    });
  }

  async update(id: string, data: any) {
    if (data.eventDate) data.eventDate = new Date(data.eventDate);
    return this.prisma.event.update({
      where: { id },
      data,
      include: { _count: { select: { guests: true, roomTables: true } } },
    });
  }

  async remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
