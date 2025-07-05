// Amiri Regular Font Loader
(async function() {
  if (typeof window !== 'undefined') {
    try {
      // محاولة تحميل ملف TTF
      const response = await fetch('/Amiri-Regular.ttf');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        window.AmiriRegular = btoa(binary);
        console.log('Amiri Regular font loaded successfully');
      } else {
        console.warn('Amiri Regular TTF file not found, using fallback');
        window.AmiriRegular = null;
      }
    } catch (error) {
      console.warn('Failed to load Amiri Regular font:', error);
      window.AmiriRegular = null;
    }
  }
})(); 