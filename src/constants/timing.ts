// Таймауты и задержки (в миллисекундах)

export const TIMING = {
  /** Задержка активации overlay */
  OVERLAY_ACTIVATION_DELAY: 100,
  /** Время показа уведомления о копировании */
  COPY_FEEDBACK_TIMEOUT: 2000,
  /** Таймаут инициализации OCR worker */
  WORKER_INIT_TIMEOUT: 30000,
} as const;
