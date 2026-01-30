// Типы сообщений между компонентами расширения

export const MESSAGE_TYPES = {
  PING: 'PING',
  CAPTURE_AREA: 'CAPTURE_AREA',
  PROCESS_IMAGE: 'PROCESS_IMAGE',
  ACTIVATE_OVERLAY: 'ACTIVATE_OVERLAY',
  DEACTIVATE_OVERLAY: 'DEACTIVATE_OVERLAY',
} as const;

export type MessageTypeValue = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
