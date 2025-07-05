
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { CacheSynchronization } from '@/utils/cache-synchronization';
import { ensureIdCardImageColumn } from '@/lib/ensure-id-card-column';

const PROFILES_TABLE = 'profiles';
const CUSTOMER_ROLE = 'customer';

const formatQatarPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/^\+974/, '').trim();
  
  if (/^[3-9]\d{7}$/.test(cleanPhone)) {
    return `+974${cleanPhone}`;
  }
  
  return phone;
};

const stripCountryCode = (phone: string): string => {
  return phone.replace(/^\+974/, '').trim();
};

export const useCustomerDataService = () => {
  const queryClient = useQueryClient();

  // Set the query client for cache synchronization
  CacheSynchronization.setQueryClient(queryClient);

  const createCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id'>) => {
      console.log('Creating new customer with data:', newCustomer);
      
      const formattedPhone = formatQatarPhoneNumber(newCustomer.phone);
      console.log('Formatted phone number:', formattedPhone);
      
      // Ensure id_card_image column exists (create if needed)
      const columnExists = await ensureIdCardImageColumn();
      
      // Prepare insert data with safe handling of id_card_image
      const insertData: any = { 
        full_name: newCustomer.full_name,
        email: newCustomer.email,
        phone_number: formattedPhone,
        address: newCustomer.address,
        driver_license: newCustomer.driver_license,
        nationality: newCustomer.nationality,
        notes: newCustomer.notes,
        status: newCustomer.status || 'active',
        role: CUSTOMER_ROLE,
        created_at: new Date().toISOString() 
      };

      // Only add id_card_image if it exists and column is available
      console.log('🔍 Checking ID card image:', { 
        hasImage: !!newCustomer.id_card_image, 
        imageLength: newCustomer.id_card_image?.length,
        columnExists 
      });
      
      if (newCustomer.id_card_image && columnExists) {
        console.log('✅ ID card image found and column exists, adding to insert data');
        insertData.id_card_image = newCustomer.id_card_image;
        console.log('📝 Final insert data keys:', Object.keys(insertData));
      } else if (newCustomer.id_card_image && !columnExists) {
        console.warn('⚠️ ID card image found but column does not exist - skipping');
        toast.warning('ملاحظة: صورة البطاقة الشخصية لن يتم حفظها حاليًا', {
          description: 'سيتم حفظ باقي بيانات العميل بنجاح'
        });
      } else {
        console.log('ℹ️ No ID card image to save');
      }

      let { data, error } = await supabase
        .from(PROFILES_TABLE)
        .insert([insertData])
        .select()
        .single();

      // If error is about id_card_image column, try without it
      if (error && error.message.includes('id_card_image')) {
        console.warn('id_card_image column not found, retrying without it');
        const { id_card_image, ...insertDataWithoutImage } = insertData;
        
        ({ data, error } = await supabase
          .from(PROFILES_TABLE)
          .insert([insertDataWithoutImage])
          .select()
          .single());
      }

      if (error) {
        console.error('Error creating customer:', error);
        throw new Error(error.message);
      }
      
      console.log('Created customer:', data);
      console.log('🔍 Created customer id_card_image field:', data.id_card_image);
      console.log('📋 All fields in created customer:', Object.keys(data));
      
      if (!data) {
        throw new Error('No data returned after customer creation');
      }
      
      return {
        ...data,
        phone: data.phone_number ? stripCountryCode(data.phone_number) : ''
      } as Customer;
    },
    onSuccess: async () => {
      await CacheSynchronization.invalidateCustomerCaches();
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create customer', { description: error.message });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async (customer: Customer) => {
      const formattedPhone = formatQatarPhoneNumber(customer.phone);
      console.log('Updating customer with formatted phone:', formattedPhone);
      
      // Ensure id_card_image column exists (create if needed)
      const columnExists = await ensureIdCardImageColumn();
      
      // Prepare update data with safe handling of id_card_image
      const updateData: any = { 
        full_name: customer.full_name,
        email: customer.email,
        phone_number: formattedPhone,
        address: customer.address,
        driver_license: customer.driver_license,
        nationality: customer.nationality,
        notes: customer.notes,
        status: customer.status,
        updated_at: new Date().toISOString() 
      };

      // Only add id_card_image if it exists and column is available
      if (customer.id_card_image && columnExists) {
        console.log('ID card image found and column exists, adding to update data');
        updateData.id_card_image = customer.id_card_image;
      } else if (customer.id_card_image && !columnExists) {
        console.warn('ID card image found but column does not exist - skipping');
        toast.warning('ملاحظة: صورة البطاقة الشخصية لن يتم حفظها حاليًا', {
          description: 'سيتم حفظ باقي بيانات العميل بنجاح'
        });
      }

      let { data, error } = await supabase
        .from(PROFILES_TABLE)
        .update(updateData)
        .eq('id', customer.id)
        .select();

      // If error is about id_card_image column, try without it
      if (error && error.message.includes('id_card_image')) {
        console.warn('id_card_image column not found, retrying without it');
        const { id_card_image, ...updateDataWithoutImage } = updateData;
        
        ({ data, error } = await supabase
          .from(PROFILES_TABLE)
          .update(updateDataWithoutImage)
          .eq('id', customer.id)
          .select());
      }

      if (error) throw new Error(error.message);
      
      if (!data || data.length === 0) {
        throw new Error('No data returned after customer update');
      }
      
      return {
        ...data[0],
        phone: data[0].phone_number ? stripCountryCode(data[0].phone_number) : ''
      } as Customer;
    },
    onSuccess: async () => {
      await CacheSynchronization.invalidateCustomerCaches();
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update customer', { description: error.message });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(PROFILES_TABLE)
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: async () => {
      await CacheSynchronization.invalidateCustomerCaches();
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete customer', { description: error.message });
    },
  });

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
