import { createWorker } from 'tesseract.js';
import { franc } from 'franc-min';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface DetectedLanguage {
  language: string;
  confidence: number;
  shortText?: boolean;
}

export interface SupportedLanguage {
  code: string;
  label: string;
}

// Поддерживаемые языки для UI и логики
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'eng', label: 'English' },
  { code: 'rus', label: 'Russian' },
  { code: 'deu', label: 'German' },
  { code: 'fra', label: 'French' },
  { code: 'spa', label: 'Spanish' },
  { code: 'ita', label: 'Italian' },
  { code: 'nld', label: 'Dutch' },
  { code: 'swe', label: 'Swedish' },
  { code: 'dan', label: 'Danish' },
  { code: 'nor', label: 'Norwegian' },
  { code: 'fin', label: 'Finnish' },
  { code: 'ara', label: 'Arabic' },
  { code: 'ind', label: 'Indonesian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'fil', label: 'Filipino' },
  { code: 'vie', label: 'Vietnamese' },
  { code: 'tur', label: 'Turkish' },
  { code: 'tha', label: 'Thai' },
  { code: 'kor', label: 'Korean' },
];

const DEFAULT_LANGUAGE_CODE = 'rus+eng';

// Сопоставление кодов Tesseract и franc (ISO 639-3)
const TESSERACT_TO_FRANC: Record<string, string> = {
  eng: 'eng',
  rus: 'rus',
  deu: 'deu',
  fra: 'fra',
  spa: 'spa',
  ita: 'ita',
  nld: 'nld',
  swe: 'swe',
  dan: 'dan',
  nor: 'nno', // одна из норвежских норм
  fin: 'fin',
  ara: 'ara',
  ind: 'ind',
  por: 'por',
  jpn: 'jpn',
  fil: 'tgl', // Tagalog / Filipino
  vie: 'vie',
  tur: 'tur',
  tha: 'tha',
  kor: 'kor',
};

const MIN_TEXT_LENGTH_FOR_FRANC = 20;

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
      console.log('OCR languages:', languageCode || DEFAULT_LANGUAGE_CODE);
      
      try {
        // Оборачиваем в Promise для лучшей обработки ошибок
        worker = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Таймаут при создании worker (30 секунд)'));
          }, 30000);
          
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
        progress: 1,
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

type ScriptType = 'latin' | 'cyrillic' | 'arabic' | 'cjk' | 'hangul' | 'thai' | 'unknown';

function detectScript(text: string): ScriptType {
  let latin = 0;
  let cyrillic = 0;
  let arabic = 0;
  let cjk = 0;
  let hangul = 0;
  let thai = 0;

  for (const ch of text) {
    const code = ch.charCodeAt(0);

    if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) {
      latin++;
    } else if (
      (code >= 0x0400 && code <= 0x04FF) || // Базовая кириллица
      (code >= 0x0500 && code <= 0x052F) || // Расширенная кириллица
      code === 0x0401 || // Ё
      code === 0x0451 // ё
    ) {
      cyrillic++;
    } else if (code >= 0x0600 && code <= 0x06FF) {
      arabic++;
    } else if (
      (code >= 0x3040 && code <= 0x30FF) || // Хирагана + катакана
      (code >= 0x4E00 && code <= 0x9FFF) // CJK
    ) {
      cjk++;
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
      hangul++;
    } else if (code >= 0x0E00 && code <= 0x0E7F) {
      thai++;
    }
  }

  const counts: { type: ScriptType; count: number }[] = [
    { type: 'latin', count: latin },
    { type: 'cyrillic', count: cyrillic },
    { type: 'arabic', count: arabic },
    { type: 'cjk', count: cjk },
    { type: 'hangul', count: hangul },
    { type: 'thai', count: thai },
  ];

  const best = counts.reduce(
    (acc, cur) => (cur.count > acc.count ? cur : acc),
    { type: 'unknown' as ScriptType, count: 0 }
  );

  if (best.count === 0) {
    return 'unknown';
  }

  return best.type;
}

function getScriptForLanguage(code: string): ScriptType {
  switch (code) {
    case 'rus':
      return 'cyrillic';
    case 'ara':
      return 'arabic';
    case 'kor':
      return 'hangul';
    case 'jpn':
      return 'cjk';
    case 'tha':
      return 'thai';
    default:
      // Все остальные — латинские языки
      return 'latin';
  }
}

export async function detectLanguageFromImage(
  imageData: string,
  candidateLanguages: string[]
): Promise<DetectedLanguage> {
  const effectiveCandidates =
    candidateLanguages && candidateLanguages.length > 0
      ? candidateLanguages
      : SUPPORTED_LANGUAGES.map((l) => l.code);

  // 1. Получаем текст в мультиязычном режиме
  const detectionLangCode = effectiveCandidates.join('+');
  const ocrResult = await recognizeText(imageData, detectionLangCode);
  const rawText = ocrResult.text || '';
  const text = rawText.replace(/\s+/g, ' ').trim();

  if (!text) {
    console.log('[OCR] Language detection: empty text, fallback to first candidate');
    return {
      language: effectiveCandidates[0] || DEFAULT_LANGUAGE_CODE,
      confidence: 0,
      shortText: true,
    };
  }

  // Если текста мало, franc даёт нестабильные результаты — используем fallback по алфавиту
  if (text.length < MIN_TEXT_LENGTH_FOR_FRANC) {
    console.log('[OCR] Language detection: text too short for franc, length =', text.length);
    const script = detectScript(text);
    const matchedShort = effectiveCandidates.find((code) => getScriptForLanguage(code) === script);
    return {
      language: matchedShort || effectiveCandidates[0] || DEFAULT_LANGUAGE_CODE,
      confidence: ocrResult.confidence || 0,
      shortText: true,
    };
  }

  // 2. Готовим whitelist для franc только по тем языкам, которые реально доступны
  const francWhitelist = Array.from(
    new Set(
      effectiveCandidates
        .map((code) => TESSERACT_TO_FRANC[code])
        .filter((c): c is string => Boolean(c))
    )
  );

  let francCode: string | undefined;
  try {
    francCode = franc(text, { only: francWhitelist, minLength: MIN_TEXT_LENGTH_FOR_FRANC });
  } catch (err) {
    console.error('[OCR] franc language detection error:', err);
  }

  if (francCode && francCode !== 'und') {
    const mapped = effectiveCandidates.find((code) => TESSERACT_TO_FRANC[code] === francCode);
    if (mapped) {
      console.log('[OCR] franc detected language:', francCode, '=>', mapped);
      return {
        language: mapped,
        confidence: ocrResult.confidence || 0,
        shortText: false,
      };
    }
  } else {
    console.warn('[OCR] franc returned und or empty, francCode =', francCode);
  }

  // 3. Fallback: определяем язык по алфавиту
  const script = detectScript(text);
  const matched = effectiveCandidates.find((code) => getScriptForLanguage(code) === script);

  return {
    language: matched || effectiveCandidates[0] || DEFAULT_LANGUAGE_CODE,
    confidence: ocrResult.confidence || 0,
    shortText: false,
  };
}

