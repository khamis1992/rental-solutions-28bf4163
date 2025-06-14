import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Activity,
  Server,
  Globe,
  Shield,
  Users,
  TrendingUp,
  Zap,
  Eye
} from 'lucide-react';
import { productionLaunchService, LaunchPhase, HealthCheck, LaunchMetrics, GoLiveChecklist } from '@/services/production-launch-service';
import { goLiveOrchestrationService, DeploymentStrategy, TrafficManagement, PostLaunchMonitoring } from '@/services/go-live-orchestration-service';

interface ProductionLaunchDashboardProps {
  className?: string;
}

export const ProductionLaunchDashboard: React.FC<ProductionLaunchDashboardProps> = ({ className }) => {
  const [launchPhases, setLaunchPhases] = useState<LaunchPhase[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [launchMetrics, setLaunchMetrics] = useState<LaunchMetrics | null>(null);
  const [goLiveChecklists, setGoLiveChecklists] = useState<GoLiveChecklist[]>([]);
  const [deploymentStrategies, setDeploymentStrategies] = useState<DeploymentStrategy[]>([]);
  const [trafficManagement, setTrafficManagement] = useState<TrafficManagement | null>(null);
  const [postLaunchMonitoring, setPostLaunchMonitoring] = useState<PostLaunchMonitoring | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [isLaunchActive, setIsLaunchActive] = useState(false);
  const [isGoLiveActive, setIsGoLiveActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    startAutoRefresh();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const loadDashboardData = () => {
    setLaunchPhases(productionLaunchService.getLaunchPhases());
    setHealthChecks(productionLaunchService.getHealthChecks());
    setLaunchMetrics(productionLaunchService.getLaunchMetrics());
    setGoLiveChecklists(productionLaunchService.getGoLiveChecklists());
    setDeploymentStrategies(goLiveOrchestrationService.getDeploymentStrategies());
    setTrafficManagement(goLiveOrchestrationService.getTrafficManagement());
    setPostLaunchMonitoring(goLiveOrchestrationService.getPostLaunchMonitoring());
    setIsLaunchActive(productionLaunchService.isLaunchActive());
    setIsGoLiveActive(goLiveOrchestrationService.isExecutionActive());
    setCurrentPhase(productionLaunchService.getCurrentPhase());
    setExecutionStatus(goLiveOrchestrationService.getExecutionStatus());
    setOverallProgress(launchMetrics?.overallProgress || 0);
  };

  const startAutoRefresh = () => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000); // Refresh every 5 seconds
    setRefreshInterval(interval);
  };

  const handleStartLaunch = async () => {
    const result = await productionLaunchService.startProductionLaunch();
    if (result.success) {
      loadDashboardData();
    } else {
      alert(`Failed to start launch: ${result.message}`);
    }
  };

  const handleStartGoLive = async () => {
    if (!selectedStrategy) {
      alert('Please select a deployment strategy');
      return;
    }

    const result = await goLiveOrchestrationService.startGoLiveExecution(selectedStrategy);
    if (result.success) {
      loadDashboardData();
    } else {
      alert(`Failed to start go-live: ${result.message}`);
    }
  };

  const handleEmergencyRollback = async () => {
    if (confirm('Are you sure you want to trigger emergency rollback? This action cannot be undone.')) {
      const result = await productionLaunchService.triggerEmergencyRollback('Manual emergency rollback triggered from dashboard');
      if (result.success) {
        loadDashboardData();
      } else {
        alert(`Rollback failed: ${result.message}`);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'passed': 'default',
      'failed': 'destructive',
      'running': 'secondary',
      'pending': 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Launch Dashboard</h1>
          <p className="text-muted-foreground">
            Day 10: Production Launch & Go-Live - Qatar Rental Solutions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartLaunch}
            disabled={isLaunchActive}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLaunchActive ? 'Launch Active' : 'Start Launch'}
          </Button>
          <Button
            onClick={handleEmergencyRollback}
            variant="destructive"
            disabled={!isLaunchActive && !isGoLiveActive}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Emergency Rollback
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {launchMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Phases</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {launchMetrics.completedPhases}/{launchMetrics.totalPhases}
              </div>
              <p className="text-xs text-muted-foreground">
                {launchMetrics.failedPhases} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {launchMetrics.criticalIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                Active alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {launchMetrics.performanceMetrics.uptime.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {launchMetrics.performanceMetrics.responseTime.toFixed(0)}ms avg response
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Status Alert */}
      {(isLaunchActive || isGoLiveActive) && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertTitle>Production Launch in Progress</AlertTitle>
          <AlertDescription>
            {isLaunchActive && currentPhase && `Current Phase: ${currentPhase}`}
            {isGoLiveActive && executionStatus?.currentStep && `Current Step: ${executionStatus.currentStep}`}
            {isGoLiveActive && ` (${executionStatus.progress.toFixed(1)}% complete)`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="launch-phases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="launch-phases">Launch Phases</TabsTrigger>
          <TabsTrigger value="health-checks">Health Checks</TabsTrigger>
          <TabsTrigger value="go-live">Go-Live</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Management</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
        </TabsList>

        {/* Launch Phases Tab */}
        <TabsContent value="launch-phases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Launch Phases
              </CardTitle>
              <CardDescription>
                Production launch execution phases and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {launchPhases.map((phase, index) => (
                  <div key={phase.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{phase.name}</h3>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                        {phase.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {formatDuration(phase.duration)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={phase.criticalityLevel === 'critical' ? 'destructive' : 'secondary'}>
                        {phase.criticalityLevel}
                      </Badge>
                      {getStatusBadge(phase.status)}
                      {getStatusIcon(phase.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Checks Tab */}
        <TabsContent value="health-checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Checks
              </CardTitle>
              <CardDescription>
                Real-time health monitoring of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthChecks.map((check) => (
                  <div key={check.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{check.name}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(check.status)}
                        {getStatusIcon(check.status)}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Type: {check.type}</p>
                      <p>Timeout: {check.timeout}ms</p>
                      {check.responseTime && (
                        <p>Response Time: {check.responseTime}ms</p>
                      )}
                      {check.lastRun && (
                        <p>Last Run: {check.lastRun.toLocaleTimeString()}</p>
                      )}
                      {check.errorMessage && (
                        <p className="text-red-500">Error: {check.errorMessage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Go-Live Tab */}
        <TabsContent value="go-live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Go-Live Execution
              </CardTitle>
              <CardDescription>
                Deployment strategy selection and execution management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strategy Selection */}
              <div>
                <h3 className="font-medium mb-2">Deployment Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deploymentStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedStrategy === strategy.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedStrategy(strategy.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{strategy.name}</h4>
                        <Badge variant={strategy.riskLevel === 'high' ? 'destructive' : strategy.riskLevel === 'medium' ? 'secondary' : 'default'}>
                          {strategy.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{strategy.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>Rollback Time: {strategy.rollbackTime}s</p>
                        <p>Health Check Interval: {strategy.healthCheckInterval}s</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Go-Live Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={handleStartGoLive}
                  disabled={isGoLiveActive || !selectedStrategy}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isGoLiveActive ? 'Go-Live Active' : 'Start Go-Live'}
                </Button>
              </div>

              {/* Execution Status */}
              {executionStatus && isGoLiveActive && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-medium mb-2">Execution Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span>{executionStatus.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={executionStatus.progress} />
                    {executionStatus.currentStep && (
                      <div className="flex justify-between">
                        <span>Current Step:</span>
                        <span className="font-medium">{executionStatus.currentStep}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Management Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Traffic Management
              </CardTitle>
              <CardDescription>
                Real-time traffic routing and load balancer status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trafficManagement && (
                <div className="space-y-6">
                  {/* Traffic Distribution */}
                  <div>
                    <h3 className="font-medium mb-4">Traffic Distribution</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-blue-600">Current Environment</h4>
                        <p className="text-2xl font-bold">{trafficManagement.currentEnvironment}</p>
                        <p className="text-sm text-muted-foreground">
                          {trafficManagement.trafficPercentage.current}% traffic
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-green-600">Target Environment</h4>
                        <p className="text-2xl font-bold">{trafficManagement.targetEnvironment}</p>
                        <p className="text-sm text-muted-foreground">
                          {trafficManagement.trafficPercentage.target}% traffic
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between mb-2">
                        <span>Switch Status:</span>
                        {getStatusBadge(trafficManagement.switchStatus)}
                      </div>
                      {trafficManagement.switchStartTime && (
                        <p className="text-sm text-muted-foreground">
                          Started: {trafficManagement.switchStartTime.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Load Balancer Status */}
                  <div>
                    <h3 className="font-medium mb-4">Load Balancer Targets</h3>
                    <div className="space-y-2">
                      {trafficManagement.loadBalancerConfig.targets.map((target) => (
                        <div key={target.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{target.host}:{target.port}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              Weight: {target.weight}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{target.responseTime}ms</span>
                            {getStatusBadge(target.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DNS Records */}
                  <div>
                    <h3 className="font-medium mb-4">DNS Records</h3>
                    <div className="space-y-2">
                      {trafficManagement.dnsRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{record.domain}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {record.type} → {record.value}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">TTL: {record.ttl}s</span>
                            {getStatusBadge(record.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Post-Launch Monitoring
              </CardTitle>
              <CardDescription>
                24-hour intensive monitoring and critical metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postLaunchMonitoring && (
                <div className="space-y-6">
                  {/* Critical Metrics */}
                  <div>
                    <h3 className="font-medium mb-4">Critical Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {postLaunchMonitoring.criticalMetrics.map((metric) => (
                        <div key={metric.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{metric.name}</h4>
                            {getStatusBadge(metric.status)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm">Current:</span>
                              <span className="font-medium">
                                {metric.currentValue.toFixed(1)} {metric.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Target:</span>
                              <span className="text-sm text-muted-foreground">
                                {metric.targetValue} {metric.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Threshold:</span>
                              <span className="text-sm text-muted-foreground">
                                {metric.threshold} {metric.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Trend:</span>
                              <Badge variant="outline" className="text-xs">
                                {metric.trend}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stability Checks */}
                  <div>
                    <h3 className="font-medium mb-4">Stability Checks</h3>
                    <div className="space-y-2">
                      {postLaunchMonitoring.stabilityChecks.map((check) => (
                        <div key={check.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{check.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              Every {check.frequency} minutes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{check.checkType}</Badge>
                            {getStatusBadge(check.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklists Tab */}
        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Go-Live Checklists
              </CardTitle>
              <CardDescription>
                Pre-launch readiness checklists by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goLiveChecklists.map((checklist) => (
                  <div key={checklist.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{checklist.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          Responsible: {checklist.responsible}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {checklist.completionPercentage.toFixed(0)}%
                        </div>
                        <Progress value={checklist.completionPercentage} className="w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {checklist.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="text-sm">{item.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.assignee}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            {getStatusIcon(item.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
