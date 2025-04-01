
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a test request
    const body = await req.json();
    if (body.test === true) {
      console.log("Test request received, returning success");
      return new Response(
        JSON.stringify({ success: true, message: "Customer import function is available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const { importId } = body;
    
    if (!importId) {
      return new Response(
        JSON.stringify({ error: "Import ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing import ID: ${importId}`);

    // Get the import record
    const { data: importRecord, error: importError } = await supabase
      .from("customer_import_logs")
      .select("*")
      .eq("id", importId)
      .single();

    if (importError || !importRecord) {
      console.error("Error fetching import record:", importError);
      return new Response(
        JSON.stringify({ error: importError?.message || "Import record not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`Found import record: ${importRecord.file_name}`);

    // Update status to processing if not already
    if (importRecord.status !== "processing") {
      await supabase
        .from("customer_import_logs")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", importId);
    }

    // Get the CSV file from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from("customer-imports")
      .download(importRecord.file_name);

    if (fileError || !fileData) {
      console.error("Error downloading file:", fileError);
      
      // Update import record with error
      await supabase
        .from("customer_import_logs")
        .update({ 
          status: "failed", 
          error_count: 1,
          errors: JSON.stringify([{ message: `File download error: ${fileError?.message || "Unknown error"}` }]),
          updated_at: new Date().toISOString() 
        })
        .eq("id", importId);
        
      return new Response(
        JSON.stringify({ error: fileError?.message || "Failed to download file" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Parse CSV content
    const csvText = await fileData.text();
    const rows = csvText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    if (rows.length <= 1) {
      console.error("CSV file has no data rows");
      
      // Update import record with error
      await supabase
        .from("customer_import_logs")
        .update({ 
          status: "failed", 
          error_count: 1,
          errors: JSON.stringify([{ message: "CSV file has no data rows" }]),
          updated_at: new Date().toISOString() 
        })
        .eq("id", importId);
        
      return new Response(
        JSON.stringify({ error: "CSV file has no data rows" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Extract headers and validate
    const headers = rows[0].split(",").map(header => header.trim());
    console.log("CSV Headers:", headers);
    
    // Process each row
    const processedCustomers = [];
    const errors = [];
    let processedCount = 0;
    let errorCount = 0;
    
    // Get mapping from CSV header to database fields
    const { data: mappingData } = await supabase
      .from("csv_import_mappings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);
      
    const fieldMappings = mappingData && mappingData.length > 0 
      ? mappingData[0].field_mappings 
      : {
          "Full Name": "full_name",
          "Email": "email",
          "Phone": "phone_number",
          "Driver License": "driver_license",
          "Nationality": "nationality",
          "Address": "address",
          "Status": "status",
          "Notes": "notes"
        };
    
    // Process each data row (skip header)
    for (let i = 1; i < rows.length; i++) {
      try {
        const row = rows[i];
        const values = parseCSVLine(row);
        
        if (values.length !== headers.length) {
          errors.push({
            row: i,
            message: `Row ${i} has ${values.length} values but should have ${headers.length}`
          });
          errorCount++;
          continue;
        }
        
        // Create customer object from CSV row
        const customer = {};
        headers.forEach((header, index) => {
          const dbField = fieldMappings[header];
          if (dbField && values[index] !== undefined) {
            customer[dbField] = values[index];
          }
        });
        
        // Add required fields
        customer["role"] = "customer";
        
        // Validate phone number format (if exists)
        if (customer["phone_number"]) {
          // Strip any non-numeric characters
          let phone = customer["phone_number"].replace(/\D/g, "");
          
          // Handle country code for Qatar numbers
          if (!phone.startsWith("+974") && phone.length === 8) {
            phone = `+974${phone}`;
          }
          
          customer["phone_number"] = phone;
        }
        
        // Insert customer into profiles table
        const { data: insertedCustomer, error: insertError } = await supabase
          .from("profiles")
          .insert([customer])
          .select();
        
        if (insertError) {
          console.error(`Error inserting row ${i}:`, insertError);
          errors.push({
            row: i,
            data: customer,
            message: insertError.message
          });
          errorCount++;
        } else {
          processedCustomers.push(insertedCustomer[0]);
          processedCount++;
        }
      } catch (err) {
        console.error(`Error processing row ${i}:`, err);
        errors.push({
          row: i,
          message: err.message
        });
        errorCount++;
      }
    }
    
    // Update import record with results
    const { error: updateError } = await supabase
      .from("customer_import_logs")
      .update({
        status: errorCount > 0 ? (processedCount > 0 ? "completed_with_errors" : "failed") : "completed",
        processed_count: processedCount,
        error_count: errorCount,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        row_count: rows.length - 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", importId);
    
    if (updateError) {
      console.error("Error updating import record:", updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        importId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to properly parse CSV lines with quoted values
function parseCSVLine(line) {
  const values = [];
  let inQuotes = false;
  let currentValue = "";
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  
  // Clean up values - remove surrounding quotes
  return values.map(val => val.replace(/^"|"$/g, ''));
}
