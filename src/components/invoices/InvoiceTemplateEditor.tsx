import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateEditorSidebar from "./TemplateEditorSidebar";
import TemplateCodeEditor from "./TemplateCodeEditor";
import TemplateTestData from "./TemplateTestData";
import TemplateActionButtons from "./TemplateActionButtons";
import AITemplateGeneratorDialog from './AITemplateGeneratorDialog';

const InvoiceTemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [templateName, setTemplateName] = useState<string>("");
  const [templateDescription, setTemplateDescription] = useState<string>("");
  const [templateCategory, setTemplateCategory] = useState<string>("invoice");
  const [templateContent, setTemplateContent] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>(defaultVariables);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [editMode, setEditMode] = useState<"code" | "preview">("code");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      await initializeTemplates();
      const fetchedTemplates = await fetchTemplates();
      setTemplates(fetchedTemplates);

      if (fetchedTemplates.length > 0) {
        selectTemplate(fetchedTemplates[0]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || "");
    setTemplateCategory(template.category);
    setTemplateContent(template.content);
    setTemplateVariables(template.variables || defaultVariables);
    setPreviewData({});
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      selectTemplate(template);
    }
  };

  const handleCreateTemplate = () => {
    const newTemplate: InvoiceTemplate = {
      id: uuidv4(),
      name: "New Template",
      description: "New template description",
      category: "invoice",
      content: getDefaultTemplate('invoice'),
      variables: defaultVariables,
      isDefault: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTemplates([...templates, newTemplate]);
    selectTemplate(newTemplate);
    toast.success("New template created");
  };

  const handleDuplicateTemplate = () => {
    if (!selectedTemplate) return;

    const duplicateTemplate: InvoiceTemplate = {
      ...selectedTemplate,
      id: uuidv4(),
      name: `${selectedTemplate.name} (Copy)`,
      isDefault: false,
      updated_at: new Date().toISOString()
    };

    setTemplates([...templates, duplicateTemplate]);
    selectTemplate(duplicateTemplate);
    toast.success("Template duplicated");
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLoading(true);
      const updatedTemplate: InvoiceTemplate = {
        ...selectedTemplate,
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        content: templateContent,
        variables: templateVariables,
        updated_at: new Date().toISOString()
      };

      const savedTemplate = await saveTemplate(updatedTemplate);
      
      setTemplates(templates.map(t => t.id === savedTemplate.id ? savedTemplate : t));
      setSelectedTemplate(savedTemplate);
      
      toast.success("Template saved successfully");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLoading(true);
      await deleteTemplate(selectedTemplate.id);
      
      const updatedTemplates = templates.filter(t => t.id !== selectedTemplate.id);
      setTemplates(updatedTemplates);
      
      if (updatedTemplates.length > 0) {
        selectTemplate(updatedTemplates[0]);
      } else {
        handleCreateTemplate();
      }
      
      toast.success("Template deleted");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsLoading(false);
    }
  };

  const insertVariable = (variable: TemplateVariable) => {
    const variableText = `{{${variable.id}}}`;
    setTemplateContent(prev => prev + variableText);
  };

  const generatePreviewHtml = () => {
    return processTemplate(templateContent, previewData);
  };

  const exportTemplateAsHtml = () => {
    const html = templateContent;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTemplateGenerated = (generatedTemplate: string) => {
    console.log("Generated template:", generatedTemplate);
    setTemplateContent(generatedTemplate);
    setEditMode("preview");
    setActiveTab("editor");
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
                selectedTemplateId={selectedTemplate?.id || ""}
                templateName={templateName}
                templateDescription={templateDescription}
                templateCategory={templateCategory}
                templateVariables={templateVariables}
                onTemplateSelect={handleSelectTemplate}
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
            <div className="border rounded-md p-6 min-h-[600px] bg-white">
              <div dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }} />
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
          loading={isLoading}
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
