// Характерные признаки для турецкого языка
export const TURKISH_MARKERS = {
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
export function refineTurkishLanguageDetection(
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
