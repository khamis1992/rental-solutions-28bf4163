
// API Edge Function for third-party system integration
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders } from "../_shared/cors.ts";

interface ApiRequest {
  resource: string;
  action: string;
  data?: any;
  filters?: Record<string, any>;
  apiKey?: string;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

// API key validation (basic implementation)
// In production, replace with proper API key management from a database table
const validateApiKey = (apiKey: string): boolean => {
  // Hard-coded for demo purposes - in production this would check against stored API keys
  const validApiKeys = [
    "api_key_test_123456",
    Deno.env.get("SYSTEM_API_KEY")
  ];

  return validApiKeys.includes(apiKey);
};

// Create a Supabase client with the Deno runtime
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Resource handlers
const resourceHandlers = {
  customers: {
    get: async (filters?: Record<string, any>, pagination?: { page: number, pageSize: number }) => {
      let query = supabaseClient
        .from("profiles")
        .select("*")
        .eq("role", "customer");
      
      // Apply filters
      if (filters) {
        if (filters.status) query = query.eq("status", filters.status);
        if (filters.search) {
          query = query.or(
            `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`
          );
        }
      }
      
      // Apply pagination
      if (pagination) {
        const { page = 1, pageSize = 20 } = pagination;
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data,
        meta: pagination ? {
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: count ? Math.ceil(count / pagination.pageSize) : 0
        } : undefined
      };
    },
    getById: async (id: string) => {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return { data };
    },
    create: async (data: any) => {
      // Format phone number if needed
      if (data.phone) {
        const cleanPhone = data.phone.replace(/^\+974/, '').trim();
        data.phone_number = `+974${cleanPhone}`;
      }
      
      const insertData = {
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number || data.phone,
        driver_license: data.driver_license,
        nationality: data.nationality,
        address: data.address,
        role: 'customer',
        status: data.status || 'active'
      };
      
      const { data: newCustomer, error } = await supabaseClient
        .from("profiles")
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return { data: newCustomer };
    },
    update: async (id: string, data: any) => {
      // Format phone number if needed
      if (data.phone) {
        const cleanPhone = data.phone.replace(/^\+974/, '').trim();
        data.phone_number = `+974${cleanPhone}`;
        delete data.phone;
      }
      
      const { data: updatedCustomer, error } = await supabaseClient
        .from("profiles")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: updatedCustomer };
    },
    delete: async (id: string) => {
      const { error } = await supabaseClient
        .from("profiles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { data: { id, deleted: true } };
    }
  },
  vehicles: {
    get: async (filters?: Record<string, any>, pagination?: { page: number, pageSize: number }) => {
      let query = supabaseClient
        .from("vehicles")
        .select("*");
      
      // Apply filters
      if (filters) {
        if (filters.status) query = query.eq("status", filters.status);
        if (filters.available === true) query = query.eq("status", "available");
        if (filters.make) query = query.eq("make", filters.make);
        if (filters.model) query = query.eq("model", filters.model);
        if (filters.year) query = query.eq("year", filters.year);
      }
      
      // Apply pagination
      if (pagination) {
        const { page = 1, pageSize = 20 } = pagination;
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data,
        meta: pagination ? {
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: count ? Math.ceil(count / pagination.pageSize) : 0
        } : undefined
      };
    },
    getById: async (id: string) => {
      const { data, error } = await supabaseClient
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return { data };
    },
    create: async (data: any) => {
      const { data: newVehicle, error } = await supabaseClient
        .from("vehicles")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return { data: newVehicle };
    },
    update: async (id: string, data: any) => {
      const { data: updatedVehicle, error } = await supabaseClient
        .from("vehicles")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: updatedVehicle };
    },
    delete: async (id: string) => {
      const { error } = await supabaseClient
        .from("vehicles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { data: { id, deleted: true } };
    }
  },
  agreements: {
    get: async (filters?: Record<string, any>, pagination?: { page: number, pageSize: number }) => {
      let query = supabaseClient
        .from("leases")
        .select(`
          *,
          customer:customer_id(id, full_name, email, phone_number),
          vehicle:vehicle_id(id, make, model, license_plate, color, year)
        `);
      
      // Apply filters
      if (filters) {
        if (filters.status) query = query.eq("status", filters.status);
        if (filters.customer_id) query = query.eq("customer_id", filters.customer_id);
        if (filters.vehicle_id) query = query.eq("vehicle_id", filters.vehicle_id);
        if (filters.start_date) query = query.gte("start_date", filters.start_date);
        if (filters.end_date) query = query.lte("end_date", filters.end_date);
        if (filters.agreement_number) query = query.ilike("agreement_number", `%${filters.agreement_number}%`);
      }
      
      // Apply pagination
      if (pagination) {
        const { page = 1, pageSize = 20 } = pagination;
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data,
        meta: pagination ? {
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: count ? Math.ceil(count / pagination.pageSize) : 0
        } : undefined
      };
    },
    getById: async (id: string) => {
      const { data, error } = await supabaseClient
        .from("leases")
        .select(`
          *,
          customer:customer_id(id, full_name, email, phone_number),
          vehicle:vehicle_id(id, make, model, license_plate, color, year)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      // Fetch payments for this agreement
      const { data: payments, error: paymentsError } = await supabaseClient
        .from("unified_payments")
        .select("*")
        .eq("lease_id", id)
        .order('created_at', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      return { 
        data: {
          ...data,
          payments
        } 
      };
    },
    create: async (data: any) => {
      // Generate next agreement number
      const timestamp = new Date().toISOString().slice(0, 7).replace('-', '');
      
      // Create the agreement
      const { data: newAgreement, error } = await supabaseClient
        .from("leases")
        .insert([
          {
            customer_id: data.customer_id,
            vehicle_id: data.vehicle_id,
            start_date: data.start_date,
            end_date: data.end_date,
            status: data.status || 'pending_payment',
            rent_amount: data.rent_amount,
            total_amount: data.total_amount,
            deposit_amount: data.deposit_amount,
            daily_late_fee: data.daily_late_fee || 120,
            agreement_type: data.agreement_type || 'short_term',
            notes: data.notes
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: newAgreement };
    },
    update: async (id: string, data: any) => {
      const { data: updatedAgreement, error } = await supabaseClient
        .from("leases")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: updatedAgreement };
    },
    delete: async (id: string) => {
      const { error } = await supabaseClient
        .from("leases")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { data: { id, deleted: true } };
    }
  },
  payments: {
    get: async (filters?: Record<string, any>, pagination?: { page: number, pageSize: number }) => {
      let query = supabaseClient
        .from("unified_payments")
        .select(`
          *,
          lease:lease_id(agreement_number, customer_id, vehicle_id)
        `);
      
      // Apply filters
      if (filters) {
        if (filters.status) query = query.eq("status", filters.status);
        if (filters.lease_id) query = query.eq("lease_id", filters.lease_id);
        if (filters.payment_date_from) query = query.gte("payment_date", filters.payment_date_from);
        if (filters.payment_date_to) query = query.lte("payment_date", filters.payment_date_to);
        if (filters.type) query = query.eq("type", filters.type);
      }
      
      // Apply pagination
      if (pagination) {
        const { page = 1, pageSize = 20 } = pagination;
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data,
        meta: pagination ? {
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: count ? Math.ceil(count / pagination.pageSize) : 0
        } : undefined
      };
    },
    create: async (data: any) => {
      const { data: newPayment, error } = await supabaseClient
        .from("unified_payments")
        .insert([{
          lease_id: data.lease_id,
          amount: data.amount,
          amount_paid: data.amount_paid || data.amount,
          balance: data.balance || 0,
          payment_date: data.payment_date || new Date().toISOString(),
          due_date: data.due_date,
          payment_method: data.payment_method || 'cash',
          status: data.status || 'paid',
          type: data.type || 'Income',
          description: data.description || 'Payment',
          transaction_id: data.transaction_id || `TXN-${Date.now()}`
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return { data: newPayment };
    }
  }
};

// Request handler
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check if it's a GET request for API documentation
    if (req.method === 'GET') {
      const url = new URL(req.url);
      if (url.pathname.endsWith('/docs')) {
        return new Response(JSON.stringify({
          name: "Car Rental System API",
          version: "1.0.0",
          description: "API for third-party integration with the car rental system",
          endpoints: {
            customers: ["get", "getById", "create", "update", "delete"],
            vehicles: ["get", "getById", "create", "update", "delete"],
            agreements: ["get", "getById", "create", "update", "delete"],
            payments: ["get", "create"]
          }
        }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        });
      }
    }
    
    // Parse request body
    let apiRequest: ApiRequest;
    try {
      apiRequest = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // API key validation
    const apiKey = req.headers.get('x-api-key') || apiRequest.apiKey;
    if (!apiKey || !validateApiKey(apiKey)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Log request
    console.log(`API Request: ${apiRequest.resource}/${apiRequest.action}`, 
      apiRequest.data ? "with data" : "");
    
    // Process request
    const { resource, action, data, filters, pagination } = apiRequest;
    let response: ApiResponse;
    
    // Validate resource and action
    if (!resourceHandlers[resource]) {
      return new Response(
        JSON.stringify({ success: false, error: `Resource '${resource}' not found` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    if (!resourceHandlers[resource][action]) {
      return new Response(
        JSON.stringify({ success: false, error: `Action '${action}' not found for resource '${resource}'` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // Execute the corresponding handler
    try {
      let result;
      switch (action) {
        case 'getById':
          if (!data?.id) throw new Error("ID is required for getById action");
          result = await resourceHandlers[resource][action](data.id);
          break;
        case 'get':
          result = await resourceHandlers[resource][action](filters, pagination);
          break;
        case 'create':
          result = await resourceHandlers[resource][action](data);
          break;
        case 'update':
          if (!data?.id) throw new Error("ID is required for update action");
          result = await resourceHandlers[resource][action](data.id, data);
          break;
        case 'delete':
          if (!data?.id) throw new Error("ID is required for delete action");
          result = await resourceHandlers[resource][action](data.id);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      response = {
        success: true,
        data: result.data,
        meta: result.meta
      };
      
    } catch (error) {
      console.error(`Error processing ${resource}/${action}:`, error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "An unknown error occurred" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
