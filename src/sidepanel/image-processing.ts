// Обработка изображений и OCR

import {
  recognizeText,
  OCRProgress,
  SUPPORTED_LANGUAGES,
  detectLanguageFromImage,
  DetectedLanguage,
} from '../utils/ocr';
import { cropImage, SelectionRect, ViewportInfo } from '../utils/image-crop';
import { validatePdfFile, convertPdfPageToImage } from '../utils/pdf-to-image';
import { elements } from './dom-elements';
import {
  showState,
  showError,
  setUploadContainerProcessing,
  resetUploadContainer,
  populateLanguageSelect,
  autoResizeTextarea,
  currentImageData,
  setCurrentImageData,
  setOriginalRecognizedText,
  detectedLanguageCode,
  setDetectedLanguageCode,
  selectedLanguageCode,
  setSelectedLanguageCode,
  isLanguageDetectionUncertain,
  setIsLanguageDetectionUncertain,
  getLanguageLabel,
} from './state';
import { validateFile, fileToBase64, isPdfFile } from './file-handling';
import { APP_STATES, UI_STRINGS, DEFAULT_OCR_LANGUAGE, THRESHOLDS } from '../constants';

// Основная функция обработки изображения
export async function processImage(
  imageData: string,
  selection?: SelectionRect,
  viewport?: ViewportInfo,
  skipLanguageDetection: boolean = false
): Promise<void> {
  showState(APP_STATES.PROCESSING);
  setUploadContainerProcessing(imageData);

  try {
    let processedImageData = imageData;

    // Если есть информация о выделении, обрезаем изображение
    if (selection && viewport) {
      try {
        processedImageData = await cropImage(imageData, selection, viewport);
        console.log('Image cropped successfully');
        // Обновляем фоновое изображение после обрезки
        setUploadContainerProcessing(processedImageData);
      } catch (cropError) {
        console.error('Crop error:', cropError);
        resetUploadContainer();
        throw new Error(`Ошибка обрезки изображения: ${cropError instanceof Error ? cropError.message : String(cropError)}`);
      }
    }

    setCurrentImageData(processedImageData);

    // Для нового изображения сбрасываем выбранный и автоопределенный язык
    if (!skipLanguageDetection) {
      setDetectedLanguageCode(null);
      setSelectedLanguageCode(null);
      setIsLanguageDetectionUncertain(false);
    }

    // Автоопределяем язык по изображению (только при первом запуске для данного изображения)
    let currentDetectedLanguageCode = detectedLanguageCode;
    if (!skipLanguageDetection) {
      try {
        const candidates = SUPPORTED_LANGUAGES.map((l) => l.code);
        const detection: DetectedLanguage = await detectLanguageFromImage(processedImageData, candidates);
        currentDetectedLanguageCode = detection.language;
        setDetectedLanguageCode(detection.language);
        setIsLanguageDetectionUncertain(Boolean(detection.shortText));
        console.log(
          'Detected language:',
          detection.language,
          'confidence:',
          detection.confidence,
          'shortText:',
          detection.shortText
        );
      } catch (detectError) {
        console.error('Language detection error:', detectError);
        setDetectedLanguageCode(null);
        currentDetectedLanguageCode = null;
        setIsLanguageDetectionUncertain(false);
      }
    }

    const ocrLanguage = selectedLanguageCode || currentDetectedLanguageCode || DEFAULT_OCR_LANGUAGE;

    // Обрабатываем изображение с выбранным языком
    try {
      const result = await recognizeText(processedImageData, ocrLanguage, (progress: OCRProgress) => {
        const percent = Math.round(progress.progress * 100);
        elements.progressFill.style.width = `${percent}%`;
        elements.processingText.textContent = `${percent}%`;
      });

      // Показываем результат и сбрасываем состояние upload-container
      resetUploadContainer();
      const recognizedText = result.text?.trim() || '';
      const isEmptyText = !recognizedText;

      if (isEmptyText) {
        // Если текст пустой, оставляем textarea пустым и показываем сообщение
        setOriginalRecognizedText('');
        elements.resultText.value = '';
        // Обновляем UI выбора языка в блоке результата
        populateLanguageSelect(selectedLanguageCode || currentDetectedLanguageCode);
        // Показываем сообщение о том, что текст не найден
        if (elements.languageWarning) {
          elements.languageWarning.textContent = UI_STRINGS.TEXT_NOT_FOUND;
          elements.languageWarning.style.display = 'block';
        }
      } else {
        // Если текст есть, заполняем textarea
        setOriginalRecognizedText(recognizedText);
        elements.resultText.value = recognizedText;
        // Обновляем UI выбора языка в блоке результата
        populateLanguageSelect(selectedLanguageCode || currentDetectedLanguageCode);
        // Показываем предупреждение, если язык определён по очень короткому тексту
        if (elements.languageWarning) {
          if (isLanguageDetectionUncertain) {
            elements.languageWarning.textContent = UI_STRINGS.SHORT_TEXT_WARNING;
            elements.languageWarning.style.display = 'block';
          } else {
            elements.languageWarning.textContent = '';
            elements.languageWarning.style.display = 'none';
          }
        }
      }
      showState(APP_STATES.RESULT);
      // Вызываем autoResizeTextarea после того, как элемент стал видимым
      requestAnimationFrame(() => {
        autoResizeTextarea();
      });
    } catch (recognizeError) {
      console.error('Recognition error:', recognizeError);
      resetUploadContainer();
      throw new Error(`Ошибка распознавания текста: ${recognizeError instanceof Error ? recognizeError.message : String(recognizeError)}`);
    }
  } catch (error) {
    console.error('Processing error:', error);
    resetUploadContainer();
    let errorText: string = UI_STRINGS.UNKNOWN_ERROR;
    if (error instanceof Error) {
      errorText = error.message || error.toString() || UI_STRINGS.UNKNOWN_ERROR;
    } else if (error) {
      errorText = String(error) || UI_STRINGS.UNKNOWN_ERROR;
    }
    if (!errorText || errorText === 'undefined' || errorText === 'null') {
      errorText = UI_STRINGS.IMAGE_PROCESSING_ERROR;
    }
    elements.errorMessage.textContent = errorText;
    showState(APP_STATES.ERROR);
  }
}

// Обработка PDF файла
export async function processPdfFile(file: File): Promise<void> {
  try {
    // Валидация PDF
    const validation = await validatePdfFile(file, THRESHOLDS.MAX_PDF_SIZE_MB, THRESHOLDS.MAX_PDF_PAGES);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ошибка валидации PDF');
    }

    // Конвертируем первую страницу PDF в изображение
    const imageData = await convertPdfPageToImage(file, 1, THRESHOLDS.PDF_RENDER_SCALE);

    // Обрабатываем полученное изображение через существующий pipeline
    await processImage(imageData);
  } catch (error) {
    console.error('PDF processing error:', error);
    resetUploadContainer();
    let errorText: string = UI_STRINGS.PDF_PROCESSING_ERROR;
    if (error instanceof Error) {
      errorText = error.message || error.toString() || errorText;
    } else if (error) {
      errorText = String(error) || errorText;
    }
    if (!errorText || errorText === 'undefined' || errorText === 'null') {
      errorText = UI_STRINGS.PDF_PROCESSING_ERROR;
    }
    elements.errorMessage.textContent = errorText;
    showState(APP_STATES.ERROR);
  }
}

// Обработчик изменения языка в результате
export function handleResultLanguageChange(): void {
  if (!elements.resultLanguageSelect || !currentImageData) return;

  setSelectedLanguageCode(elements.resultLanguageSelect.value);

  if (elements.resultLanguageName) {
    elements.resultLanguageName.textContent = getLanguageLabel(selectedLanguageCode);
  }

  // Запускаем повторное распознавание для текущего изображения без повторного автоопределения языка
  void processImage(currentImageData, undefined, undefined, true);
}

/**
 * Единая функция обработки файла (изображение или PDF)
 * Используется в index.ts, drag-drop.ts, clipboard.ts для устранения дублирования
 */
export async function handleFileProcessing(file: File): Promise<void> {
  // Валидация формата
  const validation = await validateFile(file);
  if (!validation.valid) {
    showError(validation.error || UI_STRINGS.UNSUPPORTED_FORMAT);
    return;
  }

  // Если это PDF, обрабатываем через processPdfFile
  if (isPdfFile(file)) {
    await processPdfFile(file);
  } else {
    // Конвертируем файл в base64
    const imageData = await fileToBase64(file);
    // Обрабатываем изображение
    await processImage(imageData);
  }
}
