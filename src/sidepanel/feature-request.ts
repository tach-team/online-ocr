// Форма Feature Request

import { elements } from './dom-elements';
import { validateFile } from './file-handling';

// Типы
interface AttachedFile {
  file: File;
  preview: string; // base64 data URL
  id: string; // уникальный ID для удаления
}

// Состояние формы
let attachedFiles: AttachedFile[] = [];
const MAX_ATTACHMENTS = 3;

// Генерация уникального ID для файла
function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Создание превью файла
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

// Отрисовка прикреплённых файлов
function renderAttachments(): void {
  if (!elements.featureRequestAttachments) return;

  elements.featureRequestAttachments.innerHTML = '';

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

    elements.featureRequestAttachments!.appendChild(attachmentElement);
  });
}

// Удаление прикреплённого файла
function removeAttachment(fileId: string): void {
  attachedFiles = attachedFiles.filter((file) => file.id !== fileId);
  renderAttachments();
}

// Обработчик прикрепления файла
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

// Показать форму Feature Request
function showFeatureRequestForm(): void {
  if (!elements.featureRequestForm || !elements.statusContainer || !elements.featureRequestContent) return;

  elements.featureRequestForm.style.display = 'flex';
  elements.statusContainer.style.display = 'none';
  (elements.featureRequestContent as HTMLElement).style.display = 'none';

  // Обновляем позицию звездочек после показа формы
  setTimeout(() => {
    initializeAsterisks();
  }, 0);
}

// Скрыть форму Feature Request
function hideFeatureRequestForm(): void {
  if (!elements.featureRequestForm || !elements.statusContainer || !elements.featureRequestContent) return;

  elements.featureRequestForm.style.display = 'none';
  elements.statusContainer.style.display = 'flex';
  (elements.featureRequestContent as HTMLElement).style.display = 'block';

  // Очищаем форму
  attachedFiles = [];
  renderAttachments();
  if (elements.featureRequestEmail) elements.featureRequestEmail.value = '';
  if (elements.featureRequestMessage) elements.featureRequestMessage.value = '';
}

// Отправка Feature Request
function handleFeatureRequestSend(): void {
  const email = elements.featureRequestEmail?.value || '';
  const message = elements.featureRequestMessage?.value || '';

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
  const emailWrapper = elements.featureRequestEmail?.closest('.feature-request-input-wrapper') as HTMLElement;
  const messageWrapper = elements.featureRequestMessage?.closest('.feature-request-input-wrapper') as HTMLElement;

  if (elements.featureRequestEmail && emailWrapper) {
    // Небольшая задержка для корректного вычисления стилей
    setTimeout(() => updateAsteriskPosition(elements.featureRequestEmail!, emailWrapper), 0);
    elements.featureRequestEmail.addEventListener('input', () => updateAsteriskPosition(elements.featureRequestEmail!, emailWrapper));
    elements.featureRequestEmail.addEventListener('focus', () => updateAsteriskPosition(elements.featureRequestEmail!, emailWrapper));
    elements.featureRequestEmail.addEventListener('blur', () => updateAsteriskPosition(elements.featureRequestEmail!, emailWrapper));
  }

  if (elements.featureRequestMessage && messageWrapper) {
    setTimeout(() => updateAsteriskPosition(elements.featureRequestMessage!, messageWrapper), 0);
    elements.featureRequestMessage.addEventListener('input', () => updateAsteriskPosition(elements.featureRequestMessage!, messageWrapper));
    elements.featureRequestMessage.addEventListener('focus', () => updateAsteriskPosition(elements.featureRequestMessage!, messageWrapper));
    elements.featureRequestMessage.addEventListener('blur', () => updateAsteriskPosition(elements.featureRequestMessage!, messageWrapper));
  }
}

// Обработчик ресайза для обновления позиции звездочек
function handleResize(): void {
  const emailWrapper = elements.featureRequestEmail?.closest('.feature-request-input-wrapper') as HTMLElement;
  const messageWrapper = elements.featureRequestMessage?.closest('.feature-request-input-wrapper') as HTMLElement;

  if (elements.featureRequestEmail && emailWrapper) {
    updateAsteriskPosition(elements.featureRequestEmail, emailWrapper);
  }
  if (elements.featureRequestMessage && messageWrapper) {
    updateAsteriskPosition(elements.featureRequestMessage, messageWrapper);
  }
}

// Инициализация формы Feature Request
export function initFeatureRequestForm(): void {
  // Обработчики событий для формы
  if (elements.featureRequestLink) {
    elements.featureRequestLink.addEventListener('click', (e) => {
      e.preventDefault();
      showFeatureRequestForm();
    });
  }

  if (elements.featureRequestBackButton) {
    elements.featureRequestBackButton.addEventListener('click', () => {
      hideFeatureRequestForm();
    });
  }

  if (elements.featureRequestSendButton) {
    elements.featureRequestSendButton.addEventListener('click', () => {
      handleFeatureRequestSend();
    });
  }

  if (elements.featureRequestAttachButton && elements.featureRequestFileInput) {
    elements.featureRequestAttachButton.addEventListener('click', () => {
      elements.featureRequestFileInput!.click();
    });
  }

  if (elements.featureRequestFileInput) {
    elements.featureRequestFileInput.addEventListener('change', handleFileAttach);
  }

  // Устанавливаем правильный путь к иконке скрепки через CSS переменную
  const attachIconElement = elements.featureRequestAttachButton?.querySelector('.feature-request-attach-icon');
  if (attachIconElement) {
    const iconUrl = chrome.runtime.getURL('icons/icon-attach.svg');
    (attachIconElement as HTMLElement).style.setProperty('--attach-icon-url', `url(${iconUrl})`);
    (attachIconElement as HTMLElement).style.setProperty('-webkit-mask-image', `url(${iconUrl})`);
    (attachIconElement as HTMLElement).style.setProperty('mask-image', `url(${iconUrl})`);
  }

  // Устанавливаем правильный путь к иконке крестика через CSS переменную
  const crossIconUrl = chrome.runtime.getURL('icons/icon-cross.svg');
  document.documentElement.style.setProperty('--cross-icon-url', `url(${crossIconUrl})`);

  // Инициализируем звездочки
  initializeAsterisks();

  // Обновляем позицию при изменении размера окна
  window.addEventListener('resize', handleResize);
}
