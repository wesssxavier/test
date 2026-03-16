import { TableShape } from './events';

export interface RoomTable {
  id: string;
  eventId: string;
  tableName: string;
  shape: TableShape;
  capacity: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  rotation: number;
  visualStatus: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    seatingAssignments: number;
  };
  seatingAssignments?: import('./seating').SeatingAssignment[];
}

export interface CreateTableRequest {
  eventId: string;
  tableName: string;
  shape?: TableShape;
  capacity?: number;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  rotation?: number;
  notes?: string;
}

export interface UpdateTableRequest extends Partial<Omit<CreateTableRequest, 'eventId'>> {}

export interface RoomElement {
  id: string;
  eventId: string;
  elementType: 'STAGE' | 'DANCE_FLOOR' | 'BUFFET' | 'BAR' | 'ENTRANCE' | 'EXIT' | 'RESERVED' | 'BLOCKED';
  label: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomElementRequest {
  eventId: string;
  elementType: RoomElement['elementType'];
  label: string;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  rotation?: number;
}
