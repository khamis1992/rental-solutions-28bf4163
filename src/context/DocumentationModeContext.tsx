import React, { createContext, useContext, useState } from 'react';

interface DocumentationModeContextType {
  enabled: boolean;
  toggle: () => void;
}

const DocumentationModeContext = createContext<DocumentationModeContextType>({
  enabled: false,
  toggle: () => {},
});

export const useDocumentationMode = () => useContext(DocumentationModeContext);

export const DocumentationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false);
  const toggle = () => setEnabled((v) => !v);

  return (
    <DocumentationModeContext.Provider value={{ enabled, toggle }}>
      {children}
    </DocumentationModeContext.Provider>
  );
}; 