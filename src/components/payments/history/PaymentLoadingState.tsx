
import React from 'react';

export function PaymentLoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
    </div>
  );
}
