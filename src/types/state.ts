// Типы для состояния приложения

export interface State {
  type: 'waiting' | 'processing' | 'result' | 'error';
}

export type AppStateType = State['type'];
