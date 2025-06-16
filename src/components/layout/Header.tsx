import React, { useState } from 'react';
import { Menu, X, Search, Bell, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header = ({ onToggleSidebar, isSidebarOpen = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const isRTL = language === 'ar';

  return (
    <header className="w-full h-16 px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="h-full flex items-center justify-between">
        {/* Mobile menu button - RTL aware */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden flex-shrink-0" 
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}

        {/* Search bar - responsive */}
        <div className={cn(
          "flex-1 max-w-md mx-4",
          isMobile && !showMobileSearch && "hidden"
        )}>
          <div className="relative">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
              isRTL ? "right-3" : "left-3"
            )} />
            <Input
              type="search"
              placeholder={isRTL ? "بحث..." : "Search..."}
              className={cn(
                "w-full bg-muted/50",
                isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          {isMobile && !showMobileSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Close mobile search */}
          {isMobile && showMobileSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <DropdownMenuLabel>
                {isRTL ? "الإشعارات" : "Notifications"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="text-sm">
                  <p className="font-medium">{isRTL ? "عقد جديد" : "New Agreement"}</p>
                  <p className="text-muted-foreground text-xs">
                    {isRTL ? "تم إنشاء عقد جديد #1234" : "New agreement #1234 created"}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="text-sm">
                  <p className="font-medium">{isRTL ? "صيانة مجدولة" : "Maintenance Scheduled"}</p>
                  <p className="text-muted-foreground text-xs">
                    {isRTL ? "مركبة ABC123 تحتاج صيانة" : "Vehicle ABC123 needs maintenance"}
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || user?.email?.[0].toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {profile?.full_name || user?.email || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isRTL ? "مدير النظام" : "System Admin"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/user-settings')}>
                <User className="mr-2 h-4 w-4" />
                {isRTL ? "الملف الشخصي" : "Profile"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                {isRTL ? "الإعدادات" : "Settings"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                {isRTL ? "تسجيل الخروج" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Branding - only on desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2 ml-4" dir="ltr">
              <div className="font-medium text-lg">Rental Solutions</div>
              <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xl">
                RS
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
