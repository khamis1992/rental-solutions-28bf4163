
import { Dialog } from "@/components/ui/dialog";
import { CustomButton } from "@/components/ui/custom-button";
import { CreditCard, Wallet } from 'lucide-react';

export const PaymentProcessor = ({
  amount,
  onSuccess,
  onCancel
}: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [loading, setLoading] = React.useState(false);

  const handlePayment = async (method: 'card' | 'wallet') => {
    setLoading(true);
    // Integration point for payment gateway
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
      <CustomButton
        onClick={() => handlePayment('card')}
        disabled={loading}
        className="p-6 flex-row-reverse"
      >
        <CreditCard className="h-6 w-6 ml-2" />
        دفع بالبطاقة
      </CustomButton>
      
      <CustomButton
        onClick={() => handlePayment('wallet')}
        disabled={loading}
        className="p-6 flex-row-reverse"
      >
        <Wallet className="h-6 w-6 ml-2" />
        المحفظة الرقمية
      </CustomButton>
    </div>
  );
};
