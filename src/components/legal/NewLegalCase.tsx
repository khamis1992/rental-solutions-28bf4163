
import React from 'react';
import LegalCaseCard from './LegalCaseCard';

/**
 * NewLegalCase component for creating new legal cases
 */
const NewLegalCase = () => {
  // Providing a default empty string value for agreementId
  // since it's required in LegalCaseCard
  return <LegalCaseCard agreementId="" />;
};

export default NewLegalCase;
