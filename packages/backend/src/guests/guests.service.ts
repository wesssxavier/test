import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GuestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private readonly defaultInclude = {
    seatingAssignment: { include: { table: true } },
    customFieldValues: true,
  };

  async findByEvent(eventId: string, query?: {
    search?: string;
    status?: string;
    rsvpStatus?: string;
    vipLevel?: string;
    guestType?: string;
    hasTable?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = { eventId };

    if (query?.search) {
      where.OR = [
        { convidado: { contains: query.search, mode: 'insensitive' } },
        { empresa: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { telephone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.status) where.status = query.status as any;
    if (query?.rsvpStatus) where.rsvpStatus = query.rsvpStatus as any;
    if (query?.vipLevel) where.vipLevel = query.vipLevel as any;
    if (query?.guestType) where.guestType = query.guestType as any;
    if (query?.hasTable === 'true') where.seatingAssignment = { isNot: null };
    if (query?.hasTable === 'false') where.seatingAssignment = { is: null };

    const orderBy: any = {};
    if (query?.sortBy) {
      orderBy[query.sortBy] = query?.sortDir || 'asc';
    } else {
      orderBy.createdAt = 'asc';
    }

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 200;

    const [data, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        include: this.defaultInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.guest.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        ...this.defaultInclude,
        relationshipsFrom: { include: { relatedGuest: true } },
        relationshipsTo: { include: { guest: true } },
      },
    });
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async create(data: any, userId: string) {
    const guest = await this.prisma.guest.create({
      data,
      include: this.defaultInclude,
    });
    await this.audit.log(userId, data.eventId, 'Guest', guest.id, 'GUEST_CREATED', `Created guest: ${guest.convidado}`);
    return guest;
  }

  async update(id: string, data: any, userId: string) {
    const existing = await this.prisma.guest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Guest not found');

    const guest = await this.prisma.guest.update({
      where: { id },
      data,
      include: this.defaultInclude,
    });

    const changes: string[] = [];
    if (data.rsvpStatus && data.rsvpStatus !== existing.rsvpStatus) changes.push(`RSVP: ${existing.rsvpStatus} -> ${data.rsvpStatus}`);
    if (data.status && data.status !== existing.status) changes.push(`Status: ${existing.status} -> ${data.status}`);

    await this.audit.log(userId, existing.eventId, 'Guest', id, changes.some(c => c.startsWith('RSVP')) ? 'RSVP_CHANGED' : 'GUEST_UPDATED',
      changes.length ? changes.join(', ') : `Updated guest: ${guest.convidado}`,
      { before: existing, after: data }
    );
    return guest;
  }

  async bulkUpdate(guestIds: string[], data: any, userId: string) {
    const result = await this.prisma.guest.updateMany({
      where: { id: { in: guestIds } },
      data,
    });
    for (const guestId of guestIds) {
      await this.audit.log(userId, null, 'Guest', guestId, 'GUEST_UPDATED', `Bulk updated`, { updates: data });
    }
    return result;
  }

  async remove(id: string, userId: string) {
    const guest = await this.prisma.guest.findUnique({ where: { id } });
    if (!guest) throw new NotFoundException('Guest not found');
    await this.prisma.guest.delete({ where: { id } });
    await this.audit.log(userId, guest.eventId, 'Guest', id, 'GUEST_DELETED', `Deleted guest: ${guest.convidado}`);
    return { success: true };
  }

  async bulkDelete(guestIds: string[], userId: string) {
    await this.prisma.guest.deleteMany({ where: { id: { in: guestIds } } });
    return { success: true, count: guestIds.length };
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.guest.findUnique({ where: { id } });
    if (!original) throw new NotFoundException('Guest not found');
    const { id: _, createdAt, updatedAt, ...data } = original;
    data.convidado = `${data.convidado} (copy)`;
    return this.create(data, userId);
  }
}
