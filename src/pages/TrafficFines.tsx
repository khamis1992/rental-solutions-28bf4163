
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { AlertTriangle } from "lucide-react";
import { useParams } from "react-router-dom";
import { AgreementTrafficFines } from "@/components/agreements/AgreementTrafficFines";
import { useAgreement } from "@/hooks/use-agreements";
import { UUID } from '@/types/database-types';

const TrafficFines = () => {
  const { id } = useParams<{ id: string }>();
  const { agreement, isLoading, error } = useAgreement(id as UUID);
  
  return (
    <PageContainer>
      <SectionHeader
        title="Traffic Fines Management"
        description="Record, track, validate, and manage traffic violations"
        icon={AlertTriangle}
      />
      
      {id && (
        <AgreementTrafficFines 
          agreementId={id}
          startDate={agreement?.start_date}
          endDate={agreement?.end_date}
        />
      )}
    </PageContainer>
  );
};

export default TrafficFines;
