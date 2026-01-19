import { recognizeText, initializeOCR, OCRProgress } from './utils/ocr';
import { cropImage, SelectionRect, ViewportInfo } from './utils/image-crop';

interface State {
  type: 'waiting' | 'processing' | 'result' | 'error';
}

let currentImageData: string | null = null;

// Элементы DOM
const waitingState = document.getElementById('waiting-state')!;
const processingState = document.getElementById('processing-state')!;
const resultState = document.getElementById('result-state')!;
const errorState = document.getElementById('error-state')!;
const processingText = document.getElementById('processing-text')!;
const progressFill = document.getElementById('progress-fill')!;
const resultText = document.getElementById('result-text')!;
const copyButton = document.getElementById('copy-button')!;
const newSelectionButton = document.getElementById('new-selection-button')!;
const retryButton = document.getElementById('retry-button')!;
const errorMessage = document.getElementById('error-message')!;

function showState(state: State['type']): void {
  waitingState.style.display = state === 'waiting' ? 'block' : 'none';
  processingState.style.display = state === 'processing' ? 'block' : 'none';
  resultState.style.display = state === 'result' ? 'block' : 'none';
  errorState.style.display = state === 'error' ? 'block' : 'none';
}

async function processImage(
  imageData: string,
  selection?: SelectionRect,
  viewport?: ViewportInfo
): Promise<void> {
  showState('processing');
  processingText.textContent = 'Подготовка изображения...';
  progressFill.style.width = '0%';

  try {
    let processedImageData = imageData;

    // Если есть информация о выделении, обрезаем изображение
    if (selection && viewport) {
      try {
        processingText.textContent = 'Обрезка изображения...';
        processedImageData = await cropImage(imageData, selection, viewport);
        console.log('Image cropped successfully');
      } catch (cropError) {
        console.error('Crop error:', cropError);
        throw new Error(`Ошибка обрезки изображения: ${cropError instanceof Error ? cropError.message : String(cropError)}`);
      }
    }

    currentImageData = processedImageData;

    // Инициализируем OCR при первой загрузке
    try {
      processingText.textContent = 'Инициализация OCR...';
      await initializeOCR();
      console.log('OCR initialized');
    } catch (initError) {
      console.error('OCR initialization error:', initError);
      throw new Error(`Ошибка инициализации OCR: ${initError instanceof Error ? initError.message : String(initError)}`);
    }

    // Обрабатываем изображение
    try {
      processingText.textContent = 'Распознавание текста...';

      const result = await recognizeText(processedImageData, (progress: OCRProgress) => {
        const percent = Math.round(progress.progress * 100);
        progressFill.style.width = `${percent}%`;
        processingText.textContent = `Обработка: ${percent}%`;
      });

      // Показываем результат
      resultText.textContent = result.text || 'Текст не найден';
      showState('result');
    } catch (recognizeError) {
      console.error('Recognition error:', recognizeError);
      throw new Error(`Ошибка распознавания текста: ${recognizeError instanceof Error ? recognizeError.message : String(recognizeError)}`);
    }
  } catch (error) {
    console.error('Processing error:', error);
    let errorText = 'Неизвестная ошибка';
    if (error instanceof Error) {
      errorText = error.message || error.toString() || 'Неизвестная ошибка';
    } else if (error) {
      errorText = String(error) || 'Неизвестная ошибка';
    }
    if (!errorText || errorText === 'undefined' || errorText === 'null') {
      errorText = 'Произошла неизвестная ошибка при обработке изображения';
    }
    errorMessage.textContent = errorText;
    showState('error');
  }
}

async function copyToClipboard(): Promise<void> {
  const text = resultText.textContent || '';
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = '✓ Скопировано!';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = '📋 Копировать';
      copyButton.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('Не удалось скопировать текст');
  }
}

function requestNewSelection(): void {
  // Отправляем сообщение content script для активации overlay
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ACTIVATE_OVERLAY',
      });
      showState('waiting');
    }
  });
}

// Обработчики событий
copyButton.addEventListener('click', copyToClipboard);
newSelectionButton.addEventListener('click', requestNewSelection);
retryButton.addEventListener('click', () => {
  if (currentImageData) {
    processImage(currentImageData); // При повторе используем уже обрезанное изображение
  }
});

// Слушаем сообщения от content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROCESS_IMAGE') {
    processImage(message.imageData, message.selection, message.viewport);
    sendResponse({ success: true });
  }
});

// Функция для деактивации overlay при закрытии sidepanel
function deactivateOverlay(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'DEACTIVATE_OVERLAY',
        }).catch(() => {
          // Игнорируем ошибки, если content script не загружен
        });
      }
    });
  });
}

// Обработчик закрытия sidepanel через visibilitychange (более надежный для sidepanel)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    deactivateOverlay();
  }
});

// Обработчик закрытия sidepanel через beforeunload (дополнительная защита)
window.addEventListener('beforeunload', () => {
  deactivateOverlay();
});

// Инициализация при загрузке
showState('waiting');
