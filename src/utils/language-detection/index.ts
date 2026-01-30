import { franc } from 'franc-min';
import {
  DetectedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
  TESSERACT_TO_FRANC,
  MIN_TEXT_LENGTH_FOR_FRANC,
} from '../languages';
import { refineScandinavianLanguageDetection } from './scandinavian';
import { refineFinnishLanguageDetection } from './finnish';
import { refineTurkishLanguageDetection } from './turkish';
import { refineIndonesianLanguageDetection } from './indonesian';

// Импортируем recognizeText для использования внутри модуля
// Это создает циклическую зависимость, которую нужно разрешить через параметр
type RecognizeTextFn = (
  imageData: string,
  languageCode?: string
) => Promise<{ text: string; confidence: number }>;

export type ScriptType = 'latin' | 'cyrillic' | 'arabic' | 'cjk' | 'hangul' | 'thai' | 'unknown';

export function detectScript(text: string): ScriptType {
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

export function getScriptForLanguage(code: string): ScriptType {
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
  candidateLanguages: string[],
  recognizeText: RecognizeTextFn
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

  // Уточняем определение для скандинавских языков
  if (francCode && francCode !== 'und') {
    const refinedCode = refineScandinavianLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedCode && refinedCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedCode);
      francCode = refinedCode;
    }
  }

  // Уточняем определение для индонезийского языка (вызываем раньше, чтобы предотвратить переопределение)
  if (francCode && francCode !== 'und') {
    const refinedIndonesianCode = refineIndonesianLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedIndonesianCode && refinedIndonesianCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedIndonesianCode);
      francCode = refinedIndonesianCode;
    }
  }

  // Уточняем определение для финского языка
  if (francCode && francCode !== 'und') {
    const refinedFinnishCode = refineFinnishLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedFinnishCode && refinedFinnishCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedFinnishCode);
      francCode = refinedFinnishCode;
    }
  }

  // Уточняем определение для турецкого языка
  if (francCode && francCode !== 'und') {
    const refinedTurkishCode = refineTurkishLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedTurkishCode && refinedTurkishCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedTurkishCode);
      francCode = refinedTurkishCode;
    }
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

// Реэкспорт функций уточнения для возможного использования напрямую
export { refineScandinavianLanguageDetection } from './scandinavian';
export { refineFinnishLanguageDetection } from './finnish';
export { refineTurkishLanguageDetection } from './turkish';
export { refineIndonesianLanguageDetection } from './indonesian';
