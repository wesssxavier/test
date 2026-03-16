export type CustomFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'NUMBER'
  | 'DATE'
  | 'CHECKBOX'
  | 'EMAIL'
  | 'PHONE';

export interface CustomField {
  id: string;
  eventId: string | null;
  fieldName: string;
  fieldType: CustomFieldType;
  options: string[] | null;
  isFilterable: boolean;
  isImportable: boolean;
  isExportable: boolean;
  showInGrid: boolean;
  sortOrder: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldRequest {
  eventId?: string;
  fieldName: string;
  fieldType: CustomFieldType;
  options?: string[];
  isFilterable?: boolean;
  isImportable?: boolean;
  isExportable?: boolean;
  showInGrid?: boolean;
  sortOrder?: number;
}

export interface UpdateCustomFieldRequest extends Partial<CreateCustomFieldRequest> {}
