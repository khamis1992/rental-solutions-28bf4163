
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import AgreementForm from "@/components/agreements/AgreementForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { checkStandardTemplateExists } from "@/utils/agreementUtils";
import { ensureStorageBuckets } from "@/utils/setupBuckets";

const AddAgreement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [checkingTemplate, setCheckingTemplate] = useState<boolean>(true);

  // Check if the standard template exists on component mount
  useEffect(() => {
    const setupStorage = async () => {
      try {
        console.log("Setting up storage and ensuring buckets exist...");
        setCheckingTemplate(true);
        
        // First ensure the storage buckets are configured
        const result = await ensureStorageBuckets();
        if (!result.success) {
          console.error("Error setting up storage buckets:", result.error);
          toast({
            title: "Storage Setup Error",
            description: "There was an error setting up storage buckets. Template creation may fail.",
            variant: "destructive"
          });
        } else {
          console.log("Storage buckets setup complete");
        }
        
        // Now check if template exists
        console.log("Checking if agreement template exists...");
        const exists = await checkStandardTemplateExists();
        console.log("Template exists result:", exists);
        setStandardTemplateExists(exists);
        
        if (!exists) {
          toast({
            title: "Template Not Found",
            description: "The standard agreement template was not found. A default template has been created for you.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Template Found",
            description: "The agreement template was found and will be used for new agreements.",
          });
        }
      } catch (error) {
        console.error("Error during template setup:", error);
        setStandardTemplateExists(false);
        toast({
          title: "Error Checking Template",
          description: "There was an error checking for the agreement template. A default template will be used.",
          variant: "destructive"
        });
      } finally {
        setCheckingTemplate(false);
      }
    };
    
    setupStorage();
  }, [toast]);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Create the agreement in the database
      const { data, error } = await supabase
        .from("leases")
        .insert([formData])
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
      <Card>
        <CardHeader>
          <CardTitle>Agreement Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            standardTemplateExists={standardTemplateExists}
            isCheckingTemplate={checkingTemplate}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AddAgreement;
