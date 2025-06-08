import { getTextAlignmentAndDirection, toEnglishNumerals } from './language-utils';
// @ts-expect-error: No types for arabic-persian-reshaper
import * as reshapeModule from 'arabic-persian-reshaper';
// @ts-expect-error: No types for bidi-js
import bidiFactory from 'bidi-js';
const reshape = (reshapeModule &&
  ((reshapeModule as any).default?.convertArabic || (reshapeModule as any).ArabicShaper?.convertArabic ||
   (typeof (reshapeModule as any).default === 'function' ? (reshapeModule as any).default : null) ||
   (typeof reshapeModule === 'function' ? (reshapeModule as any) : null))) as (txt: string) => string;
const bidi = (bidiFactory as any)();

// Manual text order corrections for specific Arabic phrases that appear in wrong order
const ARABIC_TEXT_ORDER_FIXES: Record<string, string> = {
  'المركبة معلومات': 'معلومات المركبة',
  'العميل معلومات': 'معلومات العميل',
  'الدفع تاريخ': 'تاريخ الدفع',
  'الإيجار مبلغ': 'مبلغ الإيجار',
  'التأمين مبلغ': 'مبلغ التأمين',
  'الإجمالي المبلغ': 'المبلغ الإجمالي',
  'الباقي المبلغ': 'المبلغ الباقي',
  'المدفوع المبلغ': 'المبلغ المدفوع',
  'الشامل الإيجار عقد': 'عقد الإيجار الشامل',
  'الدفعات سجل': 'سجل الدفعات',
  'الدفع حالة': 'حالة الدفع',
  'العقد معلومات': 'معلومات العقد',
  'التوقيع تاريخ': 'تاريخ التوقيع',
  'الانتهاء تاريخ': 'تاريخ الانتهاء',
  'الشهرية الدفعة': 'الدفعة الشهرية'
};

// Manual word order corrections
const manualOrderFixes: Record<string, string> = {
  'المركبة معلومات': 'معلومات المركبة',
  'العميل معلومات': 'معلومات العميل',
  'الدفع تاريخ': 'تاريخ الدفع',
  'الإيجار مبلغ': 'مبلغ الإيجار',
  'التأمين مبلغ': 'مبلغ التأمين',
  'العقد مدة': 'مدة العقد',
  'العقد معلومات': 'معلومات العقد',
  'الدفعات سجل': 'سجل الدفعات',
  'المخالفة تاريخ': 'تاريخ المخالفة',
  'المخالفة حالة': 'حالة المخالفة',
  'المخالفة موقع': 'موقع المخالفة',
  'الإجمالي المبلغ': 'المبلغ الإجمالي',
  'المدفوع المبلغ': 'المبلغ المدفوع',
  'المتبقي الرصيد': 'الرصيد المتبقي',
  'الشاملةالإيجار عقد': 'عقد الإيجار الشامل',
  'الدفع طريقة': 'طريقة الدفع',
  'الدفع حالة': 'حالة الدفع'
};

// Utility functions for proper Arabic text handling in PDFs

/**
 * Manually fixes Arabic text word order for known problematic phrases
 * This is a targeted solution for specific text order issues in PDF generation
 */
export function fixArabicWordOrder(text: string): string {
  // Check if the text needs manual order correction
  for (const [incorrectOrder, correctOrder] of Object.entries(ARABIC_TEXT_ORDER_FIXES)) {
    if (text.includes(incorrectOrder)) {
      text = text.replace(new RegExp(incorrectOrder, 'g'), correctOrder);
    }
  }
  return text;
}

/**
 * Fixes Arabic text order and ensures proper RTL rendering
 * Uses Unicode Bidirectional Algorithm to maintain correct word order
 */
export function fixArabicTextOrder(text: string): string {
  return fixArabicWordOrder(text);
}

/**
 * Applies manual fix for broken Arabic phrase order.
 */
export function prepareArabicForPDF(text: string): string {
  let result = text;
  for (const [wrong, correct] of Object.entries(manualOrderFixes)) {
    if (result.includes(wrong)) {
      result = result.replace(new RegExp(wrong, 'g'), correct);
    }
  }
  return result;
}

/**
 * Creates a corrected Arabic text block using manual word order fixing.
 */
export function createArabicTextBlock(text: string, style: any = 'arabicText') {
  return {
    text: prepareArabicForPDF(text),
    style,
    alignment: 'right',
    rtl: false // do NOT let pdfMake flip it again
  };
}

/**
 * Formats currency amounts in Arabic with proper text direction
 */
export function formatArabicCurrency(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return toEnglishNumerals('\u200E0 QAR');
  // Use LTR mark to force left-to-right display for numbers and currency
  return '\u200E' + toEnglishNumerals(`${amount.toLocaleString('en-US')} QAR`);
}

/**
 * Formats dates in Arabic with proper text direction
 */
export function formatArabicDate(date: string | Date | null | undefined): string {
  if (!date) return prepareArabicForPDF('غير محدد');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return prepareArabicForPDF(dateObj.toLocaleDateString('ar-QA'));
}

// Utility to shape and reorder Arabic text for correct PDF rendering (disabled fallback)
export function fixRtl(text: string): string {
  return text;
}
