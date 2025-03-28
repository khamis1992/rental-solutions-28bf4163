
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, AlertTriangle, Check, Info } from 'lucide-react';

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
        return <Badge className="bg-red-500 hover:bg-red-600">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-green-500 hover:bg-green-600">Low Risk</Badge>;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legal Risk Assessment</CardTitle>
          <CardDescription>
            Overview of compliance risks and recommended actions for the fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {RISK_ASSESSMENT_DATA.map((assessment) => (
              <Card key={assessment.id} className="border-l-4" style={{ borderLeftColor: 
                assessment.riskLevel === 'high' ? '#ef4444' : 
                assessment.riskLevel === 'medium' ? '#f59e0b' : 
                '#22c55e'
              }}>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="md:w-1/6 flex justify-center items-start pt-2">
                      {getRiskIcon(assessment.riskLevel)}
                    </div>
                    <div className="md:w-5/6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{assessment.category}</h3>
                          <div className="mt-1">{getRiskBadge(assessment.riskLevel)}</div>
                        </div>
                        <div className="mt-2 md:mt-0 flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Risk Score:</span>
                          <div className="w-32 flex items-center space-x-2">
                            <Progress value={assessment.score} className={getProgressColor(assessment.score)} />
                            <span className="text-sm font-medium">{assessment.score}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        <p><span className="font-medium">Issues Identified:</span> {assessment.issues}</p>
                        <p className="mt-1"><span className="font-medium">Description:</span> {assessment.description}</p>
                        <p className="mt-1"><span className="font-medium">Recommendations:</span> {assessment.recommendations}</p>
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
