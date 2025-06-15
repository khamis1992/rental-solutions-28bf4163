# Qatar Riyal Currency Formatting System

## Overview

A comprehensive currency formatting system specifically designed for Qatar Riyal (QAR) with full Arabic/RTL support for the Qatar Rental Solutions platform.

## Features

### ✅ Core Formatting Functions
- **formatQatarRiyal()** - Main formatting function with extensive options
- **parseQatarRiyal()** - Parse currency strings back to numbers
- **validateQatarRiyal()** - Validate currency input with custom rules
- **qatarRiyalFormatters** - Pre-configured formatters for different contexts

### ✅ Formatting Variants
- **Default**: `1,500.75 ر.ق`
- **Compact**: `1.5K ر.ق`, `2.3M ر.ق`, `1.2B ر.ق`
- **Input**: `1,500.75` (no symbol for form inputs)
- **Accounting**: `(500.00 ر.ق)` (negative in parentheses)
- **Invoice**: `1,500.75 ريال قطري` (with full currency name)
- **Arabic Numerals**: `١,٥٠٠.٧٥ ر.ق`

### ✅ Arabic/RTL Support
- Right-to-left text direction
- Arabic numeral conversion (Western ↔ Arabic-Indic)
- Proper symbol positioning (after amount in Arabic)
- Arabic validation messages
- Cultural formatting preferences

### ✅ Validation System
- Required field validation
- Min/max amount validation
- Negative number handling
- Custom validation rules
- Arabic error messages

## Usage Examples

### Basic Formatting

```typescript
import { formatQatarRiyal } from '@/utils/arabic-rtl-utils';

// Basic usage
formatQatarRiyal(1500.75);           // "1,500.75 ر.ق"
formatQatarRiyal(25000);             // "25,000.00 ر.ق"
formatQatarRiyal(0);                 // "0.00 ر.ق"
formatQatarRiyal(-500);              // "-500.00 ر.ق"
```

### Advanced Formatting Options

```typescript
// Compact formatting for large numbers
formatQatarRiyal(1500000, { compact: true });        // "1.5M ر.ق"
formatQatarRiyal(25000, { compact: true });          // "25K ر.ق"

// Without symbol (for form inputs)
formatQatarRiyal(1500.75, { showSymbol: false });    // "1,500.75"

// With Arabic numerals
formatQatarRiyal(1500.75, { useArabicNumerals: true }); // "١,٥٠٠.٧٥ ر.ق"

// Custom decimal places
formatQatarRiyal(1500, { decimalPlaces: 0 });        // "1,500 ر.ق"

// Symbol position
formatQatarRiyal(1500, { symbolPosition: 'before' }); // "ر.ق 1,500.00"
```

### Pre-configured Formatters

```typescript
import { qatarRiyalFormatters } from '@/utils/arabic-rtl-utils';

qatarRiyalFormatters.display(1500.75);     // "1,500.75 ر.ق"
qatarRiyalFormatters.compact(1500000);     // "1.5M ر.ق"
qatarRiyalFormatters.input(1500.75);       // "1,500.75"
qatarRiyalFormatters.accounting(-500);     // "(500.00 ر.ق)"
qatarRiyalFormatters.invoice(1500.75);     // "1,500.75 ريال قطري"
qatarRiyalFormatters.arabic(1500.75);      // "١,٥٠٠.٧٥ ر.ق"
qatarRiyalFormatters.export(1500.75);      // "1,500.75 ر.ق"
```

### Parsing Currency Strings

```typescript
import { parseQatarRiyal } from '@/utils/arabic-rtl-utils';

parseQatarRiyal('1,500.75 ر.ق');          // 1500.75
parseQatarRiyal('25K ر.ق');               // 25000
parseQatarRiyal('1.5M ر.ق');              // 1500000
parseQatarRiyal('١,٥٠٠.٧٥ ر.ق');          // 1500.75 (Arabic numerals)
parseQatarRiyal('2000');                   // 2000
```

### Validation

```typescript
import { validateQatarRiyal } from '@/utils/arabic-rtl-utils';

// Basic validation
validateQatarRiyal('1500');                // null (valid)
validateQatarRiyal('invalid');             // "يرجى إدخال مبلغ صحيح"

// With constraints
validateQatarRiyal('50', { min: 100 });    // "المبلغ يجب أن يكون أكبر من 100.00 ر.ق"
validateQatarRiyal('15000', { max: 10000 }); // "المبلغ يجب أن يكون أقل من 10,000.00 ر.ق"
validateQatarRiyal('', { required: true }); // "هذا الحقل مطلوب"
validateQatarRiyal('-500', { allowNegative: false }); // "يرجى إدخال رقم موجب"
```

### Numeral Conversion

```typescript
import { convertToArabicNumerals, convertToWesternNumerals } from '@/utils/arabic-rtl-utils';

convertToArabicNumerals('1234.56');       // "١٢٣٤.٥٦"
convertToWesternNumerals('١٢٣٤.٥٦');      // "1234.56"
```

## Currency Configuration

```typescript
import { qatarCurrencyConfig } from '@/utils/arabic-rtl-utils';

qatarCurrencyConfig = {
  code: 'QAR',
  symbol: 'ر.ق',
  symbolPosition: 'after',
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  locale: 'ar-QA',
  
  symbols: {
    primary: 'ر.ق',      // Primary symbol (Riyal Qatar)
    secondary: 'QAR',     // International code
    unicode: '﷼',        // Unicode Riyal symbol
    english: 'QR',        // English abbreviation
  },
  
  denominations: {
    singular: 'ريال قطري',
    plural: 'ريال قطري',
    subunit: 'درهم',
    subunitPlural: 'درهم',
  },
  
  commonAmounts: [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
};
```

## Component Integration

### Updated Components

The following components have been updated to use Qatar Riyal formatting:

1. **Dashboard Stats** (`src/components/dashboard/DashboardStats.tsx`)
   - Revenue display with proper QAR formatting
   - Compact formatting for large amounts

2. **Arabic RTL Utils** (`src/utils/arabic-rtl-utils.ts`)
   - Complete Qatar Riyal formatting system
   - Arabic validation messages
   - Numeral conversion utilities

3. **Formatters** (`src/lib/formatters.ts`)
   - Updated to use Qatar Riyal formatting
   - Legacy compatibility maintained

4. **Utils** (`src/lib/utils.ts`)
   - Enhanced formatCurrency function
   - Qatar Riyal integration

### Usage in Components

```typescript
// In React components
import { formatQatarRiyal, qatarRiyalFormatters } from '@/utils/arabic-rtl-utils';

const MyComponent = () => {
  const amount = 1500.75;
  
  return (
    <div dir="rtl">
      <p>السعر: {formatQatarRiyal(amount)}</p>
      <p>مضغوط: {qatarRiyalFormatters.compact(amount)}</p>
    </div>
  );
};
```

## Form Integration

### Currency Input Component

A specialized currency input component is available:

```typescript
import { QatarCurrencyInput } from '@/components/ui/currency-components';

<QatarCurrencyInput
  value={amount}
  onChange={setAmount}
  label="المبلغ"
  min={100}
  max={10000}
  showQuickAmounts={true}
  useArabicNumerals={false}
  required={true}
/>
```

### Display Components

```typescript
import { QatarCurrencyDisplay, QatarCurrencyBadge } from '@/components/ui/currency-components';

<QatarCurrencyDisplay 
  amount={1500.75} 
  variant="compact" 
  size="lg" 
  color="success" 
/>

<QatarCurrencyBadge 
  amount={25000} 
  variant="accounting" 
  color="warning" 
/>
```

## Best Practices

### 1. Consistent Formatting
- Use `formatQatarRiyal()` for all currency displays
- Choose appropriate variants based on context
- Maintain consistent decimal places (2 for QAR)

### 2. Arabic/RTL Support
- Always set `dir="rtl"` for Arabic content
- Use Arabic validation messages
- Consider Arabic numeral option for specific contexts

### 3. User Experience
- Provide quick amount selection for common values
- Show formatted preview while user types
- Use compact formatting for large numbers in summaries

### 4. Validation
- Validate all currency inputs
- Provide clear Arabic error messages
- Set appropriate min/max constraints

### 5. Performance
- Use pre-configured formatters when possible
- Cache formatted values for repeated displays
- Avoid unnecessary re-formatting

## Migration Guide

### From Legacy formatCurrency

```typescript
// Old way
const formatted = `${amount.toLocaleString('en-US')} ر.ق`;

// New way
const formatted = formatQatarRiyal(amount);
```

### From Manual Formatting

```typescript
// Old way
const formatted = `QAR ${amount.toFixed(2)}`;

// New way
const formatted = formatQatarRiyal(amount);
```

## Testing

### Test Cases Covered

1. **Basic Formatting**
   - Positive numbers
   - Negative numbers
   - Zero values
   - Decimal precision

2. **Large Numbers**
   - Thousands (K)
   - Millions (M)
   - Billions (B)

3. **Arabic Support**
   - Arabic numeral conversion
   - RTL text direction
   - Arabic validation messages

4. **Edge Cases**
   - Invalid inputs
   - Null/undefined values
   - Very large numbers
   - Very small decimals

5. **Parsing**
   - Various input formats
   - Currency symbols
   - Compact notation
   - Arabic numerals

## Future Enhancements

### Planned Features
- [ ] Multi-currency support (USD, EUR)
- [ ] Historical exchange rates
- [ ] Currency conversion utilities
- [ ] Advanced Arabic typography
- [ ] Voice input support (Arabic)
- [ ] Accessibility improvements

### Considerations
- Performance optimization for large datasets
- Offline currency data caching
- Integration with accounting systems
- Compliance with Qatar financial regulations

## Support

For questions or issues with the Qatar Riyal formatting system:

1. Check the examples in `src/examples/currency-formatting-example.tsx`
2. Review the test cases in the test files
3. Consult the Arabic RTL utilities documentation
4. Contact the development team for custom requirements

---

**Qatar Rental Solutions - Currency Formatting System v1.0**  
*Optimized for Qatar market with full Arabic/RTL support* 