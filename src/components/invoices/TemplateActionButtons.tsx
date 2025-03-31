
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, Save } from "lucide-react";

interface TemplateActionButtonsProps {
  onCreateTemplate: () => void;
  onDuplicateTemplate: () => void;
  onDeleteTemplate: () => void;
  onSaveTemplate: () => void;
  loading: boolean;
  templatesCount: number;
}

const TemplateActionButtons: React.FC<TemplateActionButtonsProps> = ({
  onCreateTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  loading,
  templatesCount
}) => {
  return (
    <div className="flex justify-between pt-2 flex-wrap gap-2 w-full">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateTemplate}
          className="flex gap-1 items-center"
        >
          <Plus className="h-4 w-4" /> New
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicateTemplate}
          className="flex gap-1 items-center"
        >
          <Copy className="h-4 w-4" /> Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteTemplate}
          disabled={templatesCount <= 1 || loading}
          className="flex gap-1 items-center text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
      
      <Button
        onClick={onSaveTemplate}
        disabled={loading}
        className="flex gap-1 items-center"
      >
        {loading ? "Saving..." : (
          <>
            <Save className="h-4 w-4" /> Save Template
          </>
        )}
      </Button>
    </div>
  );
};

export default TemplateActionButtons;
