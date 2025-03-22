
import { NextApiRequest, NextApiResponse } from 'next';
import { forceGeneratePaymentsForMissingMonths } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { agreementId, amount, startDate, endDate } = req.body;

    if (!agreementId || !amount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: agreementId, amount, startDate, endDate',
      });
    }

    // Parse dates from ISO strings
    const lastPaymentDate = new Date(startDate);
    const currentDate = new Date(endDate);

    const result = await forceGeneratePaymentsForMissingMonths(
      agreementId,
      amount,
      lastPaymentDate,
      currentDate
    );

    return res.status(200).json({
      success: true,
      message: `Generated ${result.generated} missing payments`,
      generated: result.generated,
    });
  } catch (error) {
    console.error('Error generating missing payments:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
