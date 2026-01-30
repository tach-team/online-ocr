import { TESSERACT_TO_FRANC } from '../languages';

// Характерные признаки для различения скандинавских языков
export const SCANDINAVIAN_MARKERS = {
  dan: {
    // Характерные датские слова (более специфичные)
    words: [
      // Очень характерные датские слова, которых точно нет в шведском/норвежском (высокий приоритет)
      /\b(bliver|siger|tager|giver|af|gennem|mellem|mod|uden|bag|hen|ind|op|ud|tilbage)\b/gi,
      // Характерные датские глаголы и формы
      /\b(være|været|værende|blev|blevet|blev\s+det|blev\s+han|blev\s+hun|blev\s+de)\b/gi,
      // Характерные датские предлоги и союзы
      /\b(efter|før|frem|blandt|bort|hos|ved|der|til|fra|over|under|om|for|med)\b/gi,
      // Характерные датские местоимения и артикли
      /\b(denne|disse|denne\s+her|disse\s+her|det\s+her|den\s+her)\b/gi,
      // Характерные датские наречия
      /\b(ikke|også|meget|mere|mest|så|lige|lige\s+nu|lige\s+her|lige\s+der)\b/gi,
      // Характерные датские слова общего использования
      /\b(og|er|det|at|vil|kan|skal|har|var|må|får|ser|kommer|går|ligger|står)\b/gi,
      // Названия стран и национальности (очень характерные)
      /\b(dansk|danmark|danske|dansker|danskere|københavn|aarhus|odense|jylland|fyn|sjælland)\b/gi,
      // Характерные датские грамматические конструкции
      /\b(der\s+er|der\s+var|der\s+kommer|der\s+går|det\s+er|det\s+var|det\s+kommer|det\s+går)\b/gi,
      // Характерные датские фразы
      /\b(hvad\s+er|hvad\s+var|hvem\s+er|hvem\s+var|hvor\s+er|hvor\s+var|hvordan\s+er|hvordan\s+var)\b/gi,
    ],
    // Частота использования букв (æ, ø, å) - датский использует больше æ и ø
    letterFrequency: {
      'æ': 0.015, // Увеличена частота для датского
      'ø': 0.015, // Увеличена частота для датского
      'å': 0.004,
    },
    // Характерные датские окончания и конструкции
    patterns: [
      /\w+ede\b/gi, // Прошедшее время глаголов (характерно для датского)
      /\w+et\s+blev\b/gi, // "blev" в датском
      /\w+er\s+blevet\b/gi, // "blevet" - характерная датская форма
      /\w+er\s+blev\b/gi, // "blev" после существительных
      /\b\w+er\s+ikke\b/gi, // "er ikke" - характерная датская конструкция
      /\b\w+er\s+også\b/gi, // "er også" - характерная датская конструкция
      /\b\w+er\s+meget\b/gi, // "er meget" - характерная датская конструкция
      /\bdet\s+er\s+\w+\s+der\b/gi, // "det er ... der" - характерная датская конструкция
      /\b\w+\s+af\s+\w+\b/gi, // "... af ..." - характерная датская конструкция
      /\b\w+\s+gennem\s+\w+\b/gi, // "... gennem ..." - характерная датская конструкция
    ],
  },
  swe: {
    words: [
      // Характерные шведские слова, которых нет в датском/норвежском
      /\b(blir|säger|tar|ger|ligger|står|kommer|går|vara|varit|varande|av|från|efter|före|genom|mellan|mot|utan|hos|bakom|bland|bort|fram|hem|in|ner|upp|ut|tillbaka)\b/gi,
      // Характерные шведские слова общего использования
      /\b(och|är|det|att|för|med|till|den|inte|vill|kan|ska|har|var|måste|får|ser|vid|om|från|över|under)\b/gi,
      // Названия стран и национальности
      /\b(svensk|sverige|svenska|svenskar|svenskarna|stockholm|göteborg|malmö)\b/gi,
      // Характерные шведские грамматические конструкции
      /\b(det\s+är|det\s+var|det\s+finns|det\s+fanns)\b/gi,
    ],
    letterFrequency: {
      'ä': 0.012,
      'ö': 0.012,
      'å': 0.004,
    },
    patterns: [
      /\w+ade\b/gi, // Прошедшее время глаголов
      /\w+et\s+blev\b/gi, // "blev" в шведском
    ],
  },
  nor: {
    words: [
      // Характерные норвежские слова
      /\b(blir|sier|tar|gir|ligger|står|kommer|går|være|vært|værende|av|fra|etter|før|gjennom|mellom|mot|uten|hos|bak|blandt|bort|frem|hjem|inn|ned|opp|ut|tilbake)\b/gi,
      // Характерные норвежские слова общего использования
      /\b(og|er|det|at|for|med|til|den|ikke|vil|kan|skal|har|var|må|får|ser|ved|om|fra|over|under)\b/gi,
      // Названия стран и национальности
      /\b(norsk|norge|norske|nordmenn|nordmennene|oslo|bergen|trondheim)\b/gi,
      // Характерные норвежские грамматические конструкции
      /\b(det\s+er|det\s+var|det\s+finnes|det\s+fantes)\b/gi,
    ],
    letterFrequency: {
      'æ': 0.008,
      'ø': 0.012,
      'å': 0.005,
    },
    patterns: [
      /\w+et\b/gi, // Нейтральное окончание
      /\w+et\s+blev\b/gi, // "blev" в норвежском
    ],
  },
};

/**
 * Анализирует текст на предмет характерных признаков скандинавских языков
 * и возвращает скорректированный результат определения языка (код franc)
 */
export function refineScandinavianLanguageDetection(
  text: string,
  francResult: string | undefined,
  candidates: string[]
): string | undefined {
  // Проверяем, есть ли среди кандидатов скандинавские языки
  const scandinavianCandidates = candidates.filter((code) => 
    code === 'dan' || code === 'swe' || code === 'nor'
  );

  // Если нет скандинавских языков среди кандидатов или franc не определил один из них
  if (scandinavianCandidates.length === 0 || !francResult) {
    return francResult;
  }

  // Проверяем, определил ли franc один из скандинавских языков
  // Учитываем, что для норвежского franc может вернуть 'nno' (nynorsk) или 'nob' (bokmål)
  const francIsScandinavian = 
    francResult === 'dan' || 
    francResult === 'swe' || 
    francResult === 'nno' || 
    francResult === 'nob' ||
    scandinavianCandidates.some((code) => TESSERACT_TO_FRANC[code] === francResult);

  // Если franc определил скандинавский язык, уточняем его
  if (francIsScandinavian) {
    const scores: Record<string, number> = {
      dan: 0,
      swe: 0,
      nor: 0,
    };

    const lowerText = text.toLowerCase();
    const textLength = text.length;

    // Подсчитываем очки для каждого языка
    for (const [langCode, markers] of Object.entries(SCANDINAVIAN_MARKERS)) {
      if (!scandinavianCandidates.includes(langCode as 'dan' | 'swe' | 'nor')) continue;

      const tesseractCode = langCode as 'dan' | 'swe' | 'nor';
      
      // Проверяем характерные слова с разными весами в зависимости от языка
      let wordIndex = 0;
      for (const wordPattern of markers.words) {
        const matches = lowerText.match(wordPattern);
        if (matches) {
          // Для датского первые паттерны (более уникальные) дают больше очков
          let weight = 2;
          if (tesseractCode === 'dan' && wordIndex < 5) {
            weight = 3; // Увеличиваем вес для самых характерных датских слов
          } else if (tesseractCode === 'dan') {
            weight = 2.5; // Средний вес для остальных датских слов
          }
          scores[tesseractCode] += matches.length * weight;
        }
        wordIndex++;
      }

      // Проверяем характерные грамматические паттерны
      if (markers.patterns) {
        for (const pattern of markers.patterns) {
          const matches = lowerText.match(pattern);
          if (matches) {
            // Для датского паттерны дают больше очков
            const patternWeight = tesseractCode === 'dan' ? 2 : 1.5;
            scores[tesseractCode] += matches.length * patternWeight;
          }
        }
      }
      
      // Специальный бонус для датского: проверяем наличие очень характерных датских слов
      if (tesseractCode === 'dan') {
        const veryDanishWords = [
          /\bbliver\b/gi,
          /\bsiger\b/gi,
          /\btager\b/gi,
          /\bgiver\b/gi,
          /\bgennem\b/gi,
          /\bmellem\b/gi,
          /\buden\b/gi,
          /\bhen\b/gi,
          /\bind\b/gi,
          /\bop\b/gi,
          /\bud\b/gi,
          /\baf\b/gi,
        ];
        let veryDanishCount = 0;
        for (const pattern of veryDanishWords) {
          if (lowerText.match(pattern)) {
            veryDanishCount++;
          }
        }
        // Бонус за наличие множества очень характерных датских слов
        if (veryDanishCount >= 3) {
          scores[tesseractCode] += veryDanishCount * 2; // Дополнительный бонус
        }
      }

      // Проверяем частоту использования характерных букв
      for (const [letter, expectedFreq] of Object.entries(markers.letterFrequency)) {
        const count = (lowerText.match(new RegExp(letter, 'gi')) || []).length;
        const actualFreq = count / textLength;
        if (actualFreq > expectedFreq * 0.5) {
          scores[tesseractCode] += 1;
        }
        // Дополнительный бонус, если частота близка к ожидаемой
        if (actualFreq >= expectedFreq * 0.8) {
          scores[tesseractCode] += 0.5;
        }
      }

      // Бонус, если franc определил этот язык
      const francCodeForLang = TESSERACT_TO_FRANC[tesseractCode];
      if (francCodeForLang === francResult || 
          (tesseractCode === 'nor' && (francResult === 'nno' || francResult === 'nob'))) {
        scores[tesseractCode] += 3;
      }
    }

    // Применяем штрафы: если в тексте есть очень характерные слова для одного языка,
    // это уменьшает вероятность того, что это другой язык
    
    // Датские индикаторы
    const veryDanishIndicators = [
      /\bbliver\b/gi,
      /\bsiger\b/gi,
      /\btager\b/gi,
      /\bgiver\b/gi,
      /\bgennem\b/gi,
      /\bmellem\b/gi,
      /\buden\b/gi,
      /\bhen\b/gi,
      /\bind\b/gi,
      /\bop\b/gi,
      /\bud\b/gi,
      /\baf\b/gi,
    ];
    
    // Шведские индикаторы
    const verySwedishIndicators = [
      /\bblir\b/gi,
      /\bsäger\b/gi,
      /\btar\b/gi,
      /\bger\b/gi,
      /\bgenom\b/gi,
      /\bmellan\b/gi,
      /\butan\b/gi,
      /\bbakom\b/gi,
      /\bbland\b/gi,
      /\bfram\b/gi,
      /\bhem\b/gi,
      /\bupp\b/gi,
      /\bfrån\b/gi,
      /\bär\b/gi,
      /\bvara\b/gi,
    ];
    
    // Норвежские индикаторы
    const veryNorwegianIndicators = [
      /\bblir\b/gi,
      /\bsier\b/gi,
      /\btar\b/gi,
      /\bgir\b/gi,
      /\bgjennom\b/gi,
      /\bmellom\b/gi,
      /\buten\b/gi,
      /\bbak\b/gi,
      /\bblandt\b/gi,
      /\bfrem\b/gi,
      /\bhjem\b/gi,
      /\binn\b/gi,
      /\bopp\b/gi,
      /\bfra\b/gi,
    ];
    
    let danishIndicatorCount = 0;
    for (const pattern of veryDanishIndicators) {
      if (lowerText.match(pattern)) {
        danishIndicatorCount++;
      }
    }
    
    let swedishIndicatorCount = 0;
    for (const pattern of verySwedishIndicators) {
      if (lowerText.match(pattern)) {
        swedishIndicatorCount++;
      }
    }
    
    let norwegianIndicatorCount = 0;
    for (const pattern of veryNorwegianIndicators) {
      if (lowerText.match(pattern)) {
        norwegianIndicatorCount++;
      }
    }
    
    // Если найдено много характерных датских слов, штрафуем шведский и норвежский
    if (danishIndicatorCount >= 2) {
      if (scores.swe > 0) {
        scores.swe = Math.max(0, scores.swe - danishIndicatorCount * 1.5);
      }
      if (scores.nor > 0) {
        scores.nor = Math.max(0, scores.nor - danishIndicatorCount * 1.5);
      }
      // Дополнительный бонус датскому за наличие множества индикаторов
      if (danishIndicatorCount >= 3) {
        scores.dan += danishIndicatorCount * 1.5;
      }
    }
    
    // Если найдено много характерных шведских слов, штрафуем датский и норвежский
    if (swedishIndicatorCount >= 2) {
      if (scores.dan > 0) {
        scores.dan = Math.max(0, scores.dan - swedishIndicatorCount * 1.5);
      }
      if (scores.nor > 0) {
        scores.nor = Math.max(0, scores.nor - swedishIndicatorCount * 1.5);
      }
      // Дополнительный бонус шведскому за наличие множества индикаторов
      if (swedishIndicatorCount >= 3) {
        scores.swe += swedishIndicatorCount * 1.5;
      }
    }
    
    // Если найдено много характерных норвежских слов, штрафуем датский и шведский
    if (norwegianIndicatorCount >= 2) {
      if (scores.dan > 0) {
        scores.dan = Math.max(0, scores.dan - norwegianIndicatorCount * 1.5);
      }
      if (scores.swe > 0) {
        scores.swe = Math.max(0, scores.swe - norwegianIndicatorCount * 1.5);
      }
      // Дополнительный бонус норвежскому за наличие множества индикаторов
      if (norwegianIndicatorCount >= 3) {
        scores.nor += norwegianIndicatorCount * 1.5;
      }
    }

    // Находим язык с максимальным количеством очков и второй по количеству очков
    const sortedScores = Object.entries(scores)
      .map(([lang, score]) => ({ lang, score }))
      .sort((a, b) => b.score - a.score);

    const bestMatch = sortedScores[0] || { lang: '', score: 0 };
    const secondMatch = sortedScores[1] || { lang: '', score: 0 };
    const scoreDifference = bestMatch.score - secondMatch.score;

    // Определяем исходный код Tesseract для francResult
    const originalTesseractCode = scandinavianCandidates.find(
      (code) => TESSERACT_TO_FRANC[code] === francResult
    ) || (francResult === 'nno' || francResult === 'nob' ? 'nor' : null);

    // Используем уточнение, если:
    // 1. Лучший результат имеет достаточно очков (минимум 3)
    // 2. Разница между лучшим и вторым результатом значительна (минимум 2 очка)
    // 3. Лучший результат отличается от исходного определения franc
    if (
      bestMatch.score >= 3 &&
      scoreDifference >= 2 &&
      bestMatch.lang &&
      bestMatch.lang !== originalTesseractCode
    ) {
      const refinedFrancCode = TESSERACT_TO_FRANC[bestMatch.lang as 'dan' | 'swe' | 'nor'];
      console.log(
        `[OCR] Уточнение скандинавского языка: franc=${francResult} (${originalTesseractCode}), уточнено=${refinedFrancCode} (${bestMatch.lang}), очки=${bestMatch.score.toFixed(1)}, разница=${scoreDifference.toFixed(1)}`
      );
      return refinedFrancCode;
    } else if (bestMatch.score > 0) {
      console.log(
        `[OCR] Уточнение скандинавского языка не применено: franc=${francResult} (${originalTesseractCode}), лучший=${bestMatch.lang} (${bestMatch.score.toFixed(1)}), второй=${secondMatch.lang} (${secondMatch.score.toFixed(1)}), разница=${scoreDifference.toFixed(1)}`
      );
    }
  }

  return francResult;
}
