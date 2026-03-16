export interface SeatingAssignment {
  id: string;
  eventId: string;
  guestId: string;
  tableId: string;
  seatNumber: number | null;
  assignmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
  guest?: import('./guests').Guest;
  table?: import('./tables').RoomTable;
}

export interface CreateSeatingRequest {
  eventId: string;
  guestId: string;
  tableId: string;
  seatNumber?: number;
  assignmentNotes?: string;
}

export interface UpdateSeatingRequest {
  tableId?: string;
  seatNumber?: number;
  assignmentNotes?: string;
}

export interface SeatingWarning {
  type: 'OVER_CAPACITY' | 'LINKED_APART' | 'SPOUSE_SEPARATED' | 'OFFICER_FAR' | 'VIP_BAD_TABLE' | 'RESTRICTED_TOGETHER' | 'NO_TABLE' | 'DUPLICATE_ASSIGNMENT' | 'RULE_VIOLATION';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  guestIds: string[];
  tableId?: string;
}
