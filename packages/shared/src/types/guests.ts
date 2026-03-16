export type GuestType = 'Guest' | 'Spouse' | 'Officer' | 'Other';
export type GuestStatus = 'Invited' | 'Confirmed' | 'Declined' | 'Waitlist' | 'Checked-In' | 'No Response';
export type RsvpStatus = 'Pending' | 'Confirmed' | 'Declined';
export type VipLevel = 'None' | 'VIP' | 'VVIP';

export interface Guest {
  id: string;
  eventId: string;
  convidado: string;
  empresa: string | null;
  telephone: string | null;
  email: string | null;
  guestType: GuestType;
  status: GuestStatus;
  rsvpStatus: RsvpStatus;
  vipLevel: VipLevel;
  dietaryRestrictions: string | null;
  notes: string | null;
  linkedGroupName: string | null;
  linkedPrimaryGuestId: string | null;
  seatPreference: string | null;
  avoidWith: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  importedFileName: string | null;
  importedRowNumber: number | null;
  createdAt: string;
  updatedAt: string;
  seatingAssignment?: SeatingAssignment | null;
  relationships?: GuestRelationship[];
  customFieldValues?: CustomFieldValue[];
}

export interface CreateGuestRequest {
  eventId: string;
  convidado: string;
  empresa?: string;
  telephone?: string;
  email?: string;
  guestType?: GuestType;
  status?: GuestStatus;
  rsvpStatus?: RsvpStatus;
  vipLevel?: VipLevel;
  dietaryRestrictions?: string;
  notes?: string;
  linkedGroupName?: string;
  linkedPrimaryGuestId?: string;
  seatPreference?: string;
  avoidWith?: string;
}

export interface UpdateGuestRequest extends Partial<CreateGuestRequest> {}

export interface BulkUpdateGuestsRequest {
  guestIds: string[];
  updates: Partial<Omit<CreateGuestRequest, 'eventId'>>;
}

export type RelationshipType = 'Spouse' | 'Companion' | 'Officer' | 'Family' | 'SameTable' | 'KeepClose' | 'AvoidTable';

export interface GuestRelationship {
  id: string;
  eventId: string;
  guestId: string;
  relatedGuestId: string;
  relationshipType: RelationshipType;
  notes: string | null;
  createdAt: string;
  relatedGuest?: Guest;
}

export interface CreateRelationshipRequest {
  eventId: string;
  guestId: string;
  relatedGuestId: string;
  relationshipType: RelationshipType;
  notes?: string;
}

export interface CustomFieldValue {
  id: string;
  guestId: string;
  fieldId: string;
  value: string;
}

import { SeatingAssignment } from './seating';
