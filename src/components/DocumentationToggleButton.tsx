
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { useDocumentationMode } from '@/context/DocumentationModeContext';

export const DocumentationToggleButton = () => {
  const { isDocumentationMode, toggleDocumentationMode } = useDocumentationMode();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isExpanded ? (
        <div className="bg-white rounded-lg shadow-lg p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Documentation Mode</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Toggle documentation mode to see helpful tooltips and guides throughout the app.
          </p>
          <Button
            onClick={toggleDocumentationMode}
            variant={isDocumentationMode ? "default" : "outline"}
            size="sm"
            className="w-full"
          >
            {isDocumentationMode ? 'Disable' : 'Enable'} Documentation
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
