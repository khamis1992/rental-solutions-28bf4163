
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RiskScore {
  creditScore: number;
  behavioralScore: number;
  historicalRiskScore: number;
  overallRiskScore: number;
}

const RiskScoringDashboard = ({ customerId }: { customerId: string }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const mockRiskScore: RiskScore = {
    creditScore: 85,
    behavioralScore: 75,
    historicalRiskScore: 90,
    overallRiskScore: 83
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={mockRiskScore.creditScore} className={getScoreColor(mockRiskScore.creditScore)} />
          <div className="text-2xl font-bold">{mockRiskScore.creditScore}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Behavioral Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={mockRiskScore.behavioralScore} className={getScoreColor(mockRiskScore.behavioralScore)} />
          <div className="text-2xl font-bold">{mockRiskScore.behavioralScore}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Historical Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={mockRiskScore.historicalRiskScore} className={getScoreColor(mockRiskScore.historicalRiskScore)} />
          <div className="text-2xl font-bold">{mockRiskScore.historicalRiskScore}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={mockRiskScore.overallRiskScore} className={getScoreColor(mockRiskScore.overallRiskScore)} />
          <div className="text-2xl font-bold">{mockRiskScore.overallRiskScore}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskScoringDashboard;
