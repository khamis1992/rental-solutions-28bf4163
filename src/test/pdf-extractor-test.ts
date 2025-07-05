// Simple test for PDF extractor service
import { contractPDFExtractor } from '../services/contract-pdf-extractor';

// Test function to verify PDF extractor works
export async function testPDFExtractor() {
  console.log('🧪 Testing PDF Extractor Service...');
  
  try {
    // Create a mock PDF file for testing
    const mockPdfContent = new Blob(['%PDF-1.4 test content'], { type: 'application/pdf' });
    const mockFile = new File([mockPdfContent], 'test-contract.pdf', { type: 'application/pdf' });
    
    console.log('📄 Created mock PDF file:', mockFile.name);
    
    // Test the extractor
    const result = await contractPDFExtractor.extractFromPDF(mockFile);
    
    console.log('✅ Extraction successful!');
    console.log('👤 Customer data:', result.customer);
    console.log('🚗 Vehicle data:', result.vehicle);
    console.log('📋 Contract details:', {
      start_date: result.start_date,
      contract_number: result.contract_number,
      original_rent_amount: result.original_rent_amount
    });
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('🔬 PDF Extractor Test Available');
  console.log('Run testPDFExtractor() in console to test');
  (window as any).testPDFExtractor = testPDFExtractor;
} 