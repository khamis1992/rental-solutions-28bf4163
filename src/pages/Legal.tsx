
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel, FileText, Scale, Languages } from 'lucide-react';
import CustomerLegalObligations from '@/components/legal/CustomerLegalObligations';
import TrafficReportTab from '@/components/legal/TrafficReportTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const Legal = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("obligations");
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleTabChange = (value: string) => {
    // This ensures we don't refresh the page when changing tabs
    console.log(`Tab changed to: ${value}`);
    setActiveTab(value);
  };

  // Simulate progress updates during report generation
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      setGenerationProgress(10);
      
      interval = setInterval(() => {
        setGenerationProgress(prev => {
          // Only update progress if still generating and less than 90%
          if (!isGenerating) return prev;
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);
    } else {
      // Reset progress when generation is complete or cancelled
      setGenerationProgress(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  return (
    <PageContainer
      title={language === 'arabic' ? "الإدارة القانونية" : "Legal Management"}
      description={language === 'arabic' 
        ? "إدارة المستندات القانونية ومتطلبات الامتثال والقضايا القانونية" 
        : "Manage legal documents, compliance requirements, and legal cases"}
    >
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          title={language === 'arabic' ? "الإدارة القانونية" : "Legal Management"}
          description={language === 'arabic' 
            ? "تتبع وإدارة جميع الجوانب القانونية لعمليات الأسطول" 
            : "Track and manage all legal aspects of your fleet operations"}
          icon={Gavel}
        />
        
        <div className="flex items-center space-x-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={language} 
            onValueChange={(value: 'english' | 'arabic') => {
              setLanguage(value);
              toast({
                title: value === 'arabic' ? "تم تغيير اللغة" : "Language Changed",
                description: value === 'arabic' 
                  ? "تم تعيين اللغة إلى العربية" 
                  : "Language has been set to English",
              });
            }}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isGenerating && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium mr-2">{language === 'arabic' ? "جاري إنشاء التقرير..." : "Generating report..."}</span>
            <span className="text-xs text-muted-foreground">{language === 'arabic' ? "يرجى الانتظار" : "Please wait"}</span>
          </div>
          <Progress value={generationProgress} className="h-2" />
        </div>
      )}
      
      <Tabs defaultValue="obligations" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="obligations">
            <FileText className="h-4 w-4 mr-2" />
            {language === 'arabic' ? "الالتزامات" : "Obligations"}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Scale className="h-4 w-4 mr-2" />
            {language === 'arabic' ? "التقارير" : "Reports"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="obligations" className="space-y-4">
          <CustomerLegalObligations />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <TrafficReportTab 
            language={language} 
            onGenerationStart={() => {
              setIsGenerating(true);
              console.log("Report generation started");
            }}
            onGenerationEnd={() => {
              setIsGenerating(false);
              setGenerationProgress(100);
              // Reset progress after showing 100% completion
              setTimeout(() => setGenerationProgress(0), 1000);
              console.log("Report generation completed");
            }}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Legal;
