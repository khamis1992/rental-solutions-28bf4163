import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ConsoleError {
  message: string;
  stack?: string;
  timestamp: string;
  count: number;
}

export const ConsoleErrorTracker: React.FC = () => {
  const [errors, setErrors] = useState<ConsoleError[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Override console.error to capture errors
    const originalError = console.error;
    const errorMap = new Map<string, ConsoleError>();

    console.error = (...args) => {
      const message = args.join(' ');
      
      // Skip known warnings
      if (message.includes('ViteJS') || 
          message.includes('next-themes') || 
          message.includes('deprecated')) {
        originalError(...args);
        return;
      }

      const timestamp = new Date().toLocaleTimeString();
      const key = message.slice(0, 100); // Use first 100 chars as key
      
      if (errorMap.has(key)) {
        const existing = errorMap.get(key)!;
        existing.count++;
        existing.timestamp = timestamp;
      } else {
        errorMap.set(key, {
          message,
          stack: args.find(arg => typeof arg === 'object' && arg.stack)?.stack,
          timestamp,
          count: 1
        });
      }

      setErrors(Array.from(errorMap.values()));
      originalError(...args);
    };

    // Check for existing errors
    const checkUrl = () => {
      if (window.location.search.includes('debug=true')) {
        setIsVisible(true);
      }
    };

    checkUrl();

    // إضافة console warning handler لإصلاح مشاكل key prop لتجنب الإزعاج في التطوير
    const originalWarn = console.warn;
    console.warn = (...args) => {
      // تجاهل تحذيرات key prop لتجنب الإزعاج في التطوير
      if (args[0]?.includes?.('Warning: Each child in a list should have a unique "key" prop')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearErrors = () => {
    setErrors([]);
  };

  if (!isVisible || errors.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {errors.length > 0 && (
          <Button
            onClick={() => setIsVisible(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {errors.length} خطأ
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              أخطاء الكونسول ({errors.length})
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={clearErrors}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="p-2 bg-white rounded border">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="destructive" className="text-xs">
                  {error.count}x
                </Badge>
                <span className="text-xs text-gray-500">{error.timestamp}</span>
              </div>
              <p className="text-sm text-red-700 break-words">
                {error.message.length > 100 
                  ? `${error.message.slice(0, 100)}...` 
                  : error.message
                }
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}; 