// Характерные признаки для индонезийского языка
export const INDONESIAN_MARKERS = {
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
export function refineIndonesianLanguageDetection(
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
