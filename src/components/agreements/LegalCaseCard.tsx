
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalCaseCompactView } from "../legal/LegalCaseCompactView";

interface LegalCaseCardProps {
  agreementId: string;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({ agreementId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Cases</CardTitle>
        <CardDescription>Legal cases associated with this agreement</CardDescription>
      </CardHeader>
      <CardContent>
        <LegalCaseCompactView agreementId={agreementId} />
      </CardContent>
    </Card>
  );
};

export default LegalCaseCard;
