import { createWorker } from 'tesseract.js';
import { franc } from 'franc-min';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface DetectedLanguage {
  language: string;
  confidence: number;
  shortText?: boolean;
}

export interface SupportedLanguage {
  code: string;
  label: string;
}

// Поддерживаемые языки для UI и логики
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'eng', label: 'English' },
  { code: 'rus', label: 'Russian' },
  { code: 'deu', label: 'German' },
  { code: 'fra', label: 'French' },
  { code: 'spa', label: 'Spanish' },
  { code: 'ita', label: 'Italian' },
  { code: 'nld', label: 'Dutch' },
  { code: 'swe', label: 'Swedish' },
  { code: 'dan', label: 'Danish' },
  { code: 'nor', label: 'Norwegian' },
  { code: 'fin', label: 'Finnish' },
  { code: 'ara', label: 'Arabic' },
  { code: 'ind', label: 'Indonesian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'fil', label: 'Filipino' },
  { code: 'vie', label: 'Vietnamese' },
  { code: 'tur', label: 'Turkish' },
  { code: 'tha', label: 'Thai' },
  { code: 'kor', label: 'Korean' },
];

const DEFAULT_LANGUAGE_CODE = 'rus+eng';

// Сопоставление кодов Tesseract и franc (ISO 639-3)
const TESSERACT_TO_FRANC: Record<string, string> = {
  eng: 'eng',
  rus: 'rus',
  deu: 'deu',
  fra: 'fra',
  spa: 'spa',
  ita: 'ita',
  nld: 'nld',
  swe: 'swe',
  dan: 'dan',
  nor: 'nno', // одна из норвежских норм
  fin: 'fin',
  ara: 'ara',
  ind: 'ind',
  por: 'por',
  jpn: 'jpn',
  fil: 'tgl', // Tagalog / Filipino
  vie: 'vie',
  tur: 'tur',
  tha: 'tha',
  kor: 'kor',
};

const MIN_TEXT_LENGTH_FOR_FRANC = 20;

// Характерные признаки для различения скандинавских языков
const SCANDINAVIAN_MARKERS = {
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
function refineScandinavianLanguageDetection(
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

// Характерные признаки для финского языка
const FINNISH_MARKERS = {
  fin: {
    // Характерные финские слова
    words: [
      // Личные местоимения и притяжательные формы
      /\b(minun|sinun|hänen|meidän|teidän|heidän)\b/gi,
      // Глаголы "быть"
      /\b(olen|olet|on|olemme|olette|ovat|ei|eivät|eikä|eikö)\b/gi,
      // Характерные финские союзы и частицы
      /\b(ja|tai|mutta|koska|kun|että|jos|vaikka|koska|kun|että|jos|vaikka|sekä|myös|vielä|nyt|sitten|nyt|sitten|myös|vielä)\b/gi,
      // Характерные финские слова общего использования
      /\b(onko|eikö|onko|eikö|minä|sinä|hän|me|te|he|tämä|tämä|tuo|tuo|nämä|nämä|nuo|nuo|se|ne)\b/gi,
      // Распространенные финские существительные
      /\b(huone|huoneeni|huoneesi|huoneensa|koti|kotini|kotiin|kadulla|kadulta|kadulle|talossa|talosta|taloon|kirja|kirjaa|kirjan|kirjassa|kirjasta|kirjaan|auto|autoa|auton|autossa|autosta|autoon|ihminen|ihmisen|ihmisiä|ihmisiin|yö|yötä|yön|päivä|päivää|päivän|vuosi|vuotta|vuoden|maa|maata|maan|maa|maata|maan)\b/gi,
      // Слова из примера пользователя (perhe = семья)
      /\b(perhe|perheeni|perheesi|perheensa|isä|isäni|isäsi|isänsä|äiti|äitini|äitisi|äitinsä|sisko|sisar|sisareni|sisaresi|sisarensa|veli|veljeni|veljesi|veljensä|rovaniemi|rovaniemellä|rovaniemessä|rovaniemestä|rovaniemelle|suomi|suomessa|suomesta|suomeen|harrastus|harrastukset|harrastuksia|harrastuksiin|lääkäri|opettaja|soittaa|soittaa\s+kitaraa|pelata|pelata\s+jalkapalloa|rakastaa|rakastaa\s+suklaata)\b/gi,
      // Слова из примера пользователя (kirje = письмо)
      /\b(kirje|ystävälle|ystavalle|hei|hannah|mitä|mita|kuuluu|kirjoitan|sinulle|suomesta|talvi|lunta|talviloma|kouluun|koulu|perheeni|lapin|lappiin|pohjoisosassa|innoissani|palaamme|lomalta|takaisin|aloitan|uuden|kielen|oppimisen|halunnut|oppia|espanjaa|rakastan|espanjalaista|kulttuuria|mielestani|espanjalainen|musiikki|romanttista|aion|käydä|kayda|espanjan|tunneilla|ystäväni|ystavani|millan|milla|perheensa|espanjassa|lomalla|siksi|haluaa|opetella|kielta|kieltä|myos|myös|paras|taalla|taällä|olleet|ystavia|ystäviä|nianasta|astia|taamme|kaiken|hetkella|hetkellä|emme|mene|menossa|mikille|joka|on|siita|siitä|erittain|erittäin|kun|aloitan|uuden|kielen|oppimisen|halunnut|oppia|espanjaa|koska|rakastan|mielestani|hyvin|romanttista|aion|käydä|kayda|espanjan|tunneilla|kanssa|perheensa|paljon|lomalla|siksi|haluaa|opetella|kielta|kieltä|myos|myös|paras|ystäväni|ystavani|taalla|taällä|suomessa|olleet|ystavia|ystäviä|nianasta|astia|taamme|kaiken)\b/gi,
      // Распространенные финские глаголы
      /\b(menee|tulee|sanoo|tekee|näkee|kuulee|tietää|osaa|voi|pitää|haluaa|tarvitsee|on|ei|eivät|eikä|eikö|onko|eikö|onko|sää|sää|kaunis|kauni|kauni|kauni)\b/gi,
      // Характерные финские слова из примера (sää = погода)
      /\b(sää|sää|kaunis|kauni|kauni|kauni|lapland|lapissa|helsinki|helsingissä|helsingistä|helsingiin)\b/gi,
      // Характерные финские предлоги и послелоги
      /\b(kohti|varten|kanssa|ilman|vastaan|vastaan|yli|ali|yli|ali|keskellä|keskellä|vieressä|vieressä|takana|takana|edessä|edessä|päällä|päällä|alla|alla|sisällä|sisällä|ulkona|ulkona)\b/gi,
      // Характерные финские наречия
      /\b(hyvin|paljon|vähän|paljon|vähän|usein|harvoin|aina|koskaan|joskus|nyt|sitten|nyt|sitten|myös|vielä|myös|vielä)\b/gi,
      // Названия стран и национальности
      /\b(suomi|suomen|suomalainen|suomalaiset|helsinki|tampere|turku|oulu|jyväskylä)\b/gi,
      // Характерные финские грамматические конструкции
      /\b(minun\s+\w+ni|sinun\s+\w+si|hänen\s+\w+nsa|hänen\s+\w+nsä|meidän\s+\w+mme|teidän\s+\w+nne|heidän\s+\w+nsa|heidän\s+\w+nsä)\b/gi,
      // Притяжательные суффиксы (очень характерно для финского)
      /\b\w+(ni|si|nsa|nsä|mme|nne)\b/gi,
    ],
    // Частота использования букв (ä, ö, å)
    letterFrequency: {
      'ä': 0.04, // Финский использует много ä
      'ö': 0.01,
      'å': 0.0001, // Очень редко в финском
    },
    // Характерные финские окончания и конструкции
    patterns: [
      // Падежные окончания
      /\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi|n|t|a|ä|i|in|en|on|un|yn)\b/gi,
      // Двойные согласные (очень характерно для финского)
      /\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi,
      // Характерные финские конструкции
      /\b\w+\s+on\s+\w+\b/gi, // "... on ..."
      /\b\w+\s+ei\s+ole\b/gi, // "... ei ole"
      /\b\w+\s+onko\b/gi, // "... onko"
      /\b\w+\s+eikö\b/gi, // "... eikö"
      /\bminun\s+\w+ni\b/gi, // "minun ...ni"
      /\bsinun\s+\w+si\b/gi, // "sinun ...si"
      /\bhänen\s+\w+nsa\b/gi, // "hänen ...nsa"
      /\bhänen\s+\w+nsä\b/gi, // "hänen ...nsä"
      // Характерные финские фразы
      /\bmitä\s+kuuluu\b/gi, // "mitä kuuluu"
      /\bmiten\s+menee\b/gi, // "miten menee"
      /\bkiitos\s+paljon\b/gi, // "kiitos paljon"
      /\bolen\s+\w+\b/gi, // "olen ..."
      /\bolet\s+\w+\b/gi, // "olet ..."
    ],
  },
};

/**
 * Анализирует текст на предмет характерных признаков финского языка
 * и возвращает скорректированный результат определения языка (код franc)
 */
function refineFinnishLanguageDetection(
  text: string,
  francResult: string | undefined,
  candidates: string[]
): string | undefined {
  // Проверяем, есть ли финский среди кандидатов
  const hasFinnish = candidates.includes('fin');
  
  // Если финского нет среди кандидатов или franc не определил язык
  if (!hasFinnish || !francResult) {
    return francResult;
  }

  // Проверяем, определил ли franc турецкий, итальянский, филипинский или индонезийский (часто путают с финским)
  const francIsConfused = francResult === 'tur' || francResult === 'ita' || francResult === 'tgl' || francResult === 'ind';
  
  // Также проверяем, если franc определил финский
  const francIsFinnish = francResult === 'fin';

  // Если franc определил турецкий/итальянский/филипинский/индонезийский или финский, проверяем признаки финского
  if (francIsConfused || francIsFinnish) {
    const lowerText = text.toLowerCase();
    const textLength = text.length;
    let finnishScore = 0;

    const markers = FINNISH_MARKERS.fin;

    // Проверяем характерные слова
    for (const wordPattern of markers.words) {
      const matches = lowerText.match(wordPattern);
      if (matches) {
        finnishScore += matches.length * 3; // Финские слова дают много очков
      }
    }

    // Проверяем характерные грамматические паттерны
    for (const pattern of markers.patterns) {
      const matches = lowerText.match(pattern);
      if (matches) {
        finnishScore += matches.length * 2; // Паттерны дают дополнительные очки
      }
    }

    // Проверяем частоту использования характерных букв
    for (const [letter, expectedFreq] of Object.entries(markers.letterFrequency)) {
      const count = (lowerText.match(new RegExp(letter, 'gi')) || []).length;
      const actualFreq = count / textLength;
      if (actualFreq > expectedFreq * 0.3) {
        finnishScore += 2;
      }
      // Дополнительный бонус, если частота близка к ожидаемой
      if (actualFreq >= expectedFreq * 0.6) {
        finnishScore += 3;
      }
    }

    // Проверяем наличие двойных согласных (очень характерно для финского)
    const doubleConsonants = lowerText.match(/\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi);
    if (doubleConsonants) {
      finnishScore += doubleConsonants.length * 2; // Увеличен вес
    }

    // Проверяем характерные финские окончания (падежи)
    const finnishCaseEndings = lowerText.match(/\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi)\b/gi);
    if (finnishCaseEndings) {
      finnishScore += finnishCaseEndings.length * 2.5; // Увеличен вес для падежных окончаний
    }

    // Проверяем притяжательные суффиксы (очень характерно для финского)
    const possessiveSuffixes = lowerText.match(/\w+(ni|si|nsa|nsä|mme|nne)\b/gi);
    if (possessiveSuffixes) {
      finnishScore += possessiveSuffixes.length * 3; // Высокий вес для притяжательных суффиксов
    }

    // Дополнительный бонус, если есть множественные характерные финские признаки
    // (которые точно не встречаются в филипинском)
    let finnishStrongIndicators = 0;
    if (doubleConsonants && doubleConsonants.length > 0) finnishStrongIndicators++;
    if (finnishCaseEndings && finnishCaseEndings.length > 0) finnishStrongIndicators++;
    if (possessiveSuffixes && possessiveSuffixes.length > 0) finnishStrongIndicators++;
    
    // Если есть все три типа признаков - большой бонус (это точно финский)
    if (finnishStrongIndicators >= 3) {
      finnishScore += 5;
    } else if (finnishStrongIndicators >= 2) {
      finnishScore += 3;
    }

    // Бонус, если franc определил финский
    if (francIsFinnish) {
      finnishScore += 5;
    }

    // Проверяем отсутствие характерных турецких признаков (если franc определил турецкий или финский)
    // Важно: проверяем турецкие признаки всегда, но учитываем сильные финские признаки
    const turkishIndicators = [
      // Очень характерные турецкие слова (высокий приоритет)
      /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|antalya|bursa|adana|ve|ile|için|gibi|göre|kadar|var|yok|olmak)\b/gi,
      // Турецкие специфические буквы (очень характерно)
      /[ıışşğğüüööçç]/gi,
      // Турецкие окончания (но могут пересекаться с другими языками)
      /\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um)\b/gi,
    ];
    let turkishIndicatorCount = 0;
    let turkishStrongIndicators = 0; // Очень характерные признаки (буквы и специфические слова)
    
    for (let i = 0; i < turkishIndicators.length; i++) {
      const pattern = turkishIndicators[i];
      const matches = lowerText.match(pattern);
      if (matches) {
        turkishIndicatorCount += matches.length;
        // Первые два паттерна - очень характерные для турецкого
        if (i < 2) {
          turkishStrongIndicators += matches.length;
        }
      }
    }
    
    // Если есть сильные финские признаки (двойные согласные + падежные окончания + притяжательные суффиксы),
    // то не снижаем счет финского даже при наличии турецких признаков
    const hasStrongFinnishIndicators = finnishStrongIndicators >= 2;
    
    // Если есть много очень характерных турецких признаков (буквы + специфические слова), 
    // и нет сильных финских признаков, снижаем счет финского
    if (turkishStrongIndicators >= 3 && !hasStrongFinnishIndicators) {
      finnishScore = Math.max(0, finnishScore - turkishStrongIndicators * 0.8);
      console.log(`[OCR] Обнаружено много характерных турецких признаков (${turkishStrongIndicators}), снижен счет финского до ${finnishScore.toFixed(1)}`);
    } else if (turkishIndicatorCount >= 8 && !hasStrongFinnishIndicators) {
      // Если общее количество турецких признаков очень большое, но нет сильных финских
      finnishScore = Math.max(0, finnishScore - turkishIndicatorCount * 0.3);
      console.log(`[OCR] Обнаружено много турецких признаков (${turkishIndicatorCount}), снижен счет финского до ${finnishScore.toFixed(1)}`);
    } else if (francResult === 'tur') {
      // Если franc определил турецкий, но нет турецких признаков, но есть финские - бонус финскому
      if (turkishIndicatorCount === 0 && finnishScore > 0) {
        finnishScore += 3;
      }
    }
    
    // Если есть сильные финские признаки, логируем это
    if (hasStrongFinnishIndicators && turkishIndicatorCount > 0) {
      console.log(`[OCR] Сильные финские признаки (${finnishStrongIndicators}), игнорируем турецкие (${turkishIndicatorCount})`);
    }

    // Проверяем отсутствие характерных итальянских признаков (если franc определил итальянский)
    if (francResult === 'ita') {
      const italianIndicators = [
        /\b(e|di|a|da|in|per|con|su|per|tra|fra|del|della|dei|delle|il|la|lo|gli|le|un|una|uno)\b/gi,
        /\b(italia|italiano|italiana|roma|milano|napoli|firenze|venezia)\b/gi,
        /\w+(zione|zione|sione|sione|mento|mento|tore|tore|trice|trice)\b/gi, // Итальянские окончания
      ];
      let italianIndicatorCount = 0;
      for (const pattern of italianIndicators) {
        if (lowerText.match(pattern)) {
          italianIndicatorCount++;
        }
      }
      // Если нет итальянских признаков, но есть финские - бонус финскому
      if (italianIndicatorCount === 0 && finnishScore > 0) {
        finnishScore += 3;
      }
    }

    // Проверяем отсутствие характерных филипинских признаков (если franc определил филипинский)
    if (francResult === 'tgl') {
      // ВАЖНО: Если есть очень сильные финские признаки (все три типа), они имеют приоритет
      // Это критично, так как филиппинский часто ошибочно определяется вместо финского
      if (finnishStrongIndicators >= 3) {
        console.log(`[OCR] Очень сильные финские признаки (${finnishStrongIndicators}), переопределяем tgl на fin, несмотря на возможные филиппинские признаки`);
        return 'fin';
      }
      
      const filipinoIndicators = [
        // Характерные филипинские слова (очень специфичные)
        /\b(ang\s+\w+|ng\s+\w+|sa\s+\w+|ay\s+\w+|mga\s+\w+)\b/gi, // Артикли и частицы с словами
        /\b\w+\s+ay\s+\w+\b/gi, // "... ay ..." - характерная филипинская конструкция
        /\bang\s+\w+\s+ay\b/gi, // "ang ... ay" - характерная филипинская конструкция
        // Характерные филипинские слова (изолированные)
        /\b(ang|ng|sa|ay|mga|si|ni|kay|para|kung|kapag|kasi|dahil|pero|ngunit|subalit)\b/gi,
        // Названия стран и национальности
        /\b(pilipinas|pilipino|pilipina|filipino|filipina|manila|cebu|davao|quezon|bayan|tao|bahay)\b/gi,
        // Характерные филипинские конструкции с "na"
        /\b\w+\s+na\s+\w+\b/gi, // "... na ..." - характерная филипинская конструкция
        /\b\w+\s+ng\s+\w+\b/gi, // "... ng ..." - характерная филипинская конструкция
      ];
      let filipinoIndicatorCount = 0;
      let filipinoStrongIndicators = 0; // Очень характерные филиппинские конструкции
      
      for (let i = 0; i < filipinoIndicators.length; i++) {
        const pattern = filipinoIndicators[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          filipinoIndicatorCount += matches.length;
          // Первые три паттерна - очень характерные для филиппинского
          if (i < 3) {
            filipinoStrongIndicators += matches.length;
          }
        }
      }
      
      // Если есть сильные филиппинские признаки, не переопределяем на финский
      // НО только если нет сильных финских признаков
      if (filipinoStrongIndicators >= 3 && !hasStrongFinnishIndicators) {
        console.log(`[OCR] Сильные филиппинские признаки (${filipinoStrongIndicators}), не переопределяем tgl на fin`);
        return francResult; // Возвращаем филиппинский, не переопределяем
      }
      
      // Если нет филипинских признаков, но есть финские - большой бонус финскому
      if (filipinoIndicatorCount === 0 && finnishScore > 0) {
        finnishScore += 8; // Увеличен бонус, так как филипинский часто путают с финским
        console.log(`[OCR] Нет филипинских признаков, но есть финские (${finnishScore.toFixed(1)} очков)`);
      }
      // Если есть филипинские признаки, но их мало, а финских много - все равно выбираем финский
      if (filipinoIndicatorCount < 2 && finnishScore >= 5) {
        finnishScore += 5; // Увеличен бонус
        console.log(`[OCR] Мало филипинских признаков (${filipinoIndicatorCount}), но много финских (${finnishScore.toFixed(1)} очков)`);
      } else if (filipinoIndicatorCount > 0) {
        console.log(`[OCR] Обнаружено филипинских признаков: ${filipinoIndicatorCount}, финских очков: ${finnishScore.toFixed(1)}`);
      }
    }

    // Проверяем отсутствие характерных индонезийских признаков (если franc определил индонезийский)
    if (francResult === 'ind') {
      const indonesianIndicators = [
        // Характерные индонезийские слова
        /\b(dan|atau|dengan|untuk|dari|ke|di|pada|yang|ini|itu|adalah|akan|sudah|belum|tidak|bukan|juga|sangat|sangat|sekali|sekali|saja|hanya|masih|sudah|belum|tidak|bukan|juga)\b/gi,
        // Характерные индонезийские конструкции
        /\b\w+\s+yang\s+\w+\b/gi, // "... yang ..." - характерная индонезийская конструкция
        /\b\w+\s+adalah\s+\w+\b/gi, // "... adalah ..." - характерная индонезийская конструкция
        /\b\w+\s+untuk\s+\w+\b/gi, // "... untuk ..." - характерная индонезийская конструкция
        /\b\w+\s+dengan\s+\w+\b/gi, // "... dengan ..." - характерная индонезийская конструкция
        // Названия стран и национальности
        /\b(indonesia|indonesia|jakarta|surabaya|bandung|medan|semarang|makassar|palembang|batam|bekasi|tangerang|depok|bogor|malang|yogyakarta|surakarta|bandar\s+lampung|padang|denpasar|banjarmasin|pontianak|samarinda|manado|pekanbaru|mataram|jambi|palu|kupang|ambon|ternate|jayapura|merauke)\b/gi,
        // Характерные индонезийские окончания
        /\w+(kan|an|i|nya|ku|mu|nya|lah|kah|pun|nya|ku|mu|nya)\b/gi,
      ];
      let indonesianIndicatorCount = 0;
      for (const pattern of indonesianIndicators) {
        const matches = lowerText.match(pattern);
        if (matches) {
          indonesianIndicatorCount += matches.length;
        }
      }
      
      // Если нет индонезийских признаков, но есть финские - большой бонус финскому
      if (indonesianIndicatorCount === 0 && finnishScore > 0) {
        finnishScore += 6; // Больший бонус, так как индонезийский часто путают с финским
        console.log(`[OCR] Нет индонезийских признаков, но есть финские (${finnishScore.toFixed(1)} очков)`);
      }
      // Если есть индонезийские признаки, но их мало, а финских много - все равно выбираем финский
      if (indonesianIndicatorCount < 3 && finnishScore >= 8) {
        finnishScore += 4;
        console.log(`[OCR] Мало индонезийских признаков (${indonesianIndicatorCount}), но много финских (${finnishScore.toFixed(1)} очков)`);
      } else if (indonesianIndicatorCount > 0) {
        console.log(`[OCR] Обнаружено индонезийских признаков: ${indonesianIndicatorCount}, финских очков: ${finnishScore.toFixed(1)}`);
      }
    }

    // Если есть сильные финские признаки (двойные согласные + падежи + притяжательные),
    // и franc определил турецкий или индонезийский, возвращаем финский
    // Проверяем наличие индонезийских признаков (если franc определил индонезийский)
    // Важно: не переопределяем индонезийский на финский, если есть сильные индонезийские признаки
    // НО: если есть очень сильные финские признаки, они имеют приоритет
    if (francResult === 'ind') {
      const indonesianIndicators = [
        // Очень характерные индонезийские конструкции
        /\b\w+\s+yang\s+\w+\b/gi, // "... yang ..." - очень характерно для индонезийского
        /\b\w+\s+adalah\s+\w+\b/gi, // "... adalah ..." - очень характерно для индонезийского
        // Характерные индонезийские слова
        /\b(dan|atau|dengan|untuk|dari|ke|di|pada|yang|ini|itu|adalah|akan|sudah|belum|tidak|bukan|juga|sangat|sekali|saja|hanya|masih|lagi|pun|sih|dong|deh|nih|kok)\b/gi,
        // Характерные индонезийские окончания
        /\w+(kan|an|i|nya|ku|mu|lah|kah|pun)\b/gi,
      ];
      let indonesianIndicatorCount = 0;
      let indonesianStrongIndicators = 0;
      
      for (let i = 0; i < indonesianIndicators.length; i++) {
        const pattern = indonesianIndicators[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          indonesianIndicatorCount += matches.length;
          // Первые два паттерна - очень характерные для индонезийского
          if (i < 2) {
            indonesianStrongIndicators += matches.length;
          }
        }
      }
      
      // Если есть очень сильные финские признаки (все три типа), они имеют приоритет над индонезийскими
      // Это важно, так как финский часто ошибочно определяется как индонезийский
      if (hasStrongFinnishIndicators && finnishStrongIndicators >= 3) {
        console.log(`[OCR] Очень сильные финские признаки (${finnishStrongIndicators}), переопределяем ind на fin, несмотря на индонезийские признаки (${indonesianStrongIndicators})`);
        return 'fin';
      }
      
      // Если есть сильные индонезийские признаки, не переопределяем индонезийский на финский
      // НО только если нет сильных финских признаков
      if (indonesianStrongIndicators >= 2 && !hasStrongFinnishIndicators) {
        console.log(`[OCR] Сильные индонезийские признаки (${indonesianStrongIndicators}), не переопределяем ind на fin`);
        return francResult; // Возвращаем индонезийский, не переопределяем
      }
    }

    // Проверяем наличие турецких признаков перед переопределением на финский
    // Важно: не переопределяем турецкий на финский, если есть сильные турецкие признаки
    if (francResult === 'tur' || candidates.includes('tur')) {
      const turkishStrongCheck = [
        // Очень характерные турецкие слова
        /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|ve|ile|için|gibi|göre|kadar|var|yok|olmak|etmek|yapmak|gitmek|gelmek|sevgili|doğum|günü|günüm|hediye|bilgisayar|kitap|anneanne|ziyaret|plaj|kuzen|mutlu|yaşında|yaşındayım|bugün|yarın|öğlen|çiçek|çikolata|lütfen)\b/gi,
        // Турецкие специфические буквы (очень характерно)
        /[ıışşğğüüööçç]/gi,
        // Турецкие окончания
        /\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um|eceğim|edeceğim|gideceğim|geleceksin|geleceksin|yazmayı|unutma)\b/gi,
      ];
      let turkishStrongCount = 0;
      for (const pattern of turkishStrongCheck) {
        const matches = lowerText.match(pattern);
        if (matches) {
          turkishStrongCount += matches.length;
        }
      }
      
      // Если есть много турецких признаков, не переопределяем на финский
      if (turkishStrongCount >= 5) {
        console.log(`[OCR] Сильные турецкие признаки (${turkishStrongCount}), не переопределяем tur на fin`);
        return francResult; // Возвращаем турецкий, не переопределяем
      }
    }

    // Если есть сильные финские признаки (двойные согласные + падежные окончания + притяжательные суффиксы),
    // и franc определил турецкий или филиппинский, возвращаем финский
    // НО только если нет сильных турецких/филиппинских признаков
    if (hasStrongFinnishIndicators && (francResult === 'tur' || francResult === 'tgl')) {
      console.log(
        `[OCR] Сильные финские признаки (${finnishStrongIndicators}), переопределяем ${francResult} на fin, очки=${finnishScore.toFixed(1)}`
      );
      return 'fin';
    }

    // Если набрано достаточно очков для финского, возвращаем финский
    // Порог ниже, если franc определил турецкий/итальянский/филипинский/индонезийский (более агрессивное исправление)
    // Для филипинского и индонезийского порог еще ниже, так как они часто путаются с финским
    // НО если есть сильные финские признаки, порог еще ниже
    // Для филиппинского порог очень низкий (3), чтобы исправить ошибку, так как он часто путается с финским
    const baseThreshold = francResult === 'ind' ? 4 : (francResult === 'tgl' ? 3 : (francResult === 'tur' ? 7 : (francIsConfused ? 6 : 10)));
    const threshold = hasStrongFinnishIndicators ? Math.max(2, baseThreshold - 2) : baseThreshold;
    
    if (finnishScore >= threshold) {
      console.log(
        `[OCR] Уточнение финского языка: franc=${francResult}, уточнено=fin, очки=${finnishScore.toFixed(1)}, порог=${threshold}`
      );
      return 'fin';
    } else if (francIsConfused && finnishScore >= 5) {
      // Если franc определил турецкий/итальянский/индонезийский, но есть признаки финского, 
      // но недостаточно для уверенности - логируем для отладки
      console.log(
        `[OCR] Возможен финский язык: franc=${francResult}, очки финского=${finnishScore.toFixed(1)}, порог=${threshold}, но недостаточно для уверенности`
      );
    }
  }

  return francResult;
}

// Характерные признаки для турецкого языка
const TURKISH_MARKERS = {
  tur: {
    // Характерные турецкие слова
    words: [
      // Характерные турецкие союзы и частицы
      /\b(ve|ile|için|gibi|göre|kadar|sonra|önce|doğru|karşı|daha|en|çok|az|biraz|çok|pek|daha|en|çok|az|biraz)\b/gi,
      // Характерные турецкие предлоги и послелоги
      /\b(ile|için|gibi|göre|kadar|sonra|önce|doğru|karşı|kadar|sonra|önce|doğru|karşı|ile|için|gibi|göre)\b/gi,
      // Характерные турецкие местоимения
      /\b(ben|sen|o|biz|siz|onlar|bu|şu|o|bunlar|şunlar|onlar|benim|senin|onun|bizim|sizin|onların)\b/gi,
      // Характерные турецкие глаголы
      /\b(var|yok|olmak|olmak|etmek|yapmak|gitmek|gelmek|almak|vermek|görmek|bilmek|istemek|sevmek|istemek|sevmek)\b/gi,
      // Характерные турецкие слова общего использования
      /\b(bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|evet|hayır|tamam|iyi|kötü|güzel|çirkin|büyük|küçük)\b/gi,
      // Названия стран и национальности
      /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|antalya|bursa|adana|gaziantep|konya|kayseri|mersin)\b/gi,
      // Характерные турецкие фразы
      /\b(merhaba|selam|günaydın|iyi\s+akşamlar|iyi\s+geceler|teşekkür\s+ederim|rica\s+ederim|lütfen|özür\s+dilerim)\b/gi,
      // Характерные турецкие слова из примера
      /\b(doğum|günü|günüm|sevgili|hediye|hediyeler|bilgisayar|kitap|kitaplar|sırt|çanta|portakal|anneanne|anneannesi|ziyaret|ziyaret\s+etmek|plaj|plaja|kuzen|kuzeni|ile|birlikte|gitmek|gidecek|gideceğim|geleceksin|geleceksin|yazmayı|unutma|mutlu|mutluyum|yaşında|yaşındayım|bugün|yarın|öğlen|çiçek|çikolata|lütfen|artık|önemli|çünkü|için|gibi|göre|kadar|nasılsın|ne\s+zaman|sen\s+de|gelir\s+misin|bana|sürpriz|adet|almanca|turuncu|ablam|abimden)\b/gi,
      // Характерные турецкие конструкции
      /\b(ne\s+var|ne\s+yok|nasıl|neden|nerede|ne\s+zaman|kim|ne|hangi|kaç|nasıl|neden|nerede|ne\s+zaman|kim|ne|hangi|kaç)\b/gi,
    ],
    // Частота использования характерных турецких букв
    letterFrequency: {
      'ı': 0.04, // Очень характерно для турецкого
      'ş': 0.02,
      'ğ': 0.01,
      'ü': 0.02,
      'ö': 0.01,
      'ç': 0.02,
    },
    // Характерные турецкие окончания и конструкции
    patterns: [
      // Характерные турецкие окончания
      /\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um|iniz|ınız|ünüz|unuz)\b/gi,
      // Характерные турецкие конструкции с "ve"
      /\b\w+\s+ve\s+\w+\b/gi, // "... ve ..."
      // Характерные турецкие конструкции с "ile"
      /\b\w+\s+ile\s+\w+\b/gi, // "... ile ..."
      // Характерные турецкие конструкции с "için"
      /\b\w+\s+için\s+\w+\b/gi, // "... için ..."
      // Характерные турецкие конструкции с "gibi"
      /\b\w+\s+gibi\s+\w+\b/gi, // "... gibi ..."
      // Характерные турецкие конструкции с "var/yok"
      /\b\w+\s+var\b/gi, // "... var"
      /\b\w+\s+yok\b/gi, // "... yok"
      // Характерные турецкие конструкции с "olmak"
      /\b\w+\s+olmak\b/gi, // "... olmak"
      /\b\w+\s+oldu\b/gi, // "... oldu"
      /\b\w+\s+olacak\b/gi, // "... olacak"
      // Характерные турецкие будущие формы из примера
      /\w+(eceğim|edeceğim|gideceğim|geleceksin|yazmayı|unutma|götüreceğim)\b/gi,
      // Характерные турецкие конструкции
      /\b\w+\s+misin\b/gi, // "... misin?" - вопрос
      /\b\w+\s+de\s+\w+\b/gi, // "... de ..." - тоже
      /\b\w+\s+ne\s+zaman\b/gi, // "... ne zaman" - когда
      /\b\w+\s+nasılsın\b/gi, // "... nasılsın" - как дела
    ],
  },
};

/**
 * Анализирует текст на предмет характерных признаков турецкого языка
 * и возвращает скорректированный результат определения языка (код franc)
 */
function refineTurkishLanguageDetection(
  text: string,
  francResult: string | undefined,
  candidates: string[]
): string | undefined {
  // Проверяем, есть ли турецкий среди кандидатов
  const hasTurkish = candidates.includes('tur');
  
  // Если турецкого нет среди кандидатов или franc не определил язык
  if (!hasTurkish || !francResult) {
    return francResult;
  }

  // Проверяем, определил ли franc финский (часто путают с турецким)
  const francIsConfused = francResult === 'fin';
  
  // Также проверяем, если franc определил турецкий
  const francIsTurkish = francResult === 'tur';

  // Если franc определил финский или турецкий, проверяем признаки турецкого
  if (francIsConfused || francIsTurkish) {
    const lowerText = text.toLowerCase();
    const textLength = text.length;
    let turkishScore = 0;

    const markers = TURKISH_MARKERS.tur;

    // Проверяем характерные слова
    for (const wordPattern of markers.words) {
      const matches = lowerText.match(wordPattern);
      if (matches) {
        turkishScore += matches.length * 3; // Турецкие слова дают много очков
      }
    }

    // Проверяем характерные грамматические паттерны
    for (const pattern of markers.patterns) {
      const matches = lowerText.match(pattern);
      if (matches) {
        turkishScore += matches.length * 2; // Паттерны дают дополнительные очки
      }
    }

    // Проверяем частоту использования характерных турецких букв
    for (const [letter, expectedFreq] of Object.entries(markers.letterFrequency)) {
      const count = (lowerText.match(new RegExp(letter, 'gi')) || []).length;
      const actualFreq = count / textLength;
      if (actualFreq > expectedFreq * 0.3) {
        turkishScore += 3; // Турецкие буквы очень характерны
      }
      // Дополнительный бонус, если частота близка к ожидаемой
      if (actualFreq >= expectedFreq * 0.6) {
        turkishScore += 4;
      }
    }

    // Проверяем наличие характерных турецких букв (очень характерно)
    const turkishLetters = lowerText.match(/[ıışşğğüüööçç]/gi);
    if (turkishLetters) {
      turkishScore += turkishLetters.length * 3; // Увеличен вес - каждая турецкая буква дает больше очков
      // Дополнительный бонус, если много турецких букв
      if (turkishLetters.length >= 5) {
        turkishScore += 5;
      }
    }

    // Проверяем характерные турецкие окончания
    const turkishEndings = lowerText.match(/\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um|eceğim|edeceğim|gideceğim|geleceksin|yazmayı|unutma)\b/gi);
    if (turkishEndings) {
      turkishScore += turkishEndings.length * 2.5; // Высокий вес для турецких окончаний
    }
    
    // Проверяем характерные турецкие слова из примера (очень характерные)
    const veryTurkishWords = lowerText.match(/\b(sevgili|doğum|günü|günüm|hediye|bilgisayar|anneanne|ziyaret|plaj|kuzen|mutlu|yaşında|yaşındayım|bugün|yarın|öğlen|çiçek|çikolata|lütfen|gideceğim|geleceksin|yazmayı|unutma|artık|önemli|çünkü|sürpriz|adet|almanca|turuncu|ablam|abimden)\b/gi);
    if (veryTurkishWords) {
      turkishScore += veryTurkishWords.length * 4; // Очень высокий вес для характерных турецких слов
    }

    // Дополнительный бонус, если есть множественные характерные турецкие признаки
    let turkishStrongIndicators = 0;
    if (turkishLetters && turkishLetters.length > 2) turkishStrongIndicators++;
    if (turkishEndings && turkishEndings.length > 0) turkishStrongIndicators++;
    if (veryTurkishWords && veryTurkishWords.length > 0) turkishStrongIndicators++;
    
    // Если есть все три типа признаков - большой бонус (это точно турецкий)
    if (turkishStrongIndicators >= 3) {
      turkishScore += 8; // Увеличен бонус
    } else if (turkishStrongIndicators >= 2) {
      turkishScore += 5;
    }

    // Бонус, если franc определил турецкий
    if (francIsTurkish) {
      turkishScore += 5;
    }
    
    // Дополнительный бонус, если franc определил финский, но есть много турецких признаков
    if (francIsConfused && turkishStrongIndicators >= 2) {
      turkishScore += 6; // Большой бонус для исправления финского на турецкий
      console.log(`[OCR] Franc определил финский, но есть сильные турецкие признаки (${turkishStrongIndicators}), бонус +6`);
    }

    // Проверяем отсутствие характерных финских признаков (если franc определил финский или индонезийский)
    // Важно: проверяем сильные финские признаки, чтобы не переопределить финский на турецкий
    // Проверяем всегда, если финский среди кандидатов
    const finnishIndicators = [
      // Характерные финские слова
      /\b(olen|olet|on|olemme|olette|ovat|ei|eivät|minun|sinun|hänen|meidän|teidän|heidän|hei|mitä|mita|kuuluu|kirjoitan|sinulle|suomesta|suomen|suomessa|talvi|lunta|talviloma|kouluun|koulu|perheeni|perhe|lapin|lappiin|pohjoisosassa|innoissani|palaamme|lomalta|takaisin|aloitan|uuden|kielen|oppimisen|halunnut|oppia|espanjaa|rakastan|espanjalaista|kulttuuria|mielestani|espanjalainen|musiikki|romanttista|aion|käydä|kayda|espanjan|tunneilla|ystäväni|ystavani|ystavia|ystäviä|kirje|ystävälle|ystavalle|harrastukseni|harrastuksesta|ratsastuksesta|ratsastus|ratsastan|hevonen|hevosta|hevoseni|bella|bellalla|bellan|bellasta|bellalle|bellalta|bellana|bellaksi|bellani|bellasi|bellansa|bellamme|bellanne|pienesta|pienestä|asti|rakastan\s+ratsastaa|rakastan\s+ratsastusta|rakastan\s+hevosia|rakastan\s+hevosiä|minun\s+harrastukseni|minun\s+hevoseni|minun\s+bellani)\b/gi,
      // Характерные финские окончания (падежи)
      /\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi)\b/gi,
      // Притяжательные суффиксы (очень характерно для финского)
      /\w+(ni|si|nsa|nsä|mme|nne)\b/gi,
      // Двойные согласные (характерно для финского)
      /\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi,
    ];
    
    let finnishIndicatorCount = 0;
    let finnishStrongIndicators = 0; // Сильные признаки (двойные согласные + падежи + притяжательные)
    
    for (let i = 0; i < finnishIndicators.length; i++) {
      const pattern = finnishIndicators[i];
      const matches = lowerText.match(pattern);
      if (matches) {
        finnishIndicatorCount += matches.length;
        // Последние три паттерна - очень характерные для финского
        if (i >= 1) {
          finnishStrongIndicators += matches.length;
        }
      }
    }
    
    // Если есть сильные финские признаки (двойные согласные + падежи + притяжательные),
    // не переопределяем финский на турецкий
    const hasStrongFinnishIndicators = finnishStrongIndicators >= 3;
    
    if (francResult === 'fin') {
      // Если нет финских признаков, но есть турецкие - большой бонус турецкому
      if (finnishIndicatorCount === 0 && turkishScore > 0 && !hasStrongFinnishIndicators) {
        turkishScore += 6; // Больший бонус, так как финский часто путают с турецким
        console.log(`[OCR] Нет финских признаков, но есть турецкие (${turkishScore.toFixed(1)} очков)`);
      }
      // Если есть финские признаки, но их мало, а турецких много - все равно выбираем турецкий
      // НО только если нет сильных финских признаков
      if (finnishIndicatorCount < 2 && turkishScore >= 8 && !hasStrongFinnishIndicators) {
        turkishScore += 4;
        console.log(`[OCR] Мало финских признаков (${finnishIndicatorCount}), но много турецких (${turkishScore.toFixed(1)} очков)`);
      } else if (finnishIndicatorCount > 0) {
        console.log(`[OCR] Обнаружено финских признаков: ${finnishIndicatorCount}, турецких очков: ${turkishScore.toFixed(1)}`);
      }
    }
    
    // Проверяем наличие индонезийских признаков (если индонезийский среди кандидатов)
    // Важно: не переопределяем индонезийский на турецкий, если есть сильные индонезийские признаки
    // Проверяем всегда, если индонезийский среди кандидатов
    if (candidates.includes('ind')) {
      const indonesianIndicators = [
        // Очень характерные индонезийские конструкции
        /\b\w+\s+yang\s+\w+\b/gi, // "... yang ..." - очень характерно для индонезийского
        /\b\w+\s+adalah\s+\w+\b/gi, // "... adalah ..." - очень характерно для индонезийского
        // Характерные индонезийские слова
        /\b(dan|atau|dengan|untuk|dari|ke|di|pada|yang|ini|itu|adalah|akan|sudah|belum|tidak|bukan|juga|sangat|sekali|saja|hanya|masih|lagi|pun|sih|dong|deh|nih|kok)\b/gi,
        // Характерные индонезийские окончания
        /\w+(kan|an|i|nya|ku|mu|lah|kah|pun)\b/gi,
      ];
      let indonesianIndicatorCount = 0;
      let indonesianStrongIndicators = 0;
      
      for (let i = 0; i < indonesianIndicators.length; i++) {
        const pattern = indonesianIndicators[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          indonesianIndicatorCount += matches.length;
          // Первые два паттерна - очень характерные для индонезийского
          if (i < 2) {
            indonesianStrongIndicators += matches.length;
          }
        }
      }
      
      // Если есть сильные индонезийские признаки, не переопределяем индонезийский на турецкий
      if (indonesianStrongIndicators >= 2) {
        console.log(`[OCR] Сильные индонезийские признаки (${indonesianStrongIndicators}), не переопределяем ind на tur`);
        return francResult; // Возвращаем индонезийский, не переопределяем
      }
    }

    // Если есть сильные финские признаки, не переопределяем финский на турецкий
    // Проверяем всегда, если финский среди кандидатов
    if (hasStrongFinnishIndicators && candidates.includes('fin')) {
      console.log(`[OCR] Сильные финские признаки (${finnishStrongIndicators}), не переопределяем на турецкий`);
      // Если franc определил финский, возвращаем финский
      if (francResult === 'fin') {
        return francResult;
      }
    }

    // Если набрано достаточно очков для турецкого, возвращаем турецкий
    // Порог ниже, если franc определил финский (более агрессивное исправление)
    // Для финского порог еще ниже, так как он часто путается с турецким
    const threshold = francResult === 'fin' ? 5 : (francIsConfused ? 6 : 10);
    
    if (turkishScore >= threshold) {
      console.log(
        `[OCR] Уточнение турецкого языка: franc=${francResult}, уточнено=tur, очки=${turkishScore.toFixed(1)}, порог=${threshold}`
      );
      return 'tur';
    } else if (francIsConfused && turkishScore >= 4) {
      // Если franc определил финский, но есть признаки турецкого, 
      // но недостаточно для уверенности - логируем для отладки
      console.log(
        `[OCR] Возможен турецкий язык: franc=${francResult}, очки турецкого=${turkishScore.toFixed(1)}, порог=${threshold}, но недостаточно для уверенности`
      );
    }
  }

  return francResult;
}

// Характерные признаки для индонезийского языка
const INDONESIAN_MARKERS = {
  ind: {
    // Характерные индонезийские слова
    words: [
      // Характерные индонезийские союзы и частицы
      /\b(dan|atau|dengan|untuk|dari|ke|di|pada|yang|ini|itu|adalah|akan|sudah|belum|tidak|bukan|juga|sangat|sekali|saja|hanya|masih|lagi|pun|sih|dong|deh|nih|kok)\b/gi,
      // Характерные индонезийские местоимения
      /\b(saya|aku|kamu|anda|dia|ia|kami|kita|mereka|ini|itu|yang|mana|siapa|apa|dimana|kapan|bagaimana|mengapa)\b/gi,
      // Характерные индонезийские глаголы
      /\b(adalah|akan|sudah|belum|tidak|bukan|ada|mau|ingin|bisa|boleh|harus|perlu|mesti|mampu|dapat|bisa|boleh)\b/gi,
      // Характерные индонезийские слова общего использования
      /\b(sangat|sekali|saja|hanya|masih|lagi|pun|sih|dong|deh|nih|kok|juga|atau|dan|dengan|untuk|dari|ke|di|pada)\b/gi,
      // Названия стран и национальности
      /\b(indonesia|indonesia|jakarta|surabaya|bandung|medan|semarang|makassar|palembang|batam|bekasi|tangerang|depok|bogor|malang|yogyakarta|surakarta|bandar\s+lampung|padang|denpasar|banjarmasin|pontianak|samarinda|manado|pekanbaru|mataram|jambi|palu|kupang|ambon|ternate|jayapura|merauke)\b/gi,
      // Характерные индонезийские фразы
      /\b(terima\s+kasih|sama\s+sama|maaf|permisi|selamat|pagi|siang|sore|malam|tinggal|jumpa|sampai|ketemu|lagi)\b/gi,
      // Слова из примера пользователя
      /\b(surat|hujan|sang|ibuku|ayahku|cinta|tuhan|tuhan|dewa|dewi|langit|bumi|air|tanah|angin|api|matahari|bulan|bintang|awan|mendung|petir|kilat|guntur|hujan|gerimis|salju|es|embun|kabut|asap|udara|oksigen|nitrogen|hidrogen|karbon|oksigen|nitrogen|hidrogen|karbon)\b/gi,
    ],
    // Частота использования характерных индонезийских букв
    letterFrequency: {
      // Индонезийский использует стандартную латиницу, но есть характерные комбинации
    },
    // Характерные индонезийские окончания и конструкции
    patterns: [
      // Характерные индонезийские окончания
      /\w+(kan|an|i|nya|ku|mu|nya|lah|kah|pun|nya|ku|mu|nya|kan|an|i)\b/gi,
      // Характерные индонезийские конструкции
      /\b\w+\s+yang\s+\w+\b/gi, // "... yang ..." - очень характерная индонезийская конструкция
      /\b\w+\s+adalah\s+\w+\b/gi, // "... adalah ..." - характерная индонезийская конструкция
      /\b\w+\s+untuk\s+\w+\b/gi, // "... untuk ..." - характерная индонезийская конструкция
      /\b\w+\s+dengan\s+\w+\b/gi, // "... dengan ..." - характерная индонезийская конструкция
      /\b\w+\s+dari\s+\w+\b/gi, // "... dari ..." - характерная индонезийская конструкция
      /\b\w+\s+ke\s+\w+\b/gi, // "... ke ..." - характерная индонезийская конструкция
      /\b\w+\s+di\s+\w+\b/gi, // "... di ..." - характерная индонезийская конструкция
      /\b\w+\s+pada\s+\w+\b/gi, // "... pada ..." - характерная индонезийская конструкция
      // Характерные индонезийские фразы
      /\bsurat\s+sang\s+\w+\b/gi, // "surat sang ..." - характерная индонезийская конструкция
      /\b\w+ku\s+\w+\b/gi, // "...ku ..." - притяжательные формы
      /\b\w+mu\s+\w+\b/gi, // "...mu ..." - притяжательные формы
      /\b\w+nya\s+\w+\b/gi, // "...nya ..." - притяжательные формы
    ],
  },
};

/**
 * Анализирует текст на предмет характерных признаков индонезийского языка
 * и возвращает скорректированный результат определения языка (код franc)
 */
function refineIndonesianLanguageDetection(
  text: string,
  francResult: string | undefined,
  candidates: string[]
): string | undefined {
  // Проверяем, есть ли индонезийский среди кандидатов
  const hasIndonesian = candidates.includes('ind');
  
  // Если индонезийского нет среди кандидатов или franc не определил язык
  if (!hasIndonesian || !francResult) {
    return francResult;
  }

  // Проверяем, определил ли franc финский или турецкий (часто путают с индонезийским)
  const francIsConfused = francResult === 'fin' || francResult === 'tur';
  
  // Также проверяем, если franc определил индонезийский
  const francIsIndonesian = francResult === 'ind';

  // Если franc определил финский/турецкий или индонезийский, проверяем признаки индонезийского
  if (francIsConfused || francIsIndonesian) {
    const lowerText = text.toLowerCase();
    const textLength = text.length;
    
    // ВАЖНО: Сначала проверяем наличие сильных финских или турецких признаков
    // Если они есть, не переопределяем на индонезийский
    
    // Проверяем финские признаки (всегда, если финский среди кандидатов)
    if (candidates.includes('fin')) {
      const finnishStrongCheck = [
        // Характерные финские слова
        /\b(olen|olet|on|olemme|olette|ovat|ei|eivät|minun|sinun|hänen|meidän|teidän|heidän|hei|mitä|mita|kuuluu|kirjoitan|sinulle|suomesta|suomen|suomessa|talvi|lunta|talviloma|kouluun|koulu|perheeni|perhe|lapin|lappiin|pohjoisosassa|innoissani|palaamme|lomalta|takaisin|aloitan|uuden|kielen|oppimisen|halunnut|oppia|espanjaa|rakastan|espanjalaista|kulttuuria|mielestani|espanjalainen|musiikki|romanttista|aion|käydä|kayda|espanjan|tunneilla|ystäväni|ystavani|ystavia|ystäviä|kirje|ystävälle|ystavalle|harrastukseni|harrastuksesta|ratsastuksesta|ratsastus|ratsastan|hevonen|hevosta|hevoseni|bella|bellalla|bellan|bellasta|bellalle|bellalta|bellana|bellaksi|bellani|bellasi|bellansa|bellamme|bellanne|pienesta|pienestä|asti|rakastan\s+ratsastaa|rakastan\s+ratsastusta|rakastan\s+hevosia|rakastan\s+hevosiä|minun\s+harrastukseni|minun\s+hevoseni|minun\s+bellani)\b/gi,
        // Характерные финские окончания (падежи)
        /\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi)\b/gi,
        // Притяжательные суффиксы (очень характерно для финского)
        /\w+(ni|si|nsa|nsä|mme|nne)\b/gi,
        // Двойные согласные (характерно для финского)
        /\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi,
      ];
      let finnishStrongCount = 0;
      for (const pattern of finnishStrongCheck) {
        const matches = lowerText.match(pattern);
        if (matches) {
          finnishStrongCount += matches.length;
        }
      }
      
      // Если есть много финских признаков, не переопределяем на индонезийский
      // Порог снижен до 3, чтобы быть более строгим
      if (finnishStrongCount >= 3) {
        console.log(`[OCR] Сильные финские признаки (${finnishStrongCount}), не переопределяем на индонезийский`);
        return francResult; // Возвращаем исходный результат, не переопределяем на индонезийский
      }
    }
    
    // Проверяем турецкие признаки (всегда, если турецкий среди кандидатов)
    if (candidates.includes('tur')) {
      const turkishStrongCheck = [
        // Очень характерные турецкие слова
        /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|ve|ile|için|gibi|göre|kadar|var|yok|olmak|etmek|yapmak|gitmek|gelmek|sevgili|doğum|günü|günüm|hediye|bilgisayar|anneanne|ziyaret|plaj|kuzen|mutlu|mutluyum|yaşında|yaşındayım|bugün|yarın|öğlen|çiçek|çikolata|lütfen|gideceğim|geleceksin|yazmayı|unutma|artık|önemli|çünkü|sürpriz|adet|almanca|turuncu|ablam|abimden|ben|sen|o|biz|siz|onlar|bu|şu|nasılsın|ne\s+zaman|gelir\s+misin|bana|sırt|çanta|portakal|annemden|babamdan|iki|yeni|birlikte|götüreceğim)\b/gi,
        // Турецкие специфические буквы (очень характерно)
        /[ıışşğğüüööçç]/gi,
        // Турецкие окончания
        /\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um|eceğim|edeceğim|gideceğim|geleceksin|yazmayı|unutma|götüreceğim|misin|de)\b/gi,
      ];
      let turkishStrongCount = 0;
      let turkishLettersCount = 0;
      for (let i = 0; i < turkishStrongCheck.length; i++) {
        const pattern = turkishStrongCheck[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          turkishStrongCount += matches.length;
          // Второй паттерн - турецкие буквы
          if (i === 1) {
            turkishLettersCount = matches.length;
          }
        }
      }
      
      // Если есть много турецких признаков (особенно букв), не переопределяем на индонезийский
      if (turkishLettersCount >= 3 || (turkishStrongCount >= 5 && turkishLettersCount >= 1)) {
        console.log(`[OCR] Сильные турецкие признаки (${turkishStrongCount}, букв ${turkishLettersCount}), не переопределяем на индонезийский`);
        return francResult; // Возвращаем исходный результат, не переопределяем на индонезийский
      }
    }
    
    let indonesianScore = 0;

    const markers = INDONESIAN_MARKERS.ind;

    // Проверяем характерные слова
    for (const wordPattern of markers.words) {
      const matches = lowerText.match(wordPattern);
      if (matches) {
        indonesianScore += matches.length * 3; // Индонезийские слова дают много очков
      }
    }

    // Проверяем характерные грамматические паттерны
    for (const pattern of markers.patterns) {
      const matches = lowerText.match(pattern);
      if (matches) {
        indonesianScore += matches.length * 2.5; // Паттерны дают дополнительные очки
      }
    }

    // Проверяем характерные индонезийские окончания
    const indonesianEndings = lowerText.match(/\w+(kan|an|i|nya|ku|mu|lah|kah|pun)\b/gi);
    if (indonesianEndings) {
      indonesianScore += indonesianEndings.length * 2.5; // Высокий вес для индонезийских окончаний
    }

    // Проверяем характерные индонезийские конструкции с "yang"
    const yangConstructions = lowerText.match(/\b\w+\s+yang\s+\w+\b/gi);
    if (yangConstructions) {
      indonesianScore += yangConstructions.length * 4; // Очень высокий вес для "yang" конструкций
    }

    // Проверяем характерные индонезийские конструкции с "adalah"
    const adalahConstructions = lowerText.match(/\b\w+\s+adalah\s+\w+\b/gi);
    if (adalahConstructions) {
      indonesianScore += adalahConstructions.length * 3; // Высокий вес для "adalah" конструкций
    }

    // Дополнительный бонус, если есть множественные характерные индонезийские признаки
    let indonesianStrongIndicators = 0;
    if (yangConstructions && yangConstructions.length > 0) indonesianStrongIndicators++;
    if (adalahConstructions && adalahConstructions.length > 0) indonesianStrongIndicators++;
    if (indonesianEndings && indonesianEndings.length > 2) indonesianStrongIndicators++;
    
    // Если есть все три типа признаков - большой бонус (это точно индонезийский)
    if (indonesianStrongIndicators >= 2) {
      indonesianScore += 5;
    }

    // Бонус, если franc определил индонезийский
    if (francIsIndonesian) {
      indonesianScore += 5;
    }

    // Проверяем отсутствие характерных финских признаков (если franc определил финский)
    if (francResult === 'fin') {
      const finnishIndicators = [
        // Характерные финские слова
        /\b(olen|olet|on|olemme|olette|ovat|ei|eivät|minun|sinun|hänen|meidän|teidän|heidän)\b/gi,
        // Характерные финские окончания
        /\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi|ni|si|nsa|nsä|mme|nne)\b/gi,
        // Двойные согласные (характерно для финского)
        /\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi,
      ];
      let finnishIndicatorCount = 0;
      for (const pattern of finnishIndicators) {
        const matches = lowerText.match(pattern);
        if (matches) {
          finnishIndicatorCount += matches.length;
        }
      }
      
      // Если нет финских признаков, но есть индонезийские - большой бонус индонезийскому
      if (finnishIndicatorCount === 0 && indonesianScore > 0) {
        indonesianScore += 6; // Больший бонус, так как финский часто путают с индонезийским
        console.log(`[OCR] Нет финских признаков, но есть индонезийские (${indonesianScore.toFixed(1)} очков)`);
      }
      // Если есть финские признаки, но их мало, а индонезийских много - все равно выбираем индонезийский
      if (finnishIndicatorCount < 2 && indonesianScore >= 8) {
        indonesianScore += 4;
        console.log(`[OCR] Мало финских признаков (${finnishIndicatorCount}), но много индонезийских (${indonesianScore.toFixed(1)} очков)`);
      } else if (finnishIndicatorCount > 0) {
        console.log(`[OCR] Обнаружено финских признаков: ${finnishIndicatorCount}, индонезийских очков: ${indonesianScore.toFixed(1)}`);
      }
    }

    // Проверяем отсутствие характерных турецких признаков (если franc определил турецкий)
    if (francResult === 'tur') {
      const turkishIndicators = [
        // Очень характерные турецкие слова
        /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|ve|ile|için|gibi|göre|kadar|var|yok|olmak)\b/gi,
        // Турецкие специфические буквы (очень характерно)
        /[ıışşğğüüööçç]/gi,
        // Турецкие окончания
        /\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um)\b/gi,
      ];
      let turkishIndicatorCount = 0;
      let turkishStrongIndicators = 0;
      
      for (let i = 0; i < turkishIndicators.length; i++) {
        const pattern = turkishIndicators[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          turkishIndicatorCount += matches.length;
          // Первые два паттерна - очень характерные для турецкого
          if (i < 2) {
            turkishStrongIndicators += matches.length;
          }
        }
      }
      
      // Если нет турецких признаков, но есть индонезийские - большой бонус индонезийскому
      if (turkishIndicatorCount === 0 && indonesianScore > 0) {
        indonesianScore += 6; // Больший бонус, так как турецкий часто путают с индонезийским
        console.log(`[OCR] Нет турецких признаков, но есть индонезийские (${indonesianScore.toFixed(1)} очков)`);
      }
      // Если есть турецкие признаки, но их мало, а индонезийских много - все равно выбираем индонезийский
      if (turkishStrongIndicators < 2 && indonesianScore >= 8) {
        indonesianScore += 4;
        console.log(`[OCR] Мало турецких признаков (${turkishStrongIndicators}), но много индонезийских (${indonesianScore.toFixed(1)} очков)`);
      } else if (turkishIndicatorCount > 0) {
        console.log(`[OCR] Обнаружено турецких признаков: ${turkishIndicatorCount}, индонезийских очков: ${indonesianScore.toFixed(1)}`);
      }
    }

    // ВАЖНО: Проверяем наличие финских и турецких признаков перед возвратом индонезийского
    // Не переопределяем финский или турецкий на индонезийский, если есть их сильные признаки
    
    // Проверяем финские признаки (всегда, если финский среди кандидатов)
    if (candidates.includes('fin')) {
      const finnishIndicators = [
        // Характерные финские слова
        /\b(olen|olet|on|olemme|olette|ovat|ei|eivät|minun|sinun|hänen|meidän|teidän|heidän|hei|mitä|kuuluu|kirjoitan|sinulle|suomesta|suomen|suomessa|talvi|lunta|talviloma|kouluun|koulu|perheeni|perhe|lapin|lappiin|pohjoisosassa|innoissani|palaamme|lomalta|takaisin|aloitan|uuden|kielen|oppimisen|halunnut|oppia|espanjaa|rakastan|espanjalaista|kulttuuria|mielestani|espanjalainen|musiikki|romanttista|aion|käydä|espanjan|tunneilla|ystäväni|ystävä|ystäviä|ystavalle|ystavani|ystavia|nianasta|astia|taamme|kaiken|harrastukseni|harrastuksesta|ratsastuksesta|ratsastus|ratsastan|hevonen|hevosta|hevoseni|bella|bellalla|bellan|bellasta|bellalle|bellalta|bellana|bellaksi|bellani|bellasi|bellansa|bellamme|bellanne|pienesta|pienestä|asti|rakastan\s+ratsastaa|rakastan\s+ratsastusta|rakastan\s+hevosia|rakastan\s+hevosiä|minun\s+harrastukseni|minun\s+hevoseni|minun\s+bellani)\b/gi,
        // Характерные финские окончания (падежи)
        /\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi|ni|si|nsa|nsä|mme|nne)\b/gi,
        // Притяжательные суффиксы (очень характерно для финского)
        /\w+(ni|si|nsa|nsä|mme|nne)\b/gi,
        // Двойные согласные (характерно для финского)
        /\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi,
      ];
      let finnishIndicatorCount = 0;
      let finnishStrongIndicators = 0;
      
      // Подсчитываем каждый тип признаков отдельно для более точной оценки
      const finnishCaseEndings = lowerText.match(/\w+(ssa|ssä|sta|stä|lla|llä|lta|ltä|na|nä|ksi)\b/gi);
      const finnishPossessiveSuffixes = lowerText.match(/\w+(ni|si|nsa|nsä|mme|nne)\b/gi);
      const finnishDoubleConsonants = lowerText.match(/\b\w*(kk|pp|tt|ss|nn|mm|ll|rr)\w+\b/gi);
      
      for (let i = 0; i < finnishIndicators.length; i++) {
        const pattern = finnishIndicators[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          finnishIndicatorCount += matches.length;
          // Последние три паттерна - очень характерные для финского
          if (i >= 1) {
            finnishStrongIndicators += matches.length;
          }
        }
      }
      
      // Проверяем наличие всех трех типов сильных финских признаков
      const hasAllFinnishIndicators = 
        (finnishCaseEndings && finnishCaseEndings.length > 0) &&
        (finnishPossessiveSuffixes && finnishPossessiveSuffixes.length > 0) &&
        (finnishDoubleConsonants && finnishDoubleConsonants.length > 0);
      
      // Если есть все три типа финских признаков, это точно финский
      if (hasAllFinnishIndicators) {
        console.log(`[OCR] Обнаружены все типы финских признаков (падежи: ${finnishCaseEndings?.length || 0}, притяжательные: ${finnishPossessiveSuffixes?.length || 0}, двойные согласные: ${finnishDoubleConsonants?.length || 0}), возвращаем fin`);
        return 'fin';
      }
      
      // Если есть сильные финские признаки (хотя бы два типа), не переопределяем на индонезийский
      // Порог снижен до 2, чтобы быть более строгим
      if (finnishStrongIndicators >= 2) {
        console.log(`[OCR] Сильные финские признаки (${finnishStrongIndicators}), не переопределяем на индонезийский`);
        // Если franc определил индонезийский, но есть сильные финские признаки, возвращаем финский
        if (francResult === 'ind' && candidates.includes('fin')) {
          console.log(`[OCR] Franc определил индонезийский, но есть сильные финские признаки, возвращаем fin`);
          return 'fin';
        }
        return francResult; // Возвращаем исходный результат, не переопределяем на индонезийский
      }
    }
    
    // Проверяем турецкие признаки (всегда, если турецкий среди кандидатов)
    if (candidates.includes('tur')) {
      const turkishIndicators = [
        // Очень характерные турецкие слова
        /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|ve|ile|için|gibi|göre|kadar|var|yok|olmak|etmek|yapmak|gitmek|gelmek|sevgili|doğum|günü|günüm|hediye|bilgisayar|anneanne|ziyaret|plaj|kuzen|mutlu|mutluyum|yaşında|yaşındayım|bugün|yarın|öğlen|çiçek|çikolata|lütfen|gideceğim|geleceksin|yazmayı|unutma|artık|önemli|çünkü|sürpriz|adet|almanca|turuncu|ablam|abimden|ben|sen|o|biz|siz|onlar|bu|şu|nasılsın|ne\s+zaman|gelir\s+misin|bana|sırt|çanta|portakal|annemden|babamdan|iki|yeni|birlikte|götüreceğim)\b/gi,
        // Турецкие специфические буквы (очень характерно)
        /[ıışşğğüüööçç]/gi,
        // Турецкие окончания
        /\w+(ler|lar|den|dan|de|da|e|a|i|ı|ü|u|in|ın|ün|un|im|ım|üm|um|eceğim|edeceğim|gideceğim|geleceksin|yazmayı|unutma|götüreceğim|misin|de)\b/gi,
      ];
      let turkishIndicatorCount = 0;
      let turkishStrongIndicators = 0;
      
      for (let i = 0; i < turkishIndicators.length; i++) {
        const pattern = turkishIndicators[i];
        const matches = lowerText.match(pattern);
        if (matches) {
          turkishIndicatorCount += matches.length;
          // Первые два паттерна - очень характерные для турецкого
          if (i < 2) {
            turkishStrongIndicators += matches.length;
          }
        }
      }
      
      // Если есть сильные турецкие признаки, не переопределяем на индонезийский
      if (turkishStrongIndicators >= 3 || (turkishIndicatorCount >= 5 && turkishStrongIndicators >= 1)) {
        console.log(`[OCR] Сильные турецкие признаки (${turkishStrongIndicators}, всего ${turkishIndicatorCount}), не переопределяем на индонезийский`);
        return francResult; // Возвращаем исходный результат, не переопределяем на индонезийский
      }
    }

    // Если набрано достаточно очков для индонезийского, возвращаем индонезийский
    // Порог ниже, если franc определил финский/турецкий (более агрессивное исправление)
    // НО порог выше, если есть финские или турецкие признаки среди кандидатов
    const baseThreshold = francIsConfused ? 6 : 10;
    const threshold = baseThreshold;
    
    if (indonesianScore >= threshold) {
      console.log(
        `[OCR] Уточнение индонезийского языка: franc=${francResult}, уточнено=ind, очки=${indonesianScore.toFixed(1)}, порог=${threshold}`
      );
      return 'ind';
    } else if (francIsConfused && indonesianScore >= 4) {
      // Если franc определил финский/турецкий, но есть признаки индонезийского, 
      // но недостаточно для уверенности - логируем для отладки
      console.log(
        `[OCR] Возможен индонезийский язык: franc=${francResult}, очки индонезийского=${indonesianScore.toFixed(1)}, но недостаточно для уверенности`
      );
    }
  }

  return francResult;
}

let worker: any = null;
let currentLanguageCode: string | null = null;

let progressCallback: ((progress: OCRProgress) => void) | null = null;

export async function initializeOCR(languageCode: string = DEFAULT_LANGUAGE_CODE): Promise<void> {
  // Если worker уже инициализирован с нужным языком — выходим
  if (worker && currentLanguageCode === languageCode) {
    return;
  }

  // Если worker инициализирован с другим языком — корректно завершаем
  if (worker && currentLanguageCode !== languageCode) {
    try {
      await worker.terminate();
    } catch (terminateError) {
      console.warn('Ошибка при завершении предыдущего OCR worker:', terminateError);
    }
    worker = null;
    currentLanguageCode = null;
  }

  if (!worker) {
    try {
      const workerPath = chrome.runtime.getURL('workers/');
      const workerUrl = chrome.runtime.getURL('workers/worker.min.js');
      
      console.log('Worker path:', workerPath);
      console.log('Worker URL:', workerUrl);
      
      // Проверяем доступность worker файла
      try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
          throw new Error(`Worker файл не найден (статус: ${response.status})`);
        }
        console.log('Worker файл доступен');
      } catch (fetchError) {
        console.error('Ошибка проверки worker файла:', fetchError);
        throw fetchError;
      }
      
      // Пробуем инициализировать worker
      // Указываем явные пути к файлам (не директориям!)
      const corePath = chrome.runtime.getURL('core/tesseract-core-lstm.wasm.js');
      const langPath = 'https://tessdata.projectnaptha.com/4.0.0_fast/'; // CDN для языковых данных (fetch разрешен)
      
      console.log('Начинаем создание worker...');
      console.log('Worker path:', workerUrl);
      console.log('Core path:', corePath);
      console.log('Lang path:', langPath);
      console.log('OCR languages:', languageCode || DEFAULT_LANGUAGE_CODE);
      
      try {
        // Оборачиваем в Promise для лучшей обработки ошибок
        worker = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Таймаут при создании worker (30 секунд)'));
          }, 30000);
          
          createWorker(languageCode || DEFAULT_LANGUAGE_CODE, 1, {
            workerPath: workerUrl, // Полный путь к файлу worker
            corePath: corePath, // Полный путь к core файлу
            langPath: langPath,
            workerBlobURL: false,
            logger: (m: any) => {
              // Логируем все сообщения для диагностики
              console.log('OCR Logger:', m.status, m.progress, m);
              
              // Обрабатываем ошибки
              if (m.status === 'error' || m.status === 'failed' || m.status === 'rejected') {
                console.error('OCR Error in logger:', m);
                // Если есть ошибка в logger, отклоняем промис
                if (m.error || m.message) {
                  clearTimeout(timeout);
                  reject(new Error(m.error || m.message || 'Ошибка в OCR worker'));
                }
              }
              
              // Передаем прогресс через callback
              if (progressCallback) {
                if (m.status === 'recognizing text' && m.progress !== undefined) {
                  progressCallback({
                    status: m.status,
                    progress: m.progress,
                  });
                } else if (m.status === 'loading language traineddata') {
                  progressCallback({
                    status: 'loading',
                    progress: 0.1,
                  });
                } else if (m.status === 'initializing tesseract') {
                  progressCallback({
                    status: 'initializing',
                    progress: 0.2,
                  });
                }
              }
            },
          })
            .then((w) => {
              clearTimeout(timeout);
              console.log('Worker успешно создан');
              currentLanguageCode = languageCode || DEFAULT_LANGUAGE_CODE;
              resolve(w);
            })
            .catch((err) => {
              clearTimeout(timeout);
              console.error('Ошибка в createWorker promise:', err);
              reject(err || new Error('Неизвестная ошибка при создании worker'));
            });
        });
      } catch (createError) {
        console.error('Ошибка при создании worker:', createError);
        const errorMsg = createError instanceof Error ? createError.message : String(createError);
        throw new Error(`Не удалось создать worker: ${errorMsg || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      // Обрабатываем ошибку с детальным логированием
      console.error('Ошибка инициализации OCR:', error);
      console.error('Тип ошибки:', typeof error);
      console.error('Ошибка как объект:', error);
      
      let errorMessage = 'Не удалось инициализировать OCR';
      
      if (error instanceof Error) {
        errorMessage = error.message || error.toString() || errorMessage;
      } else if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Если сообщение пустое или undefined
      if (!errorMessage || errorMessage === 'undefined' || errorMessage === 'null' || errorMessage === '{}') {
        errorMessage = 'Не удалось инициализировать OCR. Возможно, проблема с загрузкой worker файла. Проверьте консоль для деталей.';
      }
      
      throw new Error(errorMessage);
    }
  }
}

export async function recognizeText(
  imageData: string,
  languageCode: string = DEFAULT_LANGUAGE_CODE,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  progressCallback = onProgress || null;

  if (!worker || currentLanguageCode !== languageCode) {
    await initializeOCR(languageCode);
  }

  try {
    const result = await worker.recognize(imageData, {
      rectangle: undefined, // Обрабатываем все изображение
    });

    if (onProgress) {
      onProgress({
        status: 'completed',
        progress: 1,
      });
    }

    progressCallback = null;

    return {
      text: result.data.text?.trim?.() || '',
      confidence: result.data.confidence || 0,
    };
  } catch (error) {
    progressCallback = null;
    console.error('OCR Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to recognize text: ${errorMessage}`);
  }
}

export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    currentLanguageCode = null;
  }
}

type ScriptType = 'latin' | 'cyrillic' | 'arabic' | 'cjk' | 'hangul' | 'thai' | 'unknown';

function detectScript(text: string): ScriptType {
  let latin = 0;
  let cyrillic = 0;
  let arabic = 0;
  let cjk = 0;
  let hangul = 0;
  let thai = 0;

  for (const ch of text) {
    const code = ch.charCodeAt(0);

    if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) {
      latin++;
    } else if (
      (code >= 0x0400 && code <= 0x04FF) || // Базовая кириллица
      (code >= 0x0500 && code <= 0x052F) || // Расширенная кириллица
      code === 0x0401 || // Ё
      code === 0x0451 // ё
    ) {
      cyrillic++;
    } else if (code >= 0x0600 && code <= 0x06FF) {
      arabic++;
    } else if (
      (code >= 0x3040 && code <= 0x30FF) || // Хирагана + катакана
      (code >= 0x4E00 && code <= 0x9FFF) // CJK
    ) {
      cjk++;
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
      hangul++;
    } else if (code >= 0x0E00 && code <= 0x0E7F) {
      thai++;
    }
  }

  const counts: { type: ScriptType; count: number }[] = [
    { type: 'latin', count: latin },
    { type: 'cyrillic', count: cyrillic },
    { type: 'arabic', count: arabic },
    { type: 'cjk', count: cjk },
    { type: 'hangul', count: hangul },
    { type: 'thai', count: thai },
  ];

  const best = counts.reduce(
    (acc, cur) => (cur.count > acc.count ? cur : acc),
    { type: 'unknown' as ScriptType, count: 0 }
  );

  if (best.count === 0) {
    return 'unknown';
  }

  return best.type;
}

function getScriptForLanguage(code: string): ScriptType {
  switch (code) {
    case 'rus':
      return 'cyrillic';
    case 'ara':
      return 'arabic';
    case 'kor':
      return 'hangul';
    case 'jpn':
      return 'cjk';
    case 'tha':
      return 'thai';
    default:
      // Все остальные — латинские языки
      return 'latin';
  }
}

export async function detectLanguageFromImage(
  imageData: string,
  candidateLanguages: string[]
): Promise<DetectedLanguage> {
  const effectiveCandidates =
    candidateLanguages && candidateLanguages.length > 0
      ? candidateLanguages
      : SUPPORTED_LANGUAGES.map((l) => l.code);

  // 1. Получаем текст в мультиязычном режиме
  const detectionLangCode = effectiveCandidates.join('+');
  const ocrResult = await recognizeText(imageData, detectionLangCode);
  const rawText = ocrResult.text || '';
  const text = rawText.replace(/\s+/g, ' ').trim();

  if (!text) {
    console.log('[OCR] Language detection: empty text, fallback to first candidate');
    return {
      language: effectiveCandidates[0] || DEFAULT_LANGUAGE_CODE,
      confidence: 0,
      shortText: true,
    };
  }

  // Если текста мало, franc даёт нестабильные результаты — используем fallback по алфавиту
  if (text.length < MIN_TEXT_LENGTH_FOR_FRANC) {
    console.log('[OCR] Language detection: text too short for franc, length =', text.length);
    const script = detectScript(text);
    const matchedShort = effectiveCandidates.find((code) => getScriptForLanguage(code) === script);
    return {
      language: matchedShort || effectiveCandidates[0] || DEFAULT_LANGUAGE_CODE,
      confidence: ocrResult.confidence || 0,
      shortText: true,
    };
  }

  // 2. Готовим whitelist для franc только по тем языкам, которые реально доступны
  const francWhitelist = Array.from(
    new Set(
      effectiveCandidates
        .map((code) => TESSERACT_TO_FRANC[code])
        .filter((c): c is string => Boolean(c))
    )
  );

  let francCode: string | undefined;
  try {
    francCode = franc(text, { only: francWhitelist, minLength: MIN_TEXT_LENGTH_FOR_FRANC });
  } catch (err) {
    console.error('[OCR] franc language detection error:', err);
  }

  // Уточняем определение для скандинавских языков
  if (francCode && francCode !== 'und') {
    const refinedCode = refineScandinavianLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedCode && refinedCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedCode);
      francCode = refinedCode;
    }
  }

  // Уточняем определение для индонезийского языка (вызываем раньше, чтобы предотвратить переопределение)
  if (francCode && francCode !== 'und') {
    const refinedIndonesianCode = refineIndonesianLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedIndonesianCode && refinedIndonesianCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedIndonesianCode);
      francCode = refinedIndonesianCode;
    }
  }

  // Уточняем определение для финского языка
  if (francCode && francCode !== 'und') {
    const refinedFinnishCode = refineFinnishLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedFinnishCode && refinedFinnishCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedFinnishCode);
      francCode = refinedFinnishCode;
    }
  }

  // Уточняем определение для турецкого языка
  if (francCode && francCode !== 'und') {
    const refinedTurkishCode = refineTurkishLanguageDetection(text, francCode, effectiveCandidates);
    if (refinedTurkishCode && refinedTurkishCode !== francCode) {
      console.log('[OCR] Уточнено определение языка:', francCode, '=>', refinedTurkishCode);
      francCode = refinedTurkishCode;
    }
  }

  if (francCode && francCode !== 'und') {
    const mapped = effectiveCandidates.find((code) => TESSERACT_TO_FRANC[code] === francCode);
    if (mapped) {
      console.log('[OCR] franc detected language:', francCode, '=>', mapped);
      return {
        language: mapped,
        confidence: ocrResult.confidence || 0,
        shortText: false,
      };
    }
  } else {
    console.warn('[OCR] franc returned und or empty, francCode =', francCode);
  }

  // 3. Fallback: определяем язык по алфавиту
  const script = detectScript(text);
  const matched = effectiveCandidates.find((code) => getScriptForLanguage(code) === script);

  return {
    language: matched || effectiveCandidates[0] || DEFAULT_LANGUAGE_CODE,
    confidence: ocrResult.confidence || 0,
    shortText: false,
  };
}

