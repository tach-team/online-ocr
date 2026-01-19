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
const screenshotToggle = document.getElementById('screenshot-toggle') as HTMLInputElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const uploadButton = document.getElementById('upload-button')!;
const uploadIcon = document.getElementById('upload-icon') as HTMLImageElement;

// Поддерживаемые форматы изображений
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
];

function showState(state: State['type']): void {
  waitingState.style.display = state === 'waiting' ? 'block' : 'none';
  processingState.style.display = state === 'processing' ? 'block' : 'none';
  resultState.style.display = state === 'result' ? 'block' : 'none';
  errorState.style.display = state === 'error' ? 'block' : 'none';
}

// Валидация формата файла
function validateImageFile(file: File): { valid: boolean; error?: string } {
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
function fileToBase64(file: File): Promise<string> {
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
      // Включаем свитчер при запросе новой области
      if (screenshotToggle) {
        screenshotToggle.checked = true;
      }
    }
  });
}

// Функция для активации overlay
function activateOverlay(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ACTIVATE_OVERLAY',
      }).catch(() => {
        // Игнорируем ошибки, если content script не загружен
      });
    }
  });
}

// Функция для деактивации overlay
function deactivateOverlayFromToggle(): void {
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

// Обработчик переключения свитчера
function handleToggleChange(): void {
  if (screenshotToggle.checked) {
    activateOverlay();
  } else {
    deactivateOverlayFromToggle();
  }
}

// Обработчик загрузки файла
async function handleFileUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) {
    return;
  }

  // Валидация формата
  const validation = validateImageFile(file);
  if (!validation.valid) {
    errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла';
    showState('error');
    // Сбрасываем input для возможности повторной загрузки того же файла
    input.value = '';
    return;
  }

  try {
    // Конвертируем файл в base64
    const imageData = await fileToBase64(file);
    
    // Обрабатываем изображение
    await processImage(imageData);
  } catch (error) {
    console.error('File upload error:', error);
    errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при загрузке файла';
    showState('error');
  } finally {
    // Сбрасываем input для возможности повторной загрузки того же файла
    input.value = '';
  }
}

// Обработчик клика на кнопку загрузки
function handleUploadButtonClick(): void {
  fileInput.click();
}

// Обработчики событий
copyButton.addEventListener('click', copyToClipboard);
newSelectionButton.addEventListener('click', requestNewSelection);
retryButton.addEventListener('click', () => {
  if (currentImageData) {
    processImage(currentImageData); // При повторе используем уже обрезанное изображение
  }
});
screenshotToggle.addEventListener('change', handleToggleChange);
uploadButton.addEventListener('click', handleUploadButtonClick);
fileInput.addEventListener('change', handleFileUpload);

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

// Устанавливаем правильный путь к иконке загрузки
if (uploadIcon) {
  uploadIcon.src = chrome.runtime.getURL('icons/icon-upload.svg');
}

// Активируем overlay при загрузке, если свитчер включен
if (screenshotToggle && screenshotToggle.checked) {
  // Небольшая задержка для обеспечения загрузки content script
  setTimeout(() => {
    activateOverlay();
  }, 100);
}