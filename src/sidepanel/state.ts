// Глобальное состояние и функции управления UI

import { elements } from './dom-elements';
import { SUPPORTED_LANGUAGES } from '../utils/ocr';
import { UI_STRINGS, TIMING, APP_STATES } from '../constants';

// Re-export типа для обратной совместимости
export type { State } from '../types';

import type { State } from '../types';

// Глобальное состояние
export let currentImageData: string | null = null;
export let originalRecognizedText: string = '';
export let detectedLanguageCode: string | null = null;
export let selectedLanguageCode: string | null = null;
export let isLanguageDetectionUncertain: boolean = false;

// Сеттеры для состояния (необходимы для изменения из других модулей)
export function setCurrentImageData(data: string | null): void {
  currentImageData = data;
}

export function setOriginalRecognizedText(text: string): void {
  originalRecognizedText = text;
}

export function setDetectedLanguageCode(code: string | null): void {
  detectedLanguageCode = code;
}

export function setSelectedLanguageCode(code: string | null): void {
  selectedLanguageCode = code;
}

export function setIsLanguageDetectionUncertain(value: boolean): void {
  isLanguageDetectionUncertain = value;
}

// Функции управления UI состоянием
export function showState(state: State['type']): void {
  // waiting-state остается видимым во время обработки
  elements.waitingState.style.display = (state === APP_STATES.WAITING || state === APP_STATES.PROCESSING) ? 'block' : 'none';
  elements.resultState.style.display = state === APP_STATES.RESULT ? 'block' : 'none';
  elements.errorState.style.display = state === APP_STATES.ERROR ? 'block' : 'none';
}

/**
 * Показать ошибку с сообщением
 * Унифицированная функция для отображения ошибок
 */
export function showError(error: unknown, defaultMessage: string = UI_STRINGS.UNKNOWN_ERROR): void {
  let message: string;
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message || defaultMessage;
  } else {
    message = defaultMessage;
  }
  elements.errorMessage.textContent = message;
  showState(APP_STATES.ERROR);
}

// Функция для переключения состояния upload-container в режим обработки
export function setUploadContainerProcessing(imageData: string): void {
  elements.uploadArea.classList.add('processing');
  elements.uploadArea.style.setProperty('--processing-bg-image', `url(${imageData})`);
  elements.processingContent.style.display = 'flex';
  elements.processingText.textContent = '0%';
  elements.progressFill.style.width = '0%';
}

// Функция для возврата upload-container к исходному состоянию
export function resetUploadContainer(): void {
  elements.uploadArea.classList.remove('processing');
  elements.uploadArea.style.removeProperty('--processing-bg-image');
  elements.processingContent.style.display = 'none';
  elements.processingText.textContent = '';
  elements.progressFill.style.width = '0%';
  if (elements.languageWarning) {
    elements.languageWarning.style.display = 'none';
    elements.languageWarning.textContent = '';
  }
}

// Получить label языка по коду
export function getLanguageLabel(code: string | null): string {
  if (!code) return UI_STRINGS.UNKNOWN_LANGUAGE;
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.label : code;
}

// Заполнить select с языками
export function populateLanguageSelect(activeCode: string | null): void {
  if (!elements.resultLanguageSelect || !elements.resultLanguageContainer) return;

  elements.resultLanguageSelect.innerHTML = '';

  SUPPORTED_LANGUAGES.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.label;
    if (activeCode && lang.code === activeCode) {
      option.selected = true;
    }
    elements.resultLanguageSelect!.appendChild(option);
  });

  // Если автоопределение не дало язык, оставляем первый как выбранный
  if (!elements.resultLanguageSelect.value && SUPPORTED_LANGUAGES.length > 0) {
    elements.resultLanguageSelect.value = SUPPORTED_LANGUAGES[0].code;
  }

  selectedLanguageCode = elements.resultLanguageSelect.value || activeCode;

  if (elements.resultLanguageName) {
    elements.resultLanguageName.textContent = getLanguageLabel(selectedLanguageCode || activeCode);
  }

  elements.resultLanguageContainer.style.display = 'flex';
}

// Автоматическая подстройка высоты textarea
export function autoResizeTextarea(): void {
  // Сбрасываем высоту на auto для корректного расчета scrollHeight
  elements.resultText.style.height = 'auto';

  // Вычисляем максимальную доступную высоту с учетом кнопок и отступов
  const resultStateRect = elements.resultState.getBoundingClientRect();
  const resultLanguageContainerRect = elements.resultLanguageContainer?.getBoundingClientRect();
  const resultLanguageContainerHeight = (resultLanguageContainerRect?.height ?? 0) + 20;
  const buttonsRect = elements.resultState.querySelector('.result-buttons')?.getBoundingClientRect();
  const buttonsHeight = buttonsRect ? buttonsRect.height + 16 : 60; // 16px - margin-bottom textarea
  const paddingTop = parseInt(getComputedStyle(elements.resultState).paddingTop || '0', 10);
  const paddingBottom = parseInt(getComputedStyle(elements.resultState).paddingBottom || '0', 10);
  const maxHeight = resultStateRect.height - resultLanguageContainerHeight - buttonsHeight - paddingTop - paddingBottom;

  // Устанавливаем высоту, но не превышающую максимальную доступную
  const contentHeight = elements.resultText.scrollHeight;
  const targetHeight = Math.min(contentHeight, maxHeight);

  elements.resultText.style.height = `${targetHeight}px`;

  // Если контент превышает доступное пространство, включаем прокрутку
  if (contentHeight > maxHeight) {
    elements.resultText.style.overflowY = 'auto';
  } else {
    elements.resultText.style.overflowY = 'hidden';
  }
}

// Копирование в буфер обмена
export async function copyToClipboard(): Promise<void> {
  const text = elements.resultText.value || '';
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    elements.copyButton.textContent = UI_STRINGS.COPY_SUCCESS;
    elements.copyButton.classList.add('copied');
    setTimeout(() => {
      elements.copyButton.textContent = UI_STRINGS.COPY_BUTTON;
      elements.copyButton.classList.remove('copied');
    }, TIMING.COPY_FEEDBACK_TIMEOUT);
  } catch (error) {
    console.error('Copy error:', error);
    alert(UI_STRINGS.COPY_ERROR);
  }
}
