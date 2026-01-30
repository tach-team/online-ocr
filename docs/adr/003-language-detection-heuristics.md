# ADR 003: Multi-step Language Detection with Heuristics

## Status

Accepted

## Context

The extension supports 20 languages for OCR. Users often don't know or don't want to manually select the language before recognition.

Automatic language detection approaches:
1. **Pre-OCR detection** - Analyze image visually (complex, unreliable)
2. **Post-OCR detection** - Run OCR first, then detect language from text
3. **Multi-language OCR** - Run OCR with multiple languages simultaneously

Challenges:
- Similar Latin-script languages (Danish/Swedish/Norwegian)
- Statistical detectors (franc) fail on short text
- Some languages confused by franc (Finnish/Turkish/Filipino)

## Decision

Implement multi-step language detection:

### Step 1: Multi-language OCR

Run Tesseract with all candidate languages combined (e.g., `rus+eng+deu+...`):

```typescript
const detectionLangCode = candidateLanguages.join('+');
const ocrResult = await recognizeText(imageData, detectionLangCode);
```

### Step 2: Script Detection (Fallback for short text)

For text < 20 characters, use script detection:

```typescript
function detectScript(text: string): ScriptType {
  // Count characters in each script range
  // Return: 'latin' | 'cyrillic' | 'arabic' | 'cjk' | 'hangul' | 'thai'
}
```

### Step 3: Statistical Analysis (franc)

For longer text, use franc library with whitelist:

```typescript
const francCode = franc(text, { 
  only: candidateLanguageCodes,
  minLength: 20 
});
```

### Step 4: Heuristic Refinement

Apply language-specific heuristics to correct franc errors:

| Refinement Module | Handles |
|-------------------|---------|
| `scandinavian.ts` | Danish ↔ Swedish ↔ Norwegian |
| `finnish.ts` | Finnish ↔ Turkish ↔ Filipino |
| `turkish.ts` | Turkish ↔ Finnish |
| `indonesian.ts` | Indonesian ↔ Finnish ↔ Turkish |

Heuristics check for:
- Characteristic words and phrases
- Unique letter patterns (ı, ş, ğ for Turkish)
- Grammatical patterns (double consonants for Finnish)
- Case endings (Finnish has 15 cases)

### Example: Finnish Detection

```typescript
// Finnish strong indicators
const doubleConsonants = text.match(/\b\w*(kk|pp|tt|ss)\w+\b/gi);
const caseEndings = text.match(/\w+(ssa|ssä|sta|stä|lla|llä)\b/gi);
const possessiveSuffixes = text.match(/\w+(ni|si|nsa|nsä|mme)\b/gi);

// If all three present, high confidence Finnish
if (doubleConsonants && caseEndings && possessiveSuffixes) {
  return 'fin';
}
```

## Consequences

### Benefits

- **Automatic**: No user intervention needed in most cases
- **Accurate**: Multi-step approach handles edge cases
- **Extensible**: Easy to add new language refinements
- **Graceful degradation**: Falls back to script detection for short text

### Drawbacks

- **Complexity**: ~1500 lines of heuristic code
- **Maintenance**: New edge cases require pattern updates
- **False positives**: Some similar languages still confused
- **Performance**: Multiple regex passes for refinement

### Known Limitations

- Very short text (< 20 chars) may be misdetected
- Mixed-language text not supported
- Handwritten text detection unreliable
- Some language pairs remain difficult (Norwegian Bokmål/Nynorsk)

### Metrics

Tested accuracy on sample texts:
- Single language, 50+ chars: ~95% accurate
- Single language, 20-50 chars: ~85% accurate
- Single language, < 20 chars: ~70% accurate (script-based fallback)
