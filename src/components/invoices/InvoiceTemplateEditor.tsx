
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Save, Trash2, Eye, Copy } from "lucide-react";
import { toast } from "sonner";

interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  defaultValue: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
}

const defaultVariables: TemplateVariable[] = [
  { id: "companyName", name: "{{companyName}}", description: "Company name", defaultValue: "Your Company Name" },
  { id: "invoiceNumber", name: "{{invoiceNumber}}", description: "Invoice number", defaultValue: "INV-001" },
  { id: "customerName", name: "{{customerName}}", description: "Customer name", defaultValue: "Customer Name" },
  { id: "customerEmail", name: "{{customerEmail}}", description: "Customer email", defaultValue: "customer@example.com" },
  { id: "invoiceDate", name: "{{invoiceDate}}", description: "Invoice date", defaultValue: "2023-07-15" },
  { id: "dueDate", name: "{{dueDate}}", description: "Due date", defaultValue: "2023-08-15" },
  { id: "totalAmount", name: "{{totalAmount}}", description: "Total amount", defaultValue: "1000.00" },
  { id: "tax", name: "{{tax}}", description: "Tax amount", defaultValue: "50.00" },
  { id: "currency", name: "{{currency}}", description: "Currency", defaultValue: "QAR" },
];

const defaultTemplate = `
Dear {{customerName}},

Invoice: {{invoiceNumber}}
Date: {{invoiceDate}}
Due Date: {{dueDate}}

Thank you for your business with {{companyName}}. Please find below the details of your invoice.

Total Amount: {{currency}} {{totalAmount}}
Tax: {{currency}} {{tax}}

Payment is due by {{dueDate}}. Please make your payment promptly to avoid any late fees.

For any questions regarding this invoice, please contact our finance department.

Best Regards,
{{companyName}}
`;

const InvoiceTemplateEditor: React.FC = () => {
  const [template, setTemplate] = useState<InvoiceTemplate>({
    id: "default",
    name: "Standard Invoice",
    description: "Default invoice template for all customers",
    content: defaultTemplate,
    variables: defaultVariables,
  });
  
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    {
      id: "default",
      name: "Standard Invoice",
      description: "Default invoice template for all customers",
      content: defaultTemplate,
      variables: defaultVariables,
    },
    {
      id: "reminder",
      name: "Payment Reminder",
      description: "Template for payment reminder notices",
      content: "This is a reminder that your payment is due...",
      variables: defaultVariables,
    }
  ]);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState("default");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    const selected = templates.find(t => t.id === templateId);
    if (selected) {
      setTemplate(selected);
      setSelectedTemplateId(templateId);
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTemplate({...template, content: e.target.value});
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate({...template, name: e.target.value});
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate({...template, description: e.target.value});
  };
  
  const saveTemplate = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to save template
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the templates list
      const updatedTemplates = templates.map(t => 
        t.id === template.id ? template : t
      );
      
      setTemplates(updatedTemplates);
      toast.success("Template saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save template: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const duplicateTemplate = () => {
    const newTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    
    setTemplates([...templates, newTemplate]);
    setTemplate(newTemplate);
    setSelectedTemplateId(newTemplate.id);
    toast.success("Template duplicated successfully!");
  };
  
  const createNewTemplate = () => {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: "New Template",
      description: "Template description",
      content: "",
      variables: defaultVariables,
    };
    
    setTemplates([...templates, newTemplate]);
    setTemplate(newTemplate);
    setSelectedTemplateId(newTemplate.id);
  };
  
  const deleteTemplate = async () => {
    if (templates.length <= 1) {
      toast.error("Cannot delete the only template");
      return;
    }
    
    try {
      setLoading(true);
      
      // Simulate API call to delete template
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from templates list
      const updatedTemplates = templates.filter(t => t.id !== template.id);
      setTemplates(updatedTemplates);
      
      // Select the first template
      setTemplate(updatedTemplates[0]);
      setSelectedTemplateId(updatedTemplates[0].id);
      
      toast.success("Template deleted successfully!");
    } catch (error: any) {
      toast.error("Failed to delete template: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };
  
  const renderPreview = () => {
    let preview = template.content;
    
    template.variables.forEach(variable => {
      preview = preview.replace(
        new RegExp(variable.name, 'g'), 
        variable.defaultValue
      );
    });
    
    return preview;
  };
  
  const insertVariable = (variable: TemplateVariable) => {
    const textArea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (!textArea) return;
    
    const cursorPosition = textArea.selectionStart;
    const textBeforeCursor = template.content.substring(0, cursorPosition);
    const textAfterCursor = template.content.substring(cursorPosition);
    
    const newContent = `${textBeforeCursor}${variable.name}${textAfterCursor}`;
    setTemplate({...template, content: newContent});
    
    // Set focus back to textarea with cursor after the inserted variable
    setTimeout(() => {
      textArea.focus();
      textArea.selectionStart = cursorPosition + variable.name.length;
      textArea.selectionEnd = cursorPosition + variable.name.length;
    }, 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Invoice Template Editor
        </CardTitle>
        <CardDescription>
          Create and customize invoice templates for your business
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-4 w-full md:w-1/3">
            <div className="space-y-2">
              <Label htmlFor="template-select">Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={template.name}
                onChange={handleNameChange}
                placeholder="Enter template name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={template.description}
                onChange={handleDescriptionChange}
                placeholder="Enter template description"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="grid grid-cols-2 gap-2">
                {template.variables.map(variable => (
                  <Button 
                    key={variable.id}
                    variant="outline" 
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="justify-start text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    title={variable.description}
                  >
                    {variable.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-2/3 space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="template-content">Template Content</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={togglePreviewMode}
                className="text-xs"
              >
                {previewMode ? (
                  <>Edit <Eye className="ml-1 h-3 w-3" /></>
                ) : (
                  <>Preview <Eye className="ml-1 h-3 w-3" /></>
                )}
              </Button>
            </div>
            
            {previewMode ? (
              <div className="border rounded-md p-4 min-h-[300px] whitespace-pre-wrap">
                {renderPreview()}
              </div>
            ) : (
              <Textarea
                id="template-content"
                value={template.content}
                onChange={handleContentChange}
                placeholder="Enter your invoice template content here..."
                className="min-h-[300px] font-mono"
              />
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={createNewTemplate}
            className="flex gap-1 items-center"
          >
            <Plus className="h-4 w-4" /> New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={duplicateTemplate}
            className="flex gap-1 items-center"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteTemplate}
            disabled={templates.length <= 1 || loading}
            className="flex gap-1 items-center text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
        
        <Button
          onClick={saveTemplate}
          disabled={loading}
          className="flex gap-1 items-center"
        >
          {loading ? "Saving..." : (
            <>
              <Save className="h-4 w-4" /> Save Template
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InvoiceTemplateEditor;
