
import React from 'react';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";

// Import the necessary components
// Since we don't have access to the routes/pages in the read-only files,
// this is a placeholder that should be replaced with actual routes

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ProfileProvider>
          <Routes>
            {/* Add your routes here */}
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Toaster /> {/* For shadcn/ui toast */}
          <ToastProvider /> {/* For sonner toast */}
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
