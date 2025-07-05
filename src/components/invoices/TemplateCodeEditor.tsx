
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Download } from "lucide-react";
import TemplatePreview from "./TemplatePreview";

interface TemplateCodeEditorProps {
  templateContent: string;
  editMode: "code" | "preview";
  onContentChange: (content: string) => void;
  onEditModeChange: (mode: "code" | "preview") => void;
  onExportTemplate: () => void;
  generatePreviewHtml: () => string;
}

const TemplateCodeEditor: React.FC<TemplateCodeEditorProps> = ({
  templateContent,
  editMode,
  onContentChange,
  onEditModeChange,
  onExportTemplate,
  generatePreviewHtml
}) => {
  return (
    <div className="w-full md:w-2/3 space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="template-content">Template HTML</Label>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditModeChange(editMode === "code" ? "preview" : "code")}
            className="text-xs"
          >
            {editMode === "preview" ? (
              <>Edit <Eye className="ml-1 h-3 w-3" /></>
            ) : (
              <>Preview <Eye className="ml-1 h-3 w-3" /></>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportTemplate}
            className="text-xs"
          >
            <Download className="mr-1 h-3 w-3" /> Export HTML
          </Button>
        </div>
      </div>
      
      {editMode === "code" ? (
        <Textarea
          id="template-content"
          value={templateContent}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter your invoice template HTML here..."
          className="min-h-[500px] font-mono text-sm"
        />
      ) : (
        <TemplatePreview html={generatePreviewHtml()} className="min-h-[500px]" />
      )}
    </div>
  );
};

export default TemplateCodeEditor;
