# ADR 002: Modular Sidepanel Architecture

## Status

Accepted

## Context

The sidepanel initially started as a single file (`sidepanel.ts`) handling all functionality:
- UI state management
- DOM manipulation
- Image processing pipeline
- OCR integration
- Clipboard operations
- Drag & drop
- File handling

As features grew, the file became difficult to maintain (400+ lines) with tightly coupled responsibilities.

## Decision

Split the sidepanel into multiple focused modules:

```
sidepanel/
├── index.ts           # Entry point, public API, initialization
├── state.ts           # Global state, UI state functions
├── dom-elements.ts    # Cached DOM references
├── image-processing.ts # OCR pipeline, image handling
├── overlay.ts         # Selection overlay control
├── clipboard.ts       # Clipboard paste functionality
├── drag-drop.ts       # File drag & drop
├── file-handling.ts   # File validation, conversion
└── feature-request.ts # Feature request form
```

### Module Responsibilities

| Module | Single Responsibility |
|--------|----------------------|
| `index.ts` | Initialization, event wiring, public exports |
| `state.ts` | State variables, state mutation, UI state display |
| `dom-elements.ts` | DOM element cache (read-only) |
| `image-processing.ts` | Image/PDF processing, OCR calls |
| `overlay.ts` | Chrome messaging for overlay control |
| `clipboard.ts` | Paste event handling |
| `drag-drop.ts` | Drag events handling |
| `file-handling.ts` | File validation, base64 conversion |
| `feature-request.ts` | Form logic (isolated feature) |

### State Management

Simple module-level variables instead of a state management library:

```typescript
// state.ts
export let currentImageData: string | null = null;
export let detectedLanguageCode: string | null = null;

export function setCurrentImageData(data: string | null): void {
  currentImageData = data;
}
```

This approach works well for:
- Small state surface (~5 variables)
- No complex state dependencies
- Single-instance UI (only one sidepanel)

## Consequences

### Benefits

- **Maintainability**: Each file has single responsibility (~50-200 lines)
- **Testability**: Modules can be tested in isolation
- **Code navigation**: Easy to find relevant code
- **Reduced coupling**: Changes in one area don't affect others
- **Clear dependencies**: Import graph shows relationships

### Drawbacks

- **More files**: 9 files instead of 1
- **Import management**: Need to import from multiple modules
- **Cross-module state**: State shared via module exports

### Trade-offs Accepted

- No formal state management (Redux, Zustand) - overkill for this size
- DOM elements cached in separate module - couples to HTML structure
- Some circular awareness between modules - acceptable for UI code
