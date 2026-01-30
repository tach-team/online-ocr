// Работа с буфером обмена

import { elements } from './dom-elements';
import { showState } from './state';
import { validateFile, blobToBase64, isPdfFile } from './file-handling';
import { processImage, processPdfFile } from './image-processing';
import { deactivateOverlay } from './overlay';

// Состояние активации буфера обмена
let isClipboardActive: boolean = false;

// Функции для управления активацией буфера обмена
export function activateClipboard(): void {
  isClipboardActive = true;
  elements.uploadArea.classList.add('active');
}

export function deactivateClipboard(): void {
  isClipboardActive = false;
  elements.uploadArea.classList.remove('active');
}

export function isClipboardActiveState(): boolean {
  return isClipboardActive;
}

// Обработчик клика на область загрузки для активации буфера обмена
function handleUploadAreaClick(event: MouseEvent): void {
  // Игнорируем клик, если это клик на кнопку загрузки
  const target = event.target as HTMLElement;
  if (target.closest('.upload-button')) {
    return;
  }

  // Переключаем состояние активации
  if (isClipboardActive) {
    deactivateClipboard();
  } else {
    activateClipboard();
  }
}

// Обработчик клика вне блока для деактивации (в пределах sidepanel)
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  // Если клик не внутри upload-area и блока активирован, деактивируем
  if (isClipboardActive && !target.closest('#upload-area')) {
    deactivateClipboard();
  }
}

// Обработчик потери фокуса sidepanel (клик в любом месте браузера)
function handleWindowBlur(): void {
  if (isClipboardActive) {
    deactivateClipboard();
  }
}

// Обработчик изменения видимости sidepanel
function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    // Деактивируем буфер обмена, если он был активирован
    if (isClipboardActive) {
      deactivateClipboard();
    }
    // Деактивируем overlay
    deactivateOverlay();
  }
}

// Обработчик вставки изображения из буфера обмена
async function handlePaste(event: ClipboardEvent): Promise<void> {
  // Проверяем, что блок активирован
  if (!isClipboardActive) {
    return;
  }

  // Предотвращаем стандартное поведение
  event.preventDefault();
  event.stopPropagation();

  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return;
  }

  // Ищем изображение или PDF в буфере обмена
  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Проверяем, является ли элемент изображением или PDF
    if (item.type.startsWith('image/') || item.type === 'application/pdf') {
      const blob = item.getAsFile();
      if (!blob) {
        continue;
      }

      // Создаем временный File объект для валидации
      const fileName = item.type === 'application/pdf'
        ? 'clipboard-file.pdf'
        : `clipboard-image.${item.type.split('/')[1]}`;
      const tempFile = new File([blob], fileName, { type: item.type });

      // Валидация формата
      const validation = await validateFile(tempFile);
      if (!validation.valid) {
        elements.errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла из буфера обмена';
        showState('error');
        deactivateClipboard();
        return;
      }

      try {
        // Если это PDF, обрабатываем через processPdfFile
        if (isPdfFile(tempFile)) {
          await processPdfFile(tempFile);
        } else {
          // Конвертируем blob в base64
          const imageData = await blobToBase64(blob);

          // Обрабатываем изображение
          await processImage(imageData);
        }

        // Деактивируем блок после успешной вставки
        deactivateClipboard();
      } catch (error) {
        console.error('Paste error:', error);
        elements.errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при вставке файла из буфера обмена';
        showState('error');
        deactivateClipboard();
      }

      return; // Обработали первый найденный файл
    }
  }
}

// Инициализация событий буфера обмена
export function initClipboard(): void {
  elements.uploadArea.addEventListener('click', handleUploadAreaClick);
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('paste', handlePaste);
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}
