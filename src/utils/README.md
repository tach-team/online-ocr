# Utils Module

Core utilities for OCR processing, image manipulation, PDF handling, and language detection.

## Files

| File | Description |
|------|-------------|
| `ocr.ts` | Main OCR interface - Tesseract.js wrapper, text recognition |
| `languages.ts` | Supported languages config, language code mappings |
| `image-crop.ts` | Image cropping by selection coordinates |
| `pdf-to-image.ts` | PDF validation and page-to-image conversion (pdfjs-dist) |
| `selection.ts` | Selection overlay manager for content script |
| `language-detection/` | Auto language detection submodule |

## Public API

### OCR (`ocr.ts`)

```typescript
// Initialize OCR worker with specific language
initializeOCR(languageCode?: string): Promise<void>

// Recognize text from image
recognizeText(imageData: string, languageCode?: string, onProgress?: (progress: OCRProgress) => void): Promise<OCRResult>

// Terminate OCR worker
terminateOCR(): Promise<void>

// Detect language from image (uses multi-language OCR + franc)
detectLanguageFromImage(imageData: string, candidateLanguages: string[]): Promise<DetectedLanguage>
```

### Image Processing

```typescript
// Crop image by selection area
cropImage(imageDataUrl: string, selection: SelectionRect, viewport: ViewportInfo): Promise<string>

// Validate PDF file
validatePdfFile(file: File, maxSizeMB?: number, maxPages?: number): Promise<PdfValidationResult>

// Convert PDF page to image
convertPdfPageToImage(file: File, pageNumber?: number, scale?: number): Promise<string>
```

## Language Detection (`language-detection/`)

Advanced multi-step language detection system:

1. **Script Detection** - Identifies writing system (latin, cyrillic, arabic, cjk, hangul, thai)
2. **franc Analysis** - Statistical language detection for Latin scripts
3. **Refinement** - Specialized heuristics for similar languages

### Submodule Files

| File | Description |
|------|-------------|
| `index.ts` | Main detection logic, script detection, franc integration |
| `scandinavian.ts` | Danish/Swedish/Norwegian differentiation |
| `finnish.ts` | Finnish detection (often confused with Turkish/Filipino) |
| `turkish.ts` | Turkish detection |
| `indonesian.ts` | Indonesian detection |

### Detection Flow

```
Image
  │
  ▼
OCR (multi-language mode)
  │
  ▼
Raw text
  │
  ├─► Short text? ──► Script-based fallback
  │
  ▼
franc (statistical analysis)
  │
  ▼
Refinement heuristics
  │
  ├─► Scandinavian (æ, ø, å patterns)
  ├─► Finnish (double consonants, case endings)
  ├─► Turkish (ı, ş, ğ, ü, ö, ç letters)
  └─► Indonesian (yang, adalah constructions)
  │
  ▼
Final language code
```

## Supported Languages

20 languages supported (defined in `languages.ts`):

| Code | Language | Script |
|------|----------|--------|
| `eng` | English | Latin |
| `rus` | Russian | Cyrillic |
| `deu` | German | Latin |
| `fra` | French | Latin |
| `spa` | Spanish | Latin |
| `ita` | Italian | Latin |
| `nld` | Dutch | Latin |
| `swe` | Swedish | Latin |
| `dan` | Danish | Latin |
| `nor` | Norwegian | Latin |
| `fin` | Finnish | Latin |
| `ara` | Arabic | Arabic |
| `ind` | Indonesian | Latin |
| `por` | Portuguese | Latin |
| `jpn` | Japanese | CJK |
| `fil` | Filipino | Latin |
| `vie` | Vietnamese | Latin |
| `tur` | Turkish | Latin |
| `tha` | Thai | Thai |
| `kor` | Korean | Hangul |

## Dependencies

- `tesseract.js` - OCR engine
- `pdfjs-dist` - PDF parsing
- `franc-min` - Language detection
- `../constants/` - CDN URLs, worker paths, timing constants
- `../types/` - Type definitions

## Usage Notes

- OCR worker is lazily initialized and reused for same language
- Language detection uses multi-language OCR first, then refines
- PDF processing limited to first page, max 10MB
- Image cropping accounts for viewport scaling (devicePixelRatio)
