import React from "react";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/TooltipWrapper";
import { Plus, Copy, Trash2, Save } from "lucide-react";

interface TemplateActionButtonsProps {
  onCreateTemplate: () => void;
  onDuplicateTemplate: () => void;
  onDeleteTemplate: () => void;
  onSaveTemplate: () => void;
  loading: boolean;
  templatesCount: number;
}

export function TemplateActionButtons({
  onCreateTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  loading,
  templatesCount,
}: TemplateActionButtonsProps) {
  return (
    <div className="flex justify-between pt-2 flex-wrap gap-2 w-full">
      <div className="flex gap-2">
        <TooltipWrapper content="Create a new invoice template.">
          <Button onClick={onCreateTemplate} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Duplicate the selected invoice template.">
          <Button onClick={onDuplicateTemplate} disabled={loading || templatesCount === 0}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Delete the selected invoice template.">
          <Button onClick={onDeleteTemplate} disabled={loading || templatesCount === 0} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </TooltipWrapper>
      </div>
      
      <TooltipWrapper content="Save changes to the current invoice template.">
        <Button onClick={onSaveTemplate} disabled={loading} variant="outline">
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </TooltipWrapper>
    </div>
  );
}
