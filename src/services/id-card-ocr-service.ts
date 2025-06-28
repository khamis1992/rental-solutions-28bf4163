interface ExtractedIdData {
  fullName: string;
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  qrCodeData?: string;
  confidence: number;
}

interface OCRResult {
  success: boolean;
  data?: ExtractedIdData;
  error?: string;
  processingTime: number;
}

export class IdCardOCRService {
  async processIdCard(imageData: string | File): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      await this.simulateProcessing();
      
      const mockData: ExtractedIdData = {
        fullName: 'خميس هاشم محمد الجبر',
        idNumber: '29876543210',
        nationality: 'قطري',
        dateOfBirth: '1985-03-15',
        expiryDate: '2030-03-15',
        phoneNumber: '+974 5555 4321',
        address: 'أم صلال، منطقة 71، مبنى 79',
        gender: 'ذكر',
        confidence: 94,
        qrCodeData: 'QID:29876543210:KhasimHashem:QAT:1985-03-15'
      };

      return {
        success: true,
        data: mockData,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
        processingTime: Date.now() - startTime
      };
    }
  }

  private async simulateProcessing(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

export const idCardOCRService = new IdCardOCRService();
export type { ExtractedIdData, OCRResult }; 