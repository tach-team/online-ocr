// Главный модуль sidepanel - экспорты и инициализация

import { elements } from './dom-elements';
import {
  showState,
  resetUploadContainer,
  autoResizeTextarea,
  copyToClipboard,
  originalRecognizedText,
  setIsLanguageDetectionUncertain,
  currentImageData,
} from './state';
import { validateFile, fileToBase64, isPdfFile } from './file-handling';
import { processImage, processPdfFile, handleResultLanguageChange } from './image-processing';
import { activateOverlay, deactivateOverlay, handleToggleChange } from './overlay';
import { initDragDrop } from './drag-drop';
import { initClipboard } from './clipboard';
import { initFeatureRequestForm } from './feature-request';

// Обработчик загрузки файла
async function handleFileUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  // Валидация формата
  const validation = await validateFile(file);
  if (!validation.valid) {
    elements.errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла';
    showState('error');
    // Сбрасываем input для возможности повторной загрузки того же файла
    input.value = '';
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
    console.error('File upload error:', error);
    elements.errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при загрузке файла';
    showState('error');
  } finally {
    // Сбрасываем input для возможности повторной загрузки того же файла
    input.value = '';
  }
}

// Обработчик клика на кнопку загрузки
function handleUploadButtonClick(event: MouseEvent): void {
  event.stopPropagation(); // Предотвращаем всплытие события до upload-area
  elements.fileInput.click();
}

// Возврат к главному экрану
function backToMain(): void {
  // Сбрасываем текст к исходному распознанному тексту
  elements.resultText.value = originalRecognizedText;
  autoResizeTextarea();
  resetUploadContainer();
  if (elements.languageWarning) {
    elements.languageWarning.style.display = 'none';
    elements.languageWarning.textContent = '';
  }
  setIsLanguageDetectionUncertain(false);
  // Оставляем тогглер включённым и активируем overlay для немедленного выделения
  if (elements.screenshotToggle) {
    elements.screenshotToggle.checked = true;
    activateOverlay();
  }
  showState('waiting');
}

// Инициализация обработчиков событий
function initEventListeners(): void {
  // Основные обработчики
  elements.copyButton.addEventListener('click', copyToClipboard);
  elements.backButton.addEventListener('click', backToMain);
  elements.resultText.addEventListener('input', autoResizeTextarea);

  // Повтор обработки
  elements.retryButton.addEventListener('click', () => {
    if (currentImageData) {
      // При повторе используем уже обрезанное изображение и текущий выбранный язык
      void processImage(currentImageData, undefined, undefined, true);
    }
  });

  // Выбор языка
  if (elements.resultLanguageSelect) {
    elements.resultLanguageSelect.addEventListener('change', handleResultLanguageChange);
  }

  // Управление скриншотами
  elements.screenshotToggle.addEventListener('change', handleToggleChange);

  // Загрузка файлов
  elements.uploadButton.addEventListener('click', handleUploadButtonClick);
  elements.fileInput.addEventListener('change', handleFileUpload);

  // Слушаем сообщения от content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROCESS_IMAGE') {
      processImage(message.imageData, message.selection, message.viewport);
      sendResponse({ success: true });
    }
  });

  // Обработчик закрытия sidepanel через beforeunload
  window.addEventListener('beforeunload', () => {
    deactivateOverlay();
  });
}

// Инициализация иконок
function initIcons(): void {
  // Устанавливаем правильный путь к иконкам загрузки
  if (elements.uploadIcon) {
    elements.uploadIcon.src = chrome.runtime.getURL('icons/icon-upload.svg');
  }
  if (elements.dragUploadIcon) {
    elements.dragUploadIcon.src = chrome.runtime.getURL('icons/icon-upload.svg');
  }
}

// Инициализация overlay при загрузке
function initOverlay(): void {
  // Активируем overlay при загрузке, если свитчер включен
  if (elements.screenshotToggle && elements.screenshotToggle.checked) {
    // Небольшая задержка для обеспечения загрузки content script
    setTimeout(() => {
      activateOverlay();
    }, 100);
  }
}

// Главная функция инициализации
export function init(): void {
  // Показываем начальное состояние
  showState('waiting');

  // Инициализируем модули
  initEventListeners();
  initIcons();
  initDragDrop();
  initClipboard();
  initFeatureRequestForm();
  initOverlay();
}

// Реэкспорт для удобства
export { processImage } from './image-processing';
export { activateOverlay, deactivateOverlay } from './overlay';
export { showState } from './state';
