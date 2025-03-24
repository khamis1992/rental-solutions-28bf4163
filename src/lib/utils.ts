
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatCurrency as formatReportCurrency } from '@/utils/reportFormatters';
import { LANGUAGES } from '@/utils/reportConstants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // Use our centralized formatting utility with English as default
  return formatReportCurrency(amount, LANGUAGES.ENGLISH);
}
