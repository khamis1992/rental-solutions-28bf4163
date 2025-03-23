
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
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(true);

  // Check if the standard template exists on component mount
  useEffect(() => {
    const checkTemplate = async () => {
      const exists = await checkStandardTemplateExists();
      setStandardTemplateExists(exists);
      
      if (!exists) {
        toast({
          title: "Template not found",
          description: "The standard agreement template was not found in the database.",
          variant: "destructive"
        });
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
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AddAgreement;
