
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  InvoiceTemplate, 
  TemplateVariable, 
  templateCategories 
} from "@/utils/invoiceTemplateUtils";

interface TemplateEditorSidebarProps {
  templates: InvoiceTemplate[];
  selectedTemplateId: string;
  templateName: string;
  templateDescription: string;
  templateCategory: string;
  templateVariables: TemplateVariable[];
  onTemplateSelect: (templateId: string) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onCategoryChange: (category: string) => void;
  onInsertVariable: (variable: TemplateVariable) => void;
  onOpenAIDialog: () => void;
}

const TemplateEditorSidebar: React.FC<TemplateEditorSidebarProps> = ({
  templates,
  selectedTemplateId,
  templateName,
  templateDescription,
  templateCategory,
  templateVariables,
  onTemplateSelect,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onInsertVariable,
  onOpenAIDialog
}) => {
  // Group variables by type for better organization
  const groupVariablesByType = () => {
    const grouped: Record<string, TemplateVariable[]> = {};
    
    templateVariables.forEach(variable => {
      const type = variable.id.includes('company') ? 'Company' :
                   variable.id.includes('client') ? 'Client' :
                   variable.id.includes('invoice') ? 'Invoice' :
                   variable.id.includes('item') ? 'Items' : 'Other';
      
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(variable);
    });
    
    return grouped;
  };

  const variablesByType = groupVariablesByType();

  return (
    <div className="space-y-4 w-full md:w-1/3">
      <div className="space-y-2">
        <Label htmlFor="template-select">Select Template</Label>
        <Select value={selectedTemplateId} onValueChange={onTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} {t.isDefault && <Badge variant="outline" className="ml-2">Default</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter template name"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="template-description">Description</Label>
        <Input
          id="template-description"
          value={templateDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter template description"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="template-category">Category</Label>
        <Select value={templateCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {templateCategories.map(category => (
              <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        variant="secondary" 
        className="w-full flex items-center justify-center gap-2"
        onClick={onOpenAIDialog}
      >
        <Sparkles className="h-4 w-4" />
        Generate with AI
      </Button>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Available Variables</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Using Variables</h4>
                <p className="text-sm text-muted-foreground">
                  Click on a variable to insert it into your template. Variables will be replaced with actual data when generating invoices.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          {Object.entries(variablesByType).map(([type, variables]) => (
            <div key={type} className="space-y-1">
              <div className="text-sm font-medium capitalize">{type}</div>
              <div className="grid grid-cols-2 gap-2">
                {variables.map(variable => (
                  <Button 
                    key={variable.id}
                    variant="outline" 
                    size="sm"
                    onClick={() => onInsertVariable(variable)}
                    className="justify-start text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    title={variable.description}
                  >
                    {variable.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorSidebar;
