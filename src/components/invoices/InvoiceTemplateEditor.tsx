import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Save, Trash2, Eye, Copy, Download, Upload, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { 
  InvoiceTemplate, 
  TemplateVariable, 
  defaultVariables,
  templateCategories,
  getDefaultTemplate,
  processTemplate,
  saveTemplate,
  fetchTemplates,
  deleteTemplate,
  initializeTemplates
} from "@/utils/invoiceTemplateUtils";
import TemplatePreview from "./TemplatePreview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import AITemplateGeneratorDialog from './AITemplateGeneratorDialog';

const InvoiceTemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [editMode, setEditMode] = useState<"code" | "preview">("code");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("editor");
  
  const [templateName, setTemplateName] = useState<string>("");
  const [templateDescription, setTemplateDescription] = useState<string>("");
  const [templateContent, setTemplateContent] = useState<string>("");
  const [templateCategory, setTemplateCategory] = useState<string>("invoice");
  const [isTemplateDefault, setIsTemplateDefault] = useState<boolean>(false);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>(defaultVariables);
  
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  
  const [isAIDialogOpen, setIsAIDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    loadTemplates();
  }, []);
  
  useEffect(() => {
    const initialPreviewData: Record<string, string> = {};
    templateVariables.forEach(variable => {
      initialPreviewData[variable.id] = variable.defaultValue;
    });
    setPreviewData(initialPreviewData);
  }, [templateVariables]);
  
  const loadTemplates = async () => {
    try {
      setLoading(true);
      await initializeTemplates();
      const loadedTemplates = await fetchTemplates();
      
      setTemplates(loadedTemplates);
      
      if (loadedTemplates.length > 0) {
        const defaultTemplate = loadedTemplates.find(t => t.isDefault) || loadedTemplates[0];
        selectTemplate(defaultTemplate.id);
      }
    } catch (error: any) {
      toast.error(`Failed to load templates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const selectTemplate = (templateId: string) => {
    const selected = templates.find(t => t.id === templateId);
    if (selected) {
      setSelectedTemplateId(templateId);
      setTemplateName(selected.name);
      setTemplateDescription(selected.description);
      setTemplateContent(selected.content);
      setTemplateCategory(selected.category);
      setIsTemplateDefault(selected.isDefault);
      setTemplateVariables(selected.variables || defaultVariables);
    }
  };
  
  const handleCreateTemplate = () => {
    const newTemplate: InvoiceTemplate = {
      id: `template-${uuidv4()}`,
      name: "New Template",
      description: "Template description",
      content: getDefaultTemplate(templateCategory),
      category: templateCategory,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      variables: defaultVariables,
    };
    
    setTemplates([...templates, newTemplate]);
    selectTemplate(newTemplate.id);
    toast.success("New template created");
  };
  
  const handleDuplicateTemplate = () => {
    const selected = templates.find(t => t.id === selectedTemplateId);
    if (!selected) return;
    
    const duplicated: InvoiceTemplate = {
      ...selected,
      id: `template-${uuidv4()}`,
      name: `${selected.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setTemplates([...templates, duplicated]);
    selectTemplate(duplicated.id);
    toast.success("Template duplicated");
  };
  
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    
    try {
      setLoading(true);
      
      const templateToSave = {
        id: selectedTemplateId,
        name: templateName,
        description: templateDescription,
        content: templateContent,
        category: templateCategory,
        isDefault: isTemplateDefault,
        variables: templateVariables,
      };
      
      await saveTemplate(templateToSave);
      
      await loadTemplates();
      
      toast.success("Template saved successfully");
    } catch (error: any) {
      toast.error(`Failed to save template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTemplate = async () => {
    if (templates.length <= 1) {
      toast.error("Cannot delete the only template");
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteTemplate(selectedTemplateId);
      
      await loadTemplates();
      
      toast.success("Template deleted successfully");
    } catch (error: any) {
      toast.error(`Failed to delete template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const insertVariable = (variable: TemplateVariable) => {
    const textArea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (!textArea) return;
    
    const cursorPosition = textArea.selectionStart;
    const textBeforeCursor = templateContent.substring(0, cursorPosition);
    const textAfterCursor = templateContent.substring(cursorPosition);
    
    const newContent = `${textBeforeCursor}${variable.name}${textAfterCursor}`;
    setTemplateContent(newContent);
    
    setTimeout(() => {
      textArea.focus();
      textArea.selectionStart = cursorPosition + variable.name.length;
      textArea.selectionEnd = cursorPosition + variable.name.length;
    }, 0);
  };
  
  const generatePreviewHtml = useCallback(() => {
    if (!templateContent) return '<div class="p-4">No template content</div>';
    return processTemplate(templateContent, previewData);
  }, [templateContent, previewData]);
  
  const exportTemplateAsHtml = () => {
    const blob = new Blob([templateContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getVariablesByCategory = () => {
    const grouped: Record<string, TemplateVariable[]> = {};
    
    templateVariables.forEach(variable => {
      if (!grouped[variable.category]) {
        grouped[variable.category] = [];
      }
      grouped[variable.category].push(variable);
    });
    
    return grouped;
  };
  
  const variablesByCategory = getVariablesByCategory();
  
  const handleTemplateGenerated = (generatedTemplate: string) => {
    setTemplateContent(generatedTemplate);
    toast.success("AI template loaded into editor. Review and save it.");
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="editor" className="flex-1">Template Editor</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
            <TabsTrigger value="data" className="flex-1">Test Data</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="space-y-6 pt-4">
          <TabsContent value="editor" className="space-y-6 mt-0">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-4 w-full md:w-1/3">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Select Template</Label>
                  <Select value={selectedTemplateId} onValueChange={selectTemplate}>
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
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Enter template description"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select value={templateCategory} onValueChange={setTemplateCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="secondary" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setIsAIDialogOpen(true)}
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
                    {Object.entries(variablesByCategory).map(([category, variables]) => (
                      <div key={category} className="space-y-1">
                        <div className="text-sm font-medium capitalize">{category}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {variables.map(variable => (
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
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3 space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="template-content">Template HTML</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditMode(editMode === "code" ? "preview" : "code")}
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
                      onClick={exportTemplateAsHtml}
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
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Enter your invoice template HTML here..."
                    className="min-h-[500px] font-mono text-sm"
                  />
                ) : (
                  <TemplatePreview html={generatePreviewHtml()} className="min-h-[500px]" />
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <div className="p-2 bg-gray-50 rounded-md">
              <TemplatePreview html={generatePreviewHtml()} />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
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
                      onChange={(e) => setPreviewData({ ...previewData, [variable.id]: e.target.value })}
                      placeholder={variable.description}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-2 flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateTemplate}
            className="flex gap-1 items-center"
          >
            <Plus className="h-4 w-4" /> New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateTemplate}
            className="flex gap-1 items-center"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteTemplate}
            disabled={templates.length <= 1 || loading}
            className="flex gap-1 items-center text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
        
        <Button
          onClick={handleSaveTemplate}
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

      <AITemplateGeneratorDialog 
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        onTemplateGenerated={handleTemplateGenerated}
        variables={templateVariables}
        templateType={templateCategory}
      />
    </Card>
  );
};

export default InvoiceTemplateEditor;
