# Types Module

Centralized TypeScript type definitions for the extension.

## Files

| File | Description |
|------|-------------|
| `index.ts` | Re-exports all types from submodules |
| `ocr.ts` | OCR-related types (progress, result, language) |
| `selection.ts` | Selection rectangle and viewport info |
| `state.ts` | Application UI state types |
| `files.ts` | File validation and attachment types |
| `messages.ts` | Chrome extension message types |

## Type Categories

### OCR Types (`ocr.ts`)

```typescript
interface OCRProgress {
  status: string;      // 'loading' | 'initializing' | 'recognizing text' | 'completed'
  progress: number;    // 0.0 - 1.0
}

interface OCRResult {
  text: string;        // Recognized text
  confidence: number;  // 0 - 100
}

interface DetectedLanguage {
  language: string;    // Tesseract language code (e.g., 'eng', 'rus')
  confidence: number;  // OCR confidence
  shortText?: boolean; // True if text was too short for reliable detection
}

interface SupportedLanguage {
  code: string;        // Tesseract language code
  label: string;       // Human-readable name
}
```

### Selection Types (`selection.ts`)

```typescript
interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewportInfo {
  scrollX: number;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
}
```

### State Types (`state.ts`)

```typescript
interface State {
  type: 'waiting' | 'processing' | 'result' | 'error';
}

type AppStateType = State['type'];
```

### File Types (`files.ts`)

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface PdfValidationResult {
  valid: boolean;
  error?: string;
  numPages?: number;
}

interface AttachedFile {
  file: File;
  preview: string;  // base64 data URL
  id: string;       // Unique ID for removal
}
```

### Message Types (`messages.ts`)

Messages for communication between extension components (background, content, sidepanel):

```typescript
type MessageType =
  | 'PING'              // Health check
  | 'CAPTURE_AREA'      // Request screenshot capture
  | 'PROCESS_IMAGE'     // Send image for OCR
  | 'ACTIVATE_OVERLAY'  // Show selection overlay
  | 'DEACTIVATE_OVERLAY'; // Hide selection overlay

// Union type of all messages
type ExtensionMessage =
  | PingMessage
  | CaptureAreaMessage
  | ProcessImageMessage
  | ActivateOverlayMessage
  | DeactivateOverlayMessage;
```

## Usage

Import types from the central index:

```typescript
import type { 
  OCRResult, 
  SelectionRect, 
  ExtensionMessage 
} from '../types';
```

Or import from specific files for tree-shaking:

```typescript
import type { OCRResult } from '../types/ocr';
```

## Dependencies

This module has no dependencies - it contains only type definitions.

## Used By

- `sidepanel/` - UI state, OCR results, file handling
- `utils/` - OCR types, selection types
- `background.ts` - Message handling
- `content.ts` - Selection and message types
