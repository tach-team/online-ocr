# Constants Module

Centralized application constants, configuration values, and UI strings.

## Files

| File | Description |
|------|-------------|
| `index.ts` | Re-exports all constants |
| `messages.ts` | Message type identifiers for extension communication |
| `states.ts` | Application state identifiers |
| `timing.ts` | Timeouts and delays (milliseconds) |
| `thresholds.ts` | Limits, sizes, and numeric thresholds |
| `paths.ts` | Worker and icon file paths |
| `urls.ts` | CDN URLs, external endpoints |
| `ui-strings.ts` | User-facing text strings |

## Constants Reference

### Message Types (`messages.ts`)

```typescript
MESSAGE_TYPES = {
  PING: 'PING',                       // Health check
  CAPTURE_AREA: 'CAPTURE_AREA',       // Request screenshot
  PROCESS_IMAGE: 'PROCESS_IMAGE',     // Send image for OCR
  ACTIVATE_OVERLAY: 'ACTIVATE_OVERLAY',     // Show selection UI
  DEACTIVATE_OVERLAY: 'DEACTIVATE_OVERLAY', // Hide selection UI
}
```

### App States (`states.ts`)

```typescript
APP_STATES = {
  WAITING: 'waiting',       // Initial state, ready for input
  PROCESSING: 'processing', // OCR in progress
  RESULT: 'result',         // Showing recognized text
  ERROR: 'error',           // Error occurred
}
```

### Timing (`timing.ts`)

```typescript
TIMING = {
  OVERLAY_ACTIVATION_DELAY: 100,   // ms - delay before showing overlay
  COPY_FEEDBACK_TIMEOUT: 2000,     // ms - "Copied!" message duration
  WORKER_INIT_TIMEOUT: 30000,      // ms - max time for OCR worker init
}
```

### Thresholds (`thresholds.ts`)

```typescript
THRESHOLDS = {
  MIN_SELECTION_SIZE: 10,         // px - minimum selection area
  MAX_PDF_SIZE_MB: 10,            // max PDF file size
  MAX_PDF_PAGES: 1,               // max PDF pages to process
  PDF_RENDER_SCALE: 2,            // PDF rendering scale for OCR
  MIN_TEXT_LENGTH_FOR_FRANC: 20,  // chars - minimum for language detection
  MAX_ATTACHMENTS: 3,             // max files in feature request form
}

OCR_PROGRESS = {
  LOADING: 0.1,       // Progress during model loading
  INITIALIZING: 0.2,  // Progress during initialization
  COMPLETED: 1,       // Completion value
}
```

### Paths (`paths.ts`)

```typescript
WORKER_PATHS = {
  OCR_WORKER_DIR: 'workers/',
  OCR_WORKER: 'workers/worker.min.js',      // Tesseract worker
  OCR_CORE: 'core/tesseract-core-lstm.wasm.js',
  PDF_WORKER: 'workers/pdf.worker.min.js',  // PDF.js worker
  CONTENT_SCRIPT: 'content.js',
}

ICON_PATHS = {
  UPLOAD: 'icons/icon-upload.svg',
  ATTACH: 'icons/icon-attach.svg',
  CROSS: 'icons/icon-cross.svg',
  ARROW_LEFT: 'icons/icon-arrow-left.svg',
  MAIL: 'icons/icon-mail.svg',
}
```

### URLs (`urls.ts`)

```typescript
CDN_URLS = {
  TESSERACT_LANG_DATA: 'https://tessdata.projectnaptha.com/4.0.0_fast/',
  PDFJS_WORKER_TEMPLATE: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js',
}

// URLs where content scripts cannot run
RESTRICTED_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://']
```

### UI Strings (`ui-strings.ts`)

```typescript
UI_STRINGS = {
  // Copy button states
  COPY_BUTTON: 'Copy Text',
  COPY_SUCCESS: '✓ Copied!',
  
  // Error messages (Russian)
  TEXT_NOT_FOUND: 'Текст не найден...',
  SHORT_TEXT_WARNING: 'Текст очень короткий...',
  // ... more strings
}

DEFAULT_OCR_LANGUAGE = 'rus+eng'  // Default language for OCR
```

## Usage

Import from central index:

```typescript
import { MESSAGE_TYPES, APP_STATES, TIMING } from '../constants';

// Type-safe usage
const state = APP_STATES.WAITING; // 'waiting'
const timeout = TIMING.COPY_FEEDBACK_TIMEOUT; // 2000
```

## Design Decisions

1. **Const assertions** (`as const`) - All objects use const assertions for literal types
2. **Centralized export** - Single entry point via `index.ts`
3. **Grouped by domain** - Separate files for different concerns
4. **Type exports** - Value types exported alongside constants

## Dependencies

This module has no dependencies - pure constants only.

## Used By

All modules in the extension use these constants.
