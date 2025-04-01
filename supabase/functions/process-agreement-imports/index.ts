import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const agreementImportSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  vehicle_id: z.string().min(1, 'Vehicle ID is required'),
  start_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'Start date must be a valid date (DD/MM/YYYY or YYYY-MM-DD)' }
  ),
  end_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'End date must be a valid date (DD/MM/YYYY or YYYY-MM-DD)' }
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

function parseCorrectDateFormat(dateStr: string): Date {
  let date = new Date(dateStr);
  
  if (!isNaN(date.getTime())) {
    console.log(`Parsed date ${dateStr} as ISO format: ${date.toISOString()}`);
    return date;
  }
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      date = new Date(year, month, day);
      console.log(`Parsed date ${dateStr} as DD/MM/YYYY format: ${date.toISOString()}`);
      return date;
    }
  }
  
  throw new Error(`Invalid date format: ${dateStr}. Please use DD/MM/YYYY or YYYY-MM-DD format.`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Process agreement imports function called");
    
    let reqBody;
    try {
      reqBody = await req.json();
      console.log("Request body:", JSON.stringify(reqBody));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (reqBody.test === true) {
      console.log("Test request received, returning success");
      return new Response(
        JSON.stringify({ success: true, message: "Function is available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { importId } = reqBody;
    
    if (!importId) {
      return new Response(
        JSON.stringify({ success: false, error: "Import ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Processing import ${importId}`);
    
    const { data: importData, error: importError } = await supabase
      .from("agreement_imports")
      .select("*")
      .eq("id", importId)
      .single();
      
    if (importError) {
      console.error("Failed to get import record:", importError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to get import record: ${importError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    console.log(`Found import record: ${JSON.stringify(importData)}`);
    
    await supabase
      .from("agreement_imports")
      .update({ status: "processing" })
      .eq("id", importId);
    
    console.log(`Downloading file: ${importData.file_name}`);
    
    const { data: fileData, error: fileError } = await supabase.storage
      .from("agreement-imports")
      .download(importData.file_name);
      
    if (fileError) {
      console.error("Failed to download file:", fileError);
      await updateImportStatus(supabase, importId, "failed", {
        message: `Failed to download file: ${fileError.message}`
      });
      
      return new Response(
        JSON.stringify({ success: false, error: `Failed to download file: ${fileError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    console.log(`File downloaded, size: ${fileData.size} bytes`);
    
    if (!fileData || fileData.size === 0) {
      console.error("File data is empty");
      await updateImportStatus(supabase, importId, "failed", {
        errors: { message: "File data is empty or invalid" }
      });
      
      return new Response(
        JSON.stringify({ success: false, error: "File data is empty or invalid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const result = await processCSV(supabase, fileData, importId);
    
    console.log(`Processing completed. Result: ${JSON.stringify(result)}`);
    
    if (result.success) {
      await updateImportStatus(supabase, importId, "completed", {
        processed_count: result.processed,
        error_count: result.errors,
        row_count: result.processed + result.errors
      });
    } else {
      await updateImportStatus(supabase, importId, "failed", {
        error_count: result.errors,
        errors: { details: result.details }
      });
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing agreement imports:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
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
    let text = "";
    
    if (fileData instanceof Uint8Array) {
      text = new TextDecoder().decode(fileData);
    } else if (typeof fileData === 'string') {
      text = fileData;
    } else if (fileData instanceof Blob) {
      const arrayBuffer = await fileData.arrayBuffer();
      text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
    } else {
      const blob = new Blob([fileData]);
      const arrayBuffer = await blob.arrayBuffer();
      text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
    }
    
    console.log(`CSV text length: ${text.length} characters`);
    console.log(`CSV content preview: ${text.substring(0, 200)}...`);
    
    if (!text || text.trim() === "") {
      console.error("CSV file is empty after decoding");
      return { 
        success: false, 
        processed: 0, 
        errors: 1, 
        details: ["CSV file is empty or contains no data"] 
      };
    }
    
    const lines = text.split("\n").filter(line => {
      const trimmed = line.trim();
      return trimmed !== "" && !trimmed.startsWith("#");
    });
    
    console.log(`Found ${lines.length} lines in CSV (after removing comments and empty lines)`);
    
    if (lines.length < 2) {
      return { 
        success: false, 
        processed: 0, 
        errors: 1, 
        details: ["CSV file is empty or contains only headers"] 
      };
    }
    
    const headers = lines[0].split(",").map(h => h.trim());
    console.log(`CSV headers: ${headers.join(", ")}`);
    
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
    
    await supabase
      .from("agreement_imports")
      .update({ row_count: lines.length - 1 })
      .eq("id", importId);
    
    let processed = 0;
    let errors = 0;
    const details = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        console.log(`Processing line ${i}: ${line}`);
        const values = parseCSVLine(line);
        
        console.log(`Raw CSV values for line ${i}:`, values);
        
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          const fieldName = fieldMap[header];
          if (fieldName && values[index] !== undefined) {
            rowData[fieldName] = values[index].trim();
          }
        });
        
        console.log(`Parsed row data: ${JSON.stringify(rowData)}`);
        
        const validationResult = agreementImportSchema.safeParse(rowData);
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          
          console.error(`Validation failed for row ${i}: ${errorMessages}`);
          
          await logImportError(supabase, importId, i, rowData.customer_id || "unknown", errorMessages, rowData);
          
          errors++;
          details.push({
            row: i,
            errors: errorMessages,
            data: rowData
          });
          continue;
        }
        
        let customerId = rowData.customer_id;
        if (!isUUID(customerId)) {
          console.log(`Looking up customer with identifier: ${customerId}`);
          
          const { data: customerData, error: customerError } = await supabase
            .from("profiles")
            .select("id")
            .or(`email.eq.${customerId},phone_number.eq.${customerId},full_name.eq.${customerId}`)
            .limit(1)
            .single();
            
          if (customerError || !customerData) {
            const errorMsg = "Customer not found with provided identifier";
            console.error(`${errorMsg}: ${customerId}`);
            
            await logImportError(supabase, importId, i, customerId, errorMsg, rowData);
            errors++;
            details.push({
              row: i,
              errors: errorMsg,
              data: rowData
            });
            continue;
          }
          
          customerId = customerData.id;
          console.log(`Found customer ID: ${customerId}`);
        }
        
        let vehicleId = rowData.vehicle_id;
        if (!isUUID(vehicleId)) {
          console.log(`Looking up vehicle with identifier: ${vehicleId}`);
          
          const { data: vehicleData, error: vehicleError } = await supabase
            .from("vehicles")
            .select("id")
            .or(`license_plate.eq.${vehicleId},vin.eq.${vehicleId}`)
            .limit(1)
            .single();
            
          if (vehicleError || !vehicleData) {
            const errorMsg = "Vehicle not found with provided identifier";
            console.error(`${errorMsg}: ${vehicleId}`);
            
            await logImportError(supabase, importId, i, customerId, errorMsg, rowData);
            errors++;
            details.push({
              row: i,
              errors: errorMsg,
              data: rowData
            });
            continue;
          }
          
          vehicleId = vehicleData.id;
          console.log(`Found vehicle ID: ${vehicleId}`);
        }
        
        console.log(`Creating agreement for customer ${customerId}, vehicle ${vehicleId}`);
        
        let startDate, endDate;
        try {
          startDate = parseCorrectDateFormat(rowData.start_date);
          endDate = parseCorrectDateFormat(rowData.end_date);
          
          console.log(`Parsed start date: ${startDate.toISOString()}`);
          console.log(`Parsed end date: ${endDate.toISOString()}`);
          
          if (endDate < startDate) {
            throw new Error("End date cannot be before start date");
          }
        } catch (dateError) {
          console.error(`Error parsing dates: ${dateError.message}`);
          
          await logImportError(supabase, importId, i, customerId, 
            `Date format error: ${dateError.message}`, rowData);
          
          errors++;
          details.push({
            row: i,
            errors: `Date format error: ${dateError.message}`,
            data: rowData
          });
          continue;
        }
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const agreementDuration = `${diffDays} days`;
        
        const newAgreement = {
          customer_id: customerId,
          vehicle_id: vehicleId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          rent_amount: parseFloat(rowData.rent_amount),
          deposit_amount: rowData.deposit_amount ? parseFloat(rowData.deposit_amount) : 0,
          agreement_type: rowData.agreement_type || 'short_term',
          notes: rowData.notes || '',
          total_amount: parseFloat(rowData.rent_amount),
          status: 'active',
          agreement_number: getAgreementNumber(),
          agreement_duration: agreementDuration
        };
        
        console.log('Inserting new agreement:', JSON.stringify(newAgreement));
        
        const { data: createdAgreement, error: createError } = await supabase
          .from("leases")
          .insert(newAgreement)
          .select()
          .single();
          
        if (createError) {
          console.error(`Error creating agreement: ${createError.message}`);
          console.error(`Error details:`, createError);
          
          await logImportError(supabase, importId, i, customerId, createError.message, rowData);
          
          errors++;
          details.push({
            row: i,
            errors: createError.message,
            data: rowData
          });
          continue;
        }
        
        console.log(`Successfully created agreement for row ${i}. ID: ${createdAgreement?.id}`);
        processed++;
      } catch (err) {
        console.error(`Error processing row ${i}:`, err);
        
        await logImportError(supabase, importId, i, "unknown", err.message, { line });
        
        errors++;
        details.push({
          row: i,
          errors: err.message,
          data: { line }
        });
      }
    }
    
    console.log(`CSV processing complete. Processed: ${processed}, Errors: ${errors}`);
    
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

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function logImportError(supabase, importId, rowNumber, customerId, errorMessage, rowData) {
  try {
    await supabase
      .from("agreement_import_errors")
      .insert({
        import_log_id: importId,
        row_number: rowNumber,
        customer_identifier: customerId,
        error_message: errorMessage,
        row_data: rowData
      });
  } catch (error) {
    console.error("Failed to log import error:", error);
  }
}

function getAgreementNumber(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `AGR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${timestamp}`;
}
