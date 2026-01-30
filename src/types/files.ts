// Типы для работы с файлами

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  numPages?: number;
}

export interface AttachedFile {
  file: File;
  preview: string; // base64 data URL
  id: string; // уникальный ID для удаления
}
