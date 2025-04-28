import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { asLeaseStatus, asPaymentStatus } from '@/types/database-common';

export const AgreementStats = () => {
  const [activeAgreements, setActiveAgreements] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [completedAgreements, setCompletedAgreements] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      // Get total active agreements
      const { count: activeCount } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('status', asLeaseStatus('active'));

      // Get pending payments count
      const { count: pendingPayments } = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', asPaymentStatus('pending'));

      // Get completed agreements this month
      const { count: completedCount } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('status', asLeaseStatus('completed'));

      // Get total revenue
      const { data: revenueData } = await supabase
        .from('unified_payments')
        .select('rent_amount')
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.rent_amount || 0), 0) || 0;

      setActiveAgreements(activeCount || 0);
      setPendingPayments(pendingPayments || 0);
      setCompletedAgreements(completedCount || 0);
      setTotalRevenue(totalRevenue);
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white shadow-md rounded-md p-4">
        <h3 className="text-lg font-semibold">Active Agreements</h3>
        <p className="text-2xl">{activeAgreements}</p>
      </div>
      <div className="bg-white shadow-md rounded-md p-4">
        <h3 className="text-lg font-semibold">Pending Payments</h3>
        <p className="text-2xl">{pendingPayments}</p>
      </div>
      <div className="bg-white shadow-md rounded-md p-4">
        <h3 className="text-lg font-semibold">Completed Agreements (This Month)</h3>
        <p className="text-2xl">{completedAgreements}</p>
      </div>
      <div className="bg-white shadow-md rounded-md p-4">
        <h3 className="text-lg font-semibold">Total Revenue</h3>
        <p className="text-2xl">${totalRevenue}</p>
      </div>
    </div>
  );
};
