
// Amiri Bold Font Loader
(async function() {
  if (typeof window !== 'undefined') {
    try {
      // محاولة تحميل ملف TTF من المسار الصحيح
      const response = await fetch('/Amiri-Bold.ttf');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        window.AmiriBold = btoa(binary);
        console.log('Amiri Bold font loaded successfully');
      } else {
        console.warn('Amiri Bold TTF file not found, font loader will use regular font as fallback');
        window.AmiriBold = null;
      }
    } catch (error) {
      console.warn('Failed to load Amiri Bold font, using fallback:', error);
      window.AmiriBold = null;
    }
  }
})();
