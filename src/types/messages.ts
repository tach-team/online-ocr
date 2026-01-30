// Типы сообщений между компонентами расширения

import type { SelectionRect, ViewportInfo } from './selection';

// Типы сообщений
export type MessageType =
  | 'PING'
  | 'CAPTURE_AREA'
  | 'PROCESS_IMAGE'
  | 'ACTIVATE_OVERLAY'
  | 'DEACTIVATE_OVERLAY';

// Базовый интерфейс сообщения
export interface BaseMessage {
  type: MessageType;
}

// Сообщение PING
export interface PingMessage extends BaseMessage {
  type: 'PING';
}

// Сообщение для захвата области
export interface CaptureAreaMessage extends BaseMessage {
  type: 'CAPTURE_AREA';
  selection: SelectionRect;
  viewport: ViewportInfo;
}

// Сообщение для обработки изображения
export interface ProcessImageMessage extends BaseMessage {
  type: 'PROCESS_IMAGE';
  imageData: string;
  selection?: SelectionRect;
  viewport?: ViewportInfo;
}

// Сообщение для активации overlay
export interface ActivateOverlayMessage extends BaseMessage {
  type: 'ACTIVATE_OVERLAY';
}

// Сообщение для деактивации overlay
export interface DeactivateOverlayMessage extends BaseMessage {
  type: 'DEACTIVATE_OVERLAY';
}

// Union тип всех сообщений
export type ExtensionMessage =
  | PingMessage
  | CaptureAreaMessage
  | ProcessImageMessage
  | ActivateOverlayMessage
  | DeactivateOverlayMessage;
