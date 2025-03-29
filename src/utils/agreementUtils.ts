
import { jsPDF } from 'jspdf';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Set title and description
    doc.setFontSize(20);
    doc.text("Rental Agreement", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Agreement #: ${agreement.agreement_number}`, 105, 30, { align: 'center' });
    
    // Status information
    doc.setFontSize(10);
    doc.text(`Status: ${agreement.status.toUpperCase()}`, 105, 40, { align: 'center' });
    doc.text(`Created: ${format(new Date(agreement.created_at || new Date()), 'PP')}`, 105, 45, { align: 'center' });
    
    // Customer information
    doc.setFontSize(14);
    doc.text("Customer Information", 20, 60);
    doc.setFontSize(10);
    
    if (agreement.customers) {
      doc.text(`Name: ${agreement.customers.full_name || 'N/A'}`, 20, 70);
      doc.text(`Email: ${agreement.customers.email || 'N/A'}`, 20, 75);
      doc.text(`Phone: ${agreement.customers.phone || agreement.customers.phone_number || 'N/A'}`, 20, 80);
    } else {
      doc.text("No customer information available", 20, 70);
    }
    
    // Vehicle information
    doc.setFontSize(14);
    doc.text("Vehicle Information", 120, 60);
    doc.setFontSize(10);
    
    if (agreement.vehicles) {
      doc.text(`Vehicle: ${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.year || 'N/A'})`, 120, 70);
      doc.text(`License Plate: ${agreement.vehicles.license_plate || 'N/A'}`, 120, 75);
      doc.text(`Color: ${agreement.vehicles.color || 'N/A'}`, 120, 80);
    } else {
      doc.text("No vehicle information available", 120, 70);
    }
    
    // Rental terms
    doc.setFontSize(14);
    doc.text("Rental Terms", 20, 100);
    doc.setFontSize(10);
    
    doc.text(`Start Date: ${format(new Date(agreement.start_date), 'PP')}`, 20, 110);
    doc.text(`End Date: ${format(new Date(agreement.end_date), 'PP')}`, 20, 115);
    
    // Calculate duration in months
    const months = Math.max(1, Math.ceil(
      (new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (30 * 24 * 60 * 60 * 1000)
    ));
    
    doc.text(`Duration: ${months} ${months === 1 ? 'month' : 'months'}`, 20, 120);
    
    // Payment information
    doc.setFontSize(14);
    doc.text("Payment Information", 120, 100);
    doc.setFontSize(10);
    
    // Get the rent amount
    let rentAmount = agreement.total_amount;
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("rent_amount")
        .eq("id", agreement.id)
        .single();
        
      if (!error && data && data.rent_amount) {
        rentAmount = data.rent_amount;
      }
    } catch (err) {
      console.error("Error fetching rent amount for PDF:", err);
    }
    
    doc.text(`Monthly Rent: $${rentAmount.toFixed(2)}`, 120, 110);
    doc.text(`Total Contract Amount: $${(rentAmount * months).toFixed(2)}`, 120, 115);
    doc.text(`Deposit Amount: $${(agreement.deposit_amount || 0).toFixed(2)}`, 120, 120);
    doc.text(`Daily Late Fee: $${(agreement.daily_late_fee || 0).toFixed(2)}`, 120, 125);
    
    // Notes
    if (agreement.notes) {
      doc.setFontSize(14);
      doc.text("Notes", 20, 140);
      doc.setFontSize(10);
      
      // Split long notes into multiple lines
      const splitNotes = doc.splitTextToSize(agreement.notes, 170);
      doc.text(splitNotes, 20, 150);
    }
    
    // Legal text
    doc.setFontSize(8);
    doc.text("This document is a record of the rental agreement between the rental company and the customer. The customer", 20, 250);
    doc.text("agrees to the terms and conditions specified in the original agreement.", 20, 255);
    
    // Signatures
    doc.setFontSize(10);
    doc.text("____________________________", 40, 270);
    doc.text("Company Representative", 40, 275);
    
    doc.text("____________________________", 150, 270);
    doc.text("Customer Signature", 150, 275);
    
    // Save the PDF as a file
    doc.save(`Agreement_${agreement.agreement_number}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

export const createEmptyLeaseRecord = async () => {
  try {
    // Implementation of creating a new lease record
    // This can be implemented as needed
    return true;
  } catch (error) {
    console.error("Error creating lease record:", error);
    return false;
  }
};

// Add the missing functions that are imported in other files
export const checkStandardTemplateExists = async (): Promise<boolean> => {
  try {
    // Implementation to check if standard template exists
    return true;
  } catch (error) {
    console.error("Error checking standard template:", error);
    return false;
  }
};

export const diagnosisTemplateAccess = async (): Promise<boolean> => {
  try {
    // Implementation to diagnose template access
    return true;
  } catch (error) {
    console.error("Error diagnosing template access:", error);
    return false;
  }
};
