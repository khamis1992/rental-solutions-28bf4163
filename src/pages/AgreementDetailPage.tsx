
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement, forceGeneratePaymentForAgreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle, Calendar, RefreshCcw, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { supabase } from '@/lib/supabase';
import { manuallyRunPaymentMaintenance } from '@/lib/supabase';
import { getDateObject } from '@/lib/date-utils';
import { usePayments } from '@/hooks/use-payments';
import { fixAgreementPayments } from '@/lib/supabase';
import { analyzeAgreementStatus } from '@/utils/translation-utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Check, Clock } from 'lucide-react';

// Analysis result type
interface AnalysisResult {
  recommendedStatus: string;
  confidence: number;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
  actionItems: string[];
  agreementId: string;
  analyzedAt: string;
  currentStatus: string;
}

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement, updateAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  
  const { payments, isLoadingPayments, fetchPayments } = usePayments(id || '', rentAmount);

  const fetchAgreementData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getAgreement(id);
      
      if (data) {
        const adaptedAgreement = adaptSimpleToFullAgreement(data);
        
        if (adaptedAgreement.start_date) {
          const safeDate = getDateObject(adaptedAgreement.start_date);
          adaptedAgreement.start_date = safeDate || new Date();
        }
        
        if (adaptedAgreement.end_date) {
          const safeDate = getDateObject(adaptedAgreement.end_date);
          adaptedAgreement.end_date = safeDate || new Date();
        }
        
        if (adaptedAgreement.created_at) {
          const safeDate = getDateObject(adaptedAgreement.created_at);
          adaptedAgreement.created_at = safeDate;
        }
        
        if (adaptedAgreement.updated_at) {
          const safeDate = getDateObject(adaptedAgreement.updated_at);
          adaptedAgreement.updated_at = safeDate;
        }
        
        setAgreement(adaptedAgreement);
        fetchPayments();
        
        // Fetch latest analysis result
        fetchAnalysisResult(adaptedAgreement.id);
      } else {
        toast.error("Agreement not found");
        navigate("/agreements");
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error('Failed to load agreement details');
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  };

  const fetchAnalysisResult = async (agreementId: string) => {
    try {
      const { data, error } = await supabase
        .from('agreement_analysis_results')
        .select('*')
        .eq('agreement_id', agreementId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is ok
        console.error("Error fetching analysis:", error);
      } else if (data) {
        setAnalysisResult({
          recommendedStatus: data.recommended_status,
          confidence: data.confidence,
          explanation: data.explanation,
          riskLevel: data.risk_level as 'low' | 'medium' | 'high',
          actionItems: data.action_items || [],
          agreementId: data.agreement_id,
          analyzedAt: data.analyzed_at,
          currentStatus: data.current_status
        });
      }
    } catch (error) {
      console.error("Error fetching analysis result:", error);
    }
  };

  useEffect(() => {
    if (id && (!hasAttemptedFetch || refreshTrigger > 0)) {
      fetchAgreementData();
    }
  }, [id, refreshTrigger]);

  useEffect(() => {
    if (id && !isLoading && agreement && payments && payments.length > 0) {
      const paymentDates = payments
        .filter(p => p.original_due_date)
        .map(p => {
          const date = new Date(p.original_due_date as string);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });
      
      const monthCounts = paymentDates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const hasDuplicates = Object.values(monthCounts).some(count => count > 1);
      
      if (hasDuplicates) {
        console.log("Detected duplicate payments - will fix automatically");
        fixAgreementPayments(id).then(() => {
          fetchPayments();
        });
      }
    }
  }, [id, isLoading, agreement, payments]);

  const handleDelete = async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success("Agreement deleted successfully");
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    }
  };

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  const handleGeneratePayment = async () => {
    if (!id || !agreement) return;
    
    setIsGeneratingPayment(true);
    try {
      const result = await forceGeneratePaymentForAgreement(supabase, id);
      
      if (result.success) {
        toast.success("Payment schedule generated successfully");
        refreshAgreementData();
      } else {
        toast.error(`Failed to generate payment: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error generating payment:", error);
      toast.error("Failed to generate payment schedule");
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleRunMaintenanceJob = async () => {
    if (!id) return;
    
    setIsRunningMaintenance(true);
    try {
      toast.info("Running payment maintenance check...");
      const result = await manuallyRunPaymentMaintenance();
      
      if (result.success) {
        toast.success(result.message || "Payment schedule maintenance completed");
        refreshAgreementData();
        fetchPayments();
      } else {
        toast.error(result.message || "Payment maintenance failed");
      }
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast.error("Failed to run maintenance job");
    } finally {
      setIsRunningMaintenance(false);
    }
  };
  
  const handleAnalyzeAgreement = async () => {
    if (!id || !agreement) return;
    
    setIsAnalyzing(true);
    try {
      toast.info("Analyzing agreement with AI...");
      
      const result = await analyzeAgreementStatus(agreement);
      setAnalysisResult(result);
      
      // Save analysis to database
      await supabase
        .from('agreement_analysis_results')
        .upsert({
          agreement_id: agreement.id,
          recommended_status: result.recommendedStatus,
          confidence: result.confidence,
          current_status: agreement.status,
          risk_level: result.riskLevel,
          analyzed_at: result.analyzedAt,
          explanation: result.explanation,
          action_items: result.actionItems
        }, {
          onConflict: 'agreement_id'
        });
      
      toast.success("Agreement analysis completed");
    } catch (error) {
      console.error("Error analyzing agreement:", error);
      toast.error("Failed to analyze agreement");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleApplyRecommendation = async () => {
    if (!id || !agreement || !analysisResult) return;
    
    try {
      toast.info("Applying recommended status...");
      
      await updateAgreement.mutateAsync({
        id,
        data: {
          status: analysisResult.recommendedStatus,
          updated_at: new Date().toISOString(),
          last_ai_update: new Date().toISOString()
        }
      });
      
      toast.success("Agreement status updated successfully");
      refreshAgreementData();
    } catch (error) {
      console.error("Error updating agreement status:", error);
      toast.error("Failed to update agreement status");
    }
  };

  const renderAnalysisCard = () => {
    if (!analysisResult) return null;
    
    const isStatusDifferent = analysisResult.recommendedStatus !== analysisResult.currentStatus;
    const riskColor = 
      analysisResult.riskLevel === 'high' ? 'text-red-500' : 
      analysisResult.riskLevel === 'medium' ? 'text-amber-500' : 
      'text-green-500';
    
    return (
      <Card className="mt-6 border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">AI Status Analysis</CardTitle>
            </div>
            <Badge variant={isStatusDifferent ? "destructive" : "outline"}>
              {new Date(analysisResult.analyzedAt).toLocaleString()}
            </Badge>
          </div>
          <CardDescription>
            Analyzed with {(analysisResult.confidence * 100).toFixed(0)}% confidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Current Status</p>
                <Badge variant="outline" className="mt-1">
                  {analysisResult.currentStatus}
                </Badge>
              </div>
              <div className="text-center">
                {isStatusDifferent && (
                  <Clock className="mx-auto h-6 w-6 text-amber-500" />
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">Recommended Status</p>
                <Badge variant={isStatusDifferent ? "destructive" : "outline"} className="mt-1">
                  {analysisResult.recommendedStatus}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="font-semibold flex items-center gap-2">
                <span>Risk Level:</span> 
                <span className={riskColor}>
                  {analysisResult.riskLevel.charAt(0).toUpperCase() + analysisResult.riskLevel.slice(1)}
                </span>
              </p>
            </div>
            
            <div>
              <p className="font-semibold">Analysis:</p>
              <p className="mt-1 text-sm text-muted-foreground">{analysisResult.explanation}</p>
            </div>
            
            {analysisResult.actionItems.length > 0 && (
              <div>
                <p className="font-semibold">Recommended Actions:</p>
                <ul className="mt-1 text-sm space-y-1">
                  {analysisResult.actionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {isStatusDifferent && (
              <div className="pt-2">
                <Button 
                  onClick={handleApplyRecommendation} 
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Apply Recommended Status
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageContainer
      title="Agreement Details"
      description="View and manage rental agreement details"
      backLink="/agreements"
      actions={
        <>
          {agreement && agreement.status === AgreementStatus.ACTIVE && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGeneratePayment}
              disabled={isGeneratingPayment}
              className="gap-2 mr-2"
            >
              <Calendar className="h-4 w-4" />
              {isGeneratingPayment ? "Generating..." : "Generate Payment Schedule"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunMaintenanceJob}
            disabled={isRunningMaintenance}
            className="gap-2 mr-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {isRunningMaintenance ? "Running..." : "Run Payment Maintenance"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeAgreement}
            disabled={isAnalyzing}
            className="gap-2"
          >
            <Cpu className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div>
      ) : agreement ? (
        <>
          {renderAnalysisCard()}
          
          <AgreementDetail 
            agreement={agreement}
            onDelete={handleDelete}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
            onPaymentDeleted={refreshAgreementData}
            onDataRefresh={refreshAgreementData}
            onGenerateDocument={handleGenerateDocument}
          />
          
          <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
            <DialogContent className="max-w-4xl">
              <InvoiceGenerator 
                recordType="agreement" 
                recordId={agreement.id} 
                onClose={() => setIsDocumentDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground mb-4">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>
            Return to Agreements
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
