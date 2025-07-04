import { describe, it, expect } from 'vitest';
import { 
  formatArabicDate, 
  formatCurrency, 
  isArabicText,
  sanitizeArabicText,
  convertToArabicNumerals
} from '@/utils/arabic-text-utils';

describe('Arabic Text Utils', () => {
  describe('formatArabicDate', () => {
    it('should format date in Arabic', () => {
      const date = new Date('2024-01-15');
      const formattedDate = formatArabicDate(date);
      
      expect(formattedDate).toContain('٢٠٢٤');
      expect(formattedDate).toContain('يناير');
    });

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid');
      const formattedDate = formatArabicDate(invalidDate);
      
      expect(formattedDate).toBe('تاريخ غير صحيح');
    });

    it('should format date string', () => {
      const dateString = '2024-01-15';
      const formattedDate = formatArabicDate(dateString);
      
      expect(formattedDate).toBeTruthy();
      expect(typeof formattedDate).toBe('string');
    });
  });

  describe('formatCurrency', () => {
    it('should format QAR currency', () => {
      const amount = 1500;
      const formatted = formatCurrency(amount);
      
      expect(formatted).toContain('١٬٥٠٠');
      expect(formatted).toContain('ريال');
    });

    it('should handle zero amount', () => {
      const formatted = formatCurrency(0);
      
      expect(formatted).toContain('٠');
      expect(formatted).toContain('ريال');
    });

    it('should handle negative amount', () => {
      const formatted = formatCurrency(-500);
      
      expect(formatted).toContain('٥٠٠');
      expect(formatted).toContain('ريال');
    });

    it('should format large amounts with commas', () => {
      const formatted = formatCurrency(1000000);
      
      expect(formatted).toContain('١٬٠٠٠٬٠٠٠');
      expect(formatted).toContain('ريال');
    });
  });

  describe('isArabicText', () => {
    it('should detect Arabic text', () => {
      expect(isArabicText('مرحبا بك')).toBe(true);
      expect(isArabicText('عميل تجريبي')).toBe(true);
      expect(isArabicText('اتفاقية إيجار')).toBe(true);
    });

    it('should detect non-Arabic text', () => {
      expect(isArabicText('Hello World')).toBe(false);
      expect(isArabicText('123456')).toBe(false);
      expect(isArabicText('Test Customer')).toBe(false);
    });

    it('should handle mixed text', () => {
      expect(isArabicText('مرحبا ABC')).toBe(true); // Contains Arabic
      expect(isArabicText('Hello مرحبا')).toBe(true); // Contains Arabic
    });

    it('should handle empty string', () => {
      expect(isArabicText('')).toBe(false);
      expect(isArabicText('   ')).toBe(false); // Whitespace only
    });
  });

  describe('sanitizeArabicText', () => {
    it('should clean Arabic text', () => {
      const dirtyText = '  مرحبا بك  ';
      const cleaned = sanitizeArabicText(dirtyText);
      
      expect(cleaned).toBe('مرحبا بك');
    });

    it('should remove extra spaces', () => {
      const textWithSpaces = 'مرحبا     بك     في     النظام';
      const cleaned = sanitizeArabicText(textWithSpaces);
      
      expect(cleaned).toBe('مرحبا بك في النظام');
    });

    it('should handle empty text', () => {
      expect(sanitizeArabicText('')).toBe('');
      expect(sanitizeArabicText('   ')).toBe('');
    });

    it('should preserve Arabic diacritics', () => {
      const textWithDiacritics = 'مَرْحَباً بِكَ';
      const cleaned = sanitizeArabicText(textWithDiacritics);
      
      expect(cleaned).toContain('مَرْحَباً');
    });
  });

  describe('convertToArabicNumerals', () => {
    it('should convert English numerals to Arabic', () => {
      expect(convertToArabicNumerals('123')).toBe('١٢٣');
      expect(convertToArabicNumerals('456789')).toBe('٤٥٦٧٨٩');
      expect(convertToArabicNumerals('0')).toBe('٠');
    });

    it('should handle mixed text with numbers', () => {
      const result = convertToArabicNumerals('العميل رقم 123 في الطابق 4');
      expect(result).toBe('العميل رقم ١٢٣ في الطابق ٤');
    });

    it('should handle text without numbers', () => {
      const text = 'مرحبا بك في النظام';
      expect(convertToArabicNumerals(text)).toBe(text);
    });

    it('should handle empty string', () => {
      expect(convertToArabicNumerals('')).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined safely', () => {
      expect(() => formatCurrency(null as any)).not.toThrow();
      expect(() => isArabicText(null as any)).not.toThrow();
      expect(() => sanitizeArabicText(undefined as any)).not.toThrow();
    });

    it('should handle very long Arabic text', () => {
      const longText = 'مرحبا '.repeat(1000);
      const sanitized = sanitizeArabicText(longText);
      
      expect(sanitized.length).toBeLessThan(longText.length);
      expect(isArabicText(sanitized)).toBe(true);
    });

    it('should handle special Arabic characters', () => {
      const specialChars = 'لا أُحب؟! الأرقام: ٠١٢٣٤٥٦٧٨٩';
      
      expect(isArabicText(specialChars)).toBe(true);
      expect(sanitizeArabicText(specialChars)).toBeTruthy();
    });
  });
});  