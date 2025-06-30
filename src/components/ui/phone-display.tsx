import React from 'react';
import { formatQatarPhone } from '@/utils/phone-display-utils';

interface PhoneDisplayProps {
  phone: string | undefined | null;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

/**
 * Component for displaying phone numbers with proper LTR styling
 * Ensures all phone numbers are displayed left-to-right regardless of RTL context
 */
export const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ 
  phone, 
  className = '', 
  showLabel = false, 
  label = 'الهاتف:' 
}) => {
  const formattedPhone = formatQatarPhone(phone);
  
  if (!phone || formattedPhone === 'غير محدد') {
    return <span className={className}>غير محدد</span>;
  }

  return (
    <span className={className}>
      {showLabel && <span>{label} </span>}
      <span className="phone-number-ltr" dir="ltr">
        {formattedPhone}
      </span>
    </span>
  );
};

export default PhoneDisplay; 