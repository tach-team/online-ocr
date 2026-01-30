// Drag & Drop функциональность

import { elements } from './dom-elements';
import { showError } from './state';
import { ALLOWED_MIME_TYPES } from './file-handling';
import { handleFileProcessing } from './image-processing';
import { UI_STRINGS } from '../constants';

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

  try {
    await handleFileProcessing(file);
  } catch (error) {
    console.error('Drop error:', error);
    showError(error, UI_STRINGS.FILE_UPLOAD_ERROR);
  }
}

// Инициализация Drag & Drop событий
export function initDragDrop(): void {
  document.body.addEventListener('dragenter', handleDragEnter);
  document.body.addEventListener('dragover', handleDragOver);
  document.body.addEventListener('dragleave', handleDragLeave);
  document.body.addEventListener('drop', handleDrop);
}
