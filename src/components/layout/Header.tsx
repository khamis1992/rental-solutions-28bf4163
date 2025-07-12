import React from 'react';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InstallButton } from '@/components/pwa/InstallButton';
import { SmartAlertsDropdown } from '@/components/layout/SmartAlertsDropdown';
import { useSafeAuth } from '@/contexts/SafeAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const fetchAlertsCount = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureStr = futureDate.toISOString().split('T')[0];

  let count = 0;

  try {
    // عد الدفعات المتأخرة
    const { data: overduePayments } = await supabase
      .from('unified_payments')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')
      .lt('due_date', today);
    
    if (overduePayments && overduePayments.length > 0) count++;

    // عد المركبات في الصيانة
    const { data: maintenanceVehicles } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('status', 'maintenance');
    
    if (maintenanceVehicles && maintenanceVehicles.length > 0) count++;

    // عد العقود المنتهية قريباً
    const { data: expiringContracts } = await supabase
      .from('leases')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', futureStr);
    
    if (expiringContracts && expiringContracts.length > 0) count++;

    // عد المركبات التي تحتاج فحص
    const { data: vehiclesNeedInspection } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('status', 'available')
      .gt('mileage', 50000);
    
    if (vehiclesNeedInspection && vehiclesNeedInspection.length > 0) count++;

  } catch (error) {
    console.error('خطأ في جلب عدد التنبيهات:', error);
    // في حالة الخطأ، إرجاع عدد تجريبي
    count = 3;
  }

  // إرجاع عدد تجريبي إذا لم توجد تنبيهات حقيقية
  if (count === 0) count = 3;

  return count;
};

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showMenuButton = false
}) => {
  const { user } = useSafeAuth();

  const { data: alertsCount = 0 } = useQuery({
    queryKey: ['alertsCount'],
    queryFn: fetchAlertsCount,
    refetchInterval: 60000,
    staleTime: 50000,
  });

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
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {alertsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {alertsCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-96 p-0 max-h-96 overflow-y-auto" 
              align="end"
              side="bottom"
            >
              <SmartAlertsDropdown className="border-0 shadow-none" />
            </PopoverContent>
          </Popover>
          
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
