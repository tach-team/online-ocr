// Внешние URL (CDN и API)

export const CDN_URLS = {
  /** CDN для языковых данных Tesseract */
  TESSERACT_LANG_DATA: 'https://tessdata.projectnaptha.com/4.0.0_fast/',
  /** CDN для PDF.js worker (шаблон с версией) */
  PDFJS_WORKER_TEMPLATE: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js',
} as const;

/** Получить URL PDF.js worker для конкретной версии */
export function getPdfJsWorkerUrl(version: string): string {
  return `${CDN_URLS.PDFJS_WORKER_TEMPLATE}/${version}/pdf.worker.min.js`;
}

// Ограниченные URL префиксы (не поддерживают content scripts)
export const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'edge://',
] as const;
