import React from 'react';
import { 
  formatQatarRiyal, 
  parseQatarRiyal, 
  validateQatarRiyal,
  qatarRiyalFormatters,
  qatarCurrencyConfig,
  convertToArabicNumerals,
  convertToWesternNumerals
} from '@/utils/arabic-rtl-utils';

/**
 * Qatar Riyal Currency Formatting Examples
 * 
 * This file demonstrates the comprehensive Qatar Riyal formatting system
 * implemented for the Arabic interface of Qatar Rental Solutions.
 */

export const CurrencyFormattingExamples = () => {
  // Example amounts
  const amounts = [
    100,           // Small amount
    1500.75,       // Decimal amount
    25000,         // Medium amount
    150000,        // Large amount
    1250000,       // Very large amount
    -500.25,       // Negative amount
    0              // Zero
  ];

  console.log('=== Qatar Riyal Currency Formatting Examples ===');
  
  // Basic formatting examples
  console.log('\n1. Basic Formatting:');
  amounts.forEach(amount => {
    console.log(`${amount} → ${formatQatarRiyal(amount)}`);
  });

  // Different formatting variants
  console.log('\n2. Formatting Variants:');
  const testAmount = 1500.75;
  
  console.log(`Default: ${qatarRiyalFormatters.display(testAmount)}`);
  console.log(`Compact: ${qatarRiyalFormatters.compact(testAmount)}`);
  console.log(`Input: ${qatarRiyalFormatters.input(testAmount)}`);
  console.log(`Accounting: ${qatarRiyalFormatters.accounting(testAmount)}`);
  console.log(`Invoice: ${qatarRiyalFormatters.invoice(testAmount)}`);
  console.log(`Arabic Numerals: ${qatarRiyalFormatters.arabic(testAmount)}`);

  // Large number formatting
  console.log('\n3. Large Number Formatting:');
  const largeAmounts = [1500, 25000, 150000, 1250000, 5500000];
  largeAmounts.forEach(amount => {
    console.log(`${amount} → Compact: ${formatQatarRiyal(amount, { compact: true })}`);
  });

  // Arabic numerals
  console.log('\n4. Arabic Numerals:');
  amounts.forEach(amount => {
    console.log(`${amount} → ${formatQatarRiyal(amount, { useArabicNumerals: true })}`);
  });

  // Parsing examples
  console.log('\n5. Parsing Examples:');
  const parseExamples = [
    '1500.75 ر.ق',
    '25K ر.ق',
    '1.5M ر.ق',
    '2000',
    '١٥٠٠.٧٥ ر.ق', // Arabic numerals
  ];
  
  parseExamples.forEach(text => {
    console.log(`"${text}" → ${parseQatarRiyal(text)}`);
  });

  // Validation examples
  console.log('\n6. Validation Examples:');
  const validationExamples = [
    { value: '1500', options: {} },
    { value: '50', options: { min: 100 } },
    { value: '15000', options: { max: 10000 } },
    { value: '-500', options: { allowNegative: false } },
    { value: '', options: { required: true } },
  ];

  validationExamples.forEach(({ value, options }) => {
    const error = validateQatarRiyal(value, options);
    console.log(`"${value}" with options ${JSON.stringify(options)} → ${error || 'Valid'}`);
  });

  // Currency configuration
  console.log('\n7. Currency Configuration:');
  console.log('Symbol:', qatarCurrencyConfig.symbol);
  console.log('Code:', qatarCurrencyConfig.code);
  console.log('Locale:', qatarCurrencyConfig.locale);
  console.log('Decimal Places:', qatarCurrencyConfig.decimalPlaces);
  console.log('Denominations:', qatarCurrencyConfig.denominations);
  console.log('Common Amounts:', qatarCurrencyConfig.commonAmounts);

  // Numeral conversion
  console.log('\n8. Numeral Conversion:');
  const westernText = '1234.56';
  const arabicText = convertToArabicNumerals(westernText);
  const backToWestern = convertToWesternNumerals(arabicText);
  
  console.log(`Western: ${westernText}`);
  console.log(`Arabic: ${arabicText}`);
  console.log(`Back to Western: ${backToWestern}`);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-center">
        أمثلة على تنسيق الريال القطري
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {amounts.map((amount, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            <div className="font-semibold">المبلغ: {amount}</div>
            <div className="space-y-1 text-sm">
              <div>افتراضي: {formatQatarRiyal(amount)}</div>
              <div>مضغوط: {formatQatarRiyal(amount, { compact: true })}</div>
              <div>أرقام عربية: {formatQatarRiyal(amount, { useArabicNumerals: true })}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">إعدادات العملة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>الرمز: {qatarCurrencyConfig.symbol}</div>
          <div>الكود: {qatarCurrencyConfig.code}</div>
          <div>المنطقة: {qatarCurrencyConfig.locale}</div>
          <div>المنازل العشرية: {qatarCurrencyConfig.decimalPlaces}</div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">المبالغ الشائعة</h2>
        <div className="flex flex-wrap gap-2">
          {qatarCurrencyConfig.commonAmounts.map((amount) => (
            <span key={amount} className="bg-muted px-3 py-1 rounded text-sm">
              {formatQatarRiyal(amount, { compact: true })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Usage examples for developers
export const usageExamples = {
  // Basic formatting
  basic: () => formatQatarRiyal(1500.75), // "1,500.75 ر.ق"
  
  // Compact formatting for large numbers
  compact: () => formatQatarRiyal(1500000, { compact: true }), // "1.5M ر.ق"
  
  // Without symbol (for inputs)
  input: () => formatQatarRiyal(1500.75, { showSymbol: false }), // "1,500.75"
  
  // With Arabic numerals
  arabic: () => formatQatarRiyal(1500.75, { useArabicNumerals: true }), // "١,٥٠٠.٧٥ ر.ق"
  
  // Accounting format (negative in parentheses)
  accounting: () => qatarRiyalFormatters.accounting(-500), // "(500.00 ر.ق)"
  
  // Parse currency string to number
  parse: () => parseQatarRiyal('1,500.75 ر.ق'), // 1500.75
  
  // Validate currency input
  validate: () => validateQatarRiyal('1500', { min: 100, max: 10000 }), // null (valid)
  
  // Convert numerals
  convertToArabic: () => convertToArabicNumerals('1234.56'), // "١٢٣٤.٥٦"
  convertToWestern: () => convertToWesternNumerals('١٢٣٤.٥٦'), // "1234.56"
};

export default CurrencyFormattingExamples; 