// Пути к файлам и ресурсам

export const WORKER_PATHS = {
  OCR_WORKER_DIR: 'workers/',
  OCR_WORKER: 'workers/worker.min.js',
  OCR_CORE: 'core/tesseract-core-lstm.wasm.js',
  PDF_WORKER: 'workers/pdf.worker.min.js',
  CONTENT_SCRIPT: 'content.js',
} as const;

export const ICON_PATHS = {
  UPLOAD: 'icons/icon-upload.svg',
  ATTACH: 'icons/icon-attach.svg',
  CROSS: 'icons/icon-cross.svg',
  ARROW_LEFT: 'icons/icon-arrow-left.svg',
  MAIL: 'icons/icon-mail.svg',
} as const;
