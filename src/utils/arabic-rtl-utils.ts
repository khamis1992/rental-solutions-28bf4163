/**
 * Arabic RTL Utility Functions
 * Provides helper functions for Arabic-only UI with proper RTL layout
 */


/**
 * RTL-aware icon spacing classes
 */
export const rtlIconSpacing = {
  iconLeft: 'ml-2',  // Icon on the left (right in RTL)
  iconRight: 'mr-2', // Icon on the right (left in RTL)
};

/**
 * RTL-aware flex direction classes
 */
export const rtlFlex = {
  row: 'flex-row-reverse',
  col: 'flex-col',
  rowNormal: 'flex-row',
};

/**
 * RTL-aware spacing classes
 */
export const rtlSpacing = {
  marginLeft: 'mr-2',
  marginRight: 'ml-2',
  paddingLeft: 'pr-2',
  paddingRight: 'pl-2',
};

/**
 * RTL-aware text alignment classes
 */
export const rtlText = {
  right: 'text-right',
  left: 'text-left',
  center: 'text-center',
};

/**
 * RTL-aware border classes
 */
export const rtlBorder = {
  left: 'border-r',
  right: 'border-l',
  top: 'border-t',
  bottom: 'border-b',
};

/**
 * Creates RTL-aware button classes
 */
export function createRTLButtonClasses(baseClasses: string = ''): string {
  return cn(
    baseClasses,
    rtlFlex.row,
    'gap-2'
  );
}

/**
 * Creates RTL-aware form field classes
 */
export function createRTLFormClasses(baseClasses: string = ''): string {
  return cn(
    baseClasses,
    rtlText.right,
    'dir-rtl'
  );
}

/**
 * Creates RTL-aware card classes
 */
export function createRTLCardClasses(baseClasses: string = ''): string {
  return cn(
    baseClasses,
    rtlText.right,
    'dir-rtl'
  );
}

/**
 * Creates RTL-aware navigation classes
 */
export function createRTLNavClasses(baseClasses: string = ''): string {
  return cn(
    baseClasses,
    rtlFlex.row,
    rtlText.right
  );
}

/**
 * Common Arabic UI text constants
 */
export const arabicUIText = {
  // Actions
  add: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  submit: 'إرسال',
  close: 'إغلاق',
  back: 'رجوع',
  next: 'التالي',
  previous: 'السابق',
  
  // Common
  search: 'بحث',
  filter: 'تصفية',
  export: 'تصدير',
  import: 'استيراد',
  refresh: 'تحديث',
  loading: 'جاري التحميل...',
  error: 'خطأ',
  success: 'نجح',
  warning: 'تحذير',
  info: 'معلومات',
  
  // Status
  active: 'نشط',
  inactive: 'غير نشط',
  pending: 'في الانتظار',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  
  // Navigation
  dashboard: 'لوحة التحكم',
  vehicles: 'المركبات',
  customers: 'العملاء',
  agreements: 'العقود',
  maintenance: 'الصيانة',
  reports: 'التقارير',
  settings: 'الإعدادات',
  
  // Currency
  currency: 'العملة',
  amount: 'المبلغ',
  total: 'الإجمالي',
  subtotal: 'المجموع الفرعي',
  tax: 'الضريبة',
  discount: 'الخصم',
  paid: 'مدفوع',
  due: 'مستحق',
  balance: 'الرصيد',
  deposit: 'العربون',
  refund: 'استرداد',
};

/**
 * Arabic form validation messages
 */
export const arabicValidationMessages = {
  required: 'هذا الحقل مطلوب',
  email: 'يرجى إدخال بريد إلكتروني صحيح',
  phone: 'يرجى إدخال رقم هاتف صحيح',
  minLength: (min: number) => `يجب أن يكون الحد الأدنى ${min} أحرف`,
  maxLength: (max: number) => `يجب أن لا يتجاوز ${max} حرف`,
  numeric: 'يرجى إدخال أرقام فقط',
  alphanumeric: 'يرجى إدخال أحرف وأرقام فقط',
  password: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل',
  confirmPassword: 'كلمات المرور غير متطابقة',
  date: 'يرجى إدخال تاريخ صحيح',
  url: 'يرجى إدخال رابط صحيح',
  positiveNumber: 'يرجى إدخال رقم موجب',
  range: (min: number, max: number) => `القيمة يجب أن تكون بين ${min} و ${max}`,
  fileSize: (maxSize: string) => `حجم الملف يجب أن لا يتجاوز ${maxSize}`,
  fileType: (types: string) => `نوع الملف يجب أن يكون ${types}`,
  unique: 'هذه القيمة موجودة مسبقاً',
  custom: 'قيمة غير صحيحة',
  currency: 'يرجى إدخال مبلغ صحيح',
  minAmount: (min: number) => `المبلغ يجب أن يكون أكبر من ${min.toLocaleString()} ر.ق`,
  maxAmount: (max: number) => `المبلغ يجب أن يكون أقل من ${max.toLocaleString()} ر.ق`,
};

/**
 * Qatar Riyal Currency Configuration
 */
export const qatarCurrencyConfig = {
  code: 'QAR',
  symbol: 'ر.ق',
  symbolPosition: 'after', // Symbol comes after the number in Arabic
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  locale: 'ar-QA',
  
  // Alternative symbols and formats
  symbols: {
    primary: 'ر.ق',      // Primary symbol (Riyal Qatar)
    secondary: 'QAR',     // International code
    unicode: '﷼',        // Unicode Riyal symbol
    english: 'QR',        // English abbreviation
  },
  
  // Denomination names in Arabic
  denominations: {
    singular: 'ريال قطري',
    plural: 'ريال قطري',
    subunit: 'درهم',
    subunitPlural: 'درهم',
  },
  
  // Common amounts for quick selection
  commonAmounts: [
    100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000
  ],
};

/**
 * Format amount as Qatar Riyal with proper Arabic formatting
 */
export function formatQatarRiyal(
  amount: number | string, 
  options: {
    showSymbol?: boolean;
    symbolPosition?: 'before' | 'after';
    decimalPlaces?: number;
    useArabicNumerals?: boolean;
    compact?: boolean;
    showCurrency?: boolean;
  } = {}
): string {
  const {
    showSymbol = true,
    symbolPosition = 'after',
    decimalPlaces = 2,
    useArabicNumerals = false,
    compact = false,
    showCurrency = false,
  } = options;

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0 ر.ق';
  }

  // Format for compact display (K, M, B)
  if (compact && Math.abs(numAmount) >= 1000) {
    return formatCompactQatarRiyal(numAmount, { showSymbol, useArabicNumerals });
  }

  // إذا كان الرقم عدد صحيح، لا نعرض .00
  if (Number.isInteger(numAmount) && decimalPlaces === 2) {
    let formattedNumber = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    // Convert to Arabic numerals if requested
    if (useArabicNumerals) {
      formattedNumber = convertToArabicNumerals(formattedNumber);
    }
    
    // Add currency symbol/code
    if (showSymbol) {
      const symbol = showCurrency ? qatarCurrencyConfig.symbols.primary : qatarCurrencyConfig.symbol;
      
      if (symbolPosition === 'before') {
        return `${symbol} ${formattedNumber}`;
      } else {
        return `${formattedNumber} ${symbol}`;
      }
    }
    
    return formattedNumber;
  }

  // Format the number with proper separators for non-integers
  let formattedNumber = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  });

  // إزالة .0 إذا انتهى الرقم بها
  if (formattedNumber.endsWith('.0')) {
    formattedNumber = formattedNumber.slice(0, -2);
  }

  // Convert to Arabic numerals if requested
  if (useArabicNumerals) {
    formattedNumber = convertToArabicNumerals(formattedNumber);
  }

  // Add currency symbol/code
  if (showSymbol) {
    const symbol = showCurrency ? qatarCurrencyConfig.symbols.primary : qatarCurrencyConfig.symbol;
    
    if (symbolPosition === 'before') {
      return `${symbol} ${formattedNumber}`;
    } else {
      return `${formattedNumber} ${symbol}`;
    }
  }

  return formattedNumber;
}

/**
 * Format compact Qatar Riyal (e.g., 1.5K ر.ق, 2.3M ر.ق)
 */
export function formatCompactQatarRiyal(
  amount: number,
  options: {
    showSymbol?: boolean;
    useArabicNumerals?: boolean;
  } = {}
): string {
  const { showSymbol = true, useArabicNumerals = false } = options;
  
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  let value: number;
  let suffix: string;
  
  if (absAmount >= 1_000_000_000) {
    value = absAmount / 1_000_000_000;
    suffix = useArabicNumerals ? 'ب' : 'B'; // Billion
  } else if (absAmount >= 1_000_000) {
    value = absAmount / 1_000_000;
    suffix = useArabicNumerals ? 'م' : 'M'; // Million
  } else if (absAmount >= 1_000) {
    value = absAmount / 1_000;
    suffix = useArabicNumerals ? 'ألف' : 'K'; // Thousand
  } else {
    return formatQatarRiyal(amount, { showSymbol, useArabicNumerals });
  }
  
  // Format to 1 decimal place
  let formattedValue = value.toFixed(1);
  
  // Remove .0 or .00 if it's a whole number
  if (formattedValue.endsWith('.0')) {
    formattedValue = formattedValue.slice(0, -2);
  } else if (formattedValue.endsWith('.00')) {
    formattedValue = formattedValue.slice(0, -3);
  }
  
  // Convert to Arabic numerals if requested
  if (useArabicNumerals) {
    formattedValue = convertToArabicNumerals(formattedValue);
  }
  
  const result = `${sign}${formattedValue}${suffix}`;
  
  return showSymbol ? `${result} ${qatarCurrencyConfig.symbol}` : result;
}

/**
 * Convert Western numerals to Arabic-Indic numerals
 */
export function convertToArabicNumerals(text: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
}

/**
 * Convert Arabic-Indic numerals to Western numerals
 */
export function convertToWesternNumerals(text: string): string {
  const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  return text.replace(/[٠-٩]/g, (digit) => {
    const index = arabicNumerals.indexOf(digit);
    return index !== -1 ? westernNumerals[index] : digit;
  });
}

/**
 * Parse Qatar Riyal string to number
 */
export function parseQatarRiyal(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbols and extra spaces
  let cleanValue = value
    .replace(/[ر.ق|QAR|QR|﷼]/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Convert Arabic numerals to Western
  cleanValue = convertToWesternNumerals(cleanValue);
  
  // Handle compact notation
  if (cleanValue.includes('K') || cleanValue.includes('ألف')) {
    const numValue = parseFloat(cleanValue.replace(/[Kألف]/g, ''));
    return numValue * 1000;
  }
  
  if (cleanValue.includes('M') || cleanValue.includes('م')) {
    const numValue = parseFloat(cleanValue.replace(/[Mم]/g, ''));
    return numValue * 1000000;
  }
  
  if (cleanValue.includes('B') || cleanValue.includes('ب')) {
    const numValue = parseFloat(cleanValue.replace(/[Bب]/g, ''));
    return numValue * 1000000000;
  }
  
  // Remove thousands separators and parse
  cleanValue = cleanValue.replace(/,/g, '');
  return parseFloat(cleanValue) || 0;
}

/**
 * Validate Qatar Riyal amount
 */
export function validateQatarRiyal(
  value: string,
  options: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
    required?: boolean;
  } = {}
): string | null {
  const { min, max, allowNegative = false, required = false } = options;
  
  if (!value || value.trim() === '') {
    return required ? arabicValidationMessages.required : null;
  }
  
  const amount = parseQatarRiyal(value);
  
  if (isNaN(amount)) {
    return arabicValidationMessages.currency;
  }
  
  if (!allowNegative && amount < 0) {
    return arabicValidationMessages.positiveNumber;
  }
  
  if (min !== undefined && amount < min) {
    return arabicValidationMessages.minAmount(min);
  }
  
  if (max !== undefined && amount > max) {
    return arabicValidationMessages.maxAmount(max);
  }
  
  return null;
}

/**
 * Format Qatar Riyal for different contexts
 */
export const qatarRiyalFormatters = {
  // Standard display format
  display: (amount: number) => formatQatarRiyal(amount),
  
  // Compact format for cards and summaries
  compact: (amount: number) => formatQatarRiyal(amount, { compact: true }),
  
  // Input format (no symbol for form inputs)
  input: (amount: number) => formatQatarRiyal(amount, { showSymbol: false }),
  
  // Arabic numerals format
  arabic: (amount: number) => formatQatarRiyal(amount, { useArabicNumerals: true }),
  
  // Accounting format (negative in parentheses)
  accounting: (amount: number) => {
    if (amount < 0) {
      return `(${formatQatarRiyal(Math.abs(amount))})`;
    }
    return formatQatarRiyal(amount);
  },
  
  // Invoice format with currency name
  invoice: (amount: number) => formatQatarRiyal(amount, { showCurrency: true }),
  
  // Export format (plain number with symbol)
  export: (amount: number) => formatQatarRiyal(amount, { decimalPlaces: 2 }),
};

/**
 * Arabic date and time formatting
 */
export const arabicDateTimeFormats = {
  shortDate: 'dd/MM/yyyy',
  longDate: 'dd MMMM yyyy',
  shortTime: 'HH:mm',
  longTime: 'HH:mm:ss',
  dateTime: 'dd/MM/yyyy HH:mm',
  monthYear: 'MMMM yyyy',
  dayMonth: 'dd MMMM',
};

/**
 * Arabic number formatting (legacy - kept for compatibility)
 */
export const arabicNumberFormats = {
  currency: (amount: number) => formatQatarRiyal(amount),
  percentage: (value: number) => `${value}%`,
  decimal: (value: number, decimals: number = 2) => value.toFixed(decimals),
  thousands: (value: number) => value.toLocaleString('ar-QA'),
};

/**
 * Formats Arabic numbers (converts Western numerals to Arabic-Indic if needed)
 */
export function formatArabicNumber(num: number | string): string {
  // For now, keep Western numerals as they're more commonly used in business contexts
  // But this function can be extended to convert to Arabic-Indic numerals if needed
  return String(num);
}

/**
 * Validates Arabic text input
 */
export function validateArabicText(text: string): boolean {
  const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d\p{P}]+$/u;
  return arabicRegex.test(text);
}

/**
 * Creates RTL-aware language attribute
 */
export function getArabicLang(): 'ar' {
  return 'ar';
}

/**
 * Helper to create consistent Arabic form layouts
 */
export function createArabicFormLayout(className?: string) {
  return cn(
    'space-y-4',
    rtlText.right,
    className
  );
}

/**
 * Helper to create consistent Arabic card layouts
 */
export function createArabicCardLayout(className?: string) {
  return cn(
    'p-4',
    rtlText.right,
    className
  );
}

/**
 * Helper to create consistent Arabic table layouts
 */
export function createArabicTableLayout(className?: string) {
  return cn(
    'w-full',
    rtlText.right,
    className
  );
}

/**
 * Helper to create Arabic modal layouts
 */
export function createArabicModalLayout(className?: string) {
  return cn(
    'text-right',
    'dir-rtl',
    className
  );
}

/**
 * Helper to create Arabic notification layouts
 */
export function createArabicNotificationLayout(className?: string) {
  return cn(
    'text-right',
    'dir-rtl',
    rtlFlex.row,
    className
  );
}

/**
 * Helper to format Arabic currency (legacy - uses Qatar Riyal)
 */
export function formatArabicCurrency(amount: number): string {
  return formatQatarRiyal(amount);
}

/**
 * Helper to format Arabic date (Gregorian calendar only)
 */
export function formatArabicDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper to format Arabic time
 */
export function formatArabicTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('ar-QA', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Helper to create Arabic error messages
 */
export function createArabicErrorMessage(error: string | Error): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Common error translations
  const errorTranslations: Record<string, string> = {
    'Network Error': 'خطأ في الشبكة',
    'Server Error': 'خطأ في الخادم',
    'Not Found': 'غير موجود',
    'Unauthorized': 'غير مصرح',
    'Forbidden': 'محظور',
    'Validation Error': 'خطأ في التحقق',
    'Database Error': 'خطأ في قاعدة البيانات',
    'Connection Failed': 'فشل في الاتصال',
    'Timeout': 'انتهت المهلة الزمنية',
    'Unknown Error': 'خطأ غير معروف',
  };
  
  return errorTranslations[errorMessage] || errorMessage;
}

/**
 * Helper to create Arabic success messages
 */
export function createArabicSuccessMessage(action: string): string {
  const successTranslations: Record<string, string> = {
    'created': 'تم الإنشاء بنجاح',
    'updated': 'تم التحديث بنجاح',
    'deleted': 'تم الحذف بنجاح',
    'saved': 'تم الحفظ بنجاح',
    'sent': 'تم الإرسال بنجاح',
    'uploaded': 'تم الرفع بنجاح',
    'downloaded': 'تم التحميل بنجاح',
    'imported': 'تم الاستيراد بنجاح',
    'exported': 'تم التصدير بنجاح',
    'completed': 'تم الإنجاز بنجاح',
  };
  
  return successTranslations[action] || 'تم بنجاح';
} 