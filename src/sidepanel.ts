import { recognizeText, initializeOCR, OCRProgress } from './utils/ocr';
import { cropImage, SelectionRect, ViewportInfo } from './utils/image-crop';

interface State {
  type: 'waiting' | 'processing' | 'result' | 'error';
}

let currentImageData: string | null = null;
let originalRecognizedText: string = '';

// Элементы DOM
const waitingState = document.getElementById('waiting-state')!;
const resultState = document.getElementById('result-state')!;
const errorState = document.getElementById('error-state')!;
const uploadArea = document.getElementById('upload-area')!;
const processingContent = document.getElementById('processing-content')!;
const processingText = document.getElementById('processing-text')!;
const progressFill = document.getElementById('progress-fill')!;
const resultText = document.getElementById('result-text') as HTMLTextAreaElement;
const copyButton = document.getElementById('copy-button')!;
const backButton = document.getElementById('back-button')!;
const retryButton = document.getElementById('retry-button')!;
const errorMessage = document.getElementById('error-message')!;
const screenshotToggle = document.getElementById('screenshot-toggle') as HTMLInputElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const uploadButton = document.getElementById('upload-button')!;
const uploadIcon = document.getElementById('upload-icon') as HTMLImageElement;
const container = document.querySelector('.container')!;
const dragOverlay = document.getElementById('drag-overlay')!;
const dragUploadIcon = document.getElementById('drag-upload-icon') as HTMLImageElement;

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
  // waiting-state остается видимым во время обработки
  waitingState.style.display = (state === 'waiting' || state === 'processing') ? 'block' : 'none';
  resultState.style.display = state === 'result' ? 'block' : 'none';
  errorState.style.display = state === 'error' ? 'block' : 'none';
}

// Функция для переключения состояния upload-container в режим обработки
function setUploadContainerProcessing(imageData: string): void {
  uploadArea.classList.add('processing');
  uploadArea.style.setProperty('--processing-bg-image', `url(${imageData})`);
  processingContent.style.display = 'flex';
  processingText.textContent = '0%';
  progressFill.style.width = '0%';
}

// Функция для возврата upload-container к исходному состоянию
function resetUploadContainer(): void {
  uploadArea.classList.remove('processing');
  uploadArea.style.removeProperty('--processing-bg-image');
  processingContent.style.display = 'none';
  processingText.textContent = '';
  progressFill.style.width = '0%';
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
  setUploadContainerProcessing(imageData);

  try {
    let processedImageData = imageData;

    // Если есть информация о выделении, обрезаем изображение
    if (selection && viewport) {
      try {
        processedImageData = await cropImage(imageData, selection, viewport);
        console.log('Image cropped successfully');
        // Обновляем фоновое изображение после обрезки
        setUploadContainerProcessing(processedImageData);
      } catch (cropError) {
        console.error('Crop error:', cropError);
        resetUploadContainer();
        throw new Error(`Ошибка обрезки изображения: ${cropError instanceof Error ? cropError.message : String(cropError)}`);
      }
    }

    currentImageData = processedImageData;

    // Инициализируем OCR при первой загрузке
    try {
      await initializeOCR();
      console.log('OCR initialized');
    } catch (initError) {
      console.error('OCR initialization error:', initError);
      resetUploadContainer();
      throw new Error(`Ошибка инициализации OCR: ${initError instanceof Error ? initError.message : String(initError)}`);
    }

    // Обрабатываем изображение
    try {
      const result = await recognizeText(processedImageData, (progress: OCRProgress) => {
        const percent = Math.round(progress.progress * 100);
        progressFill.style.width = `${percent}%`;
        processingText.textContent = `${percent}%`;
      });

      // Показываем результат и сбрасываем состояние upload-container
      resetUploadContainer();
      const recognizedText = result.text || 'Текст не найден';
      originalRecognizedText = recognizedText;
      resultText.value = recognizedText;
      showState('result');
      // Вызываем autoResizeTextarea после того, как элемент стал видимым
      requestAnimationFrame(() => {
        autoResizeTextarea();
      });
    } catch (recognizeError) {
      console.error('Recognition error:', recognizeError);
      resetUploadContainer();
      throw new Error(`Ошибка распознавания текста: ${recognizeError instanceof Error ? recognizeError.message : String(recognizeError)}`);
    }
  } catch (error) {
    console.error('Processing error:', error);
    resetUploadContainer();
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

function autoResizeTextarea(): void {
  // Сбрасываем высоту на auto для корректного расчета scrollHeight
  resultText.style.height = 'auto';
  
  // Вычисляем максимальную доступную высоту с учетом кнопок и отступов
  const resultStateRect = resultState.getBoundingClientRect();
  const buttonsRect = resultState.querySelector('.result-buttons')?.getBoundingClientRect();
  const buttonsHeight = buttonsRect ? buttonsRect.height + 16 : 60; // 16px - margin-bottom textarea
  const paddingTop = parseInt(getComputedStyle(resultState).paddingTop || '0', 10);
  const paddingBottom = parseInt(getComputedStyle(resultState).paddingBottom || '0', 10);
  const maxHeight = resultStateRect.height - buttonsHeight - paddingTop - paddingBottom;
  
  // Устанавливаем высоту, но не превышающую максимальную доступную
  const contentHeight = resultText.scrollHeight;
  const targetHeight = Math.min(contentHeight, maxHeight);
  
  resultText.style.height = `${targetHeight}px`;
  
  // Если контент превышает доступное пространство, включаем прокрутку
  if (contentHeight > maxHeight) {
    resultText.style.overflowY = 'auto';
  } else {
    resultText.style.overflowY = 'hidden';
  }
}

async function copyToClipboard(): Promise<void> {
  const text = resultText.value || '';
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = '✓ Copied!';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = 'Copy Text';
      copyButton.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('Не удалось скопировать текст');
  }
}

function backToMain(): void {
  // Сбрасываем текст к исходному распознанному тексту
  resultText.value = originalRecognizedText;
  autoResizeTextarea();
  resetUploadContainer();
  // Выключаем тогглер Screenshot to text
  if (screenshotToggle) {
    screenshotToggle.checked = false;
    deactivateOverlayFromToggle();
  }
  showState('waiting');
}

function requestNewSelection(): void {
  // Отправляем сообщение content script для активации overlay
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ACTIVATE_OVERLAY',
      });
      resetUploadContainer();
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

// Drag & Drop функционал
let dragCounter = 0;

function showDragOverlay(): void {
  container.classList.add('dragging');
  dragOverlay.classList.add('active');
}

function hideDragOverlay(): void {
  container.classList.remove('dragging');
  dragOverlay.classList.remove('active');
}

function hasImageFile(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  
  // Проверяем типы файлов
  if (dataTransfer.types.includes('Files')) {
    // Проверяем items для более точного определения типа
    if (dataTransfer.items) {
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file' && ALLOWED_MIME_TYPES.includes(item.type.toLowerCase())) {
          return true;
        }
      }
    }
    // Если items недоступны, допускаем возможность изображения
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
  const validation = validateImageFile(file);
  if (!validation.valid) {
    errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла';
    showState('error');
    return;
  }
  
  try {
    // Конвертируем файл в base64
    const imageData = await fileToBase64(file);
    
    // Обрабатываем изображение
    await processImage(imageData);
  } catch (error) {
    console.error('Drop error:', error);
    errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при загрузке файла';
    showState('error');
  }
}

// Обработчики событий
copyButton.addEventListener('click', copyToClipboard);
backButton.addEventListener('click', backToMain);
resultText.addEventListener('input', autoResizeTextarea);
retryButton.addEventListener('click', () => {
  if (currentImageData) {
    processImage(currentImageData); // При повторе используем уже обрезанное изображение
  }
});
screenshotToggle.addEventListener('change', handleToggleChange);
uploadButton.addEventListener('click', handleUploadButtonClick);
fileInput.addEventListener('change', handleFileUpload);

// Drag & Drop события
document.body.addEventListener('dragenter', handleDragEnter);
document.body.addEventListener('dragover', handleDragOver);
document.body.addEventListener('dragleave', handleDragLeave);
document.body.addEventListener('drop', handleDrop);

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

// Устанавливаем правильный путь к иконкам загрузки
if (uploadIcon) {
  uploadIcon.src = chrome.runtime.getURL('icons/icon-upload.svg');
}
if (dragUploadIcon) {
  dragUploadIcon.src = chrome.runtime.getURL('icons/icon-upload.svg');
}

// Активируем overlay при загрузке, если свитчер включен
if (screenshotToggle && screenshotToggle.checked) {
  // Небольшая задержка для обеспечения загрузки content script
  setTimeout(() => {
    activateOverlay();
  }, 100);
}