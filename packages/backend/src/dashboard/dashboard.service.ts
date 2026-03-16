import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getEventDashboard(eventId: string) {
    const [
      totalGuests,
      guestsByStatus,
      guestsByRsvp,
      guestsByVip,
      guestsByType,
      seatedCount,
      checkedInCount,
      totalTables,
      tableCapacity,
      recentActivity,
    ] = await Promise.all([
      this.prisma.guest.count({ where: { eventId } }),
      this.prisma.guest.groupBy({ by: ['status'], where: { eventId }, _count: true }),
      this.prisma.guest.groupBy({ by: ['rsvpStatus'], where: { eventId }, _count: true }),
      this.prisma.guest.groupBy({ by: ['vipLevel'], where: { eventId }, _count: true }),
      this.prisma.guest.groupBy({ by: ['guestType'], where: { eventId }, _count: true }),
      this.prisma.seatingAssignment.count({ where: { eventId } }),
      this.prisma.guest.count({ where: { eventId, checkedIn: true } }),
      this.prisma.roomTable.count({ where: { eventId } }),
      this.prisma.roomTable.aggregate({ where: { eventId }, _sum: { capacity: true } }),
      this.prisma.auditLog.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { displayName: true } } },
      }),
    ]);

    const totalCapacity = tableCapacity._sum.capacity || 0;

    // Guests by company (top 10)
    const guestsByCompany = await this.prisma.guest.groupBy({
      by: ['empresa'],
      where: { eventId, empresa: { not: null } },
      _count: true,
      orderBy: { _count: { empresa: 'desc' } },
      take: 10,
    });

    return {
      overview: {
        totalGuests,
        confirmed: guestsByRsvp.find((r: any) => r.rsvpStatus === 'Confirmed')?._count || 0,
        pending: guestsByRsvp.find((r: any) => r.rsvpStatus === 'Pending')?._count || 0,
        declined: guestsByRsvp.find((r: any) => r.rsvpStatus === 'Declined')?._count || 0,
        checkedIn: checkedInCount,
        seated: seatedCount,
        unseated: totalGuests - seatedCount,
        totalTables,
        totalCapacity,
        availableSeats: totalCapacity - seatedCount,
      },
      breakdowns: {
        byStatus: guestsByStatus.map((g: any) => ({ status: g.status, count: g._count })),
        byRsvp: guestsByRsvp.map((g: any) => ({ rsvpStatus: g.rsvpStatus, count: g._count })),
        byVipLevel: guestsByVip.map((g: any) => ({ vipLevel: g.vipLevel, count: g._count })),
        byGuestType: guestsByType.map((g: any) => ({ guestType: g.guestType, count: g._count })),
        byCompany: guestsByCompany.map((g: any) => ({ empresa: g.empresa, count: g._count })),
      },
      recentActivity,
    };
  }

  async getGlobalDashboard() {
    const [totalEvents, upcomingEvents, totalGuests] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.findMany({
        where: { eventDate: { gte: new Date() } },
        include: { _count: { select: { guests: true } } },
        orderBy: { eventDate: 'asc' },
        take: 5,
      }),
      this.prisma.guest.count(),
    ]);

    return {
      totalEvents,
      totalGuests,
      upcomingEvents,
    };
  }
}
