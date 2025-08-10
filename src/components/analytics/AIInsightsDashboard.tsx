// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  Zap,
  Eye,
  Activity,
  BarChart3,
  RefreshCw,
  CheckCircle,
  Clock,
  Users,
  Cpu,
  Database,
  Smartphone,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';
import { aiAnalytics, AIInsight, PredictionModel, AnomalyDetection, Prediction } from '@/services/ai-analytics';

interface AIInsightsDashboardProps {
  className?: string;
}

const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({ className }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadAIData();
    
    if (autoRefresh) {
      const interval = setInterval(loadAIData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadAIData = async () => {
    try {
      setIsLoading(true);
      
      const insightsData = aiAnalytics.getInsights();
      const modelsData = aiAnalytics.getModels();
      const anomaliesData = aiAnalytics.getAnomalies();
      const predictionsData = aiAnalytics.getPredictions();
      const healthData = aiAnalytics.getSystemHealth();

      setInsights(insightsData);
      setModels(modelsData);
      setAnomalies(anomaliesData);
      setPredictions(predictionsData);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Failed to load AI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'trend': return <BarChart3 className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days > 0) return isArabic ? `منذ ${days} أيام` : `${days}d ago`;
    if (hours > 0) return isArabic ? `منذ ${hours} ساعات` : `${hours}h ago`;
    if (minutes > 0) return isArabic ? `منذ ${minutes} دقائق` : `${minutes}m ago`;
    return isArabic ? 'الآن' : 'now';
  };

  const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => (
    <Card className={`border-l-4 ${getImpactColor(insight.impact)}`}>
      <CardHeader className="pb-2">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getInsightIcon(insight.type)}
            <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
          </div>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Badge variant="outline" className={getConfidenceColor(insight.confidence)}>
              {insight.confidence.toFixed(0)}%
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {isArabic ? 
                (insight.impact === 'critical' ? 'حرج' : 
                 insight.impact === 'high' ? 'عالي' : 
                 insight.impact === 'medium' ? 'متوسط' : 'منخفض') :
                insight.impact
              }
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
        
        {insight.actions && insight.actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">
              {isArabic ? 'الإجراءات المقترحة:' : 'Recommended Actions:'}
            </p>
            {insight.actions.slice(0, 2).map(action => (
              <div key={action.id} className="flex items-center gap-2 text-xs">
                <ArrowRight className="w-3 h-3 text-blue-500" />
                <span>{action.title}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className={`flex items-center justify-between mt-3 text-xs text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <span>{formatTimeAgo(insight.timestamp)}</span>
          <span className="capitalize">{insight.category.replace('_', ' ')}</span>
        </div>
      </CardContent>
    </Card>
  );

  const PredictionCard: React.FC<{ prediction: Prediction }> = ({ prediction }) => (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">{prediction.metric}</span>
          </div>
          <Badge variant="outline" className={getConfidenceColor(prediction.confidence)}>
            {prediction.confidence.toFixed(0)}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'القيمة المتوقعة:' : 'Predicted Value:'}
            </span>
            <span className="font-medium">{prediction.predictedValue.toFixed(1)}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'الاتجاه:' : 'Trend:'}
            </span>
            <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
              {prediction.trend === 'increasing' && <TrendingUp className="w-3 h-3 text-green-500" />}
              {prediction.trend === 'decreasing' && <TrendingDown className="w-3 h-3 text-red-500" />}
              {prediction.trend === 'stable' && <Activity className="w-3 h-3 text-gray-500" />}
              <span className="capitalize">
                {isArabic ? 
                  (prediction.trend === 'increasing' ? 'متزايد' : 
                   prediction.trend === 'decreasing' ? 'متناقص' : 'مستقر') :
                  prediction.trend
                }
              </span>
            </div>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'الإطار الزمني:' : 'Timeframe:'}
            </span>
            <span>{prediction.timeframe}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AnomalyCard: React.FC<{ anomaly: AnomalyDetection }> = ({ anomaly }) => (
    <Card className="border-l-4 border-l-red-500">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="font-medium text-sm">{anomaly.metric}</span>
          </div>
          <Badge variant="destructive" className="text-xs">
            {isArabic ? 
              (anomaly.severity === 'critical' ? 'حرج' : 
               anomaly.severity === 'high' ? 'عالي' : 
               anomaly.severity === 'medium' ? 'متوسط' : 'منخفض') :
              anomaly.severity
            }
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'القيمة المتوقعة:' : 'Expected:'}
            </span>
            <span>{anomaly.expectedValue.toFixed(1)}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'القيمة الفعلية:' : 'Actual:'}
            </span>
            <span className="font-medium text-red-600">{anomaly.actualValue.toFixed(1)}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'الانحراف:' : 'Deviation:'}
            </span>
            <span className="font-medium">{(anomaly.deviation * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        {anomaly.possibleCauses.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {isArabic ? 'الأسباب المحتملة:' : 'Possible Causes:'}
            </p>
            <div className="space-y-1">
              {anomaly.possibleCauses.slice(0, 2).map((cause, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>{cause}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          {formatTimeAgo(anomaly.timestamp)}
        </div>
      </CardContent>
    </Card>
  );

  const ModelCard: React.FC<{ model: PredictionModel }> = ({ model }) => (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">{model.name}</span>
          </div>
          <Badge variant="outline" className={getConfidenceColor(model.accuracy)}>
            {model.accuracy.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'النوع:' : 'Type:'}
            </span>
            <span className="capitalize">{model.type.replace('_', ' ')}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'التنبؤات:' : 'Predictions:'}
            </span>
            <span>{model.predictions.length}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">
              {isArabic ? 'آخر تدريب:' : 'Last Trained:'}
            </span>
            <span>{formatTimeAgo(model.lastTrained)}</span>
          </div>
        </div>
        
        <div className="mt-3">
          <div className={`flex items-center justify-between text-xs mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span>{isArabic ? 'دقة النموذج' : 'Model Accuracy'}</span>
            <span>{model.accuracy.toFixed(1)}%</span>
          </div>
          <Progress value={model.accuracy} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading && insights.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 animate-pulse" />
          <span>{isArabic ? 'جاري تحليل البيانات بالذكاء الاصطناعي...' : 'AI analyzing data...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold">
            {isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights Dashboard'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 'تحليلات ذكية وتنبؤات مدعومة بالذكاء الاصطناعي' : 'Intelligent analytics and AI-powered predictions'}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="touch-friendly"
          >
            <Brain className="w-4 h-4" />
            {isArabic ? 'تحليل تلقائي' : 'Auto Analysis'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadAIData}
            disabled={isLoading}
            className="touch-friendly"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <h3 className="text-lg font-semibold mb-2">
                  {isArabic ? 'صحة النظام العامة' : 'Overall System Health'}
                </h3>
                <div className={`text-4xl font-bold ${getConfidenceColor(systemHealth.overallScore)}`}>
                  {systemHealth.overallScore}/100
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    {isArabic ? 'المشاكل الحرجة:' : 'Critical Issues:'} {systemHealth.criticalIssues}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isArabic ? 'التوصيات النشطة:' : 'Active Recommendations:'} {systemHealth.recommendations.length}
                  </p>
                </div>
              </div>
              
              <div className="text-6xl">
                {systemHealth.overallScore >= 90 ? '🤖' : 
                 systemHealth.overallScore >= 70 ? '🔍' : '⚠️'}
              </div>
            </div>
            
            {/* Category Scores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {Object.entries(systemHealth.categories).map(([category, score]) => (
                <div key={category} className="text-center">
                  <div className="text-lg font-bold">{(score as number).toFixed(0)}</div>
                  <div className="text-xs text-gray-600 capitalize">
                    {isArabic ? 
                      (category === 'performance' ? 'الأداء' :
                       category === 'user_behavior' ? 'سلوك المستخدمين' :
                       category === 'business' ? 'الأعمال' : 'تقني') :
                      category.replace('_', ' ')
                    }
                  </div>
                  <Progress value={score as number} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="insights">
            {isArabic ? 'الرؤى' : 'Insights'}
          </TabsTrigger>
          <TabsTrigger value="predictions">
            {isArabic ? 'التنبؤات' : 'Predictions'}
          </TabsTrigger>
          <TabsTrigger value="anomalies">
            {isArabic ? 'الشذوذ' : 'Anomalies'}
          </TabsTrigger>
          <TabsTrigger value="models">
            {isArabic ? 'النماذج' : 'Models'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد رؤى متاحة حالياً. سيقوم الذكاء الاصطناعي بتحليل البيانات قريباً.' : 'No insights available yet. AI is analyzing data...'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.slice(0, 8).map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد تنبؤات متاحة. جاري تدريب النماذج...' : 'No predictions available. Models are training...'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.map((prediction, index) => (
                <PredictionCard key={index} prediction={prediction} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {anomalies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لم يتم اكتشاف أي شذوذ. النظام يعمل بشكل طبيعي.' : 'No anomalies detected. System is operating normally.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anomalies.map((anomaly, index) => (
                <AnomalyCard key={index} anomaly={anomaly} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model, index) => (
              <ModelCard key={index} model={model} />
            ))}
          </div>
          
          {/* Model Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Star className="w-5 h-5 text-yellow-500" />
                {isArabic ? 'ملخص أداء النماذج' : 'Model Performance Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
                  <div className="text-2xl font-bold text-blue-600">
                    {models.reduce((sum, m) => sum + m.accuracy, 0) / models.length || 0}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'متوسط الدقة' : 'Average Accuracy'}
                  </div>
                </div>
                <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
                  <div className="text-2xl font-bold text-green-600">
                    {models.reduce((sum, m) => sum + m.predictions.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'إجمالي التنبؤات' : 'Total Predictions'}
                  </div>
                </div>
                <div className={`text-center ${isArabic ? 'text-right' : 'text-left'}`}>
                  <div className="text-2xl font-bold text-purple-600">
                    {models.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'النماذج النشطة' : 'Active Models'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsightsDashboard; 