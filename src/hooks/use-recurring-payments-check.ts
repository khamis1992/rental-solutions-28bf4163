import { useEffect } from 'react';
import { checkAndGenerateMonthlyPayments } from '@/lib/supabase';

export function useRecurringPaymentsCheck() {
  useEffect(() => {
    checkAndGenerateMonthlyPayments().then((result) => {
      console.log("Monthly payment check completed:", result);
    });

    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('lastPaymentCheck');

    if (!lastCheck || lastCheck !== today) {
      localStorage.setItem('lastPaymentCheck', today);
      checkAndGenerateMonthlyPayments().then((result) => {
        console.log("Daily payment check completed:", result);
      });
    }
  }, []);
}
