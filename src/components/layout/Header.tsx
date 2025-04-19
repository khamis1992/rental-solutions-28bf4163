
import React, { useEffect, useState } from 'react';
import { Bell, Settings, Search, User, Languages, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AIBadge } from "@/components/ui/ai-badge";
import { ArabicTextStatus } from "@/components/ui/arabic-text-status";
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Header = () => {
  const [deepSeekAvailable, setDeepSeekAvailable] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkDeepSeekService = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('process-arabic-text', {
          body: { text: 'test', context: 'status_check' }
        });
        
        if (error) {
          console.warn('DeepSeek AI service check failed:', error);
          setDeepSeekAvailable(false);
        } else {
          setDeepSeekAvailable(data?.success === true);
        }
      } catch (error) {
        console.error('Error checking DeepSeek AI service:', error);
        setDeepSeekAvailable(false);
      }
    };
    
    checkDeepSeekService();
    // Check service availability every 5 minutes
    const interval = setInterval(checkDeepSeekService, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return <header className="w-full h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
      <div className="flex items-center">
        <div className="hidden md:flex h-10 w-10 rounded-md bg-primary text-primary-foreground items-center justify-center font-semibold text-xl">
          RS
        </div>
        <div className="hidden md:block ml-4 font-medium text-lg">Rental Solutions</div>
      </div>
      
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary border-none rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      
      <div className="flex items-center space-x-2">
        <ArabicTextStatus />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center px-2 py-1 rounded-md bg-secondary">
              <span className="text-xs mr-1">DeepSeek AI</span>
              {deepSeekAvailable === null ? (
                <span className="h-4 w-4 rounded-full bg-gray-300 animate-pulse"></span>
              ) : deepSeekAvailable ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {deepSeekAvailable === null ? 'Checking DeepSeek AI service...' : 
             deepSeekAvailable ? 'DeepSeek AI service is available' : 
             'DeepSeek AI service is currently unavailable'}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>;
};

export default Header;
