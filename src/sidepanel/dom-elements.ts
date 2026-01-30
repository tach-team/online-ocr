// Кэш DOM-элементов sidepanel

export const elements = {
  // Основные состояния
  waitingState: document.getElementById('waiting-state')!,
  resultState: document.getElementById('result-state')!,
  errorState: document.getElementById('error-state')!,

  // Область загрузки
  uploadArea: document.getElementById('upload-area')!,
  processingContent: document.getElementById('processing-content')!,
  processingText: document.getElementById('processing-text')!,
  progressFill: document.getElementById('progress-fill')!,

  // Результат
  resultText: document.getElementById('result-text') as HTMLTextAreaElement,
  copyButton: document.getElementById('copy-button')!,
  backButton: document.getElementById('back-button')!,
  retryButton: document.getElementById('retry-button')!,
  errorMessage: document.getElementById('error-message')!,

  // Элементы управления
  screenshotToggle: document.getElementById('screenshot-toggle') as HTMLInputElement,
  fileInput: document.getElementById('file-input') as HTMLInputElement,
  uploadButton: document.getElementById('upload-button')!,
  uploadIcon: document.getElementById('upload-icon') as HTMLImageElement,

  // Контейнеры
  container: document.querySelector('.container')!,
  dragOverlay: document.getElementById('drag-overlay')!,
  dragUploadIcon: document.getElementById('drag-upload-icon') as HTMLImageElement,

  // Язык результата
  resultLanguageContainer: document.getElementById('result-language') as HTMLElement | null,
  resultLanguageName: document.getElementById('result-detected-language-name') as HTMLElement | null,
  resultLanguageSelect: document.getElementById('result-language-select') as HTMLSelectElement | null,
  languageWarning: document.getElementById('language-warning') as HTMLElement | null,

  // Feature Request форма
  featureRequestLink: document.getElementById('feature-request-link'),
  featureRequestForm: document.getElementById('feature-request-form'),
  featureRequestBackButton: document.getElementById('feature-request-back-button'),
  featureRequestSendButton: document.getElementById('feature-request-send-button'),
  featureRequestAttachButton: document.getElementById('feature-request-attach-button'),
  featureRequestFileInput: document.getElementById('feature-request-file-input') as HTMLInputElement,
  featureRequestAttachments: document.getElementById('feature-request-attachments'),
  statusContainer: document.getElementById('status-container'),
  featureRequestContent: document.querySelector('.feature-request-content'),
  featureRequestEmail: document.getElementById('feature-request-email') as HTMLInputElement,
  featureRequestMessage: document.getElementById('feature-request-message') as HTMLTextAreaElement,
};
