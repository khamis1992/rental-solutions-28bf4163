
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Context Providers
import { ProfileProvider } from "./contexts/ProfileContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ErrorProvider } from "./contexts/ErrorContext";

// Error Boundary
import ErrorBoundary from "./components/error/ErrorBoundary";

import initializeApp from "./utils/app-initializer";
import errorService from "./services/error/ErrorService";

function App({ children }) {
  // Create a single QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,  // 10 minutes
      },
    },
  }));

  useEffect(() => {
    initializeApp();
  }, []);

  // Function to handle global errors
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("Global error caught:", error, errorInfo);
    // Add additional error reporting here
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          {(errorHandler) => {
            // Initialize the error service with the context handler
            errorService.initialize(errorHandler.addError);
            return (
              <ProfileProvider>
                <SettingsProvider>
                  <NotificationProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      {children}
                    </TooltipProvider>
                  </NotificationProvider>
                </SettingsProvider>
              </ProfileProvider>
            );
          }}
        </ErrorProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
