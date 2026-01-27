import { recognizeText, initializeOCR, OCRProgress } from './utils/ocr';
import { cropImage, SelectionRect, ViewportInfo } from './utils/image-crop';
import { validatePdfFile, convertPdfPageToImage } from './utils/pdf-to-image';

interface State {
  type: 'waiting' | 'processing' | 'result' | 'error';
}

let currentImageData: string | null = null;
let originalRecognizedText: string = '';
let isClipboardActive: boolean = false;

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
  'application/pdf',
];

const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'pdf',
];

const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_PAGES = 1;

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

// Проверка, является ли файл PDF
function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') {
    return true;
  }
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();
  return extension === 'pdf';
}

// Валидация формата файла (изображения и PDF)
async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Если это PDF, используем специальную валидацию
  if (isPdfFile(file)) {
    const validation = await validatePdfFile(file, MAX_PDF_SIZE_MB, MAX_PDF_PAGES);
    return validation;
  }

  // Валидация изображений (старая логика)
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

// Конвертация Blob в base64 строку
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Ошибка чтения изображения из буфера обмена'));
    };
    reader.readAsDataURL(blob);
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

// Обработка PDF файла
async function processPdfFile(file: File): Promise<void> {
  try {
    // Валидация PDF
    const validation = await validatePdfFile(file, MAX_PDF_SIZE_MB, MAX_PDF_PAGES);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ошибка валидации PDF');
    }

    // Конвертируем первую страницу PDF в изображение
    const imageData = await convertPdfPageToImage(file, 1, 2);
    
    // Обрабатываем полученное изображение через существующий pipeline
    await processImage(imageData);
  } catch (error) {
    console.error('PDF processing error:', error);
    resetUploadContainer();
    let errorText = 'Неизвестная ошибка при обработке PDF';
    if (error instanceof Error) {
      errorText = error.message || error.toString() || errorText;
    } else if (error) {
      errorText = String(error) || errorText;
    }
    if (!errorText || errorText === 'undefined' || errorText === 'null') {
      errorText = 'Произошла неизвестная ошибка при обработке PDF файла';
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
  // Оставляем тогглер включённым и активируем overlay для немедленного выделения
  if (screenshotToggle) {
    screenshotToggle.checked = true;
    activateOverlay();
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
  const validation = await validateFile(file);
  if (!validation.valid) {
    errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла';
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
    errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при загрузке файла';
    showState('error');
  } finally {
    // Сбрасываем input для возможности повторной загрузки того же файла
    input.value = '';
  }
}

// Обработчик клика на кнопку загрузки
function handleUploadButtonClick(event: MouseEvent): void {
  event.stopPropagation(); // Предотвращаем всплытие события до upload-area
  fileInput.click();
}

// Функции для управления активацией буфера обмена
function activateClipboard(): void {
  isClipboardActive = true;
  uploadArea.classList.add('active');
}

function deactivateClipboard(): void {
  isClipboardActive = false;
  uploadArea.classList.remove('active');
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
        errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла из буфера обмена';
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
        errorMessage.textContent = error instanceof Error ? error.message : 'Ошибка при вставке файла из буфера обмена';
        showState('error');
        deactivateClipboard();
      }
      
      return; // Обработали первый найденный файл
    }
  }
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
    errorMessage.textContent = validation.error || 'Неподдерживаемый формат файла';
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
uploadArea.addEventListener('click', handleUploadAreaClick);
document.addEventListener('click', handleClickOutside);
document.addEventListener('paste', handlePaste);
window.addEventListener('blur', handleWindowBlur);
document.addEventListener('visibilitychange', handleVisibilityChange);

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

// Feature Request Form
interface AttachedFile {
  file: File;
  preview: string; // base64 data URL
  id: string; // уникальный ID для удаления
}

const featureRequestLink = document.getElementById('feature-request-link');
const featureRequestForm = document.getElementById('feature-request-form');
const featureRequestBackButton = document.getElementById('feature-request-back-button');
const featureRequestSendButton = document.getElementById('feature-request-send-button');
const featureRequestAttachButton = document.getElementById('feature-request-attach-button');
const featureRequestFileInput = document.getElementById('feature-request-file-input') as HTMLInputElement;
const featureRequestAttachments = document.getElementById('feature-request-attachments');
const statusContainer = document.getElementById('status-container');
const featureRequestContent = document.querySelector('.feature-request-content');

let attachedFiles: AttachedFile[] = [];
const MAX_ATTACHMENTS = 3;

function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    reader.readAsDataURL(file);
  });
}

function renderAttachments(): void {
  if (!featureRequestAttachments) return;

  featureRequestAttachments.innerHTML = '';

  attachedFiles.forEach((attachedFile) => {
    const attachmentElement = document.createElement('div');
    attachmentElement.className = 'feature-request-attachment';
    attachmentElement.dataset.fileId = attachedFile.id;

    const previewElement = document.createElement('div');
    previewElement.className = 'feature-request-attachment-preview';

    if (attachedFile.preview) {
      const img = document.createElement('img');
      img.src = attachedFile.preview;
      img.alt = attachedFile.file.name;
      previewElement.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'feature-request-attachment-preview-placeholder';
      placeholder.textContent = 'IMG';
      previewElement.appendChild(placeholder);
    }

    const nameElement = document.createElement('div');
    nameElement.className = 'feature-request-attachment-name';
    nameElement.textContent = attachedFile.file.name;
    nameElement.title = attachedFile.file.name;

    const removeButton = document.createElement('button');
    removeButton.className = 'feature-request-attachment-remove';
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', 'Удалить файл');
    removeButton.addEventListener('click', () => {
      removeAttachment(attachedFile.id);
    });

    attachmentElement.appendChild(previewElement);
    attachmentElement.appendChild(nameElement);
    attachmentElement.appendChild(removeButton);

    featureRequestAttachments.appendChild(attachmentElement);
  });
}

function removeAttachment(fileId: string): void {
  attachedFiles = attachedFiles.filter((file) => file.id !== fileId);
  renderAttachments();
}

async function handleFileAttach(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) {
    return;
  }

  // Проверяем, сколько файлов можно добавить
  const availableSlots = MAX_ATTACHMENTS - attachedFiles.length;
  if (availableSlots <= 0) {
    alert(`Можно прикрепить максимум ${MAX_ATTACHMENTS} изображения`);
    input.value = '';
    return;
  }

  // Обрабатываем файлы (не более доступных слотов)
  const filesToProcess = Array.from(files).slice(0, availableSlots);

  for (const file of filesToProcess) {
    // Валидация формата
    const validation = await validateFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Неподдерживаемый формат файла');
      continue;
    }

    try {
      // Создаем превью
      const preview = await createFilePreview(file);

      // Добавляем файл в массив
      const attachedFile: AttachedFile = {
        file,
        preview,
        id: generateFileId(),
      };

      attachedFiles.push(attachedFile);
    } catch (error) {
      console.error('Ошибка при создании превью:', error);
      alert('Ошибка при обработке файла');
    }
  }

  // Обновляем отображение
  renderAttachments();

  // Сбрасываем input
  input.value = '';
}

function showFeatureRequestForm(): void {
  if (!featureRequestForm || !statusContainer || !featureRequestContent) return;

  featureRequestForm.style.display = 'flex';
  statusContainer.style.display = 'none';
  (featureRequestContent as HTMLElement).style.display = 'none';
  
  // Обновляем позицию звездочек после показа формы
  setTimeout(() => {
    initializeAsterisks();
  }, 0);
}

function hideFeatureRequestForm(): void {
  if (!featureRequestForm || !statusContainer || !featureRequestContent) return;

  featureRequestForm.style.display = 'none';
  statusContainer.style.display = 'flex';
  (featureRequestContent as HTMLElement).style.display = 'block';

  // Очищаем форму
  attachedFiles = [];
  renderAttachments();
  const emailInput = document.getElementById('feature-request-email') as HTMLInputElement;
  const messageTextarea = document.getElementById('feature-request-message') as HTMLTextAreaElement;
  if (emailInput) emailInput.value = '';
  if (messageTextarea) messageTextarea.value = '';
}

function handleFeatureRequestSend(): void {
  const emailInput = document.getElementById('feature-request-email') as HTMLInputElement;
  const messageTextarea = document.getElementById('feature-request-message') as HTMLTextAreaElement;

  const email = emailInput?.value || '';
  const message = messageTextarea?.value || '';

  // Пока только логируем данные (без реальной отправки)
  console.log('Feature Request Data:', {
    email,
    message,
    attachments: attachedFiles.map((f) => ({
      name: f.file.name,
      size: f.file.size,
      type: f.file.type,
    })),
  });

  alert('Форма отправлена (заглушка)');
}

// Обработчики событий для формы
if (featureRequestLink) {
  featureRequestLink.addEventListener('click', (e) => {
    e.preventDefault();
    showFeatureRequestForm();
  });
}

if (featureRequestBackButton) {
  featureRequestBackButton.addEventListener('click', () => {
    hideFeatureRequestForm();
  });
}

if (featureRequestSendButton) {
  featureRequestSendButton.addEventListener('click', () => {
    handleFeatureRequestSend();
  });
}

if (featureRequestAttachButton && featureRequestFileInput) {
  featureRequestAttachButton.addEventListener('click', () => {
    featureRequestFileInput.click();
  });
}

if (featureRequestFileInput) {
  featureRequestFileInput.addEventListener('change', handleFileAttach);
}

// Устанавливаем правильный путь к иконке скрепки через CSS переменную
const attachIconElement = featureRequestAttachButton?.querySelector('.feature-request-attach-icon');
if (attachIconElement) {
  const iconUrl = chrome.runtime.getURL('icons/icon-attach.svg');
  (attachIconElement as HTMLElement).style.setProperty('--attach-icon-url', `url(${iconUrl})`);
  (attachIconElement as HTMLElement).style.setProperty('-webkit-mask-image', `url(${iconUrl})`);
  (attachIconElement as HTMLElement).style.setProperty('mask-image', `url(${iconUrl})`);
}

// Устанавливаем правильный путь к иконке крестика через CSS переменную
const crossIconUrl = chrome.runtime.getURL('icons/icon-cross.svg');
document.documentElement.style.setProperty('--cross-icon-url', `url(${crossIconUrl})`);

// Вычисляем позицию звездочки на основе ширины текста плейсхолдера
function updateAsteriskPosition(element: HTMLInputElement | HTMLTextAreaElement, wrapper: HTMLElement): void {
  if (!element.value && element.placeholder) {
    // Получаем вычисленные стили элемента
    const computedStyle = window.getComputedStyle(element);
    
    // Создаем временный элемент для измерения ширины текста плейсхолдера
    const temp = document.createElement('span');
    temp.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      font-size: ${computedStyle.fontSize};
      font-family: ${computedStyle.fontFamily};
      font-weight: ${computedStyle.fontWeight};
      padding: 0;
      margin: 0;
    `;
    temp.textContent = element.placeholder;
    document.body.appendChild(temp);
    const width = temp.offsetWidth;
    document.body.removeChild(temp);
    
    // Получаем padding-left элемента
    const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 20;
    
    // Устанавливаем позицию звездочки (ширина текста + padding + небольшой отступ)
    wrapper.style.setProperty('--placeholder-width', `${width + paddingLeft + 4}px`);
  } else {
    // Скрываем звездочку, если поле заполнено
    wrapper.style.setProperty('--placeholder-width', '0px');
  }
}

// Инициализируем позиционирование звездочек
function initializeAsterisks(): void {
  const emailInput = document.getElementById('feature-request-email') as HTMLInputElement;
  const messageTextarea = document.getElementById('feature-request-message') as HTMLTextAreaElement;
  const emailWrapper = emailInput?.closest('.feature-request-input-wrapper') as HTMLElement;
  const messageWrapper = messageTextarea?.closest('.feature-request-input-wrapper') as HTMLElement;

  if (emailInput && emailWrapper) {
    // Небольшая задержка для корректного вычисления стилей
    setTimeout(() => updateAsteriskPosition(emailInput, emailWrapper), 0);
    emailInput.addEventListener('input', () => updateAsteriskPosition(emailInput, emailWrapper));
    emailInput.addEventListener('focus', () => updateAsteriskPosition(emailInput, emailWrapper));
    emailInput.addEventListener('blur', () => updateAsteriskPosition(emailInput, emailWrapper));
  }

  if (messageTextarea && messageWrapper) {
    setTimeout(() => updateAsteriskPosition(messageTextarea, messageWrapper), 0);
    messageTextarea.addEventListener('input', () => updateAsteriskPosition(messageTextarea, messageWrapper));
    messageTextarea.addEventListener('focus', () => updateAsteriskPosition(messageTextarea, messageWrapper));
    messageTextarea.addEventListener('blur', () => updateAsteriskPosition(messageTextarea, messageWrapper));
  }
}

// Инициализируем при загрузке
initializeAsterisks();

// Обновляем позицию при изменении размера окна
window.addEventListener('resize', () => {
  const emailInput = document.getElementById('feature-request-email') as HTMLInputElement;
  const messageTextarea = document.getElementById('feature-request-message') as HTMLTextAreaElement;
  const emailWrapper = emailInput?.closest('.feature-request-input-wrapper') as HTMLElement;
  const messageWrapper = messageTextarea?.closest('.feature-request-input-wrapper') as HTMLElement;
  
  if (emailInput && emailWrapper) {
    updateAsteriskPosition(emailInput, emailWrapper);
  }
  if (messageTextarea && messageWrapper) {
    updateAsteriskPosition(messageTextarea, messageWrapper);
  }
});
