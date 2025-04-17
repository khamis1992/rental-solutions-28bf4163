
/**
 * Utility functions for handling RTL (Right-to-Left) text and Arabic language support
 */

/**
 * Detects if text contains RTL (Arabic, Hebrew, etc.) characters
 * @param text Text to check
 * @returns Boolean indicating if the text contains RTL characters
 */
export const hasRTLCharacters = (text: string): boolean => {
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
};

/**
 * Determines if text should be displayed in RTL mode based on content
 * @param text Text to analyze
 * @returns Direction ('rtl' or 'ltr')
 */
export const getTextDirection = (text: string): 'rtl' | 'ltr' => {
  return hasRTLCharacters(text) ? 'rtl' : 'ltr';
};

/**
 * Wraps text in the appropriate direction container based on content
 * @param text Text to wrap
 * @returns CSS class for text direction
 */
export const getDirectionClass = (text: string): string => {
  return hasRTLCharacters(text) ? 'rtl text-arabic' : 'ltr';
};

/**
 * Returns the appropriate font class for the text
 * @param text Text to analyze
 * @returns Font class name
 */
export const getFontClass = (text: string): string => {
  return hasRTLCharacters(text) ? 'font-cairo' : 'font-sans';
};

/**
 * Formats text for proper display based on language
 * @param text Text to format
 * @param addContainer Whether to wrap in a container div with direction
 * @returns Formatted text with proper direction and font
 */
export const formatBiDiText = (text: string, addContainer = false): JSX.Element => {
  const direction = getTextDirection(text);
  const fontClass = getFontClass(text);
  
  if (addContainer) {
    return (
      <div className={`bidi-container ${direction} ${fontClass}`}>
        {text}
      </div>
    );
  }
  
  return <span className={`${fontClass}`} style={{ direction }}>{text}</span>;
};
