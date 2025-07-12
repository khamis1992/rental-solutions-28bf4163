import React, { createContext, useContext, useState } from 'react';

interface DocumentationModeContextType {
  isDocumentationMode: boolean;
  toggleDocumentationMode: () => void;
}

// Create context with null initial value for proper checking
const DocumentationModeContext = createContext<DocumentationModeContextType | null>(null);

export const useDocumentationMode = (): DocumentationModeContextType => {
  const context = useContext(DocumentationModeContext);
  
  if (context === null) {
    // Return safe fallback instead of throwing error
    console.warn('useDocumentationMode called outside DocumentationModeProvider, using fallback');
    return {
      isDocumentationMode: false,
      toggleDocumentationMode: () => {
        console.warn('toggleDocumentationMode called outside provider');
      }
    };
  }
  
  return context;
};

export const DocumentationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDocumentationMode, setIsDocumentationMode] = useState(false);

  const toggleDocumentationMode = () => {
    setIsDocumentationMode(prev => !prev);
  };

  const contextValue: DocumentationModeContextType = {
    isDocumentationMode,
    toggleDocumentationMode,
  };

  return (
    <DocumentationModeContext.Provider value={contextValue}>
      {children}
    </DocumentationModeContext.Provider>
  );
};
