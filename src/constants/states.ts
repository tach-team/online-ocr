// Состояния приложения

export const APP_STATES = {
  WAITING: 'waiting',
  PROCESSING: 'processing',
  RESULT: 'result',
  ERROR: 'error',
} as const;

export type AppStateValue = (typeof APP_STATES)[keyof typeof APP_STATES];
