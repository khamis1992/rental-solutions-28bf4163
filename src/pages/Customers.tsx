
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Users } from "lucide-react";
import CustomerList from "@/components/customers/CustomerList";

const Customers = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Customer Management"
        description="Manage your customers and their information"
        icon={Users}
      />
      <CustomerList />
    </PageContainer>
  );
};

export default Customers;
