
  // Get agreement by ID
  const getAgreement = async (id: string): Promise<Agreement | null> => {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);
      
      if (!id || id.trim() === '') {
        console.error("Invalid agreement ID provided");
        toast.error("Invalid agreement ID");
        return null;
      }
      
      // First, get the lease data
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching agreement from Supabase:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }
      
      if (!data) {
        console.error(`No lease data found for ID: ${id}`);
        return null;
      }
      
      console.log("Raw lease data from Supabase:", data);
      
      // If we have the lease data, get the related customer and vehicle data
      let customerData = null;
      let vehicleData = null;
      
      // Get customer data
      if (data.customer_id) {
        try {
          const { data: customer, error: customerError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number, driver_license, nationality, address')
            .eq('id', data.customer_id)
            .single();
            
          if (customerError) {
            console.error("Error fetching customer:", customerError);
          } else if (customer) {
            console.log("Customer data fetched:", customer);
            customerData = customer;
          } else {
            console.log(`No customer found with ID: ${data.customer_id}`);
          }
        } catch (customerFetchError) {
          console.error("Error in customer data fetch:", customerFetchError);
        }
      }
      
      // Get vehicle data - optimized with error handling
      if (data.vehicle_id) {
        try {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color, vin, registration_number')
            .eq('id', data.vehicle_id)
            .single();
            
          if (vehicleError) {
            console.error("Error fetching vehicle:", vehicleError);
          } else if (vehicle) {
            console.log("Vehicle data fetched:", vehicle);
            vehicleData = vehicle;
          } else {
            console.log(`No vehicle found with ID: ${data.vehicle_id}`);
          }
        } catch (vehicleFetchError) {
          console.error("Error in vehicle data fetch:", vehicleFetchError);
        }
      }
      
      // Transform to Agreement type
      const agreement: Agreement = {
        id: data.id,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        status: data.status,
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
        total_amount: data.total_amount || 0,
        deposit_amount: data.down_payment || 0, // Using down_payment as deposit_amount
        agreement_number: data.agreement_number || '',
        notes: data.notes || '',
        terms_accepted: true, // Default to true since the column doesn't exist in DB
        additional_drivers: data.additional_drivers || [],
        customers: customerData,
        vehicles: vehicleData,
        signature_url: data.signature_url
      };
      
      console.log("Transformed agreement data:", agreement);
      return agreement;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  };
