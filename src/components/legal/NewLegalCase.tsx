
import React from 'react';
import LegalCaseCard from './LegalCaseCard';
import { useParams } from 'react-router-dom';

/**
 * NewLegalCase component for creating new legal cases
 * If an agreementId is not provided in URL params, it passes an empty string
 */
const NewLegalCase = () => {
  // Get agreementId from URL params if available
  const { agreementId } = useParams<{ agreementId?: string }>();
  
  // Pass the agreementId to the LegalCaseCard component with a fallback to empty string
  return <LegalCaseCard agreementId={agreementId || ""} />;
};

export default NewLegalCase;
