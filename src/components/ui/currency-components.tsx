import React, { useState, useEffect, useRef } from 'react';

import { 
  formatQatarRiyal, 
  parseQatarRiyal, 
  validateQatarRiyal, 
  qatarCurrencyConfig,
  qatarRiyalFormatters,
  convertToArabicNumerals,
  convertToWesternNumerals
} from '@/utils/arabic-rtl-utils';
import { 
  Calculator, 
  DollarSign, 
  ChevronDown, 
  Check,
  AlertCircle 
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QatarCurrencyInputProps {
  value?: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  showQuickAmounts?: boolean;
  useArabicNumerals?: boolean;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'invoice';
}

export const QatarCurrencyInput: React.FC<QatarCurrencyInputProps> = ({
  value = 0,
  onChange,
  label,
  placeholder = 'أدخل المبلغ',
  error,
  disabled = false,
  required = false,
  min,
  max,
  allowNegative = false,
  showQuickAmounts = true,
  useArabicNumerals = false,
  className,
  inputClassName,
  size = 'md',
  variant = 'default',
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update display value when value prop changes
  useEffect(() => {
    if (!focused) {
      if (value === 0) {
        setDisplayValue('');
      } else {
        const formatted = variant === 'compact' 
          ? qatarRiyalFormatters.compact(value)
          : qatarRiyalFormatters.input(value);
        setDisplayValue(useArabicNumerals ? convertToArabicNumerals(formatted) : formatted);
      }
    }
  }, [value, focused, variant, useArabicNumerals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Convert Arabic numerals to Western for processing
    if (useArabicNumerals) {
      inputValue = convertToWesternNumerals(inputValue);
    }
    
    setDisplayValue(e.target.value);
    
    // Parse and validate the input
    const numericValue = parseQatarRiyal(inputValue);
    
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    // Show raw number without formatting when focused
    if (value !== 0) {
      const rawValue = value.toString();
      setDisplayValue(useArabicNumerals ? convertToArabicNumerals(rawValue) : rawValue);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    // Format the display value when not focused
    if (value !== 0) {
      const formatted = variant === 'compact' 
        ? qatarRiyalFormatters.compact(value)
        : qatarRiyalFormatters.input(value);
      setDisplayValue(useArabicNumerals ? convertToArabicNumerals(formatted) : formatted);
    }
  };

  const handleQuickAmountSelect = (amount: number) => {
    onChange(amount);
    setShowQuickSelect(false);
    inputRef.current?.focus();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 text-sm';
      case 'lg':
        return 'h-12 text-lg';
      default:
        return 'h-10';
    }
  };

  const validationError = validateQatarRiyal(displayValue, {
    min,
    max,
    allowNegative,
    required,
  });

  const finalError = error || validationError;

  return (
    <div className={cn('space-y-2', className)} dir="rtl">
      {label && (
        <Label 
          className={cn(
            'text-right block',
            required && 'after:content-["*"] after:text-red-500 after:mr-1'
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'text-right dir-rtl pr-12',
              getSizeClasses(),
              finalError && 'border-red-500 focus:border-red-500',
              inputClassName
            )}
          />
          
          {/* Currency Symbol */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <span className="text-muted-foreground text-sm">
              {qatarCurrencyConfig.symbol}
            </span>
          </div>
          
          {/* Error Icon */}
          {finalError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
        
        {/* Quick Amount Selector */}
        {showQuickAmounts && !disabled && (
          <Popover open={showQuickSelect} onOpenChange={setShowQuickSelect}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                type="button"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-right">مبالغ سريعة</p>
                <div className="grid grid-cols-3 gap-2">
                  {qatarCurrencyConfig.commonAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmountSelect(amount)}
                      className="text-xs h-8"
                    >
                      {qatarRiyalFormatters.compact(amount)}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAmountSelect(0)}
                  className="w-full text-xs"
                >
                  مسح
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {/* Display formatted amount when not focused */}
      {!focused && value > 0 && (
        <div className="text-sm text-muted-foreground text-right">
          {variant === 'invoice' 
            ? qatarRiyalFormatters.invoice(value)
            : qatarRiyalFormatters.display(value)
          }
        </div>
      )}
      
      {/* Error Message */}
      {finalError && (
        <p className="text-sm text-red-600 text-right flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {finalError}
        </p>
      )}
      
      {/* Helper Text */}
      {!finalError && (min !== undefined || max !== undefined) && (
        <p className="text-xs text-muted-foreground text-right">
          {min !== undefined && max !== undefined
            ? `المدى المسموح: ${formatQatarRiyal(min)} - ${formatQatarRiyal(max)}`
            : min !== undefined
            ? `الحد الأدنى: ${formatQatarRiyal(min)}`
            : `الحد الأقصى: ${formatQatarRiyal(max)}`
          }
        </p>
      )}
    </div>
  );
};

interface QatarCurrencyDisplayProps {
  amount: number;
  variant?: 'default' | 'compact' | 'accounting' | 'invoice' | 'arabic';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  showSign?: boolean;
  className?: string;
}

export const QatarCurrencyDisplay: React.FC<QatarCurrencyDisplayProps> = ({
  amount,
  variant = 'default',
  size = 'md',
  color = 'default',
  showSign = false,
  className,
}) => {
  const formatAmount = () => {
    switch (variant) {
      case 'compact':
        return qatarRiyalFormatters.compact(amount);
      case 'accounting':
        return qatarRiyalFormatters.accounting(amount);
      case 'invoice':
        return qatarRiyalFormatters.invoice(amount);
      case 'arabic':
        return qatarRiyalFormatters.arabic(amount);
      default:
        return qatarRiyalFormatters.display(amount);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl font-semibold';
      default:
        return 'text-base';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'text-green-600';
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'muted':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getSignColor = () => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <span 
      className={cn(
        'font-mono',
        getSizeClasses(),
        getColorClasses(),
        className
      )}
      dir="rtl"
    >
      {showSign && amount !== 0 && (
        <span className={cn('mr-1', getSignColor())}>
          {amount > 0 ? '+' : ''}
        </span>
      )}
      {formatAmount()}
    </span>
  );
};

interface QatarCurrencyBadgeProps {
  amount: number;
  variant?: 'default' | 'compact' | 'accounting';
  color?: 'default' | 'success' | 'danger' | 'warning' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QatarCurrencyBadge: React.FC<QatarCurrencyBadgeProps> = ({
  amount,
  variant = 'compact',
  color = 'default',
  size = 'md',
  className,
}) => {
  const formatAmount = () => {
    switch (variant) {
      case 'compact':
        return qatarRiyalFormatters.compact(amount);
      case 'accounting':
        return qatarRiyalFormatters.accounting(amount);
      default:
        return qatarRiyalFormatters.display(amount);
    }
  };

  const getBadgeVariant = () => {
    switch (color) {
      case 'success':
        return 'default';
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'secondary':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCustomClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return '';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant()}
      className={cn(
        'font-mono',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        getCustomClasses(),
        className
      )}
    >
      {formatAmount()}
    </Badge>
  );
};

// Hook for managing currency input state
export const useQatarCurrencyInput = (initialValue: number = 0) => {
  const [amount, setAmount] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const setValue = (value: number) => {
    setAmount(value);
    setError(null);
  };

  const validate = (options: {
    min?: number;
    max?: number;
    required?: boolean;
    allowNegative?: boolean;
  } = {}) => {
    const validationError = validateQatarRiyal(amount.toString(), options);
    setError(validationError);
    return !validationError;
  };

  const reset = () => {
    setAmount(initialValue);
    setError(null);
  };

  const formatForDisplay = (variant: 'default' | 'compact' | 'accounting' | 'invoice' = 'default') => {
    switch (variant) {
      case 'compact':
        return qatarRiyalFormatters.compact(amount);
      case 'accounting':
        return qatarRiyalFormatters.accounting(amount);
      case 'invoice':
        return qatarRiyalFormatters.invoice(amount);
      default:
        return qatarRiyalFormatters.display(amount);
    }
  };

  return {
    amount,
    setValue,
    error,
    validate,
    reset,
    formatForDisplay,
    isValid: !error,
  };
}; 