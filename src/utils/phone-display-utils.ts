// Phone Display Utilities - Force LTR display for all phone numbers

/**
 * Format phone number with Qatar country code and ensure LTR display
 */
export const formatQatarPhone = (phone: string | undefined | null): string => {
  if (!phone) return 'غير محدد';
  
  // Remove any existing country code
  let cleanPhone = phone.replace(/^\+974/, '').trim();
  
  // Ensure it's a valid Qatar phone number
  if (cleanPhone.length === 8 && /^[3-9]/.test(cleanPhone)) {
    return `+974${cleanPhone}`;
  }
  
  // Return as is if already has country code or invalid format
  return phone.startsWith('+974') ? phone : phone;
};

/**
 * Generate HTML string for phone display with LTR styling
 */
export const generatePhoneHTML = (
  phone: string | undefined | null,
  showLabel: boolean = false,
  label: string = 'الهاتف:'
): string => {
  const formattedPhone = formatQatarPhone(phone);
  
  if (!phone || phone === 'غير محدد') {
    return '<span>غير محدد</span>';
  }
  
  const labelHtml = showLabel ? `<span>${label} </span>` : '';
  const phoneHtml = `<span class="phone-number-ltr" dir="ltr">${formattedPhone}</span>`;
  
  return `${labelHtml}${phoneHtml}`;
};

/**
 * Apply LTR styling to phone numbers in DOM content
 * This function can be called after dynamic content is loaded
 */
export const applyPhoneLTRStyling = (): void => {
  if (typeof document === 'undefined') return;
  
  // Pattern to match Qatar phone numbers
  const phonePattern = /\+974\d{8}|\b[3-9]\d{7}\b/g;
  
  // Find all elements with text content containing phone numbers
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    const textNodes = element.childNodes;
    
    textNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const content = node.textContent;
        
        if (phonePattern.test(content)) {
          const parent = node.parentElement;
          if (parent) {
            const newContent = content.replace(phonePattern, (match) => {
              return `<span class="phone-number-ltr" dir="ltr">${match}</span>`;
            });
            
            if (newContent !== content) {
              parent.innerHTML = parent.innerHTML.replace(content, newContent);
            }
          }
        }
      }
    });
  });
};

/**
 * Initialize phone number styling observer
 * This will automatically apply LTR styling to new phone numbers
 */
export const initPhoneNumberObserver = (): void => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Apply initial styling
  applyPhoneLTRStyling();
  
  // Set up mutation observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    let hasNewContent = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hasNewContent = true;
      }
    });
    
    if (hasNewContent) {
      // Debounce the styling application
      setTimeout(applyPhoneLTRStyling, 100);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
};

/**
 * Utility to check if a string contains a phone number
 */
export const containsPhoneNumber = (text: string): boolean => {
  const phonePattern = /\+974\d{8}|\b[3-9]\d{7}\b/;
  return phonePattern.test(text);
};

/**
 * Extract phone numbers from text
 */
export const extractPhoneNumbers = (text: string): string[] => {
  const phonePattern = /\+974\d{8}|\b[3-9]\d{7}\b/g;
  return text.match(phonePattern) || [];
}; 