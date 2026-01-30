import { createWorker } from 'tesseract.js';
import {
  OCRProgress,
  OCRResult,
  DetectedLanguage,
  DEFAULT_LANGUAGE_CODE,
} from './languages';
import {
  detectLanguageFromImage as detectLanguageFromImageImpl,
} from './language-detection';
import { CDN_URLS, WORKER_PATHS, TIMING, OCR_PROGRESS } from '../constants';

// Реэкспорт типов и констант из languages.ts
export type { OCRProgress, OCRResult, DetectedLanguage, SupportedLanguage } from './languages';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE, TESSERACT_TO_FRANC, MIN_TEXT_LENGTH_FOR_FRANC } from './languages';

// Реэкспорт функций из language-detection
export type { ScriptType } from './language-detection';
export { detectScript, getScriptForLanguage } from './language-detection';

let worker: any = null;
let currentLanguageCode: string | null = null;

let progressCallback: ((progress: OCRProgress) => void) | null = null;

export async function initializeOCR(languageCode: string = DEFAULT_LANGUAGE_CODE): Promise<void> {
  // Если worker уже инициализирован с нужным языком — выходим
  if (worker && currentLanguageCode === languageCode) {
    return;
  }

  // Если worker инициализирован с другим языком — корректно завершаем
  if (worker && currentLanguageCode !== languageCode) {
    try {
      await worker.terminate();
    } catch (terminateError) {
      console.warn('Ошибка при завершении предыдущего OCR worker:', terminateError);
    }
    worker = null;
    currentLanguageCode = null;
  }

  if (!worker) {
    try {
      const workerPath = chrome.runtime.getURL(WORKER_PATHS.OCR_WORKER_DIR);
      const workerUrl = chrome.runtime.getURL(WORKER_PATHS.OCR_WORKER);
      
      console.log('Worker path:', workerPath);
      console.log('Worker URL:', workerUrl);
      
      // Проверяем доступность worker файла
      try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
          throw new Error(`Worker файл не найден (статус: ${response.status})`);
        }
        console.log('Worker файл доступен');
      } catch (fetchError) {
        console.error('Ошибка проверки worker файла:', fetchError);
        throw fetchError;
      }
      
      // Пробуем инициализировать worker
      // Указываем явные пути к файлам (не директориям!)
      const corePath = chrome.runtime.getURL(WORKER_PATHS.OCR_CORE);
      const langPath = CDN_URLS.TESSERACT_LANG_DATA; // CDN для языковых данных (fetch разрешен)
      
      console.log('Начинаем создание worker...');
      console.log('Worker path:', workerUrl);
      console.log('Core path:', corePath);
      console.log('Lang path:', langPath);
      console.log('OCR languages:', languageCode || DEFAULT_LANGUAGE_CODE);
      
      try {
        // Оборачиваем в Promise для лучшей обработки ошибок
        worker = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Таймаут при создании worker (${TIMING.WORKER_INIT_TIMEOUT / 1000} секунд)`));
          }, TIMING.WORKER_INIT_TIMEOUT);
          
          createWorker(languageCode || DEFAULT_LANGUAGE_CODE, 1, {
            workerPath: workerUrl, // Полный путь к файлу worker
            corePath: corePath, // Полный путь к core файлу
            langPath: langPath,
            workerBlobURL: false,
            logger: (m: any) => {
              // Логируем все сообщения для диагностики
              console.log('OCR Logger:', m.status, m.progress, m);
              
              // Обрабатываем ошибки
              if (m.status === 'error' || m.status === 'failed' || m.status === 'rejected') {
                console.error('OCR Error in logger:', m);
                // Если есть ошибка в logger, отклоняем промис
                if (m.error || m.message) {
                  clearTimeout(timeout);
                  reject(new Error(m.error || m.message || 'Ошибка в OCR worker'));
                }
              }
              
              // Передаем прогресс через callback
              if (progressCallback) {
                if (m.status === 'recognizing text' && m.progress !== undefined) {
                  progressCallback({
                    status: m.status,
                    progress: m.progress,
                  });
                } else if (m.status === 'loading language traineddata') {
                  progressCallback({
                    status: 'loading',
                    progress: OCR_PROGRESS.LOADING,
                  });
                } else if (m.status === 'initializing tesseract') {
                  progressCallback({
                    status: 'initializing',
                    progress: OCR_PROGRESS.INITIALIZING,
                  });
                }
              }
            },
          })
            .then((w) => {
              clearTimeout(timeout);
              console.log('Worker успешно создан');
              currentLanguageCode = languageCode || DEFAULT_LANGUAGE_CODE;
              resolve(w);
            })
            .catch((err) => {
              clearTimeout(timeout);
              console.error('Ошибка в createWorker promise:', err);
              reject(err || new Error('Неизвестная ошибка при создании worker'));
            });
        });
      } catch (createError) {
        console.error('Ошибка при создании worker:', createError);
        const errorMsg = createError instanceof Error ? createError.message : String(createError);
        throw new Error(`Не удалось создать worker: ${errorMsg || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      // Обрабатываем ошибку с детальным логированием
      console.error('Ошибка инициализации OCR:', error);
      console.error('Тип ошибки:', typeof error);
      console.error('Ошибка как объект:', error);
      
      let errorMessage = 'Не удалось инициализировать OCR';
      
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || errorMessage;
      } else if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Если сообщение пустое или undefined
      if (!errorMessage || errorMessage === 'undefined' || errorMessage === 'null' || errorMessage === '{}') {
        errorMessage = 'Не удалось инициализировать OCR. Возможно, проблема с загрузкой worker файла. Проверьте консоль для деталей.';
      }
      
      throw new Error(errorMessage);
    }
  }
}

export async function recognizeText(
  imageData: string,
  languageCode: string = DEFAULT_LANGUAGE_CODE,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  progressCallback = onProgress || null;

  if (!worker || currentLanguageCode !== languageCode) {
    await initializeOCR(languageCode);
  }

  try {
    const result = await worker.recognize(imageData, {
      rectangle: undefined, // Обрабатываем все изображение
    });

    if (onProgress) {
      onProgress({
        status: 'completed',
        progress: OCR_PROGRESS.COMPLETED,
      });
    }

    progressCallback = null;

    return {
      text: result.data.text?.trim?.() || '',
      confidence: result.data.confidence || 0,
    };
  } catch (error) {
    progressCallback = null;
    console.error('OCR Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to recognize text: ${errorMessage}`);
  }
}

export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    currentLanguageCode = null;
  }
}

/**
 * Определяет язык текста на изображении
 * Обертка над detectLanguageFromImageImpl, которая передает recognizeText
 */
export async function detectLanguageFromImage(
  imageData: string,
  candidateLanguages: string[]
): Promise<DetectedLanguage> {
  return detectLanguageFromImageImpl(imageData, candidateLanguages, recognizeText);
}
