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

// Поддерживаемые языки для UI и логики
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'eng', label: 'English' },
  { code: 'rus', label: 'Russian' },
  { code: 'deu', label: 'German' },
  { code: 'fra', label: 'French' },
  { code: 'spa', label: 'Spanish' },
  { code: 'ita', label: 'Italian' },
  { code: 'nld', label: 'Dutch' },
  { code: 'swe', label: 'Swedish' },
  { code: 'dan', label: 'Danish' },
  { code: 'nor', label: 'Norwegian' },
  { code: 'fin', label: 'Finnish' },
  { code: 'ara', label: 'Arabic' },
  { code: 'ind', label: 'Indonesian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'fil', label: 'Filipino' },
  { code: 'vie', label: 'Vietnamese' },
  { code: 'tur', label: 'Turkish' },
  { code: 'tha', label: 'Thai' },
  { code: 'kor', label: 'Korean' },
];

export const DEFAULT_LANGUAGE_CODE = 'rus+eng';

// Сопоставление кодов Tesseract и franc (ISO 639-3)
export const TESSERACT_TO_FRANC: Record<string, string> = {
  eng: 'eng',
  rus: 'rus',
  deu: 'deu',
  fra: 'fra',
  spa: 'spa',
  ita: 'ita',
  nld: 'nld',
  swe: 'swe',
  dan: 'dan',
  nor: 'nno', // одна из норвежских норм
  fin: 'fin',
  ara: 'ara',
  ind: 'ind',
  por: 'por',
  jpn: 'jpn',
  fil: 'tgl', // Tagalog / Filipino
  vie: 'vie',
  tur: 'tur',
  tha: 'tha',
  kor: 'kor',
};

export const MIN_TEXT_LENGTH_FOR_FRANC = 20;
