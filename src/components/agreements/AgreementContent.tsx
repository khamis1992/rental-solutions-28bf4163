
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AgreementContentProps {
  content?: string;
  isLoading?: boolean;
}

const AgreementContent: React.FC<AgreementContentProps> = ({ content, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agreement Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agreement Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No content available for this agreement.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {/* Render the content safely */}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AgreementContent;
