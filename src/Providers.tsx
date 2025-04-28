import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
