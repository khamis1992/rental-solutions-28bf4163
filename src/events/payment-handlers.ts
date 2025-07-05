import { eventBus } from '@/lib/event-bus';
import { supabase } from '@/lib/supabase';
import { Events, PaymentRecordedPayload } from './index';

export function registerPaymentEventHandlers() {
  eventBus.subscribe<PaymentRecordedPayload>(
    Events.PaymentRecorded,
    async (payload) => {
      await supabase
        .from('leases')
        .update({ last_payment_date: new Date().toISOString() })
        .eq('id', payload.agreementId);
    }
  );
}
