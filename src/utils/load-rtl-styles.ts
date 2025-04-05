
import debounce from 'lodash/debounce';

// Track loaded stylesheets to avoid duplicate loading
const loadedStylesheets = new Set<string>();

/**
 * Helper function to load RTL specific stylesheets when RTL mode is active
 * @param isRTL Boolean indicating if the current mode is RTL
 */
export const loadRTLStyles = (isRTL: boolean) => {
  // Only apply document direction attribute change - this is most critical
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = isRTL ? 'ar' : 'en';
  
  // Add/remove RTL class to body
  if (isRTL) {
    document.body.classList.add('rtl-mode');
  } else {
    document.body.classList.remove('rtl-mode');
  }
  
  // Debounced function to load stylesheets after a short delay
  const debouncedStyleLoad = debounce(() => {
    const stylesheets = [
      '/src/styles/rtl.css',
      '/src/styles/rtl-charts.css',
      '/src/styles/rtl-forms.css'
    ];
    
    // Add or remove RTL stylesheet links
    stylesheets.forEach(stylesheet => {
      const id = `rtl-${stylesheet.split('/').pop()?.replace('.', '-')}`;
      const existingLink = document.getElementById(id);
      
      if (isRTL && !existingLink && !loadedStylesheets.has(id)) {
        // Add stylesheet if in RTL mode and not already loaded
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = stylesheet;
        document.head.appendChild(link);
        loadedStylesheets.add(id);
      } else if (!isRTL && existingLink) {
        // Remove stylesheet if not in RTL mode
        existingLink.remove();
        loadedStylesheets.delete(id);
      }
    });
  }, 50);
  
  debouncedStyleLoad();
};

/**
 * Apply this function in the TranslationContext to ensure RTL styles are loaded
 * when language changes
 */
export const setupRTLStylesObserver = () => {
  // Create MutationObserver to watch for changes to the dir attribute
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'dir') {
        const htmlElement = document.documentElement;
        const isRTL = htmlElement.dir === 'rtl';
        
        // Apply RTL-specific styles when direction changes
        loadRTLStyles(isRTL);
      }
    });
  });
  
  // Start observing the html element for dir attribute changes
  observer.observe(document.documentElement, { attributes: true });
  
  // Initial load of styles
  loadRTLStyles(document.documentElement.dir === 'rtl');
  
  return observer;
};
