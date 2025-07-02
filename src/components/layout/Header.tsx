
// @ts-nocheck
/* eslint-disable */
import { Bell, Settings, User, Menu } from 'lucide-react';

import { InstallButton } from '@/components/pwa/InstallButton';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showMenuButton = false
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <h1 className="text-xl font-bold text-gray-900">
            نظام العراف للتأجير
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <InstallButton 
            variant="outline" 
            size="sm"
            className="hidden sm:flex"
          />
          
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
