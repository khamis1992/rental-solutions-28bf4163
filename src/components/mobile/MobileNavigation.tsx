import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Car, 
  CreditCard, 
  Users, 
  Settings,
  Bell,
  Plus,
  Search,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface NavItem {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  isNew?: boolean;
}

interface MobileNavigationProps {
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelAr: 'الرئيسية',
      icon: <Home className="mobile-nav-icon" />,
      path: '/dashboard',
    },
    {
      id: 'agreements',
      label: 'Agreements',
      labelAr: 'الاتفاقيات',
      icon: <FileText className="mobile-nav-icon" />,
      path: '/agreements',
      badge: 2,
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      labelAr: 'المركبات',
      icon: <Car className="mobile-nav-icon" />,
      path: '/vehicles',
    },
    {
      id: 'payments',
      label: 'Payments',
      labelAr: 'المدفوعات',
      icon: <CreditCard className="mobile-nav-icon" />,
      path: '/payments',
      isNew: true,
    },
    {
      id: 'more',
      label: 'More',
      labelAr: 'المزيد',
      icon: <Menu className="mobile-nav-icon" />,
      path: '/more',
    },
  ];

  const quickActions = [
    {
      id: 'new-agreement',
      label: 'New Agreement',
      labelAr: 'اتفاقية جديدة',
      icon: <FileText className="w-5 h-5" />,
      path: '/agreements/add',
      color: 'bg-blue-500',
    },
    {
      id: 'add-customer',
      label: 'Add Customer',
      labelAr: 'عميل جديد',
      icon: <Users className="w-5 h-5" />,
      path: '/customers/add',
      color: 'bg-green-500',
    },
    {
      id: 'add-vehicle',
      label: 'Add Vehicle',
      labelAr: 'مركبة جديدة',
      icon: <Car className="w-5 h-5" />,
      path: '/vehicles/add',
      color: 'bg-purple-500',
    },
    {
      id: 'quick-payment',
      label: 'Quick Payment',
      labelAr: 'دفع سريع',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/payments/quick',
      color: 'bg-orange-500',
    },
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const currentTab = navItems.find(item => 
      currentPath.startsWith(item.path) || 
      (item.path === '/dashboard' && currentPath === '/')
    );
    
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [location.pathname]);

  const handleNavigation = (item: NavItem) => {
    setActiveTab(item.id);
    navigate(item.path);
    
    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setShowQuickActions(false);
    navigate(action.path);
    
    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  };

  return (
    <>
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
            onClick={() => setShowQuickActions(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {isArabic ? 'الإجراءات السريعة' : 'Quick Actions'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'اختر إجراء سريع' : 'Choose a quick action'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="ghost"
                        className="h-auto p-4 flex flex-col items-center gap-2 touch-friendly"
                        onClick={() => handleQuickAction(action)}
                      >
                        <div className={`p-3 rounded-full ${action.color} text-white`}>
                          {action.icon}
                        </div>
                        <span className="text-xs font-medium">
                          {isArabic ? action.labelAr : action.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full mt-4 touch-friendly"
                    onClick={() => setShowQuickActions(false)}
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className={`pwa-bottom-nav mobile-nav ${className}`}>
        <div className="flex justify-around items-center relative">
          {navItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Add Quick Actions Button in the Middle */}
              {index === 2 && (
                <Button
                  className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg touch-friendly"
                  onClick={() => setShowQuickActions(true)}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              )}
              
              <button
                className={`mobile-nav-item touch-friendly ${
                  activeTab === item.id ? 'active' : ''
                } ${index === 2 ? 'mr-16' : ''} ${index === 3 ? 'ml-16' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <div className="relative">
                  {item.icon}
                  
                  {/* Badge */}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  
                  {/* New indicator */}
                  {item.isNew && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                
                <span className="mobile-nav-label">
                  {isArabic ? item.labelAr : item.label}
                </span>
                
                {/* Active indicator */}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        {/* Safe area for iPhone X and newer */}
        <div className="pb-safe-area-inset-bottom"></div>
      </div>

      {/* Notification Indicator */}
      {notifications > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 z-40"
        >
          <Button
            size="sm"
            variant="outline"
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg touch-friendly"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-4 h-4 mr-2" />
            <Badge variant="destructive" className="text-xs">
              {notifications}
            </Badge>
          </Button>
        </motion.div>
      )}
    </>
  );
};

// PWA-specific styles for mobile navigation
const mobileNavStyles = `
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--background);
    border-top: 1px solid var(--border);
    z-index: 1000;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 8px 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
  
  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    color: var(--muted-foreground);
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 8px;
    position: relative;
    min-width: 60px;
  }
  
  .mobile-nav-item:hover {
    color: var(--primary);
    background: var(--primary/5);
  }
  
  .mobile-nav-item.active {
    color: var(--primary);
    background: var(--primary/10);
  }
  
  .mobile-nav-icon {
    width: 24px;
    height: 24px;
  }
  
  .mobile-nav-label {
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
  }
  
  .pb-safe-area-inset-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  /* RTL support */
  [dir="rtl"] .mobile-nav {
    flex-direction: row-reverse;
  }
  
  /* Landscape optimizations */
  @media (orientation: landscape) and (max-height: 600px) {
    .mobile-nav {
      padding: 4px 0;
      padding-bottom: max(4px, env(safe-area-inset-bottom));
    }
    
    .mobile-nav-item {
      padding: 6px 8px;
      gap: 2px;
    }
    
    .mobile-nav-icon {
      width: 20px;
      height: 20px;
    }
    
    .mobile-nav-label {
      font-size: 9px;
    }
  }
`;

// Inject styles
if (typeof window !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = mobileNavStyles;
  document.head.appendChild(styleElement);
}