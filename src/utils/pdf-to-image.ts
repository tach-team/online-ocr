import * as pdfjsLib from 'pdfjs-dist';

// Настройка worker для PDF.js
// Используем локальный worker через chrome.runtime.getURL для Chrome расширения
if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.runtime) {
  try {
    // Пытаемся использовать локальный worker из расширения
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('workers/pdf.worker.min.js');
  } catch (error) {
    // Fallback на CDN, если локальный worker недоступен
    console.warn('Local PDF.js worker not found, using CDN fallback');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
} else if (typeof window !== 'undefined') {
  // Для обычного веб-окружения используем CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  numPages?: number;
}

/**
 * Валидирует PDF файл: проверяет размер и количество страниц
 * @param file PDF файл
 * @param maxSizeMB Максимальный размер в MB (по умолчанию 10)
 * @param maxPages Максимальное количество страниц (по умолчанию 1)
 * @returns Результат валидации
 */
export async function validatePdfFile(
  file: File,
  maxSizeMB: number = 10,
  maxPages: number = 1
): Promise<PdfValidationResult> {
  // Проверка размера файла
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `PDF файл слишком большой. Максимальный размер: ${maxSizeMB}MB`,
    };
  }

  // Проверка MIME типа
  if (file.type && file.type !== 'application/pdf') {
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    if (extension !== 'pdf') {
      return {
        valid: false,
        error: 'Неподдерживаемый формат файла. Поддерживается только PDF',
      };
    }
  }

  try {
    // Загружаем PDF для проверки количества страниц
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    if (numPages > maxPages) {
      return {
        valid: false,
        error: `PDF содержит более ${maxPages} страницы. Поддерживается только первая страница`,
        numPages,
      };
    }

    return {
      valid: true,
      numPages,
    };
  } catch (error) {
    console.error('PDF validation error:', error);
    return {
      valid: false,
      error: 'Ошибка чтения PDF файла. Файл может быть поврежден или иметь неподдерживаемый формат',
    };
  }
}

/**
 * Конвертирует страницу PDF в изображение (base64 data URL)
 * @param file PDF файл
 * @param pageNumber Номер страницы (начиная с 1, по умолчанию 1)
 * @param scale Масштаб рендеринга (по умолчанию 2 для лучшего качества OCR)
 * @returns Base64 data URL изображения
 */
export async function convertPdfPageToImage(
  file: File,
  pageNumber: number = 1,
  scale: number = 2
): Promise<string> {
  try {
    // Загружаем PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Проверяем количество страниц
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Страница ${pageNumber} не существует. PDF содержит ${pdf.numPages} страниц`);
    }

    // Получаем страницу
    const page = await pdf.getPage(pageNumber);

    // Получаем viewport с указанным масштабом
    const viewport = page.getViewport({ scale });

    // Создаем canvas для рендеринга
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Не удалось получить контекст canvas');
    }

    // Устанавливаем размеры canvas
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Рендерим страницу на canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Конвертируем canvas в base64 data URL (PNG)
    const imageData = canvas.toDataURL('image/png');

    return imageData;
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    if (error instanceof Error) {
      throw new Error(`Ошибка конвертации PDF в изображение: ${error.message}`);
    }
    throw new Error('Ошибка конвертации PDF в изображение');
  }
}
