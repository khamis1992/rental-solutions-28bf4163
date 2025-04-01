
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';

// Define the schema for validating CSV row data
const agreementImportSchema = z.object({
  customer_id: z.string().uuid('Customer ID must be a valid UUID'),
  vehicle_id: z.string().uuid('Vehicle ID must be a valid UUID'),
  start_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'Start date must be a valid date (YYYY-MM-DD)' }
  ),
  end_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'End date must be a valid date (YYYY-MM-DD)' }
  ),
  rent_amount: z.string().refine(
    (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0,
    { message: 'Rent amount must be a valid number' }
  ),
  deposit_amount: z.string().optional().refine(
    (value) => value === undefined || value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0),
    { message: 'Deposit amount must be a valid number or empty' }
  ),
  agreement_type: z.string().optional(),
  notes: z.string().optional(),
});

type AgreementImportRow = z.infer<typeof agreementImportSchema>;
type ProcessingResult = {
  success: boolean;
  processed: number;
  errors: number;
  details: any[];
};

serve(async (req) => {
  try {
    // Get the request body
    const { importId } = await req.json();
    
    if (!importId) {
      return new Response(
        JSON.stringify({ success: false, error: "Import ID is required" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the import record
    const { data: importData, error: importError } = await supabase
      .from("agreement_imports")
      .select("*")
      .eq("id", importId)
      .single();
      
    if (importError) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to get import record: ${importError.message}` }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Update import status to processing
    await supabase
      .from("agreement_imports")
      .update({ status: "processing" })
      .eq("id", importId);
      
    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("agreement-imports")
      .download(importData.file_name);
      
    if (fileError) {
      await updateImportStatus(supabase, importId, "failed", {
        message: `Failed to download file: ${fileError.message}`
      });
      
      return new Response(
        JSON.stringify({ success: false, error: `Failed to download file: ${fileError.message}` }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Process the CSV file
    const result = await processCSV(supabase, fileData, importId);
    
    // Update import status based on processing result
    if (result.success) {
      await updateImportStatus(supabase, importId, "completed", {
        processed_count: result.processed,
        error_count: result.errors
      });
    } else {
      await updateImportStatus(supabase, importId, "failed", {
        error_count: result.errors,
        errors: { details: result.details }
      });
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing agreement imports:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function updateImportStatus(supabase, importId, status, updates = {}) {
  await supabase
    .from("agreement_imports")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...updates
    })
    .eq("id", importId);
}

async function processCSV(supabase, fileData, importId): Promise<ProcessingResult> {
  try {
    // Parse the CSV file
    const text = new TextDecoder().decode(fileData);
    const lines = text.split("\n").filter(line => line.trim() !== "");
    
    if (lines.length < 2) {
      return { 
        success: false, 
        processed: 0, 
        errors: 1, 
        details: ["CSV file is empty or contains only headers"] 
      };
    }
    
    // Parse headers
    const headers = lines[0].split(",").map(h => h.trim());
    
    // Map headers to field names
    const fieldMap = {
      'Customer ID': 'customer_id',
      'Vehicle ID': 'vehicle_id',
      'Start Date': 'start_date',
      'End Date': 'end_date',
      'Rent Amount': 'rent_amount',
      'Deposit Amount': 'deposit_amount',
      'Agreement Type': 'agreement_type',
      'Notes': 'notes'
    };
    
    // Update the row count in the import record
    await supabase
      .from("agreement_imports")
      .update({ row_count: lines.length - 1 })
      .eq("id", importId);
    
    let processed = 0;
    let errors = 0;
    const details = [];
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Split the line into values, handling quoted values properly
        const values = parseCSVLine(line);
        
        // Create an object with the mapped fields
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          const fieldName = fieldMap[header];
          if (fieldName && values[index] !== undefined) {
            rowData[fieldName] = values[index].trim();
          }
        });
        
        // Validate the row data
        const validationResult = agreementImportSchema.safeParse(rowData);
        
        if (!validationResult.success) {
          // Log validation error
          const errorMessages = validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          
          await logImportError(supabase, importId, i, rowData.customer_id, errorMessages, rowData);
          
          errors++;
          details.push({
            row: i,
            errors: errorMessages,
            data: rowData
          });
          continue;
        }
        
        // Create a new agreement record
        const { error: createError } = await supabase
          .from("leases")
          .insert({
            customer_id: rowData.customer_id,
            vehicle_id: rowData.vehicle_id,
            start_date: new Date(rowData.start_date).toISOString(),
            end_date: new Date(rowData.end_date).toISOString(),
            rent_amount: parseFloat(rowData.rent_amount),
            deposit_amount: rowData.deposit_amount ? parseFloat(rowData.deposit_amount) : 0,
            agreement_type: rowData.agreement_type || 'short_term',
            notes: rowData.notes || '',
            total_amount: parseFloat(rowData.rent_amount),
            status: 'draft',
            agreement_number: getAgreementNumber()
          });
          
        if (createError) {
          await logImportError(supabase, importId, i, rowData.customer_id, createError.message, rowData);
          
          errors++;
          details.push({
            row: i,
            errors: createError.message,
            data: rowData
          });
          continue;
        }
        
        processed++;
      } catch (err) {
        await logImportError(supabase, importId, i, "unknown", err.message, { line });
        
        errors++;
        details.push({
          row: i,
          errors: err.message,
          data: { line }
        });
      }
    }
    
    return {
      success: true,
      processed,
      errors,
      details: details.length > 0 ? details : []
    };
  } catch (err) {
    console.error("Error processing CSV:", err);
    return {
      success: false,
      processed: 0,
      errors: 1,
      details: [err.message]
    };
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

async function logImportError(supabase, importId, rowNumber, customerId, errorMessage, rowData) {
  await supabase
    .from("agreement_import_errors")
    .insert({
      import_log_id: importId,
      row_number: rowNumber,
      customer_identifier: customerId,
      error_message: errorMessage,
      row_data: rowData
    });
}

function getAgreementNumber(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `AGR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${timestamp}`;
}
