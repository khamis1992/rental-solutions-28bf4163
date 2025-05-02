
import { supabase } from '@/lib/supabase';
import { ServiceResponse } from '../response-handler';
import { forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { withTimeout, withTimeoutAndRetry } from '../promise-utils';
import { fetchAndProcessRecord } from '@/hooks/use-supabase-query';
import { processBatches } from '../concurrency-utils';

/**
 * Generate payment schedule for an agreement
 * @param agreement The agreement data
 * @returns Result of the payment schedule generation
 */
export async function generatePaymentSchedule(agreement: any): Promise<ServiceResponse<any>> {
  return withTimeout(
    (async () => {
      // Implementation logic goes here
      const result = { /* calculation result */ };
      return result;
    })(),
    15000, // 15 second timeout
    'Payment schedule generation'
  );
}

/**
 * Generate payment for an agreement by ID
 * This is an optimized version that uses chainDatabaseOperations to combine
 * the fetching of agreement data and payment generation into one operation
 * 
 * @param agreementId The agreement ID to generate payment for
 * @returns Result of the payment generation operation
 */
export async function generatePaymentForAgreement(agreementId: string): Promise<ServiceResponse<any>> {
  return fetchAndProcessRecord(
    'leases',
    agreementId,
    (agreement) => forceGeneratePaymentForAgreement(supabase, agreement.id, undefined),
    {
      operationName: "Payment generation",
      timeoutMs: 30000,
      retries: 2
    }
  );
}

/**
 * Batch generate payments for multiple agreements
 * @param agreementIds Array of agreement IDs to generate payments for
 * @returns Results of payment generation operations
 */
export async function batchGeneratePayments(
  agreementIds: string[]
): Promise<{
  results: Array<{ id: string; success: boolean; message?: string }>;
  summary: { total: number; succeeded: number; failed: number };
}> {
  console.log(`Starting batch payment generation for ${agreementIds.length} agreements`);
  
  // Process agreements in batches with controlled concurrency
  const results = await processBatches(
    agreementIds,
    10, // Process 10 agreements per batch
    3,  // Maximum 3 concurrent operations
    async (id) => {
      try {
        console.log(`Generating payment for agreement ${id}`);
        const result = await generatePaymentForAgreement(id);
        
        if (!result.success) {
          console.error(`Failed to generate payment for agreement ${id}: ${result.message}`);
        }
        
        return {
          id,
          success: result.success,
          message: result.message
        };
      } catch (error) {
        console.error(`Error generating payment for agreement ${id}:`, error);
        return {
          id,
          success: false,
          message: error instanceof Error ? error.message : String(error)
        };
      }
    },
    (batchResults, batchIndex) => {
      // Log progress after each batch
      const successCount = batchResults.filter(r => r.success).length;
      console.log(`Completed batch ${batchIndex + 1}: ${successCount}/${batchResults.length} succeeded`);
    }
  );

  // Calculate summary statistics
  const summary = results.reduce(
    (acc, curr) => {
      acc.total += 1;
      acc.succeeded += curr.success ? 1 : 0;
      acc.failed += curr.success ? 0 : 1;
      return acc;
    },
    { total: 0, succeeded: 0, failed: 0 }
  );

  console.log(`Batch payment generation completed: ${summary.succeeded}/${summary.total} succeeded`);
  return { results, summary };
}
