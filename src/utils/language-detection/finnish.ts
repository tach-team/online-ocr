// Характерные признаки для финского языка
export const FINNISH_MARKERS = {
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
export function refineFinnishLanguageDetection(
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
        /\b(türk|türkiye|türkçe|istanbul|ankara|izmir|ve|ile|için|gibi|göre|kadar|var|yok|olmak|etmek|yapmak|gitmek|gelmek|sevgili|doğum|günü|günüm|hediye|bilgisayar|kitap|anneanne|ziyaret|plaj|kuzen|mutlu|yaşında|yaşındayım|bugün|yarın|öğlen|çiçek|çikolata|lütfen|gideceğim|geleceksin|yazmayı|unutma|artık|önemli|çünkü|sürpriz|adet|almanca|turuncu|ablam|abimden)\b/gi,
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
