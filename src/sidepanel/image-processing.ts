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
  setUploadContainerProcessing,
  resetUploadContainer,
  populateLanguageSelect,
  autoResizeTextarea,
  currentImageData,
  setCurrentImageData,
  originalRecognizedText,
  setOriginalRecognizedText,
  detectedLanguageCode,
  setDetectedLanguageCode,
  selectedLanguageCode,
  setSelectedLanguageCode,
  isLanguageDetectionUncertain,
  setIsLanguageDetectionUncertain,
  getLanguageLabel,
} from './state';
import { MAX_PDF_SIZE_MB, MAX_PDF_PAGES } from './file-handling';

// Основная функция обработки изображения
export async function processImage(
  imageData: string,
  selection?: SelectionRect,
  viewport?: ViewportInfo,
  skipLanguageDetection: boolean = false
): Promise<void> {
  showState('processing');
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

    const ocrLanguage = selectedLanguageCode || currentDetectedLanguageCode || 'rus+eng';

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
          elements.languageWarning.textContent = 'Текст не найден на изображении. Попробуйте выбрать другой язык или загрузить другое изображение.';
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
            elements.languageWarning.textContent =
              'Текст очень короткий, автоопределение языка может быть неточным. При необходимости выберите язык вручную.';
            elements.languageWarning.style.display = 'block';
          } else {
            elements.languageWarning.textContent = '';
            elements.languageWarning.style.display = 'none';
          }
        }
      }
      showState('result');
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
    let errorText = 'Неизвестная ошибка';
    if (error instanceof Error) {
      errorText = error.message || error.toString() || 'Неизвестная ошибка';
    } else if (error) {
      errorText = String(error) || 'Неизвестная ошибка';
    }
    if (!errorText || errorText === 'undefined' || errorText === 'null') {
      errorText = 'Произошла неизвестная ошибка при обработке изображения';
    }
    elements.errorMessage.textContent = errorText;
    showState('error');
  }
}

// Обработка PDF файла
export async function processPdfFile(file: File): Promise<void> {
  try {
    // Валидация PDF
    const validation = await validatePdfFile(file, MAX_PDF_SIZE_MB, MAX_PDF_PAGES);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ошибка валидации PDF');
    }

    // Конвертируем первую страницу PDF в изображение
    const imageData = await convertPdfPageToImage(file, 1, 2);

    // Обрабатываем полученное изображение через существующий pipeline
    await processImage(imageData);
  } catch (error) {
    console.error('PDF processing error:', error);
    resetUploadContainer();
    let errorText = 'Неизвестная ошибка при обработке PDF';
    if (error instanceof Error) {
      errorText = error.message || error.toString() || errorText;
    } else if (error) {
      errorText = String(error) || errorText;
    }
    if (!errorText || errorText === 'undefined' || errorText === 'null') {
      errorText = 'Произошла неизвестная ошибка при обработке PDF файла';
    }
    elements.errorMessage.textContent = errorText;
    showState('error');
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
