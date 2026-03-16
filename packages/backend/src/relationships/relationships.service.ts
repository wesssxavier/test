import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RelationshipsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findByEvent(eventId: string) {
    return this.prisma.guestRelationship.findMany({
      where: { eventId },
      include: {
        guest: { select: { id: true, convidado: true, empresa: true } },
        relatedGuest: { select: { id: true, convidado: true, empresa: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByGuest(guestId: string) {
    return this.prisma.guestRelationship.findMany({
      where: { OR: [{ guestId }, { relatedGuestId: guestId }] },
      include: {
        guest: { select: { id: true, convidado: true, empresa: true } },
        relatedGuest: { select: { id: true, convidado: true, empresa: true } },
      },
    });
  }

  async create(data: any, userId: string) {
    const existing = await this.prisma.guestRelationship.findFirst({
      where: {
        eventId: data.eventId,
        OR: [
          { guestId: data.guestId, relatedGuestId: data.relatedGuestId, relationshipType: data.relationshipType },
          { guestId: data.relatedGuestId, relatedGuestId: data.guestId, relationshipType: data.relationshipType },
        ],
      },
    });
    if (existing) throw new ConflictException('Relationship already exists');

    const relationship = await this.prisma.guestRelationship.create({
      data,
      include: {
        guest: { select: { id: true, convidado: true } },
        relatedGuest: { select: { id: true, convidado: true } },
      },
    });

    await this.audit.log(
      userId, data.eventId, 'GuestRelationship', relationship.id,
      'RELATIONSHIP_CREATED',
      `Linked ${relationship.guest.convidado} and ${relationship.relatedGuest.convidado} as ${data.relationshipType}`,
    );

    return relationship;
  }

  async remove(id: string, userId: string) {
    const rel = await this.prisma.guestRelationship.findUnique({
      where: { id },
      include: {
        guest: { select: { convidado: true } },
        relatedGuest: { select: { convidado: true } },
      },
    });
    if (!rel) throw new NotFoundException('Relationship not found');

    await this.prisma.guestRelationship.delete({ where: { id } });

    await this.audit.log(
      userId, rel.eventId, 'GuestRelationship', id,
      'RELATIONSHIP_DELETED',
      `Removed ${rel.relationshipType} link between ${rel.guest.convidado} and ${rel.relatedGuest.convidado}`,
    );

    return { success: true };
  }
}
