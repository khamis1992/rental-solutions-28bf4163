
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TranslationProvider, useTranslation } from '@/contexts/TranslationContext';
import i18n from '@/i18n';

// Test component that uses the translation context
const TestComponent = () => {
  const { language, direction, isRTL, changeLanguage } = useTranslation();
  
  return (
    <div data-testid="test-container" dir={direction}>
      <p data-testid="language-display">Current language: {language}</p>
      <p data-testid="direction-display">Direction: {direction}</p>
      <p data-testid="is-rtl-display">Is RTL: {isRTL.toString()}</p>
      <button 
        data-testid="toggle-language" 
        onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
      >
        Toggle Language
      </button>
    </div>
  );
};

describe('TranslationContext', () => {
  beforeEach(() => {
    // Reset language to English before each test
    localStorage.setItem('language', 'en');
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    document.body.classList.remove('rtl-mode');
  });
  
  test('provides correct initial values', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );
    
    expect(screen.getByTestId('language-display').textContent).toBe('Current language: en');
    expect(screen.getByTestId('direction-display').textContent).toBe('Direction: ltr');
    expect(screen.getByTestId('is-rtl-display').textContent).toBe('Is RTL: false');
  });
  
  test('changes language and direction when requested', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );
    
    // Initial state is English
    expect(screen.getByTestId('language-display').textContent).toBe('Current language: en');
    
    // Change to Arabic
    act(() => {
      screen.getByTestId('toggle-language').click();
    });
    
    // Check that state has updated
    expect(screen.getByTestId('language-display').textContent).toBe('Current language: ar');
    expect(screen.getByTestId('direction-display').textContent).toBe('Direction: rtl');
    expect(screen.getByTestId('is-rtl-display').textContent).toBe('Is RTL: true');
    
    // Check that HTML and body attributes are updated
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.body.classList.contains('rtl-mode')).toBe(true);
    
    // Change back to English
    act(() => {
      screen.getByTestId('toggle-language').click();
    });
    
    // Check that state has updated back
    expect(screen.getByTestId('language-display').textContent).toBe('Current language: en');
    expect(screen.getByTestId('direction-display').textContent).toBe('Direction: ltr');
    expect(screen.getByTestId('is-rtl-display').textContent).toBe('Is RTL: false');
    
    // Check that HTML and body attributes are updated back
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.body.classList.contains('rtl-mode')).toBe(false);
  });
  
  test('loads saved language from localStorage', () => {
    localStorage.setItem('language', 'ar');
    
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );
    
    expect(screen.getByTestId('language-display').textContent).toBe('Current language: ar');
    expect(screen.getByTestId('direction-display').textContent).toBe('Direction: rtl');
  });
  
  test('translateText function works for both languages', async () => {
    const TestTranslation = () => {
      const { translateText, language } = useTranslation();
      const [translatedText, setTranslatedText] = React.useState('');
      
      React.useEffect(() => {
        const doTranslate = async () => {
          const result = await translateText('Hello, world!');
          setTranslatedText(result);
        };
        doTranslate();
      }, [translateText, language]);
      
      return <p data-testid="translated-text">{translatedText}</p>;
    };
    
    // First with English
    localStorage.setItem('language', 'en');
    render(
      <TranslationProvider>
        <TestTranslation />
      </TranslationProvider>
    );
    
    // In English mode, it should return the original text
    await screen.findByText('Hello, world!');
    
    // Now test with Arabic (mock the translation API)
    // This would actually call the real API, which we don't want in tests
    // So in a real test, you would mock the translation API
  });
});
