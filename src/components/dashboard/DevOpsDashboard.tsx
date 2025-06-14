import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  Server, 
  Database, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Cpu, 
  HardDrive, 
  Memory,
  Network,
  Container,
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Monitor,
  Cloud,
  Zap,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';
import { devOpsService } from '@/services/devops-service';
import { containerService } from '@/services/container-service';

interface DevOpsDashboardProps {
  className?: string;
}

export const DevOpsDashboard: React.FC<DevOpsDashboardProps> = ({ className }) => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [clusterMetrics, setClusterMetrics] = useState<any>(null);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [status, metrics, pipelineList, alertList, deploymentList] = await Promise.all([
        devOpsService.getSystemStatus(),
        containerService.getClusterMetrics(),
        devOpsService.getPipelines(),
        devOpsService.getAlerts('firing'),
        devOpsService.getDeployments()
      ]);

      setSystemStatus(status);
      setClusterMetrics(metrics);
      setPipelines(pipelineList);
      setAlerts(alertList);
      setDeployments(deploymentList);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setIsLoading(false);
    }
  };

  const handleRunPipeline = async (pipelineId: string) => {
    try {
      await devOpsService.runPipeline(pipelineId, 'manual');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to run pipeline:', error);
    }
  };

  const handleScaleService = async (serviceId: string, replicas: number) => {
    try {
      await containerService.scaleDeployment(serviceId, replicas);
      loadDashboardData();
    } catch (error) {
      console.error('Failed to scale service:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'healthy':
      case 'running':
      case 'active':
      case 'complete':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'failed':
      case 'unhealthy':
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'pending':
      case 'deploying':
      case 'progressing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading DevOps Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DevOps Dashboard</h1>
          <p className="text-gray-600 mt-1">Infrastructure monitoring and management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Globe className="w-3 h-3 mr-1" />
            Qatar Region
          </Badge>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Active Alerts ({alerts.length})</AlertTitle>
          <AlertDescription className="text-red-700">
            {alerts.slice(0, 3).map(alert => alert.name).join(', ')}
            {alerts.length > 3 && ` and ${alerts.length - 3} more`}
          </AlertDescription>
        </Alert>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.pipelines?.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-green-600">{systemStatus?.pipelines?.running || 0} running</span>
              <span className="text-red-600">{systemStatus?.pipelines?.failed || 0} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.services?.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-green-600">{systemStatus?.services?.healthy || 0} healthy</span>
              <span className="text-red-600">{systemStatus?.services?.unhealthy || 0} unhealthy</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.alerts?.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-red-600">{systemStatus?.alerts?.critical || 0} critical</span>
              <span className="text-yellow-600">{systemStatus?.alerts?.firing || 0} firing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.backups?.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-green-600">{systemStatus?.backups?.successful || 0} successful</span>
              <span className="text-red-600">{systemStatus?.backups?.failed || 0} failed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="w-5 h-5 mr-2" />
                  Cluster Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{clusterMetrics?.resources?.cpu?.percentage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={clusterMetrics?.resources?.cpu?.percentage || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{clusterMetrics?.resources?.memory?.percentage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={clusterMetrics?.resources?.memory?.percentage || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage Usage</span>
                    <span>{clusterMetrics?.resources?.storage?.percentage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={clusterMetrics?.resources?.storage?.percentage || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Cluster Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {clusterMetrics?.nodes?.ready || 0}
                    </div>
                    <div className="text-sm text-gray-600">Ready Nodes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {clusterMetrics?.pods?.running || 0}
                    </div>
                    <div className="text-sm text-gray-600">Running Pods</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {clusterMetrics?.services?.active || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Services</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {clusterMetrics?.deployments?.available || 0}
                    </div>
                    <div className="text-sm text-gray-600">Deployments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deployments.slice(0, 5).map((deployment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(deployment.status).replace('text-', 'bg-').replace(' bg-', ' ')}`}></div>
                      <div>
                        <div className="font-medium">Deployment: {deployment.configId}</div>
                        <div className="text-sm text-gray-600">Version {deployment.version}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {deployment.duration ? formatDuration(deployment.duration) : 'In progress'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-6">
          <div className="grid gap-6">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <GitBranch className="w-5 h-5 mr-2" />
                        {pipeline.name}
                      </CardTitle>
                      <CardDescription>
                        {pipeline.repository} • {pipeline.branch} branch
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(pipeline.status)}>
                        {pipeline.status}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleRunPipeline(pipeline.id)}
                        disabled={pipeline.status === 'running'}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pipeline.stages.map((stage: any, index: number) => (
                      <div key={stage.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getStatusColor(stage.status)}`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-gray-600">{stage.type}</div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(stage.status)}>
                          {stage.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {pipeline.lastRun && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Last run: {formatDuration(pipeline.lastRun.duration || 0)} • 
                        Triggered by {pipeline.lastRun.triggeredBy}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Containers Tab */}
        <TabsContent value="containers" className="space-y-6">
          <div className="grid gap-6">
            {containerService.getServices().map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Container className="w-5 h-5 mr-2" />
                        {service.name}
                      </CardTitle>
                      <CardDescription>
                        {service.namespace} namespace • {service.type}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScaleService(service.id, service.replicas - 1)}
                          disabled={service.replicas <= 1}
                        >
                          -
                        </Button>
                        <span className="px-2 text-sm font-medium">{service.replicas}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScaleService(service.id, service.replicas + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Endpoints</div>
                      <div className="text-lg font-bold">{service.endpoints.length}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Cluster IP</div>
                      <div className="text-sm font-mono">{service.clusterIP}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Ports</div>
                      <div className="text-sm">
                        {service.ports.map(port => `${port.port}:${port.targetPort}`).join(', ')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">CPU Usage</span>
                    </div>
                    <span className="text-sm font-medium">
                      {clusterMetrics?.resources?.cpu?.percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Memory className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Memory Usage</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatBytes(clusterMetrics?.resources?.memory?.used || 0)} / 
                      {formatBytes(clusterMetrics?.resources?.memory?.capacity || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Storage Usage</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatBytes(clusterMetrics?.resources?.storage?.used || 0)} / 
                      {formatBytes(clusterMetrics?.resources?.storage?.capacity || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Network className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Network Status</span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Healthy
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Time</span>
                      <span className="text-green-600">↓ 15ms avg</span>
                    </div>
                    <div className="text-xs text-gray-600">95th percentile: 45ms</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Throughput</span>
                      <span className="text-blue-600">↑ 1.2k req/min</span>
                    </div>
                    <div className="text-xs text-gray-600">Peak: 2.1k req/min</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Error Rate</span>
                      <span className="text-green-600">↓ 0.02%</span>
                    </div>
                    <div className="text-xs text-gray-600">Target: < 0.1%</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Availability</span>
                      <span className="text-green-600">99.98%</span>
                    </div>
                    <div className="text-xs text-gray-600">SLA: 99.9%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-6">
          <div className="grid gap-6">
            {deployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Cloud className="w-5 h-5 mr-2" />
                        {deployment.configId}
                      </CardTitle>
                      <CardDescription>
                        Version {deployment.version} • Deployed by {deployment.deployedBy}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(deployment.status)}>
                      {deployment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Duration</div>
                      <div className="text-lg font-bold">
                        {deployment.duration ? formatDuration(deployment.duration) : 'In progress'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Started</div>
                      <div className="text-sm">
                        {new Date(deployment.startTime).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Metrics</div>
                      <div className="text-sm">
                        {deployment.metrics.length} data points
                      </div>
                    </div>
                  </div>
                  {deployment.rollbackVersion && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <RotateCcw className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          Rolled back to version {deployment.rollbackVersion}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
                alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'high' ? 'text-orange-600' :
                      alert.severity === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <AlertTitle className="text-base font-semibold">
                        {alert.name}
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                        <span>Severity: {alert.severity}</span>
                        <span>Duration: {formatDuration(Date.now() - alert.created)}</span>
                        <span>Condition: {alert.condition}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Acknowledge
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevOpsDashboard; 