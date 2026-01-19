import { createWorker } from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

let worker: any = null;

let progressCallback: ((progress: OCRProgress) => void) | null = null;

export async function initializeOCR(): Promise<void> {
  if (!worker) {
    try {
      const workerPath = chrome.runtime.getURL('workers/');
      const workerUrl = chrome.runtime.getURL('workers/worker.min.js');
      
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
      const corePath = chrome.runtime.getURL('core/tesseract-core-lstm.wasm.js');
      const langPath = 'https://tessdata.projectnaptha.com/4.0.0_fast/'; // CDN для языковых данных (fetch разрешен)
      
      console.log('Начинаем создание worker...');
      console.log('Worker path:', workerUrl);
      console.log('Core path:', corePath);
      console.log('Lang path:', langPath);
      
      try {
        // Оборачиваем в Promise для лучшей обработки ошибок
        worker = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Таймаут при создании worker (30 секунд)'));
          }, 30000);
          
          createWorker('rus+eng', 1, {
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
                    progress: 0.1,
                  });
                } else if (m.status === 'initializing tesseract') {
                  progressCallback({
                    status: 'initializing',
                    progress: 0.2,
                  });
                }
              }
            },
          })
            .then((w) => {
              clearTimeout(timeout);
              console.log('Worker успешно создан');
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
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  if (!worker) {
    progressCallback = onProgress || null;
    await initializeOCR();
  } else {
    progressCallback = onProgress || null;
  }

  try {
    const result = await worker.recognize(imageData, {
      rectangle: undefined, // Обрабатываем все изображение
    });

    if (onProgress) {
      onProgress({
        status: 'completed',
        progress: 1,
      });
    }

    progressCallback = null;

    return {
      text: result.data.text.trim(),
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
  }
}
