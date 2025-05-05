
import React from 'react';
import LegalCaseCard from './LegalCaseCard';

/**
 * NewLegalCase component for creating new legal cases
 */
const NewLegalCase = () => {
  // Providing a default empty string or null value for agreementId
  // depending on how LegalCaseCard is implemented
  return <LegalCaseCard agreementId={null} />;
};

export default NewLegalCase;
