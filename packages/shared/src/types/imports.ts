export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type ImportRowStatus = 'VALID' | 'DUPLICATE' | 'ERROR' | 'SKIPPED' | 'IMPORTED' | 'NEEDS_REVIEW';

export interface ImportJob {
  id: string;
  eventId: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  status: ImportStatus;
  columnMapping: Record<string, string>;
  mappingTemplateId: string | null;
  importedBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface ImportRow {
  id: string;
  importJobId: string;
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: Record<string, string>;
  status: ImportRowStatus;
  errorMessage: string | null;
  duplicateGuestId: string | null;
  createdAt: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  isCustomField: boolean;
  customFieldId?: string;
}

export interface MappingTemplate {
  id: string;
  templateName: string;
  mappings: ColumnMapping[];
  createdBy: string;
  createdAt: string;
}

export interface ImportPreview {
  headers: string[];
  rows: Record<string, string>[];
  suggestedMappings: ColumnMapping[];
  totalRows: number;
}

export interface DuplicateCandidate {
  importRow: ImportRow;
  existingGuest: import('./guests').Guest;
  matchReason: string;
}
