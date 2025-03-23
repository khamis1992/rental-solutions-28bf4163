
import React from 'react';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast-provider";

function App({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster /> {/* For shadcn/ui toast */}
      <ToastProvider /> {/* For sonner toast */}
    </ThemeProvider>
  )
}

export default App
