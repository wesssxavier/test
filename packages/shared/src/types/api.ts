export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, string[]>;
}

export interface DashboardStats {
  totalInvited: number;
  confirmed: number;
  declined: number;
  pending: number;
  checkedIn: number;
  assignedToTables: number;
  unassigned: number;
  vipGuests: number;
  numberOfTables: number;
  tablesOverCapacity: number;
  recentImports: ImportJobSummary[];
  guestsMissingRsvp: number;
  guestsMissingTables: number;
  seatingWarnings: number;
}

export interface ImportJobSummary {
  id: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  createdAt: string;
  status: string;
}

export interface SavedView {
  id: string;
  eventId: string | null;
  viewName: string;
  isDefault: boolean;
  config: SavedViewConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedViewConfig {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  frozenColumns: string[];
  filters: ViewFilter[];
  sorting: ViewSorting[];
  searchTerm?: string;
  groupBy?: string;
}

export interface ViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: string | string[];
}

export interface ViewSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CheckInLogEntry {
  id: string;
  eventId: string;
  guestId: string;
  action: 'CHECK_IN' | 'UNDO_CHECK_IN' | 'NO_SHOW' | 'WALK_IN';
  notes: string | null;
  performedBy: string;
  createdAt: string;
  guest?: { convidado: string; empresa: string | null };
}
