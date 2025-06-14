import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LegalCaseFormValues } from './LegalCaseForm';
import { useAgreements } from '@/hooks/use-agreements';
import { calculateAgreementAmountOwed } from '@/hooks/legal/useLegalCases';
import type { SimpleAgreement } from '@/hooks/use-agreements';
import { supabase } from '@/lib/supabase';

interface CustomerProfile {
  id: string;
  full_name: string;
  email?: string;
}

interface LegalCaseBasicInfoProps {
  form: UseFormReturn<LegalCaseFormValues>;
}

export const LegalCaseBasicInfo: React.FC<LegalCaseBasicInfoProps> = ({ form }) => {
  const { agreements, isLoading: agreementsLoading } = useAgreements();
  const [amountOwed, setAmountOwed] = useState<number>(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerProfile[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const customerId = form.watch('customer_id');
  const agreementId = form.watch('agreement_id');
  const selectedAgreement = agreements?.find((a: SimpleAgreement) => a.id === agreementId);

  // Fetch customers on search
  useEffect(() => {
    if (!customerSearch) {
      setCustomerResults([]);
      return;
    }
    setCustomerLoading(true);
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .or(`full_name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%`)
      .limit(10)
      .then(({ data }) => {
        setCustomerResults(data || []);
        setCustomerLoading(false);
      });
  }, [customerSearch]);

  // Filter agreements by selected customer
  const filteredAgreements = customerId
    ? agreements?.filter((a: SimpleAgreement) => a.customer_id === customerId)
    : agreements;

  useEffect(() => {
    if (agreementId) {
      calculateAgreementAmountOwed(agreementId).then(setAmountOwed).catch(() => setAmountOwed(0));
      form.setValue('amount_owed', amountOwed);
    }
  }, [agreementId]);

  // Reset agreement if customer changes
  useEffect(() => {
    form.setValue('agreement_id', '');
  }, [customerId]);

  return (
    <>
      {/* Customer Search & Select */}
      <FormField
        control={form.control}
        name="customer_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <FormControl>
              <div>
                <Input
                  placeholder="Search customer by name or email..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="mb-2"
                />
                {customerLoading && <div className="text-xs text-muted-foreground">Searching...</div>}
                {customerSearch && customerResults.length > 0 && (
                  <div className="border rounded bg-white shadow max-h-40 overflow-y-auto z-10 relative">
                    {customerResults.map(c => (
                      <div
                        key={c.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${field.value === c.id ? 'bg-gray-100' : ''}`}
                        onClick={() => {
                          field.onChange(c.id);
                          setCustomerSearch(c.full_name);
                          setCustomerResults([]);
                        }}
                      >
                        <span className="font-medium">{c.full_name}</span>
                        {c.email && <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Agreement Select (filtered by customer) */}
      <FormField
        control={form.control}
        name="agreement_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Agreement</FormLabel>
            <FormControl>
              <select {...field} className="border rounded px-3 py-2 w-full">
                <option value="">Select agreement...</option>
                {filteredAgreements?.map((a: SimpleAgreement) => (
                  <option key={a.id} value={a.id}>
                    {a.agreement_number || a.id} — {a.customer_name}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
            {selectedAgreement && (
              <div className="text-xs text-muted-foreground mt-1">
                Customer: <span className="font-medium">{selectedAgreement.customer_name}</span>
              </div>
            )}
          </FormItem>
        )}
      />
      {/* Amount Owed (auto) */}
      <FormField
        control={form.control}
        name="amount_owed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount Owed</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amountOwed}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
