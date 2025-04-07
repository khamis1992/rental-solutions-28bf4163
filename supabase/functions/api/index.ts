import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Define supported API resources
type ApiResourceType = 'vehicles' | 'customers' | 'agreements' | 'traffic-fines';

// Helper function to log API requests
async function logApiRequest(apiKeyId: string, endpoint: string, method: string, statusCode: number, responseTimeMs: number, ipAddress?: string, userAgent?: string) {
  try {
    await supabaseClient.from('api_request_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error("Error logging API request:", error);
  }
}

serve(async (req: Request) => {
  console.log(`API request received: ${req.method} ${req.url}`);
  const startTime = performance.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log("Path parts:", pathParts);
    
    // Validate API path
    if (pathParts.length < 2 || pathParts[0] !== 'api') {
      console.error("Invalid API endpoint:", url.pathname);
      return new Response(JSON.stringify({ 
        error: 'Invalid API endpoint' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const resourceType = pathParts[1] as ApiResourceType;
    const resourceId = pathParts[2];
    
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    console.log("Auth header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader) {
      console.error("No Authorization header found");
      return new Response(JSON.stringify({ 
        error: 'Missing API key. Please provide an Authorization header with format: Bearer YOUR_API_KEY' 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Extract API key, handling multiple format variations (Bearer KEY, key=KEY, etc.)
    let apiKey = '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (authHeader.includes('=')) {
      // Handle key=value format
      const parts = authHeader.split('=');
      if (parts.length >= 2) {
        apiKey = parts[1].trim();
      }
    } else {
      // Just use the raw value as the key
      apiKey = authHeader.trim();
    }
    
    if (!apiKey) {
      console.error("Empty API key after processing");
      return new Response(JSON.stringify({ 
        error: 'Invalid API key format. Please provide: Bearer YOUR_API_KEY' 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Validating API key: ${apiKey.substring(0, 5)}...`);
    
    // Validate API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('id, permissions, is_active')
      .eq('key_value', apiKey)
      .single();
      
    if (apiKeyError) {
      console.error("API key validation error:", apiKeyError);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return new Response(JSON.stringify({ 
        error: 'Invalid API key', 
        details: 'The provided API key was not found in our system.'
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!apiKeyData || !apiKeyData.is_active) {
      console.error("API key inactive or not found");
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return new Response(JSON.stringify({ 
        error: apiKeyData ? 'API key has been revoked' : 'Invalid API key' 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`API key valid. Permissions:`, apiKeyData.permissions);
    
    // Check resource permissions
    const permissions = apiKeyData.permissions as string[];
    if (!permissions.includes(resourceType) && !permissions.includes('*')) {
      console.error(`Access denied to resource: ${resourceType}`);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      // Log the unauthorized access attempt
      await logApiRequest(
        apiKeyData.id,
        url.pathname,
        req.method,
        403,
        responseTime,
        req.headers.get('x-forwarded-for') || undefined,
        req.headers.get('user-agent') || undefined
      );
      
      return new Response(JSON.stringify({ 
        error: `Access denied to resource: ${resourceType}` 
      }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Access granted to resource: ${resourceType}`);
    
    // Handle different resources
    let response: Response;
    switch(resourceType) {
      case 'traffic-fines':
        response = await handleTrafficFineRequests(req, resourceId);
        break;
      case 'vehicles':
        response = await handleVehicleRequests(req, resourceId);
        break;
      case 'customers':
        response = await handleCustomerRequests(req, resourceId);
        break;
      case 'agreements':
        response = await handleAgreementRequests(req, resourceId);
        break;
      default:
        console.error(`Unsupported resource type: ${resourceType}`);
        response = new Response(JSON.stringify({ 
          error: 'Unsupported resource type' 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Log the successful request
    await logApiRequest(
      apiKeyData.id,
      url.pathname,
      req.method,
      response.status,
      responseTime,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    );
    
    // Make sure response has CORS headers
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    
    // Return response with CORS headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// Handler for Traffic Fine API requests
async function handleTrafficFineRequests(req: Request, fineId?: string): Promise<Response> {
  const method = req.method;
  
  try {
    // GET request handling
    if (method === 'GET') {
      if (fineId) {
        // Get specific traffic fine
        const { data, error } = await supabaseClient
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            license_plate,
            violation_date,
            fine_amount,
            violation_charge,
            payment_status,
            fine_location,
            vehicle_id,
            lease_id,
            payment_date
          `)
          .eq('id', fineId)
          .single();
          
        if (error) {
          return new Response(JSON.stringify({ 
            error: `Traffic fine not found: ${error.message}` 
          }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        return new Response(JSON.stringify({ data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } else {
        // Get all traffic fines with optional filtering
        const url = new URL(req.url);
        const licensePlate = url.searchParams.get('license_plate');
        const status = url.searchParams.get('status');
        const limit = parseInt(url.searchParams.get('limit') || '100');
        
        let query = supabaseClient
          .from('traffic_fines')
          .select(`
            id,
            violation_number,
            license_plate,
            violation_date,
            fine_amount,
            violation_charge,
            payment_status,
            fine_location,
            vehicle_id,
            lease_id,
            payment_date
          `)
          .order('violation_date', { ascending: false })
          .limit(limit);
          
        if (licensePlate) {
          query = query.ilike('license_plate', `%${licensePlate}%`);
        }
        
        if (status) {
          query = query.eq('payment_status', status);
        }
        
        const { data, error } = await query;
        
        if (error) {
          return new Response(JSON.stringify({ 
            error: `Failed to fetch traffic fines: ${error.message}` 
          }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        return new Response(JSON.stringify({ data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }
    
    // POST request - Create a new traffic fine
    if (method === 'POST') {
      const body = await req.json();
      
      // Validate required fields
      const requiredFields = ['violation_number', 'violation_date', 'fine_amount', 'payment_status'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return new Response(JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      // Insert new traffic fine
      const { data, error } = await supabaseClient
        .from('traffic_fines')
        .insert(body)
        .select()
        .single();
        
      if (error) {
        return new Response(JSON.stringify({ 
          error: `Failed to create traffic fine: ${error.message}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Traffic fine created successfully', 
        data 
      }), { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // PUT request - Update a traffic fine
    if (method === 'PUT') {
      if (!fineId) {
        return new Response(JSON.stringify({ 
          error: 'Fine ID is required for updates' 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const body = await req.json();
      const { data, error } = await supabaseClient
        .from('traffic_fines')
        .update(body)
        .eq('id', fineId)
        .select()
        .single();
        
      if (error) {
        return new Response(JSON.stringify({ 
          error: `Failed to update traffic fine: ${error.message}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Traffic fine updated successfully', 
        data 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // DELETE request - Delete a traffic fine
    if (method === 'DELETE') {
      if (!fineId) {
        return new Response(JSON.stringify({ 
          error: 'Fine ID is required for deletion' 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const { error } = await supabaseClient
        .from('traffic_fines')
        .delete()
        .eq('id', fineId);
        
      if (error) {
        return new Response(JSON.stringify({ 
          error: `Failed to delete traffic fine: ${error.message}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Traffic fine deleted successfully' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error handling traffic fine request:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// Handler for Vehicle API requests
async function handleVehicleRequests(req: Request, vehicleId?: string): Promise<Response> {
  const method = req.method;
  
  try {
    // GET request handling
    if (method === 'GET') {
      if (vehicleId) {
        // Get specific vehicle
        const { data, error } = await supabaseClient
          .from('vehicles')
          .select(`
            id,
            make,
            model,
            year,
            license_plate,
            vin,
            color,
            status,
            mileage,
            image_url,
            description,
            location,
            insurance_company,
            insurance_expiry,
            rent_amount,
            vehicle_type_id,
            registration_number,
            created_at,
            updated_at,
            vehicle_types(
              id,
              name,
              size,
              daily_rate,
              weekly_rate,
              monthly_rate,
              description,
              features
            )
          `)
          .eq('id', vehicleId)
          .single();
          
        if (error) {
          return new Response(JSON.stringify({ 
            error: `Vehicle not found: ${error.message}` 
          }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        return new Response(JSON.stringify({ data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } else {
        // Get all vehicles with optional filtering
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const make = url.searchParams.get('make');
        const model = url.searchParams.get('model');
        const location = url.searchParams.get('location');
        const limit = parseInt(url.searchParams.get('limit') || '100');
        
        let query = supabaseClient
          .from('vehicles')
          .select(`
            id,
            make, 
            model,
            year,
            license_plate,
            vin,
            color,
            status,
            mileage,
            image_url,
            description,
            location,
            insurance_company,
            insurance_expiry,
            rent_amount,
            vehicle_type_id,
            registration_number,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (status) {
          query = query.eq('status', status);
        }
        
        if (make) {
          query = query.ilike('make', `%${make}%`);
        }
        
        if (model) {
          query = query.ilike('model', `%${model}%`);
        }
        
        if (location) {
          query = query.eq('location', location);
        }
        
        const { data, error } = await query;
        
        if (error) {
          return new Response(JSON.stringify({ 
            error: `Failed to fetch vehicles: ${error.message}` 
          }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        return new Response(JSON.stringify({ data }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }
    
    // POST request - Create a new vehicle
    if (method === 'POST') {
      const body = await req.json();
      
      // Validate required fields
      const requiredFields = ['make', 'model', 'year', 'license_plate', 'vin'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return new Response(JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      // Insert new vehicle
      const { data, error } = await supabaseClient
        .from('vehicles')
        .insert(body)
        .select()
        .single();
        
      if (error) {
        return new Response(JSON.stringify({ 
          error: `Failed to create vehicle: ${error.message}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Vehicle created successfully', 
        data 
      }), { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // PUT request - Update a vehicle
    if (method === 'PUT') {
      if (!vehicleId) {
        return new Response(JSON.stringify({ 
          error: 'Vehicle ID is required for updates' 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const body = await req.json();
      const { data, error } = await supabaseClient
        .from('vehicles')
        .update(body)
        .eq('id', vehicleId)
        .select()
        .single();
        
      if (error) {
        return new Response(JSON.stringify({ 
          error: `Failed to update vehicle: ${error.message}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Vehicle updated successfully', 
        data 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // DELETE request - Delete a vehicle
    if (method === 'DELETE') {
      if (!vehicleId) {
        return new Response(JSON.stringify({ 
          error: 'Vehicle ID is required for deletion' 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const { error } = await supabaseClient
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
        
      if (error) {
        return new Response(JSON.stringify({ 
          error: `Failed to delete vehicle: ${error.message}` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Vehicle deleted successfully' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error handling vehicle request:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// Handler for Customer API requests (stub - implement similarly to traffic fines)
async function handleCustomerRequests(req: Request, customerId?: string): Promise<Response> {
  return new Response(JSON.stringify({ 
    message: 'Customer API not yet implemented',
    resourceId: customerId
  }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}

// Handler for Agreement API requests (stub - implement similarly to traffic fines)
async function handleAgreementRequests(req: Request, agreementId?: string): Promise<Response> {
  return new Response(JSON.stringify({ 
    message: 'Agreement API not yet implemented',
    resourceId: agreementId
  }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}
