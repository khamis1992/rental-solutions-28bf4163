
import React, { useEffect, useState } from 'react';
import { Languages, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { ArabicTextService } from '@/utils/arabic-text-service';

interface ArabicTextStatusProps {
  className?: string;
}

export function ArabicTextStatus({ className }: ArabicTextStatusProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Arabic text support ready');

  useEffect(() => {
    // Test the Arabic text processing service
    const testProcessing = async () => {
      try {
        setStatus('loading');
        setMessage('Testing Arabic text processing...');
        
        // Simple Arabic text to test (means "Hello World")
        const testText = "مرحبا بالعالم";
        const processedText = await ArabicTextService.processText(testText, 'System Test');
        
        // Very basic validation - just check if we got some text back
        if (processedText && processedText.length > 0) {
          setStatus('success');
          setMessage('Arabic text processing available');
        } else {
          setStatus('error');
          setMessage('Arabic text processing unavailable');
        }
      } catch (error) {
        console.error('Error testing Arabic text processing:', error);
        setStatus('error');
        setMessage('Arabic text processing error');
      }
    };
    
    testProcessing();
  }, []);

  return (
    <div className={`flex items-center rounded-md px-2 py-1 text-xs gap-1 ${
      status === 'success' ? 'bg-green-50 text-green-600' : 
      status === 'error' ? 'bg-red-50 text-red-600' : 
      'bg-amber-50 text-amber-600'
    } ${className}`}>
      {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'success' && <Check className="h-3 w-3" />}
      {status === 'error' && <AlertTriangle className="h-3 w-3" />}
      <Languages className="h-3 w-3" />
      <span>{message}</span>
    </div>
  );
}
