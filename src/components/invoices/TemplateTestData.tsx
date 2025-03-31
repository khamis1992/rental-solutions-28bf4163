
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateVariable } from "@/utils/invoiceTemplateUtils";

interface TemplateTestDataProps {
  templateVariables: TemplateVariable[];
  previewData: Record<string, string>;
  onPreviewDataChange: (data: Record<string, string>) => void;
}

const TemplateTestData: React.FC<TemplateTestDataProps> = ({
  templateVariables,
  previewData,
  onPreviewDataChange
}) => {
  const handleInputChange = (variableId: string, value: string) => {
    onPreviewDataChange({
      ...previewData,
      [variableId]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templateVariables.map(variable => (
          <div key={variable.id} className="space-y-1">
            <Label htmlFor={`var-${variable.id}`} className="text-sm">
              {variable.description}
            </Label>
            <Input
              id={`var-${variable.id}`}
              value={previewData[variable.id] || variable.defaultValue}
              onChange={(e) => handleInputChange(variable.id, e.target.value)}
              placeholder={variable.description}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateTestData;
