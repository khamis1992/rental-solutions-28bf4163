export const Events = {
  PaymentRecorded: 'payment.recorded'
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export interface PaymentRecordedPayload {
  paymentId: string;
  agreementId: string;
  amount: number;
}
