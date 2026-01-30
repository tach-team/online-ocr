// Re-export типов для обратной совместимости
export type { SelectionRect, ViewportInfo } from '../types';

import type { SelectionRect, ViewportInfo } from '../types';

/**
 * Обрезает изображение по выделенной области
 */
export async function cropImage(
  imageDataUrl: string,
  selection: SelectionRect,
  viewport: ViewportInfo
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Рассчитываем масштаб между реальным размером изображения и viewport
      const scaleX = img.width / viewport.innerWidth;
      const scaleY = img.height / viewport.innerHeight;

      // Рассчитываем координаты обрезки с учетом масштаба
      const cropX = selection.x * scaleX;
      const cropY = selection.y * scaleY;
      const cropWidth = selection.width * scaleX;
      const cropHeight = selection.height * scaleY;

      // Устанавливаем размер canvas равным размеру обрезки
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Рисуем обрезанную часть изображения
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Конвертируем в data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageDataUrl;
  });
}
