
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // Format with 2 decimal places
  const formatted = new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amount);
  
  // If the amount ends with .00, remove the decimal part
  return formatted.endsWith('.00') ? formatted.substring(0, formatted.length - 3) : formatted;
}
