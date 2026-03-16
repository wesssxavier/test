export type AuditAction =
  | 'GUEST_CREATED'
  | 'GUEST_UPDATED'
  | 'GUEST_DELETED'
  | 'RSVP_CHANGED'
  | 'SEAT_CHANGED'
  | 'RELATIONSHIP_CREATED'
  | 'RELATIONSHIP_UPDATED'
  | 'RELATIONSHIP_DELETED'
  | 'IMPORT_PERFORMED'
  | 'ROW_SPLIT'
  | 'ROW_MERGED'
  | 'CHECK_IN_RECORDED'
  | 'PERMISSION_CHANGED'
  | 'EXPORT_GENERATED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'TABLE_CREATED'
  | 'TABLE_UPDATED'
  | 'TABLE_DELETED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'LAYOUT_SAVED';

export interface AuditLog {
  id: string;
  userId: string;
  eventId: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  summary: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user?: { displayName: string; username: string };
}

export interface AuditLogQuery {
  eventId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}
