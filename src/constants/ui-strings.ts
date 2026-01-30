// Строки для пользовательского интерфейса

export const UI_STRINGS = {
  // Кнопка копирования
  COPY_BUTTON: 'Copy Text',
  COPY_SUCCESS: '✓ Copied!',
  COPY_ERROR: 'Не удалось скопировать текст',

  // Сообщения об ошибках и предупреждениях
  TEXT_NOT_FOUND: 'Текст не найден на изображении. Попробуйте выбрать другой язык или загрузить другое изображение.',
  SHORT_TEXT_WARNING: 'Текст очень короткий, автоопределение языка может быть неточным. При необходимости выберите язык вручную.',
  UNSUPPORTED_FORMAT: 'Неподдерживаемый формат файла',
  FILE_READ_ERROR: 'Ошибка чтения файла',
  CLIPBOARD_READ_ERROR: 'Ошибка чтения изображения из буфера обмена',
  FILE_UPLOAD_ERROR: 'Ошибка при загрузке файла',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
  IMAGE_PROCESSING_ERROR: 'Произошла неизвестная ошибка при обработке изображения',
  PDF_PROCESSING_ERROR: 'Произошла неизвестная ошибка при обработке PDF файла',

  // Языки
  UNKNOWN_LANGUAGE: 'Unknown',

  // Прочее
  REMOVE_FILE: 'Удалить файл',
  IMG_PLACEHOLDER: 'IMG',
} as const;

// Дефолтный код языка для OCR
export const DEFAULT_OCR_LANGUAGE = 'rus+eng';
