
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import LegalCaseForm from './form/LegalCaseForm';

const LegalCaseCard: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <LegalCaseForm />
      </CardContent>
    </Card>
  );
};

export default LegalCaseCard;
