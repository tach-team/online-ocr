// Утилиты для работы с файлами

import { validatePdfFile } from '../utils/pdf-to-image';

// Поддерживаемые форматы
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/pdf',
];

export const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'pdf',
];

export const MAX_PDF_SIZE_MB = 10;
export const MAX_PDF_PAGES = 1;

// Интерфейс результата валидации
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Проверка, является ли файл PDF
export function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') {
    return true;
  }
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();
  return extension === 'pdf';
}

// Валидация формата файла (изображения и PDF)
export async function validateFile(file: File): Promise<ValidationResult> {
  // Если это PDF, используем специальную валидацию
  if (isPdfFile(file)) {
    const validation = await validatePdfFile(file, MAX_PDF_SIZE_MB, MAX_PDF_PAGES);
    return validation;
  }

  // Валидация изображений
  // Проверка по MIME-типу
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    // Дополнительная проверка по расширению (на случай, если MIME-тип не определен)
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Неподдерживаемый формат файла. Поддерживаемые форматы: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`,
      };
    }
  }
  return { valid: true };
}

// Конвертация File в base64 строку
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    reader.readAsDataURL(file);
  });
}

// Конвертация Blob в base64 строку
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Ошибка чтения изображения из буфера обмена'));
    };
    reader.readAsDataURL(blob);
  });
}
