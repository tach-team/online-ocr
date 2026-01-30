// Типы для OCR

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface DetectedLanguage {
  language: string;
  confidence: number;
  shortText?: boolean;
}

export interface SupportedLanguage {
  code: string;
  label: string;
}
