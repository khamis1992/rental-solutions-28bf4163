
import React, { createContext, useContext, useState } from 'react';

interface DocumentationModeContextType {
  isDocumentationMode: boolean;
  toggleDocumentationMode: () => void;
}

const DocumentationModeContext = createContext<DocumentationModeContextType>({
  isDocumentationMode: false,
  toggleDocumentationMode: () => {},
});

export const useDocumentationMode = () => {
  const context = useContext(DocumentationModeContext);
  if (!context) {
    throw new Error('useDocumentationMode must be used within a DocumentationModeProvider');
  }
  return context;
};

export const DocumentationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDocumentationMode, setIsDocumentationMode] = useState(false);

  const toggleDocumentationMode = () => {
    setIsDocumentationMode(prev => !prev);
  };

  return (
    <DocumentationModeContext.Provider value={{ isDocumentationMode, toggleDocumentationMode }}>
      {children}
    </DocumentationModeContext.Provider>
  );
};
