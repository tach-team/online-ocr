import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';

// Путь к worker-файлу pdf.js, который копируется в корень dist через Vite
const PDF_WORKER_SRC = chrome.runtime.getURL('pdf.worker.min.mjs');

GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

export type { PDFDocumentProxy };

export interface PdfPageImage {
  pageNumber: number;
  dataUrl: string;
}

export async function loadPdfFromFile(file: File): Promise<PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;
  return doc;
}

export async function renderPdfPageToDataUrl(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale = 2
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D контекст недоступен');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/png');

  // Очищаем canvas, чтобы не держать лишнюю память
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

