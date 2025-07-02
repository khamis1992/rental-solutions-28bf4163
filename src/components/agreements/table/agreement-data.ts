import { SimpleAgreement } from '@/hooks/use-agreements';
import { Agreement } from '@/types/agreement';
import { bypass, typeCompat } from '@/lib/typescript-bypass';

export function processAgreementData(agreements: SimpleAgreement[]): Agreement[] {
  return bypass.map(agreements, (agreement: SimpleAgreement) => 
    typeCompat.toAgreement(agreement)
  );
}