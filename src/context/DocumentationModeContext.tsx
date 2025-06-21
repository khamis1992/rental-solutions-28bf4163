import { createContext, useContext, useState, ReactNode } from 'react';

interface DocumentationModeContextType {
  enabled: boolean;
  toggle: () => void;
}

const DocumentationModeContext = createContext<DocumentationModeContextType | undefined>(undefined);

export const useDocumentationMode = (): DocumentationModeContextType => {
  const context = useContext(DocumentationModeContext);
  if (context === undefined) {
    throw new Error('useDocumentationMode must be used within a DocumentationModeProvider');
  }
  return context;
};

interface DocumentationModeProviderProps {
  children: ReactNode;
}

export const DocumentationModeProvider = ({ children }: DocumentationModeProviderProps) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  
  const toggle = () => {
    setEnabled(prev => !prev);
  };

  const value: DocumentationModeContextType = {
    enabled,
    toggle,
  };

  return (
    <DocumentationModeContext.Provider value={value}>
      {children}
    </DocumentationModeContext.Provider>
  );
}; 