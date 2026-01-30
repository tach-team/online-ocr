// Пороговые значения и ограничения

export const THRESHOLDS = {
  /** Минимальный размер выделения в пикселях */
  MIN_SELECTION_SIZE: 10,
  /** Максимальный размер PDF в мегабайтах */
  MAX_PDF_SIZE_MB: 10,
  /** Максимальное количество страниц PDF */
  MAX_PDF_PAGES: 1,
  /** Масштаб рендеринга PDF для OCR */
  PDF_RENDER_SCALE: 2,
  /** Минимальная длина текста для определения языка через franc */
  MIN_TEXT_LENGTH_FOR_FRANC: 20,
  /** Максимальное количество прикреплённых файлов */
  MAX_ATTACHMENTS: 3,
} as const;

// Прогресс OCR
export const OCR_PROGRESS = {
  LOADING: 0.1,
  INITIALIZING: 0.2,
  COMPLETED: 1,
} as const;
