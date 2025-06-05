import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../../lib/cors.ts';
import { getSupabaseClient } from '../../lib/supabaseClient.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, paymentAmount } = await req.json();
    if (!paymentId || typeof paymentAmount !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid paymentId or paymentAmount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    // Fetch the scheduled payment
    const { data: payment, error } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const newAmountPaid = (payment.amount_paid || 0) + paymentAmount;
    const totalDue = (payment.amount || 0) + (payment.late_fine_amount || 0);
    const newBalance = totalDue - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : 'pending';

    const { error: updateError } = await supabase
      .from('unified_payments')
      .update({
        amount_paid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      })
      .eq('id', paymentId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update payment', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Optionally, fetch and return the updated payment
    const { data: updatedPayment } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    return new Response(
      JSON.stringify({ success: true, payment: updatedPayment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: err?.message || err }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 