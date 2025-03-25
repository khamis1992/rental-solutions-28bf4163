
import React from 'react';
import { Loader2 } from 'lucide-react';

const UploadLoader: React.FC = () => {
  return (
    <div className="py-12 flex flex-col items-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
      <p className="text-sm text-muted-foreground">Processing image...</p>
    </div>
  );
};

export default UploadLoader;
