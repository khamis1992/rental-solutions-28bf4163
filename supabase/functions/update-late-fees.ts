import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (_req) => {
  // 1. Get all relevant payments (pending, overdue, paid, completed, partially_paid)
  const { data: payments, error } = await supabase
    .from('unified_payments')
    .select('id, payment_date, original_due_date, late_fine_amount, status')
    .in('status', ['pending', 'overdue', 'paid', 'completed', 'partially_paid']);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const today = new Date();
  let updated = 0;
  let failed = 0;

  for (const payment of payments || []) {
    // Use original_due_date if payment_date is missing
    const dueDateStr = payment.original_due_date || payment.payment_date;
    if (!dueDateStr) continue;
    const dueDate = new Date(dueDateStr);
    const firstOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

    // Determine the date to use for late fee calculation
    // If payment is paid/completed/partially_paid, use payment_date; otherwise, use today
    let endDate: Date;
    if (
      ['paid', 'completed', 'partially_paid'].includes(String(payment.status)) && payment.payment_date
    ) {
      endDate = new Date(payment.payment_date);
    } else {
      endDate = today;
    }

    // Calculate days late
    const daysLate = Math.max(0, Math.floor((endDate.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24)));
    const fee = Math.min(daysLate * 120, 3000);
    if (payment.late_fine_amount !== fee) {
      const { error: updateError } = await supabase
        .from('unified_payments')
        .update({ late_fine_amount: fee })
        .eq('id', payment.id);
      if (updateError) {
        failed++;
      } else {
        updated++;
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, updated, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}); 