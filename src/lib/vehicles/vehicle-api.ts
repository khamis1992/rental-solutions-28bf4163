import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { 
  ExtendedVehicle, 
  VehicleInsert, 
  VehicleUpdate, 
  VehicleFilterParams,
  VehicleType,
  VehicleStatus
} from '@/types/vehicle';
import { isValidVehicleStatus } from '@/lib/validation/vehicle-status';
import { enhancedVehicleSearch, enhancedLicensePlateMatch } from '@/utils/searchUtils';

const supabaseClient = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Helper function to safely convert status strings to VehicleStatus
const safeMapToVehicleStatus = (status: string): VehicleStatus => {
  if (!isValidVehicleStatus(status)) {
    console.warn(`Invalid vehicle status: ${status}. Defaulting to 'available'`);
    return 'available' as VehicleStatus;
  }
  return status === 'reserved' ? 'reserve' as VehicleStatus : status as VehicleStatus;
};

// Helper function to handle API errors
const handleApiError = (operation: string, error: any): never => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to ${operation}: ${errorMessage}`);
};

// Fetch vehicles with optional filtering
export async function fetchVehicles(filters?: VehicleFilterParams): Promise<ExtendedVehicle[] | undefined> {
  try {
    let query = supabaseClient.from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)');
    
    if (filters) {
      if (filters.statuses?.length) {
        // Map 'reserved' to 'reserve' for DB compatibility
        const statuses = filters.statuses.map(s => s === 'reserved' ? 'reserve' : s);
        query = query.in('status', statuses as any);
      }
      
      if (filters.make) {
        query = query.eq('make', filters.make);
      }
      
      if (filters.model) {
        query = query.eq('model', filters.model);
      }
      
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      if (filters.vehicle_type_id) {
        query = query.eq('vehicle_type_id', filters.vehicle_type_id);
      }
      
      if (filters?.searchTerm) {
        query = query.or(`vin.ilike.%${filters.searchTerm}%,license_plate.ilike.%${filters.searchTerm}%`);
      }

      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortDirection === 'asc' });
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data as unknown as ExtendedVehicle[];
  } catch (error) {
    handleApiError('fetch vehicles', error);
  }
  return undefined;
}

// Fetch a single vehicle by ID
export async function fetchVehicleById(id: string): Promise<ExtendedVehicle | undefined> {
  try {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }

    return data as unknown as ExtendedVehicle;
  } catch (error) {
    handleApiError(`fetch vehicle with ID ${id}`, error);
  }
  return undefined;
}

// Fetch all vehicle types
export async function fetchVehicleTypes(): Promise<VehicleType[] | undefined> {
  try {
    const { data, error } = await supabaseClient
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(type => ({
      ...type,
      features: type.features ?? undefined
    })) as unknown as VehicleType[];
  } catch (error) {
    handleApiError('fetch vehicle types', error);
  }
  return undefined;
}

// Create a new vehicle
export async function createVehicle(vehicle: VehicleInsert): Promise<ExtendedVehicle | undefined> {
  try {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .insert(vehicle)
      .select('*, vehicle_types(*), agreements:leases(*)')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to create vehicle - no data returned');
    }

    return data as ExtendedVehicle;
  } catch (error) {
    handleApiError('create vehicle', error);
  }
  return undefined;
}

// Update a vehicle
export async function updateVehicle(id: string, vehicle: VehicleUpdate): Promise<ExtendedVehicle | undefined> {
  try {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select('*, vehicle_types(*), agreements:leases(*)')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Vehicle not found with ID: ${id}`);
    }

    return data as ExtendedVehicle;
  } catch (error) {
    handleApiError(`update vehicle with ID ${id}`, error);
  }
  return undefined;
}

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    handleApiError(`delete vehicle with ID ${id}`, error);
  }
}

// Get available vehicles
export async function getAvailableVehicles(): Promise<ExtendedVehicle[] | undefined> {
  try {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .eq('status', 'available');

    if (error) {
      throw error;
    }

    return data as ExtendedVehicle[];
  } catch (error) {
    handleApiError('fetch available vehicles', error);
  }
  return undefined;
}

// Get vehicles by status
export async function getVehiclesByStatus(status: VehicleStatus): Promise<ExtendedVehicle[] | undefined> {
  try {
    const dbStatus = status === 'reserved' ? 'reserve' : status;
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .eq('status', dbStatus);

    if (error) {
      throw error;
    }

    return data as ExtendedVehicle[];
  } catch (error) {
    handleApiError(`fetch vehicles with status ${status}`, error);
  }
  return undefined;
}

// Enhanced search vehicles with fuzzy matching
export async function enhancedSearchVehicles(
  searchTerm: string, 
  options?: {
    minConfidence?: number;
    includeMatchDetails?: boolean;
    maxResults?: number;
  }
): Promise<(ExtendedVehicle & { matchScore?: number; matchDetails?: string[] })[] | undefined> {
  try {
    // First, get all vehicles from the database
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)');

    if (error) {
      throw error;
    }

    if (!data || !searchTerm) {
      return data as ExtendedVehicle[];
    }

    // Apply enhanced search with fuzzy matching
    const searchResults = enhancedVehicleSearch(searchTerm, data as ExtendedVehicle[]);
    
    // Filter by minimum confidence if specified
    const minConfidence = options?.minConfidence || 30;
    const filteredResults = searchResults.filter(result => result.matchScore >= minConfidence);
    
    // Limit results if specified
    const maxResults = options?.maxResults || 50;
    const limitedResults = filteredResults.slice(0, maxResults);
    
    // Include or exclude match details based on options
    if (options?.includeMatchDetails) {
      return limitedResults;
    } else {
      return limitedResults.map(({ matchScore, matchDetails, ...vehicle }) => ({
        ...vehicle,
        matchScore
      }));
    }
  } catch (error) {
    handleApiError('enhanced search vehicles', error);
  }
  return undefined;
}

// Search vehicles by license plate with fuzzy matching
export async function searchVehiclesByLicensePlate(
  licensePlateQuery: string,
  options?: {
    minConfidence?: number;
    exactMatchOnly?: boolean;
  }
): Promise<(ExtendedVehicle & { matchScore?: number; matchType?: string })[] | undefined> {
  try {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)');

    if (error) {
      throw error;
    }

    if (!data || !licensePlateQuery) {
      return [];
    }

    const results: (ExtendedVehicle & { matchScore?: number; matchType?: string })[] = [];
    const minConfidence = options?.minConfidence || 50;

    for (const vehicle of data as ExtendedVehicle[]) {
      if (vehicle.license_plate) {
        const match = enhancedLicensePlateMatch(vehicle.license_plate, licensePlateQuery);
        
        if (match.isMatch && match.confidence >= minConfidence) {
          // If exactMatchOnly is true, only include exact matches
          if (options?.exactMatchOnly && match.matchType !== 'exact') {
            continue;
          }
          
          results.push({
            ...vehicle,
            matchScore: match.confidence,
            matchType: match.matchType
          });
        }
      }
    }

    // Sort by match score (highest first)
    return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  } catch (error) {
    handleApiError('search vehicles by license plate', error);
  }
  return undefined;
}

// Updated search vehicles function with enhanced capabilities
export async function searchVehicles(searchTerm: string): Promise<ExtendedVehicle[] | undefined> {
  try {
    // For backward compatibility, first try the database search
    const { data: dbResults, error } = await supabaseClient
      .from('vehicles')
      .select('*, vehicle_types(*), agreements:leases(*)')
      .or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%`);

    if (error) {
      throw error;
    }

    // If we have database results, return them
    if (dbResults && dbResults.length > 0) {
      return dbResults as ExtendedVehicle[];
    }

    // If no database results, try enhanced search for better fuzzy matching
    const enhancedResults = await enhancedSearchVehicles(searchTerm, {
      minConfidence: 30,
      includeMatchDetails: false,
      maxResults: 20
    });

    return enhancedResults?.map(({ matchScore, ...vehicle }) => vehicle) || [];
  } catch (error) {
    handleApiError('search vehicles', error);
  }
  return undefined;
}
