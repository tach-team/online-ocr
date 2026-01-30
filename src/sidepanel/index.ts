// Главный модуль sidepanel - экспорты и инициализация

import { elements } from './dom-elements';
import {
  showState,
  showError,
  resetUploadContainer,
  autoResizeTextarea,
  copyToClipboard,
  originalRecognizedText,
  setIsLanguageDetectionUncertain,
  currentImageData,
} from './state';
import { processImage, handleResultLanguageChange, handleFileProcessing } from './image-processing';
import { activateOverlay, deactivateOverlay, handleToggleChange } from './overlay';
import { initDragDrop } from './drag-drop';
import { initClipboard } from './clipboard';
import { initFeatureRequestForm } from './feature-request';
import { MESSAGE_TYPES, TIMING, ICON_PATHS, UI_STRINGS, APP_STATES } from '../constants';

// Обработчик загрузки файла
async function handleFileUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    await handleFileProcessing(file);
  } catch (error) {
    console.error('File upload error:', error);
    showError(error, UI_STRINGS.FILE_UPLOAD_ERROR);
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
  showState(APP_STATES.WAITING);
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
    if (message.type === MESSAGE_TYPES.PROCESS_IMAGE) {
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
    elements.uploadIcon.src = chrome.runtime.getURL(ICON_PATHS.UPLOAD);
  }
  if (elements.dragUploadIcon) {
    elements.dragUploadIcon.src = chrome.runtime.getURL(ICON_PATHS.UPLOAD);
  }
}

// Инициализация overlay при загрузке
function initOverlay(): void {
  // Активируем overlay при загрузке, если свитчер включен
  if (elements.screenshotToggle && elements.screenshotToggle.checked) {
    // Небольшая задержка для обеспечения загрузки content script
    setTimeout(() => {
      activateOverlay();
    }, TIMING.OVERLAY_ACTIVATION_DELAY);
  }
}

/**
 * Главная функция инициализации sidepanel.
 * Инициализирует все модули и обработчики событий.
 */
export function init(): void {
  // Показываем начальное состояние
  showState(APP_STATES.WAITING);

  // Инициализируем модули
  initEventListeners();
  initIcons();
  initDragDrop();
  initClipboard();
  initFeatureRequestForm();
  initOverlay();
}

// ============================================
// Публичный API модуля sidepanel
// ============================================

/**
 * Основная функция обработки изображения с OCR.
 * @param imageData - base64 строка изображения
 * @param selection - область выделения (опционально)
 * @param viewport - информация о viewport (опционально)
 * @param skipLanguageDetection - пропустить автоопределение языка
 */
export { processImage } from './image-processing';

/**
 * Активирует overlay для выделения области на странице.
 */
export { activateOverlay } from './overlay';

/**
 * Деактивирует overlay выделения области.
 */
export { deactivateOverlay } from './overlay';

/**
 * Управление отображением состояния UI (waiting, processing, result, error).
 */
export { showState } from './state';
