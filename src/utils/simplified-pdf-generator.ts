
import pdfMake from 'pdfmake/build/pdfmake';
import { initializeFonts } from './font-loader';
import { supabase } from '@/lib/supabase';

// Simple, robust document structure without complex RTL text
export async function generateSimplifiedAgreementPdf({ agreement, customer, vehicle, payment }: {
  agreement: any,
  customer: any,
  vehicle: any,
  payment: any
}) {
  // Ensure fonts are loaded with error handling
  try {
    await initializeFonts();
  } catch (error) {
    console.warn('Font initialization failed, continuing with defaults:', error);
  }

  // Helper function to safely format values
  const safeValue = (value: any, fallback: string = 'Not specified'): string => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    return String(value);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number | null | undefined): string => {
    if (!amount || isNaN(amount)) return 'QAR 0';
    return `QAR ${amount.toLocaleString()}`;
  };

  // Helper function to format dates
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'Not specified';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return dateObj.toLocaleDateString('en-GB');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Simple, clean document definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [50, 60, 50, 60],
    
    header: {
      text: 'AL ARAF CAR RENTAL COMPANY L.L.C',
      style: 'header',
      margin: [50, 30, 50, 0]
    },
    
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        style: 'footer',
        margin: [50, 0, 50, 30]
      };
    },
    
    content: [
      // Title
      {
        text: 'VEHICLE RENTAL AGREEMENT',
        style: 'title',
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      
      // Agreement Number
      {
        text: `Agreement Number: ${safeValue(agreement.agreement_number)}`,
        style: 'subtitle',
        margin: [0, 0, 0, 20]
      },
      
      // Agreement Details
      {
        text: 'AGREEMENT DETAILS',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            ['Start Date:', formatDate(agreement.start_date)],
            ['End Date:', formatDate(agreement.end_date)],
            ['Monthly Rent:', formatCurrency(agreement.rent_amount)],
            ['Total Amount:', formatCurrency(agreement.total_amount)],
            ['Deposit:', formatCurrency(agreement.deposit_amount)],
            ['Status:', safeValue(agreement.status)]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Customer Information
      {
        text: 'CUSTOMER INFORMATION',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            ['Full Name:', safeValue(customer.full_name || customer.name)],
            ['Email:', safeValue(customer.email)],
            ['Phone:', safeValue(customer.phone_number)],
            ['Driver License:', safeValue(customer.driver_license)],
            ['Nationality:', safeValue(customer.nationality)]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Vehicle Information
      {
        text: 'VEHICLE INFORMATION',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            ['Make & Model:', `${safeValue(vehicle.make)} ${safeValue(vehicle.model)}`],
            ['Year:', safeValue(vehicle.year)],
            ['License Plate:', safeValue(vehicle.license_plate)],
            ['VIN:', safeValue(vehicle.vin)],
            ['Color:', safeValue(vehicle.color)]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      
      // Terms and Conditions
      {
        text: 'TERMS AND CONDITIONS',
        style: 'sectionHeader',
        margin: [0, 30, 0, 10]
      },
      {
        text: [
          '1. The renter agrees to use the vehicle responsibly and in accordance with traffic laws.\n\n',
          '2. Payment must be made according to the agreed schedule.\n\n',
          '3. The vehicle must be returned in the same condition as received.\n\n',
          '4. Any damages or fines incurred during the rental period are the responsibility of the renter.\n\n',
          '5. This agreement is governed by the laws of Qatar.'
        ],
        style: 'terms',
        margin: [0, 0, 0, 30]
      },
      
      // Signatures
      {
        columns: [
          {
            width: '50%',
            text: [
              'LESSOR SIGNATURE:\n\n',
              '_________________________\n',
              'AL ARAF CAR RENTAL\n',
              `Date: ${formatDate(new Date())}`
            ],
            style: 'signature'
          },
          {
            width: '50%',
            text: [
              'LESSEE SIGNATURE:\n\n',
              '_________________________\n',
              `${safeValue(customer.full_name || customer.name)}\n`,
              `Date: ${formatDate(new Date())}`
            ],
            style: 'signature'
          }
        ],
        margin: [0, 30, 0, 0]
      }
    ],
    
    styles: {
      header: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        color: '#1e40af'
      },
      footer: {
        fontSize: 10,
        alignment: 'center',
        color: '#666666'
      },
      title: {
        fontSize: 18,
        bold: true,
        color: '#1e40af'
      },
      subtitle: {
        fontSize: 14,
        bold: true,
        color: '#334155'
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#1e40af',
        decoration: 'underline'
      },
      terms: {
        fontSize: 10,
        lineHeight: 1.3
      },
      signature: {
        fontSize: 10,
        alignment: 'center'
      }
    },
    
    defaultStyle: {
      fontSize: 10,
      font: 'Roboto'
    }
  };

  try {
    // Generate and download PDF
    const fileName = `agreement-${safeValue(agreement.agreement_number, 'unknown')}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);

    // Upload to Supabase storage
    return new Promise((resolve, reject) => {
      pdfMake.createPdf(docDefinition).getBlob(async (blob: Blob) => {
        try {
          const supabaseFileName = `agreement_${safeValue(agreement.agreement_number, Date.now().toString())}.pdf`;
          const { data, error } = await supabase.storage
            .from('agreements')
            .upload(supabaseFileName, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'application/pdf',
            });
          
          if (error) {
            console.error('Supabase upload error:', error);
            resolve(true); // Still resolve as true since download worked
          } else {
            resolve(data);
          }
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          resolve(true); // Still resolve as true since download worked
        }
      });
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF document');
  }
}
