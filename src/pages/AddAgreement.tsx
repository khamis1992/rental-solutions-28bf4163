
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import AgreementForm from "@/components/agreements/AgreementForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { TemplateUploader } from "@/components/agreements/TemplateUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ensureStorageBuckets } from "@/utils/setupBuckets";

const AddAgreement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [isBucketReady, setIsBucketReady] = useState(false);

  // Check and create buckets if needed on component mount
  useEffect(() => {
    const setupBuckets = async () => {
      const success = await ensureStorageBuckets();
      setIsBucketReady(success);
      
      if (!success) {
        toast({
          title: "Storage setup issue",
          description: "There was a problem setting up storage. Template uploads may not work.",
          variant: "destructive"
        });
      }
    };
    
    setupBuckets();
  }, [toast]);

  const handleTemplateUpload = (url: string) => {
    setTemplateUrl(url);
    toast({
      title: "Template uploaded",
      description: "The agreement template has been successfully uploaded.",
    });
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Add the template URL to the agreement data if one was uploaded
      const agreementData = {
        ...formData,
        template_url: templateUrl,
      };

      // Create the agreement in the database
      const { data, error } = await supabase
        .from("leases")
        .insert([agreementData])
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Agreement created",
        description: "The agreement has been successfully created.",
      });

      // Navigate to the agreement detail page
      navigate(`/agreements/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating agreement",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create New Agreement" 
      description="Create a new rental agreement with a customer"
      backLink="/agreements"
    >
      <Tabs defaultValue="form">
        <TabsList className="mb-4">
          <TabsTrigger value="form">Agreement Form</TabsTrigger>
          <TabsTrigger value="template">Agreement Template</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Information</CardTitle>
            </CardHeader>
            <CardContent>
              <AgreementForm onSubmit={handleSubmit} isSubmitting={isSubmitting} templateUrl={templateUrl} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Upload Agreement Template</CardTitle>
            </CardHeader>
            <CardContent>
              {!isBucketReady && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 mb-4 rounded-md">
                  Setting up storage... Template uploads might not work until this is complete.
                </div>
              )}
              <TemplateUploader 
                onUploadComplete={handleTemplateUpload} 
                currentTemplate={templateUrl} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default AddAgreement;
