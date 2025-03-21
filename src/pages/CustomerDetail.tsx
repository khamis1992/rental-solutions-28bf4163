
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { User } from "lucide-react";
import CustomerDetail from "@/components/customers/CustomerDetail";

const CustomerDetailPage = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Customer Details"
        description="View and manage customer information"
        icon={User}
      />
      <CustomerDetail />
    </PageContainer>
  );
};

export default CustomerDetailPage;
