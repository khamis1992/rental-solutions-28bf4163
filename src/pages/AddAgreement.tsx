
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import AgreementForm from "@/components/agreements/AgreementForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { checkStandardTemplateExists } from "@/utils/agreementUtils";

const AddAgreement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [checkingTemplate, setCheckingTemplate] = useState<boolean>(true);

  // Check if the standard template exists on component mount
  useEffect(() => {
    const checkTemplate = async () => {
      try {
        console.log("Checking if agreement template exists...");
        setCheckingTemplate(true);
        
        // Get the table structure first to log what tables are available
        const { data: tables, error: tablesError } = await supabase
          .from('postgres_tables')
          .select('*');
        
        if (!tablesError) {
          console.log("Available tables:", tables);
        }
        
        const exists = await checkStandardTemplateExists();
        console.log("Template exists result:", exists);
        setStandardTemplateExists(exists);
        
        if (!exists) {
          toast({
            title: "Template not found",
            description: "The agreement template was not found in the database. Creating a new agreement will use the default template format.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Template found",
            description: "The agreement template was found and will be used for new agreements.",
          });
        }
      } catch (error) {
        console.error("Error checking template:", error);
        setStandardTemplateExists(false);
        toast({
          title: "Error checking template",
          description: "There was an error checking for the agreement template.",
          variant: "destructive"
        });
      } finally {
        setCheckingTemplate(false);
      }
    };
    
    checkTemplate();
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
