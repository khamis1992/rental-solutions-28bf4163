
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Edit } from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const EditCustomer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id]);

  const fetchCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error: any) {
      console.error("Error fetching customer:", error.message);
      toast.error("Failed to load customer details");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Customer not found</h2>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title={`Edit Customer: ${customer.first_name} ${customer.last_name}`}
        description="Update customer information"
        icon={Edit}
      />
      <CustomerForm 
        defaultValues={customer} 
        customerId={id} 
        isEditing={true} 
      />
    </PageContainer>
  );
};

export default EditCustomer;
