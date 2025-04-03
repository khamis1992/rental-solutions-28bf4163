
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

// Generate direction-aware class names for positioning
export const dirAwarePosition = (
  language: string,
  position: 'left' | 'right',
  value: string
): string => {
  const pos = isRTL(language) 
    ? (position === 'left' ? 'right' : 'left') 
    : position;
  
  return `${pos}-${value}`;
};

// Generate direction-aware transform for icons/elements
export const dirAwareTransform = (
  language: string,
  defaultTransform: string,
  rtlTransform: string
): string => {
  return isRTL(language) ? rtlTransform : defaultTransform;
};

// Create a dir-aware flex direction
export const dirAwareFlexDirection = (
  language: string,
  defaultDir: string,
  rtlDir: string
): string => {
  return isRTL(language) ? rtlDir : defaultDir;
};

// Create a dir-aware text alignment
export const dirAwareTextAlign = (
  language: string
): string => {
  return isRTL(language) ? 'text-right' : 'text-left';
};
