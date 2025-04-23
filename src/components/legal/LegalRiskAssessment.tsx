
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  Info, 
  BarChart4, 
  ArrowRight 
} from 'lucide-react';

// Mock risk assessment data
const RISK_ASSESSMENT_DATA = [
  {
    id: '1',
    category: 'Vehicle Compliance',
    riskLevel: 'high',
    score: 78,
    issues: 5,
    description: 'Multiple vehicles have expired documentation or inspection certificates',
    recommendations: 'Schedule immediate inspection for vehicles ABC123, XYZ789, and LMN456'
  },
  {
    id: '2',
    category: 'Driver Documentation',
    riskLevel: 'medium',
    score: 52,
    issues: 3,
    description: 'Several drivers have licenses approaching expiration dates',
    recommendations: 'Send reminders to drivers with licenses expiring in the next 30 days'
  },
  {
    id: '3',
    category: 'Contractual Obligations',
    riskLevel: 'low',
    score: 22,
    issues: 1,
    description: 'Minor contract clause inconsistencies detected in recent agreements',
    recommendations: 'Review template agreement clauses regarding maintenance responsibilities'
  },
  {
    id: '4',
    category: 'Insurance Coverage',
    riskLevel: 'medium',
    score: 45,
    issues: 2,
    description: 'Insurance coverage gaps identified for certain vehicle operations',
    recommendations: 'Update insurance policy to include coverage for new vehicle types'
  }
];

const LegalRiskAssessment = () => {
  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge className="bg-red-500">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <ShieldAlert className="h-6 w-6 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'low':
        return <Check className="h-6 w-6 text-green-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getProgressColor = (score: number) => {
    if (score > 70) return 'bg-red-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Calculate overall risk score
  const overallRiskScore = Math.round(
    RISK_ASSESSMENT_DATA.reduce((sum, item) => sum + item.score, 0) / RISK_ASSESSMENT_DATA.length
  );

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Overall Risk Assessment</CardTitle>
              <Button variant="outline" size="sm">
                <BarChart4 className="mr-2 h-4 w-4" />
                Risk History
              </Button>
            </div>
            <CardDescription>
              Risk profile based on compliance, contractual, and operational factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6">
              <div className="relative h-40 w-40 mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="block text-4xl font-bold">{overallRiskScore}%</span>
                    <span className="text-sm font-medium text-muted-foreground">Risk Level</span>
                  </div>
                </div>
                <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={overallRiskScore > 70 ? "#ef4444" : overallRiskScore > 40 ? "#f59e0b" : "#22c55e"}
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40 * overallRiskScore / 100} ${2 * Math.PI * 40 * (1 - overallRiskScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="text-center mt-2 space-y-2">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                    <span className="text-xs">High: {RISK_ASSESSMENT_DATA.filter(item => item.riskLevel === 'high').length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
                    <span className="text-xs">Medium: {RISK_ASSESSMENT_DATA.filter(item => item.riskLevel === 'medium').length}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                    <span className="text-xs">Low: {RISK_ASSESSMENT_DATA.filter(item => item.riskLevel === 'low').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Priority Actions</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Expired Vehicle Inspections</p>
                <p className="text-xs text-muted-foreground">3 vehicles have expired inspection certificates</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Insurance Coverage Gaps</p>
                <p className="text-xs text-muted-foreground">Coverage doesn't include new vehicle types</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Contract Review Required</p>
                <p className="text-xs text-muted-foreground">Template agreement needs updates</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="sm">
              View All Actions
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Detailed Risk Assessment */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Detailed Risk Assessment</CardTitle>
          <CardDescription>
            Risk breakdown by category with recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {RISK_ASSESSMENT_DATA.map((assessment) => (
              <Card key={assessment.id} className="border overflow-hidden shadow-sm">
                <div className={`h-1 w-full ${getProgressColor(assessment.score)}`}></div>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-1/6 flex justify-center items-start pt-2">
                      {getRiskIcon(assessment.riskLevel)}
                    </div>
                    <div className="sm:w-5/6 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{assessment.category}</h3>
                          <div className="mt-1">{getRiskBadge(assessment.riskLevel)}</div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Risk Score:</span>
                          <div className="w-32 flex items-center space-x-2">
                            <Progress value={assessment.score} className={getProgressColor(assessment.score)} />
                            <span className="text-sm font-medium">{assessment.score}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 space-y-2">
                        <p><span className="font-medium">Issues Identified:</span> {assessment.issues}</p>
                        <p><span className="font-medium">Description:</span> {assessment.description}</p>
                        <p className="border-l-2 border-primary pl-3 py-1 mt-2 bg-muted/50 italic">
                          <span className="font-medium">Recommendation: </span> 
                          {assessment.recommendations}
                        </p>
                      </div>
                      
                      <div className="pt-2 flex justify-end">
                        <Button variant="outline" size="sm">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalRiskAssessment;
