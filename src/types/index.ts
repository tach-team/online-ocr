// Централизованный экспорт всех типов

// OCR типы
export type { OCRProgress, OCRResult, DetectedLanguage, SupportedLanguage } from './ocr';

// Типы выделения и viewport
export type { SelectionRect, ViewportInfo } from './selection';

// Типы состояния
export type { State, AppStateType } from './state';

// Типы файлов
export type { ValidationResult, PdfValidationResult, AttachedFile } from './files';

// Типы сообщений
export type {
  MessageType,
  BaseMessage,
  PingMessage,
  CaptureAreaMessage,
  ProcessImageMessage,
  ActivateOverlayMessage,
  DeactivateOverlayMessage,
  ExtensionMessage,
} from './messages';
