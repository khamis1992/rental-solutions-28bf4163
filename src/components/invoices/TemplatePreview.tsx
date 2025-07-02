
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TemplatePreviewProps {
  html: string;
  className?: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ html, className = '' }) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <iframe
          srcDoc={html}
          title="Template Preview"
          className="w-full h-[600px] border-0"
          sandbox="allow-same-origin"
        />
      </CardContent>
    </Card>
  );
};

export default TemplatePreview;
