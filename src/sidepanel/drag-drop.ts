// Drag & Drop функциональность

import { elements } from './dom-elements';
import { showState } from './state';
import { validateFile, fileToBase64, isPdfFile, ALLOWED_MIME_TYPES } from './file-handling';
import { processImage, processPdfFile } from './image-processing';

// Счётчик для отслеживания вложенных drag событий
let dragCounter = 0;

function showDragOverlay(): void {
  elements.container.classList.add('dragging');
  elements.dragOverlay.classList.add('active');
}

function hideDragOverlay(): void {
  elements.container.classList.remove('dragging');
  elements.dragOverlay.classList.remove('active');
}

function hasImageFile(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;

  // Проверяем типы файлов
  if (dataTransfer.types.includes('Files')) {
    // Проверяем items для более точного определения типа
    if (dataTransfer.items) {
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const mimeType = item.type.toLowerCase();
          if (ALLOWED_MIME_TYPES.includes(mimeType)) {
            return true;
          }
        }
      }
    }
    // Если items недоступны, допускаем возможность изображения или PDF
    return true;
  }
  return false;
}

function handleDragEnter(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  dragCounter++;

  if (hasImageFile(event.dataTransfer)) {
    showDragOverlay();
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();

  dragCounter--;

  if (dragCounter === 0) {
    hideDragOverlay();
  }
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  dragCounter = 0;
  hideDragOverlay();

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    return;
  }

  const file = files[0];

  // Валидация формата
  const validation = await validateFile(file);
  if (!validation.valid) {
    elements.errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла';
    showState('error');
    return;
  }

  try {
    // Если это PDF, обрабатываем через processPdfFile
    if (isPdfFile(file)) {
      await processPdfFile(file);
    } else {
      // Конвертируем файл в base64
      const imageData = await fileToBase64(file);

      // Обрабатываем изображение
      await processImage(imageData);
    }
  } catch (error) {
    console.error('Drop error:', error);
    elements.errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при загрузке файла';
    showState('error');
  }
}

// Инициализация Drag & Drop событий
export function initDragDrop(): void {
  document.body.addEventListener('dragenter', handleDragEnter);
  document.body.addEventListener('dragover', handleDragOver);
  document.body.addEventListener('dragleave', handleDragLeave);
  document.body.addEventListener('drop', handleDrop);
}
