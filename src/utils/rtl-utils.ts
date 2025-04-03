
// Helper function to determine if a given language is RTL
export const isRTL = (language: string): boolean => {
  return ['ar', 'he', 'fa', 'ur'].includes(language);
};

// Helper function to conditionally apply RTL-specific styling
export const rtlClass = (
  language: string, 
  baseClass: string, 
  rtlClass: string
): string => {
  return isRTL(language) ? `${baseClass} ${rtlClass}` : baseClass;
};

// Generate direction-aware margin or padding classes
export const dirAwareSpacing = (
  language: string, 
  type: 'margin' | 'padding', 
  direction: 'start' | 'end',
  size: number
): string => {
  const prefix = type === 'margin' ? 'm' : 'p';
  const dir = isRTL(language) 
    ? (direction === 'start' ? 'r' : 'l') 
    : (direction === 'start' ? 'l' : 'r');
  
  return `${prefix}${dir}-${size}`;
};

// Generate direction-aware flex ordering
export const dirAwareOrder = (
  language: string,
  defaultOrder: string,
  rtlOrder: string
): string => {
  return isRTL(language) ? rtlOrder : defaultOrder;
};
