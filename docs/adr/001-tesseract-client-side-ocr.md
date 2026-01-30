# ADR 001: Client-side OCR with Tesseract.js

## Status

Accepted

## Context

The extension needs to extract text from images. There are two main approaches:

1. **Server-side OCR** - Send images to a cloud API (Google Vision, AWS Textract, etc.)
2. **Client-side OCR** - Process images locally in the browser

Key requirements:
- Privacy-sensitive: users may capture confidential documents
- Offline capability desired
- No backend infrastructure to maintain
- Reasonable accuracy for printed text

## Decision

Use **Tesseract.js** for client-side OCR processing.

Tesseract.js is a JavaScript port of the Tesseract OCR engine, running entirely in the browser via WebAssembly.

### Implementation Details

- Worker runs in a separate thread to avoid blocking UI
- Language models loaded from CDN on first use (`tessdata.projectnaptha.com`)
- Worker is lazily initialized and reused for same language
- 20 languages supported with fast models (`4.0.0_fast`)

### Worker Configuration

```typescript
createWorker(languageCode, 1, {
  workerPath: chrome.runtime.getURL('workers/worker.min.js'),
  corePath: chrome.runtime.getURL('core/tesseract-core-lstm.wasm.js'),
  langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast/',
  workerBlobURL: false,
});
```

## Consequences

### Benefits

- **Privacy**: Images never leave the user's device
- **Offline**: Works without internet (after first language model download)
- **No costs**: No API fees or rate limits
- **No backend**: Zero server infrastructure to maintain
- **Fast**: WASM provides near-native performance

### Drawbacks

- **Initial load**: ~3MB language model download on first use
- **Memory**: OCR worker consumes significant memory
- **Accuracy**: Slightly lower than cloud APIs for complex layouts
- **Language switching**: Requires worker re-initialization (~1-2s)

### Mitigations

- Show download progress to user during model loading
- Reuse worker for consecutive recognitions in same language
- Use fast models for better performance/accuracy tradeoff
