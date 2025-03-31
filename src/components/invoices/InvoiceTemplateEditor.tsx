
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { 
  InvoiceTemplate, 
  TemplateVariable, 
  defaultVariables,
  getDefaultTemplate,
  processTemplate,
  saveTemplate,
  fetchTemplates,
  deleteTemplate,
  initializeTemplates
} from "@/utils/invoiceTemplateUtils";
import TemplatePreview from "./TemplatePreview";
import AITemplateGeneratorDialog from './AITemplateGeneratorDialog';
import TemplateEditorSidebar from "./TemplateEditorSidebar";
import TemplateCodeEditor from "./TemplateCodeEditor";
import TemplateTestData from "./TemplateTestData";
import TemplateActionButtons from "./TemplateActionButtons";

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
              <TemplateEditorSidebar 
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                templateName={templateName}
                templateDescription={templateDescription}
                templateCategory={templateCategory}
                templateVariables={templateVariables}
                onSelectTemplate={selectTemplate}
                onNameChange={setTemplateName}
                onDescriptionChange={setTemplateDescription}
                onCategoryChange={setTemplateCategory}
                onInsertVariable={insertVariable}
                onOpenAIDialog={() => setIsAIDialogOpen(true)}
              />
              
              <TemplateCodeEditor 
                templateContent={templateContent}
                editMode={editMode}
                onContentChange={setTemplateContent}
                onEditModeChange={setEditMode}
                onExportTemplate={exportTemplateAsHtml}
                generatePreviewHtml={generatePreviewHtml}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <div className="p-2 bg-gray-50 rounded-md">
              <TemplatePreview html={generatePreviewHtml()} />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <TemplateTestData 
              templateVariables={templateVariables}
              previewData={previewData}
              onPreviewDataChange={setPreviewData}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter>
        <TemplateActionButtons 
          onCreateTemplate={handleCreateTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onSaveTemplate={handleSaveTemplate}
          loading={loading}
          templatesCount={templates.length}
        />
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
