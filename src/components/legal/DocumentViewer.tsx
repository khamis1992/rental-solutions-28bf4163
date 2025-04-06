
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentViewerProps {
  content: string;
  title?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ content, title }) => {
  return (
    <Card className="w-full h-full">
      {title && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-200px)] p-4">
        <div className="prose max-w-none">
          {content}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DocumentViewer;
