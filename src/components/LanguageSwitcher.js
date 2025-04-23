import React from 'react';
import { setDocumentDirection } from '../utils/languageUtils';

const LanguageSwitcher = ({ onLanguageChange }) => {
  const changeLanguage = (lang) => {
    localStorage.setItem('language', lang);
    setDocumentDirection(lang);
    if (onLanguageChange) onLanguageChange(lang);
    // Force reload to apply changes throughout the app
    window.location.reload();
  };

  return (
    <div className="language-switcher">
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('ar')}>العربية</button>
    </div>
  );
};

export default LanguageSwitcher;
