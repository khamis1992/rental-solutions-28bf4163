
import { RedesignedAgreementDetail } from './redesigned';

// You can add logic here to switch between classic and redesigned if needed
export function AgreementDetailWrapper(props: any) {
  return <RedesignedAgreementDetail {...props} />;
}
