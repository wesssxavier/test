export type TableShape = 'ROUND' | 'SQUARE' | 'RECTANGLE';

export interface Event {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  roomName: string | null;
  notes: string | null;
  roomWidth: number;
  roomHeight: number;
  defaultTableShape: TableShape;
  defaultTableCapacity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    guests: number;
    roomTables: number;
  };
}

export interface CreateEventRequest {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  roomName?: string;
  notes?: string;
  roomWidth?: number;
  roomHeight?: number;
  defaultTableShape?: TableShape;
  defaultTableCapacity?: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}
