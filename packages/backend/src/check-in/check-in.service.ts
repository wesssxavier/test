import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CheckInService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async checkIn(eventId: string, guestId: string, userId: string, notes?: string) {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Guest not found');
    if (guest.checkedIn) throw new BadRequestException('Guest is already checked in');

    const updatedGuest = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        status: 'Checked_In',
      },
      include: {
        seatingAssignment: { include: { table: true } },
      },
    });

    await this.prisma.checkInLog.create({
      data: {
        eventId,
        guestId,
        action: 'CHECK_IN',
        notes,
        performedBy: userId,
      },
    });

    await this.audit.log(userId, eventId, 'Guest', guestId, 'GUEST_CHECKED_IN', `Checked in: ${guest.convidado}`);

    return updatedGuest;
  }

  async undoCheckIn(eventId: string, guestId: string, userId: string, notes?: string) {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Guest not found');
    if (!guest.checkedIn) throw new BadRequestException('Guest is not checked in');

    const updatedGuest = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        checkedIn: false,
        checkedInAt: null,
        status: 'Confirmed',
      },
      include: {
        seatingAssignment: { include: { table: true } },
      },
    });

    await this.prisma.checkInLog.create({
      data: {
        eventId,
        guestId,
        action: 'UNDO_CHECK_IN',
        notes,
        performedBy: userId,
      },
    });

    await this.audit.log(userId, eventId, 'Guest', guestId, 'GUEST_CHECKOUT', `Undid check-in: ${guest.convidado}`);

    return updatedGuest;
  }

  async getCheckInStats(eventId: string) {
    const [total, checkedIn, vipTotal, vipCheckedIn] = await Promise.all([
      this.prisma.guest.count({ where: { eventId, rsvpStatus: 'Confirmed' } }),
      this.prisma.guest.count({ where: { eventId, checkedIn: true } }),
      this.prisma.guest.count({ where: { eventId, rsvpStatus: 'Confirmed', vipLevel: { not: 'None' } } }),
      this.prisma.guest.count({ where: { eventId, checkedIn: true, vipLevel: { not: 'None' } } }),
    ]);

    return {
      totalExpected: total,
      checkedIn,
      remaining: total - checkedIn,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      vipTotal,
      vipCheckedIn,
      vipRemaining: vipTotal - vipCheckedIn,
    };
  }

  async searchForCheckIn(eventId: string, search: string) {
    return this.prisma.guest.findMany({
      where: {
        eventId,
        rsvpStatus: 'Confirmed',
        OR: [
          { convidado: { contains: search, mode: 'insensitive' } },
          { empresa: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        seatingAssignment: { include: { table: true } },
      },
      orderBy: { convidado: 'asc' },
      take: 20,
    });
  }

  async getCheckInLogs(eventId: string) {
    return this.prisma.checkInLog.findMany({
      where: { eventId },
      include: {
        guest: { select: { convidado: true, empresa: true } },
        user: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async walkIn(eventId: string, data: { convidado: string; empresa?: string; notes?: string }, userId: string) {
    const guest = await this.prisma.guest.create({
      data: {
        eventId,
        convidado: data.convidado,
        empresa: data.empresa || null,
        notes: data.notes || null,
        guestType: 'Guest',
        status: 'Checked_In',
        rsvpStatus: 'Confirmed',
        checkedIn: true,
        checkedInAt: new Date(),
      },
      include: {
        seatingAssignment: { include: { table: true } },
      },
    });

    await this.prisma.checkInLog.create({
      data: {
        eventId,
        guestId: guest.id,
        action: 'WALK_IN',
        notes: data.notes,
        performedBy: userId,
      },
    });

    await this.audit.log(userId, eventId, 'Guest', guest.id, 'CHECK_IN_RECORDED', `Walk-in: ${guest.convidado}`);

    return guest;
  }

  async bulkCheckIn(eventId: string, guestIds: string[], userId: string) {
    const results = [];
    for (const guestId of guestIds) {
      try {
        const result = await this.checkIn(eventId, guestId, userId);
        results.push({ guestId, success: true, guest: result });
      } catch (err: any) {
        results.push({ guestId, success: false, error: err.message });
      }
    }
    return results;
  }
}
