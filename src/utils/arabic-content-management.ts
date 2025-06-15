/**
 * Arabic Content Management System
 * Provides comprehensive Arabic text handling, validation, spell-check, and search capabilities
 */

/**
 * Arabic Text Validation System
 */
export class ArabicTextValidator {
  // Arabic Unicode ranges
  private static readonly ARABIC_RANGES = [
    [0x0600, 0x06FF], // Arabic
    [0x0750, 0x077F], // Arabic Supplement
    [0x08A0, 0x08FF], // Arabic Extended-A
    [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
    [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
  ];

  // Arabic diacritics (Tashkeel)
  private static readonly DIACRITICS = [
    '\u064B', // Fathatan
    '\u064C', // Dammatan
    '\u064D', // Kasratan
    '\u064E', // Fatha
    '\u064F', // Damma
    '\u0650', // Kasra
    '\u0651', // Shadda
    '\u0652', // Sukun
    '\u0653', // Maddah
    '\u0654', // Hamza above
    '\u0655', // Hamza below
    '\u0656', // Subscript alef
    '\u0657', // Inverted damma
    '\u0658', // Mark noon ghunna
    '\u0659', // Zwarakay
    '\u065A', // Vowel sign small v above
    '\u065B', // Vowel sign inverted small v above
    '\u065C', // Vowel sign dot below
    '\u065D', // Reversed damma
    '\u065E', // Fatha with two dots
    '\u065F', // Wavy hamza below
    '\u0670', // Superscript alef
  ];

  // Common Arabic words for spell checking
  private static readonly COMMON_WORDS = new Set([
    'الله', 'محمد', 'عبد', 'أحمد', 'علي', 'حسن', 'حسين', 'فاطمة', 'عائشة', 'خديجة',
    'السلام', 'عليكم', 'وعليكم', 'بسم', 'الرحمن', 'الرحيم', 'الحمد', 'رب', 'العالمين',
    'مرحبا', 'أهلا', 'وسهلا', 'شكرا', 'عفوا', 'آسف', 'معذرة', 'من', 'فضلك', 'لو', 'سمحت',
    'نعم', 'لا', 'كلا', 'طبعا', 'بالطبع', 'ممكن', 'مستحيل', 'ربما', 'أكيد', 'بالتأكيد',
    'اليوم', 'أمس', 'غدا', 'الآن', 'بعد', 'قبل', 'صباح', 'مساء', 'ليل', 'نهار',
    'سيارة', 'مركبة', 'إيجار', 'تأجير', 'عقد', 'اتفاقية', 'عميل', 'زبون', 'شركة', 'مؤسسة',
    'قطر', 'الدوحة', 'الريال', 'درهم', 'دينار', 'جنيه', 'دولار', 'يورو',
    'كيلومتر', 'متر', 'سنتيمتر', 'كيلو', 'جرام', 'لتر', 'ساعة', 'دقيقة', 'ثانية',
    'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
  ]);

  /**
   * Check if text contains Arabic characters
   */
  static isArabicText(text: string): boolean {
    if (!text) return false;
    
    for (const char of text) {
      const code = char.charCodeAt(0);
      for (const [start, end] of this.ARABIC_RANGES) {
        if (code >= start && code <= end) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if text is primarily Arabic (>50% Arabic characters)
   */
  static isPrimarilyArabic(text: string): boolean {
    if (!text) return false;
    
    let arabicCount = 0;
    let totalLetters = 0;
    
    for (const char of text) {
      if (/\p{L}/u.test(char)) {
        totalLetters++;
        const code = char.charCodeAt(0);
        for (const [start, end] of this.ARABIC_RANGES) {
          if (code >= start && code <= end) {
            arabicCount++;
            break;
          }
        }
      }
    }
    
    return totalLetters > 0 && (arabicCount / totalLetters) > 0.5;
  }

  /**
   * Remove Arabic diacritics from text
   */
  static removeDiacritics(text: string): string {
    let result = text;
    for (const diacritic of this.DIACRITICS) {
      result = result.replace(new RegExp(diacritic, 'g'), '');
    }
    return result;
  }

  /**
   * Normalize Arabic text for comparison
   */
  static normalizeArabicText(text: string): string {
    return text
      // Remove diacritics
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      // Normalize Alef variations
      .replace(/[آأإ]/g, 'ا')
      // Normalize Yeh variations
      .replace(/[ىي]/g, 'ي')
      // Normalize Teh Marbuta
      .replace(/ة/g, 'ه')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate Arabic text structure
   */
  static validateArabicStructure(text: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!text) {
      return { isValid: true, errors, warnings };
    }

    // Check for mixed LTR/RTL text issues
    const hasArabic = this.isArabicText(text);
    const hasLatin = /[a-zA-Z]/.test(text);
    
    if (hasArabic && hasLatin) {
      warnings.push('النص يحتوي على خليط من الأحرف العربية واللاتينية');
    }

    // Check for common Arabic typing errors
    if (text.includes('لا')) {
      // Check for incorrect Lam-Alef combinations
      if (text.includes('ل ا')) {
        errors.push('استخدم "لا" بدلاً من "ل ا"');
      }
    }

    // Check for excessive diacritics
    const diacriticCount = (text.match(/[\u064B-\u0652]/g) || []).length;
    const letterCount = (text.match(/[\u0627-\u06FF]/g) || []).length;
    
    if (letterCount > 0 && (diacriticCount / letterCount) > 0.3) {
      warnings.push('النص يحتوي على تشكيل مفرط');
    }

    // Check for proper punctuation
    if (hasArabic) {
      if (text.includes(',') && !text.includes('،')) {
        warnings.push('استخدم الفاصلة العربية "،" بدلاً من ","');
      }
      if (text.includes(';') && !text.includes('؛')) {
        warnings.push('استخدم الفاصلة المنقوطة العربية "؛" بدلاً من ";"');
      }
      if (text.includes('?') && !text.includes('؟')) {
        warnings.push('استخدم علامة الاستفهام العربية "؟" بدلاً من "?"');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Basic Arabic spell check
   */
  static spellCheck(text: string): {
    suggestions: Array<{
      word: string;
      position: number;
      suggestions: string[];
      confidence: number;
    }>;
    misspelledCount: number;
  } {
    const suggestions: Array<{
      word: string;
      position: number;
      suggestions: string[];
      confidence: number;
    }> = [];

    if (!this.isArabicText(text)) {
      return { suggestions, misspelledCount: 0 };
    }

    // Split text into words
    const words = text.split(/\s+/);
    let position = 0;

    for (const word of words) {
      const cleanWord = this.normalizeArabicText(word.replace(/[^\u0600-\u06FF\u0750-\u077F]/g, ''));
      
      if (cleanWord.length > 1 && !this.COMMON_WORDS.has(cleanWord)) {
        // Find similar words
        const similarWords = this.findSimilarWords(cleanWord);
        
        if (similarWords.length > 0) {
          suggestions.push({
            word,
            position,
            suggestions: similarWords,
            confidence: 0.7,
          });
        }
      }
      
      position += word.length + 1;
    }

    return {
      suggestions,
      misspelledCount: suggestions.length,
    };
  }

  /**
   * Find similar Arabic words
   */
  private static findSimilarWords(word: string): string[] {
    const suggestions: string[] = [];
    const maxDistance = Math.floor(word.length / 3);

    for (const commonWord of this.COMMON_WORDS) {
      const distance = this.levenshteinDistance(word, commonWord);
      if (distance <= maxDistance) {
        suggestions.push(commonWord);
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Arabic Search System with Diacritics Support
 */
/**
 * Search options interface
 */
export interface ArabicSearchOptions {
  ignoreDiacritics?: boolean;
  ignoreCase?: boolean;
  fuzzyMatch?: boolean;
  maxDistance?: number;
  highlightMatches?: boolean;
}

/**
 * Search result interface
 */
export interface ArabicSearchResult<T = any> {
  item: T;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    highlighted?: string;
    positions: number[];
  }>;
}

export class ArabicSearchEngine {
  /**
   * Perform Arabic-aware search
   */
  static search<T>(
    items: T[],
    query: string,
    searchFields: (keyof T)[],
    options: ArabicSearchOptions = {}
  ): ArabicSearchResult<T>[] {
    const {
      ignoreDiacritics = true,
      ignoreCase = true,
      fuzzyMatch = false,
      maxDistance = 2,
      highlightMatches = false,
    } = options;

    if (!query.trim()) {
      return items.map(item => ({
        item,
        score: 0,
        matches: [],
      }));
    }

    const normalizedQuery = this.normalizeSearchQuery(query, { ignoreDiacritics, ignoreCase });
    const results: ArabicSearchResult<T>[] = [];

    for (const item of items) {
      const matches: ArabicSearchResult<T>['matches'] = [];
      let totalScore = 0;

      for (const field of searchFields) {
        const fieldValue = String(item[field] || '');
        const normalizedValue = this.normalizeSearchQuery(fieldValue, { ignoreDiacritics, ignoreCase });

        let score = 0;
        const positions: number[] = [];

        if (fuzzyMatch) {
          score = this.fuzzySearch(normalizedQuery, normalizedValue, maxDistance);
        } else {
          const matchResult = this.exactSearch(normalizedQuery, normalizedValue);
          score = matchResult.score;
          positions.push(...matchResult.positions);
        }

        if (score > 0) {
          matches.push({
            field: String(field),
            value: fieldValue,
            highlighted: highlightMatches ? this.highlightMatches(fieldValue, query, positions) : undefined,
            positions,
          });
          totalScore += score;
        }
      }

      if (totalScore > 0) {
        results.push({
          item,
          score: totalScore,
          matches,
        });
      }
    }

    // Sort by score (descending)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Normalize search query
   */
  private static normalizeSearchQuery(
    text: string,
    options: { ignoreDiacritics?: boolean; ignoreCase?: boolean }
  ): string {
    let normalized = text;

    if (options.ignoreDiacritics) {
      normalized = ArabicTextValidator.removeDiacritics(normalized);
    }

    if (options.ignoreCase) {
      normalized = normalized.toLowerCase();
    }

    return ArabicTextValidator.normalizeArabicText(normalized);
  }

  /**
   * Perform exact search
   */
  private static exactSearch(query: string, text: string): { score: number; positions: number[] } {
    const positions: number[] = [];
    let score = 0;
    let index = 0;

    while ((index = text.indexOf(query, index)) !== -1) {
      positions.push(index);
      score += query.length / text.length;
      index += query.length;
    }

    return { score, positions };
  }

  /**
   * Perform fuzzy search
   */
  private static fuzzySearch(query: string, text: string, maxDistance: number): number {
    const words = text.split(/\s+/);
    let bestScore = 0;

    for (const word of words) {
      const distance = ArabicTextValidator.levenshteinDistance(query, word);
      if (distance <= maxDistance) {
        const score = 1 - (distance / Math.max(query.length, word.length));
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  }

  /**
   * Highlight search matches
   */
  private static highlightMatches(text: string, query: string, positions: number[]): string {
    if (positions.length === 0) return text;

    let highlighted = '';
    let lastIndex = 0;

    for (const position of positions) {
      highlighted += text.slice(lastIndex, position);
      highlighted += `<mark>${text.slice(position, position + query.length)}</mark>`;
      lastIndex = position + query.length;
    }

    highlighted += text.slice(lastIndex);
    return highlighted;
  }

  /**
   * Advanced search with multiple queries
   */
  static advancedSearch<T>(
    items: T[],
    queries: Array<{
      query: string;
      fields: (keyof T)[];
      weight?: number;
      operator?: 'AND' | 'OR';
    }>,
    options: ArabicSearchOptions = {}
  ): ArabicSearchResult<T>[] {
    const results = new Map<T, { score: number; matches: ArabicSearchResult<T>['matches'] }>();

    for (const { query, fields, weight = 1, operator = 'OR' } of queries) {
      const queryResults = this.search(items, query, fields, options);

      for (const result of queryResults) {
        const existing = results.get(result.item);
        const weightedScore = result.score * weight;

        if (existing) {
          if (operator === 'AND') {
            existing.score = Math.min(existing.score, weightedScore);
          } else {
            existing.score = Math.max(existing.score, weightedScore);
          }
          existing.matches.push(...result.matches);
        } else {
          results.set(result.item, {
            score: weightedScore,
            matches: [...result.matches],
          });
        }
      }
    }

    // Convert map to array and sort by score
    return Array.from(results.entries())
      .map(([item, { score, matches }]) => ({ item, score, matches }))
      .sort((a, b) => b.score - a.score);
  }
}

/**
 * Content Translation Management System
 */
export class ArabicTranslationManager {
  private translations: Map<string, Map<string, string>> = new Map();
  private fallbackLanguage = 'ar';
  private currentLanguage = 'ar';

  /**
   * Translation entry
   */
  interface TranslationEntry {
    key: string;
    ar: string;
    en?: string;
    context?: string;
    category?: string;
    lastUpdated?: Date;
    status?: 'draft' | 'review' | 'approved';
  }

  /**
   * Load translations
   */
  loadTranslations(translations: Record<string, Record<string, string>>): void {
    for (const [language, entries] of Object.entries(translations)) {
      if (!this.translations.has(language)) {
        this.translations.set(language, new Map());
      }
      const langMap = this.translations.get(language)!;
      for (const [key, value] of Object.entries(entries)) {
        langMap.set(key, value);
      }
    }
  }

  /**
   * Get translation
   */
  t(key: string, params?: Record<string, string | number>, language?: string): string {
    const lang = language || this.currentLanguage;
    const langMap = this.translations.get(lang);
    
    let translation = langMap?.get(key);
    
    // Fallback to default language
    if (!translation && lang !== this.fallbackLanguage) {
      const fallbackMap = this.translations.get(this.fallbackLanguage);
      translation = fallbackMap?.get(key);
    }
    
    // Fallback to key if no translation found
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      translation = key;
    }

    // Replace parameters
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }
    }

    return translation;
  }

  /**
   * Set current language
   */
  setLanguage(language: string): void {
    this.currentLanguage = language;
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Add translation
   */
  addTranslation(key: string, language: string, value: string): void {
    if (!this.translations.has(language)) {
      this.translations.set(language, new Map());
    }
    this.translations.get(language)!.set(key, value);
  }

  /**
   * Get missing translations
   */
  getMissingTranslations(language: string): string[] {
    const baseMap = this.translations.get(this.fallbackLanguage);
    const targetMap = this.translations.get(language);
    
    if (!baseMap) return [];
    
    const missing: string[] = [];
    for (const key of baseMap.keys()) {
      if (!targetMap?.has(key)) {
        missing.push(key);
      }
    }
    
    return missing;
  }

  /**
   * Export translations
   */
  exportTranslations(language?: string): Record<string, string> {
    const lang = language || this.currentLanguage;
    const langMap = this.translations.get(lang);
    
    if (!langMap) return {};
    
    const exported: Record<string, string> = {};
    for (const [key, value] of langMap.entries()) {
      exported[key] = value;
    }
    
    return exported;
  }

  /**
   * Validate translations
   */
  validateTranslations(): {
    isValid: boolean;
    errors: Array<{
      key: string;
      language: string;
      error: string;
    }>;
  } {
    const errors: Array<{ key: string; language: string; error: string }> = [];

    for (const [language, langMap] of this.translations.entries()) {
      for (const [key, value] of langMap.entries()) {
        // Check for empty translations
        if (!value.trim()) {
          errors.push({
            key,
            language,
            error: 'الترجمة فارغة',
          });
        }

        // Check for Arabic translations that don't contain Arabic text
        if (language === 'ar' && !ArabicTextValidator.isArabicText(value)) {
          errors.push({
            key,
            language,
            error: 'الترجمة العربية لا تحتوي على نص عربي',
          });
        }

        // Check for parameter mismatches
        const paramPattern = /{{(\w+)}}/g;
        const baseParams = (this.translations.get(this.fallbackLanguage)?.get(key) || '').match(paramPattern) || [];
        const currentParams = value.match(paramPattern) || [];
        
        if (baseParams.length !== currentParams.length) {
          errors.push({
            key,
            language,
            error: 'عدم تطابق في المعاملات',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Arabic Text Processing Utilities
 */
export class ArabicTextProcessor {
  /**
   * Convert Arabic numerals to Western numerals
   */
  static arabicToWesternNumerals(text: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = text;
    for (let i = 0; i < arabicNumerals.length; i++) {
      result = result.replace(new RegExp(arabicNumerals[i], 'g'), westernNumerals[i]);
    }
    
    return result;
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  static westernToArabicNumerals(text: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = text;
    for (let i = 0; i < westernNumerals.length; i++) {
      result = result.replace(new RegExp(westernNumerals[i], 'g'), arabicNumerals[i]);
    }
    
    return result;
  }

  /**
   * Format Arabic text for display
   */
  static formatArabicText(text: string, options: {
    addDiacritics?: boolean;
    normalizeSpacing?: boolean;
    fixPunctuation?: boolean;
  } = {}): string {
    let formatted = text;

    if (options.normalizeSpacing) {
      // Normalize spacing
      formatted = formatted.replace(/\s+/g, ' ').trim();
      
      // Fix spacing around punctuation
      formatted = formatted.replace(/\s*([،؛؟!])\s*/g, '$1 ');
      formatted = formatted.replace(/\s*([()])\s*/g, ' $1 ');
    }

    if (options.fixPunctuation) {
      // Replace English punctuation with Arabic equivalents
      formatted = formatted.replace(/,/g, '،');
      formatted = formatted.replace(/;/g, '؛');
      formatted = formatted.replace(/\?/g, '؟');
    }

    return formatted;
  }

  /**
   * Extract keywords from Arabic text
   */
  static extractKeywords(text: string, minLength: number = 3): string[] {
    const cleanText = ArabicTextValidator.removeDiacritics(text);
    const words = cleanText.split(/\s+/);
    
    // Common Arabic stop words
    const stopWords = new Set([
      'في', 'من', 'إلى', 'على', 'عن', 'مع', 'بعد', 'قبل', 'تحت', 'فوق',
      'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'التي', 'اللذان', 'اللتان',
      'هو', 'هي', 'هم', 'هن', 'أنت', 'أنتم', 'أنتن', 'أنا', 'نحن',
      'كان', 'كانت', 'كانوا', 'كن', 'يكون', 'تكون', 'يكونوا', 'يكن',
      'قال', 'قالت', 'قالوا', 'قلن', 'يقول', 'تقول', 'يقولوا', 'يقلن',
      'أو', 'أم', 'لكن', 'لكن', 'غير', 'سوى', 'إلا', 'بل', 'لا', 'ما', 'لم', 'لن',
    ]);

    const keywords = words
      .filter(word => word.length >= minLength)
      .filter(word => !stopWords.has(word))
      .filter(word => ArabicTextValidator.isArabicText(word))
      .map(word => ArabicTextValidator.normalizeArabicText(word));

    // Remove duplicates and return
    return Array.from(new Set(keywords));
  }

  /**
   * Calculate text readability score for Arabic
   */
  static calculateReadabilityScore(text: string): {
    score: number;
    level: 'easy' | 'medium' | 'hard';
    metrics: {
      averageWordsPerSentence: number;
      averageLettersPerWord: number;
      complexWordsPercentage: number;
    };
  } {
    const sentences = text.split(/[.!؟]/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const letters = text.replace(/\s/g, '').length;

    const averageWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const averageLettersPerWord = letters / Math.max(words.length, 1);
    
    // Count complex words (>6 letters)
    const complexWords = words.filter(word => word.length > 6).length;
    const complexWordsPercentage = (complexWords / Math.max(words.length, 1)) * 100;

    // Simple readability formula adapted for Arabic
    const score = 100 - (averageWordsPerSentence * 1.5) - (averageLettersPerWord * 2) - (complexWordsPercentage * 0.5);

    let level: 'easy' | 'medium' | 'hard';
    if (score >= 70) level = 'easy';
    else if (score >= 50) level = 'medium';
    else level = 'hard';

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      metrics: {
        averageWordsPerSentence,
        averageLettersPerWord,
        complexWordsPercentage,
      },
    };
  }
}

/**
 * Export all Arabic content management utilities
 */
export const arabicContentManagement = {
  validator: ArabicTextValidator,
  search: ArabicSearchEngine,
  translation: ArabicTranslationManager,
  processor: ArabicTextProcessor,
}; 