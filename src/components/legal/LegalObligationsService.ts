// Import the typeGuards correctly
import { typeGuards } from '@/lib/database';

export class LegalObligationsService {
  // Existing code...
  
  static validateData(data: any): boolean {
    // Use the correctly imported isString function
    if (!data || !typeGuards.isString(data.customerName)) {
      return false;
    }
    // Rest of validation
    return true;
  }
  
  // Other methods...
}
