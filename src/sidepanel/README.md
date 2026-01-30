# Sidepanel Module

Manages the UI and logic of the extension's side panel, including image processing, OCR integration, and user interactions.

## Files

| File | Description |
|------|-------------|
| `index.ts` | Entry point, initialization, public API exports |
| `state.ts` | Global state management and UI state functions |
| `dom-elements.ts` | Cached DOM element references |
| `image-processing.ts` | Image and PDF processing, OCR pipeline |
| `overlay.ts` | Selection overlay control (activate/deactivate) |
| `clipboard.ts` | Clipboard paste functionality |
| `drag-drop.ts` | Drag & drop file handling |
| `file-handling.ts` | File validation and conversion utilities |
| `feature-request.ts` | Feature request form logic |

## Public API

```typescript
// Initialize sidepanel (call once on load)
init(): void

// Process image with OCR
processImage(imageData: string, selection?, viewport?, skipLanguageDetection?): Promise<void>

// Control selection overlay on page
activateOverlay(): void
deactivateOverlay(): void

// UI state management
showState(state: 'waiting' | 'processing' | 'result' | 'error'): void
```

## Dependencies

- `../utils/ocr` - Text recognition (Tesseract.js)
- `../utils/image-crop` - Image cropping
- `../utils/pdf-to-image` - PDF to image conversion
- `../types/` - TypeScript type definitions
- `../constants/` - App constants and UI strings

## Data Flow

```
User Action
    │
    ├─► Screenshot toggle ─► overlay.ts ─► content.ts (page overlay)
    │                                          │
    │                                          ▼
    │                                    Selection captured
    │                                          │
    ├─► File upload ─────────────────────────► │
    ├─► Drag & drop ─────────────────────────► │
    ├─► Clipboard paste ─────────────────────► │
    │                                          │
    │                                          ▼
    │                              image-processing.ts
    │                                    │
    │                                    ├─► cropImage (if selection)
    │                                    ├─► detectLanguage
    │                                    └─► recognizeText (OCR)
    │                                          │
    │                                          ▼
    └─────────────────────────────────── state.ts (show result)
```

## State Management

The module uses simple module-level state variables in `state.ts`:

- `currentImageData` - Current image being processed (base64)
- `originalRecognizedText` - Original OCR result
- `detectedLanguageCode` - Auto-detected language
- `selectedLanguageCode` - User-selected language
- `isLanguageDetectionUncertain` - Flag for short text warning

## UI States

| State | Description |
|-------|-------------|
| `waiting` | Initial state, upload area visible |
| `processing` | OCR in progress, shows progress bar |
| `result` | Recognition complete, shows text |
| `error` | Error occurred, shows error message |
