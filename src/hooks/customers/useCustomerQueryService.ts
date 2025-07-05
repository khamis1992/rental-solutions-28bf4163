import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

const PROFILES_TABLE = 'profiles';
const CUSTOMER_ROLE = 'customer';

const stripCountryCode = (phone: string): string => {
  return phone.replace(/^\+974/, '').trim();
};

interface SearchParams {
  query: string;
  status: string;
}

// Function to create sample customers if none exist
const createSampleCustomers = async () => {
  console.log('Creating sample customers...');
  const sampleCustomers = [
    {
      id: crypto.randomUUID(),
      full_name: 'أحمد محمد العلي',
      email: 'ahmed.ali@email.com',
      phone_number: '+97433123456',
      driver_license: 'DL123456',
      nationality: 'قطري',
      address: 'الدوحة - قطر',
      notes: 'عميل جديد',
      status: 'active',
      role: CUSTOMER_ROLE,
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      full_name: 'فاطمة أحمد الكعبي',
      email: 'fatima.kaabi@email.com',
      phone_number: '+97455987654',
      driver_license: 'DL789012',
      nationality: 'قطري',
      address: 'الدوحة - قطر',
      notes: 'عميل مميز',
      status: 'active',
      role: CUSTOMER_ROLE,
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      full_name: 'محمد علي السليطي',
      email: 'mohamed.sulaiti@email.com',
      phone_number: '+97470456789',
      driver_license: 'DL345678',
      nationality: 'قطري',
      address: 'الدوحة - قطر',
      notes: 'عميل منتظم',
      status: 'active',
      role: CUSTOMER_ROLE,
      created_at: new Date().toISOString()
    }
  ];

  try {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .insert(sampleCustomers)
      .select();

    if (error) {
      console.error('Error creating sample customers:', error);
      return false;
    }

    console.log('Sample customers created successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error creating sample customers:', error);
    return false;
  }
};

export const useCustomerQueryService = (searchParams: SearchParams) => {
  const { 
    data: customers, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      console.log('Fetching customers with params:', searchParams);
      
      try {
        let query = supabase
          .from(PROFILES_TABLE)
          .select('*')
          .eq('role', CUSTOMER_ROLE);
          
        // Order by created_at descending
        query = query.order('created_at', { ascending: false });

        if (searchParams.status !== 'all' && searchParams.status) {
          // Use safe casting for the status filter
          query = query.eq('status', searchParams.status);
        }

        if (searchParams.query) {
          query = query.or(
            `full_name.ilike.%${searchParams.query}%,email.ilike.%${searchParams.query}%,phone_number.ilike.%${searchParams.query}%,driver_license.ilike.%${searchParams.query}%`
          );
        }

        console.log('Executing SQL query: SELECT * FROM profiles WHERE role = \'customer\'');

        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(error.message);
        }
        
        console.log('Raw customer data from profiles table:', data);
        console.log('Number of customers found:', data?.length || 0);
        
        // If no customers found, create sample ones
        if (!data || data.length === 0) {
          console.log('No customers found. Creating sample customers...');
          const created = await createSampleCustomers();
          if (created) {
            // Refetch after creating sample customers
            const { data: newData, error: newError } = await query;
            if (newError) {
              console.error('Error refetching after creating samples:', newError);
              return [];
            }
            console.log('Customers after creating samples:', newData);
            const processedCustomers = Array.isArray(newData) ? newData.map(profile => ({
              id: profile.id,
              full_name: profile.full_name || '',
              email: profile.email || '',
              phone: profile.phone_number || profile.phone || '',
              driver_license: profile.driver_license || '',
              nationality: profile.nationality || '',
              address: profile.address || '',
              notes: profile.notes || '',
              status: (profile.status || 'active'),
              id_card_image: profile.id_card_image || '', // إضافة صورة البطاقة الشخصية
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            })) : [];
            
            return processedCustomers as Customer[];
          }
        }
        
        const processedCustomers = Array.isArray(data) ? data.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone_number || profile.phone || '',
          driver_license: profile.driver_license || '',
          nationality: profile.nationality || '',
          address: profile.address || '',
          notes: profile.notes || '',
          status: (profile.status || 'active'),
          id_card_image: profile.id_card_image || '', // إضافة صورة البطاقة الشخصية
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        })) : [];
        
        console.log('Processed customers from profiles:', processedCustomers);
        return processedCustomers as Customer[];
      } catch (catchError: any) {
        console.error('Unexpected error in customer fetch:', catchError);
        toast.error('Error loading customers', { description: catchError?.message || String(catchError) });
        return [];
      }
    },
    initialData: []
  });

  const getCustomer = async (id: string): Promise<Customer | null> => {
    try {
      console.log('Fetching customer with ID:', id);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('*')
        .eq('id', id)
        .eq('role', CUSTOMER_ROLE)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer by ID:', error);
        toast.error('Failed to fetch customer', { description: error.message });
        return null;
      }

      if (!data) {
        console.log('No customer found with ID:', id);
        return null;
      }

      console.log('Raw customer data from profiles:', data);

      const customerData: Customer = {
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone_number ? stripCountryCode(data.phone_number) : '',
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status || 'active'),
        id_card_image: data.id_card_image || '', // ✅ إضافة صورة البطاقة الشخصية
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      return customerData;
    } catch (error: any) {
      console.error('Unexpected error fetching customer:', error);
      toast.error('Failed to fetch customer');
      return null;
    }
  };

  return {
    customers,
    isLoading,
    error,
    refetch,
    getCustomer,
  };
};
