import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    eventId: string | null | undefined,
    entityType: string,
    entityId: string,
    action: string,
    summary: string,
    details?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        eventId: eventId || undefined,
        entityType,
        entityId,
        action,
        summary,
        details: details || undefined,
      },
    });
  }

  async findByEvent(eventId: string, query?: { page?: number; pageSize?: number; entityType?: string; action?: string }) {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 50;
    const where: any = { eventId };

    if (query?.entityType) where.entityType = query.entityType;
    if (query?.action) where.action = { contains: query.action };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { displayName: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: { user: { select: { displayName: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentActivity(limit: number = 20) {
    return this.prisma.auditLog.findMany({
      include: { user: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
