import { useTranslation } from '@/contexts/TranslationContext';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Hook to provide directional-aware CSS classes
 */
export const useDirectionalClasses = (
  baseClasses: string,
  ltrClasses: string = '',
  rtlClasses: string = ''
): string => {
  const { isRTL } = useTranslation();

  return cn(
    baseClasses,
    isRTL ? rtlClasses : ltrClasses
  );
};

/**
 * Helper function to flip margins, paddings, etc. for RTL support
 */
export const getDirectionalMargin = (
  prefixClass: 'ml' | 'mr' | 'pl' | 'pr',
  size: string
): string => {
  const { isRTL } = useTranslation();

  const mapping = {
    ml: isRTL ? 'mr' : 'ml',
    mr: isRTL ? 'ml' : 'mr',
    pl: isRTL ? 'pr' : 'pl',
    pr: isRTL ? 'pl' : 'pr'
  };

  return `${mapping[prefixClass]}-${size}`;
};

const classCache = new Map<string, string>();

export const getDirectionalClasses = (classes: string): string => {
  const { isRTL } = useTranslation();

  if (!isRTL) return classes;

  const cacheKey = `${classes}-${isRTL}`;
  if (classCache.has(cacheKey)) {
    return classCache.get(cacheKey)!;
  }

  return classes.split(' ').map(cls => {
    const marginMatch = cls.match(/^(m[lr]|margin-[lr])\-(.+)$/);
    const paddingMatch = cls.match(/^(p[lr]|padding-[lr])\-(.+)$/);

    if (marginMatch) {
      const [, prefix, size] = marginMatch;
      if (prefix === 'ml' || prefix === 'margin-l') return `mr-${size}`;
      if (prefix === 'mr' || prefix === 'margin-r') return `ml-${size}`;
    }

    if (paddingMatch) {
      const [, prefix, size] = paddingMatch;
      if (prefix === 'pl' || prefix === 'padding-l') return `pr-${size}`;
      if (prefix === 'pr' || prefix === 'padding-r') return `pl-${size}`;
    }

    if (cls === 'text-left') return 'text-right';
    if (cls === 'text-right') return 'text-left';

    if (cls === 'items-start') return 'items-end';
    if (cls === 'items-end') return 'items-start';
    if (cls === 'justify-start') return 'justify-end';
    if (cls === 'justify-end') return 'justify-start';

    if (cls.startsWith('border-l')) return cls.replace('border-l', 'border-r');
    if (cls.startsWith('border-r')) return cls.replace('border-r', 'border-l');

    if (cls.startsWith('left-')) return cls.replace('left-', 'right-');
    if (cls.startsWith('right-')) return cls.replace('right-', 'left-');

    if (cls.includes('rounded-l-')) return cls.replace('rounded-l-', 'rounded-r-');
    if (cls.includes('rounded-r-')) return cls.replace('rounded-r-', 'rounded-l-');
    if (cls.includes('rounded-tl-')) return cls.replace('rounded-tl-', 'rounded-tr-');
    if (cls.includes('rounded-tr-')) return cls.replace('rounded-tr-', 'rounded-tl-');
    if (cls.includes('rounded-bl-')) return cls.replace('rounded-bl-', 'rounded-br-');
    if (cls.includes('rounded-br-')) return cls.replace('rounded-br-', 'rounded-bl-');

    if (cls === 'space-x-reverse') return '';
    if (cls.startsWith('space-x-')) return `${cls} space-x-reverse`;

    return cls;
  }).join(' ');
};

export const getDirectionalFlexClass = (): string => {
  const { isRTL } = useTranslation();
  return isRTL ? 'flex-row-reverse' : 'flex-row';
};

export const getDirectionalTextAlign = (): string => {
  const { isRTL } = useTranslation();
  return isRTL ? 'text-right' : 'text-left';
};

export const getDirectionalIcon = (iconType: 'arrow' | 'chevron') => {
  const { isRTL } = useTranslation();

  if (iconType === 'arrow') {
    return isRTL ? 'ArrowRight' : 'ArrowLeft';
  } else {
    return isRTL ? 'ChevronRight' : 'ChevronLeft';
  }
};

export const useIsRTL = () => {
  const { i18n } = useI18nTranslation();
  return i18n.dir() === 'rtl';
};

export const applyRTLStyle = (isRTL: boolean, style: React.CSSProperties = {}): React.CSSProperties => {
  if (!isRTL) return style;
  return {
    ...style,
    direction: 'rtl',
    textAlign: 'right'
  };
};