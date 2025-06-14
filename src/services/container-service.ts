import { performanceAnalytics } from './performance-analytics';
import { securityService } from './security-service';

export interface ContainerConfig {
  environment: 'development' | 'staging' | 'production';
  cluster: {
    name: string;
    region: string;
    nodeCount: number;
    nodeType: string;
  };
  registry: {
    url: string;
    username?: string;
    password?: string;
  };
  networking: {
    clusterCIDR: string;
    serviceCIDR: string;
    podSubnet: string;
  };
  storage: {
    provider: 'aws-ebs' | 'azure-disk' | 'gcp-disk' | 'local';
    storageClass: string;
    encryption: boolean;
  };
}

export interface KubernetesCluster {
  id: string;
  name: string;
  status: 'creating' | 'active' | 'updating' | 'deleting' | 'error';
  version: string;
  region: string;
  nodes: ClusterNode[];
  created: number;
  updated: number;
  config: ContainerConfig;
}

export interface ClusterNode {
  id: string;
  name: string;
  status: 'ready' | 'not-ready' | 'unknown';
  role: 'master' | 'worker';
  capacity: {
    cpu: string;
    memory: string;
    storage: string;
    pods: number;
  };
  allocatable: {
    cpu: string;
    memory: string;
    storage: string;
    pods: number;
  };
  conditions: NodeCondition[];
  created: number;
}

export interface NodeCondition {
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure' | 'NetworkUnavailable';
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransition: number;
}

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'unknown';
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  containers: Container[];
  node: string;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  created: number;
  started?: number;
  restartCount: number;
  qosClass: 'Guaranteed' | 'Burstable' | 'BestEffort';
}

export interface Container {
  id: string;
  name: string;
  image: string;
  imageTag: string;
  status: 'waiting' | 'running' | 'terminated';
  ready: boolean;
  restartCount: number;
  ports: ContainerPort[];
  resources: ResourceRequirements;
  environment: { [key: string]: string };
  volumes: VolumeMount[];
  probes: {
    liveness?: HealthProbe;
    readiness?: HealthProbe;
    startup?: HealthProbe;
  };
}

export interface ContainerPort {
  containerPort: number;
  hostPort?: number;
  protocol: 'TCP' | 'UDP' | 'SCTP';
  name?: string;
}

export interface ResourceRequirements {
  requests: {
    cpu: string;
    memory: string;
    storage?: string;
  };
  limits: {
    cpu: string;
    memory: string;
    storage?: string;
  };
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly: boolean;
}

export interface HealthProbe {
  httpGet?: {
    path: string;
    port: number;
    scheme: 'HTTP' | 'HTTPS';
    headers?: { [key: string]: string };
  };
  exec?: {
    command: string[];
  };
  tcpSocket?: {
    port: number;
  };
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface Service {
  id: string;
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  clusterIP: string;
  externalIPs?: string[];
  ports: ServicePort[];
  selector: { [key: string]: string };
  sessionAffinity: 'None' | 'ClientIP';
  endpoints: Endpoint[];
  status: 'active' | 'inactive' | 'pending';
  created: number;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
}

export interface ServicePort {
  name?: string;
  protocol: 'TCP' | 'UDP' | 'SCTP';
  port: number;
  targetPort: number;
  nodePort?: number;
}

export interface Endpoint {
  ip: string;
  port: number;
  ready: boolean;
  node?: string;
  pod?: string;
}

export interface Deployment {
  id: string;
  name: string;
  namespace: string;
  replicas: number;
  availableReplicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  status: 'progressing' | 'available' | 'replicafailure';
  strategy: 'RollingUpdate' | 'Recreate';
  template: PodTemplate;
  selector: { [key: string]: string };
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  created: number;
  updated: number;
  conditions: DeploymentCondition[];
}

export interface PodTemplate {
  metadata: {
    labels: { [key: string]: string };
    annotations: { [key: string]: string };
  };
  spec: {
    containers: Container[];
    volumes: Volume[];
    restartPolicy: 'Always' | 'OnFailure' | 'Never';
    nodeSelector?: { [key: string]: string };
    tolerations?: Toleration[];
    affinity?: Affinity;
  };
}

export interface Volume {
  name: string;
  type: 'emptyDir' | 'hostPath' | 'persistentVolumeClaim' | 'configMap' | 'secret';
  source: {
    emptyDir?: {};
    hostPath?: { path: string; type?: string };
    persistentVolumeClaim?: { claimName: string; readOnly?: boolean };
    configMap?: { name: string; items?: any[] };
    secret?: { secretName: string; items?: any[] };
  };
}

export interface Toleration {
  key: string;
  operator: 'Equal' | 'Exists';
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  tolerationSeconds?: number;
}

export interface Affinity {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAffinity;
}

export interface NodeAffinity {
  requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector;
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTerm[];
}

export interface NodeSelector {
  nodeSelectorTerms: NodeSelectorTerm[];
}

export interface NodeSelectorTerm {
  matchExpressions?: NodeSelectorRequirement[];
  matchFields?: NodeSelectorRequirement[];
}

export interface NodeSelectorRequirement {
  key: string;
  operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt';
  values?: string[];
}

export interface PreferredSchedulingTerm {
  weight: number;
  preference: NodeSelectorTerm;
}

export interface PodAffinity {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
}

export interface PodAffinityTerm {
  labelSelector?: LabelSelector;
  namespaces?: string[];
  topologyKey: string;
}

export interface WeightedPodAffinityTerm {
  weight: number;
  podAffinityTerm: PodAffinityTerm;
}

export interface LabelSelector {
  matchLabels?: { [key: string]: string };
  matchExpressions?: LabelSelectorRequirement[];
}

export interface LabelSelectorRequirement {
  key: string;
  operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
  values?: string[];
}

export interface DeploymentCondition {
  type: 'Available' | 'Progressing' | 'ReplicaFailure';
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransition: number;
  lastUpdate: number;
}

export interface ConfigMap {
  id: string;
  name: string;
  namespace: string;
  data: { [key: string]: string };
  binaryData?: { [key: string]: string };
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  created: number;
}

export interface Secret {
  id: string;
  name: string;
  namespace: string;
  type: 'Opaque' | 'kubernetes.io/service-account-token' | 'kubernetes.io/dockercfg' | 'kubernetes.io/dockerconfigjson' | 'kubernetes.io/basic-auth' | 'kubernetes.io/ssh-auth' | 'kubernetes.io/tls';
  data: { [key: string]: string };
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  created: number;
}

export interface PersistentVolume {
  id: string;
  name: string;
  capacity: string;
  accessModes: ('ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany')[];
  persistentVolumeReclaimPolicy: 'Retain' | 'Recycle' | 'Delete';
  storageClass: string;
  status: 'Available' | 'Bound' | 'Released' | 'Failed';
  claimRef?: {
    name: string;
    namespace: string;
  };
  source: {
    type: 'aws-ebs' | 'azure-disk' | 'gcp-disk' | 'nfs' | 'hostPath';
    config: any;
  };
  created: number;
}

export interface PersistentVolumeClaim {
  id: string;
  name: string;
  namespace: string;
  accessModes: ('ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany')[];
  resources: {
    requests: { storage: string };
    limits?: { storage: string };
  };
  storageClass: string;
  status: 'Pending' | 'Bound' | 'Lost';
  volume?: string;
  capacity?: string;
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  created: number;
}

export interface HorizontalPodAutoscaler {
  id: string;
  name: string;
  namespace: string;
  targetRef: {
    kind: 'Deployment' | 'ReplicaSet' | 'StatefulSet';
    name: string;
  };
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  desiredReplicas: number;
  metrics: AutoscalerMetric[];
  behavior?: AutoscalerBehavior;
  status: 'active' | 'inactive' | 'unknown';
  conditions: AutoscalerCondition[];
  created: number;
  updated: number;
}

export interface AutoscalerMetric {
  type: 'Resource' | 'Pods' | 'Object' | 'External';
  resource?: {
    name: 'cpu' | 'memory';
    target: {
      type: 'Utilization' | 'AverageValue';
      averageUtilization?: number;
      averageValue?: string;
    };
  };
  pods?: {
    metric: { name: string; selector?: LabelSelector };
    target: { type: 'AverageValue'; averageValue: string };
  };
  object?: {
    metric: { name: string; selector?: LabelSelector };
    target: { type: 'Value'; value: string };
    describedObject: { kind: string; name: string };
  };
  external?: {
    metric: { name: string; selector?: LabelSelector };
    target: { type: 'Value' | 'AverageValue'; value?: string; averageValue?: string };
  };
}

export interface AutoscalerBehavior {
  scaleUp?: AutoscalerBehaviorPolicy;
  scaleDown?: AutoscalerBehaviorPolicy;
}

export interface AutoscalerBehaviorPolicy {
  stabilizationWindowSeconds?: number;
  selectPolicy?: 'Max' | 'Min' | 'Disabled';
  policies?: AutoscalerPolicy[];
}

export interface AutoscalerPolicy {
  type: 'Pods' | 'Percent';
  value: number;
  periodSeconds: number;
}

export interface AutoscalerCondition {
  type: 'AbleToScale' | 'ScalingActive' | 'ScalingLimited';
  status: 'True' | 'False' | 'Unknown';
  reason: string;
  message: string;
  lastTransition: number;
}

export interface ClusterMetrics {
  nodes: {
    total: number;
    ready: number;
    notReady: number;
  };
  pods: {
    total: number;
    running: number;
    pending: number;
    failed: number;
  };
  services: {
    total: number;
    active: number;
    inactive: number;
  };
  deployments: {
    total: number;
    available: number;
    progressing: number;
  };
  resources: {
    cpu: {
      capacity: number;
      allocatable: number;
      used: number;
      percentage: number;
    };
    memory: {
      capacity: number;
      allocatable: number;
      used: number;
      percentage: number;
    };
    storage: {
      capacity: number;
      used: number;
      percentage: number;
    };
  };
  network: {
    ingressTraffic: number;
    egressTraffic: number;
    activeConnections: number;
  };
}

class ContainerService {
  private config: ContainerConfig;
  private clusters: Map<string, KubernetesCluster> = new Map();
  private pods: Map<string, Pod> = new Map();
  private services: Map<string, Service> = new Map();
  private deployments: Map<string, Deployment> = new Map();
  private configMaps: Map<string, ConfigMap> = new Map();
  private secrets: Map<string, Secret> = new Map();
  private persistentVolumes: Map<string, PersistentVolume> = new Map();
  private persistentVolumeClaims: Map<string, PersistentVolumeClaim> = new Map();
  private autoscalers: Map<string, HorizontalPodAutoscaler> = new Map();
  private isInitialized = false;

  constructor(config?: Partial<ContainerConfig>) {
    this.config = {
      environment: 'development',
      cluster: {
        name: 'rental-solutions-cluster',
        region: 'qatar',
        nodeCount: 3,
        nodeType: 't3.medium'
      },
      registry: {
        url: 'registry.rental-solutions.com'
      },
      networking: {
        clusterCIDR: '10.100.0.0/16',
        serviceCIDR: '10.96.0.0/12',
        podSubnet: '10.244.0.0/16'
      },
      storage: {
        provider: 'aws-ebs',
        storageClass: 'gp3',
        encryption: true
      },
      ...config
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Create default cluster
      await this.createDefaultCluster();
      
      // Initialize default services
      await this.createDefaultServices();
      
      // Setup monitoring
      this.setupClusterMonitoring();
      
      this.isInitialized = true;
      
      this.logEvent('container_service_initialized', {
        environment: this.config.environment,
        clusterName: this.config.cluster.name,
        region: this.config.cluster.region
      });
      
    } catch (error) {
      console.error('Failed to initialize Container service:', error);
      throw error;
    }
  }

  private async createDefaultCluster(): Promise<void> {
    const cluster: KubernetesCluster = {
      id: this.generateId(),
      name: this.config.cluster.name,
      status: 'active',
      version: '1.28.0',
      region: this.config.cluster.region,
      created: Date.now(),
      updated: Date.now(),
      config: this.config,
      nodes: []
    };

    // Create cluster nodes
    for (let i = 0; i < this.config.cluster.nodeCount; i++) {
      const node: ClusterNode = {
        id: this.generateId(),
        name: `${cluster.name}-node-${i + 1}`,
        status: 'ready',
        role: i === 0 ? 'master' : 'worker',
        capacity: {
          cpu: '2000m',
          memory: '4Gi',
          storage: '20Gi',
          pods: 110
        },
        allocatable: {
          cpu: '1900m',
          memory: '3.5Gi',
          storage: '18Gi',
          pods: 110
        },
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'KubeletReady',
            message: 'kubelet is posting ready status',
            lastTransition: Date.now()
          }
        ],
        created: Date.now()
      };
      cluster.nodes.push(node);
    }

    this.clusters.set(cluster.id, cluster);
  }

  private async createDefaultServices(): Promise<void> {
    // Create rental-solutions API deployment
    const apiDeployment: Deployment = {
      id: this.generateId(),
      name: 'rental-solutions-api',
      namespace: 'default',
      replicas: 3,
      availableReplicas: 3,
      readyReplicas: 3,
      updatedReplicas: 3,
      status: 'available',
      strategy: 'RollingUpdate',
      selector: { app: 'rental-solutions-api' },
      labels: { app: 'rental-solutions-api', version: 'v1.0.0' },
      annotations: { 'deployment.kubernetes.io/revision': '1' },
      created: Date.now(),
      updated: Date.now(),
      conditions: [
        {
          type: 'Available',
          status: 'True',
          reason: 'MinimumReplicasAvailable',
          message: 'Deployment has minimum availability.',
          lastTransition: Date.now(),
          lastUpdate: Date.now()
        }
      ],
      template: {
        metadata: {
          labels: { app: 'rental-solutions-api' },
          annotations: {}
        },
        spec: {
          containers: [
            {
              id: this.generateId(),
              name: 'api',
              image: 'rental-solutions/api',
              imageTag: 'latest',
              status: 'running',
              ready: true,
              restartCount: 0,
              ports: [
                { containerPort: 3000, protocol: 'TCP', name: 'http' }
              ],
              resources: {
                requests: { cpu: '100m', memory: '128Mi' },
                limits: { cpu: '500m', memory: '512Mi' }
              },
              environment: {
                NODE_ENV: 'production',
                DATABASE_URL: 'postgresql://localhost:5432/rentals',
                REDIS_URL: 'redis://localhost:6379'
              },
              volumes: [],
              probes: {
                liveness: {
                  httpGet: { path: '/health', port: 3000, scheme: 'HTTP' },
                  initialDelaySeconds: 30,
                  periodSeconds: 10,
                  timeoutSeconds: 5,
                  successThreshold: 1,
                  failureThreshold: 3
                },
                readiness: {
                  httpGet: { path: '/ready', port: 3000, scheme: 'HTTP' },
                  initialDelaySeconds: 5,
                  periodSeconds: 5,
                  timeoutSeconds: 3,
                  successThreshold: 1,
                  failureThreshold: 3
                }
              }
            }
          ],
          volumes: [],
          restartPolicy: 'Always'
        }
      }
    };

    this.deployments.set(apiDeployment.id, apiDeployment);

    // Create API service
    const apiService: Service = {
      id: this.generateId(),
      name: 'rental-solutions-api-service',
      namespace: 'default',
      type: 'ClusterIP',
      clusterIP: '10.96.1.100',
      ports: [
        { name: 'http', protocol: 'TCP', port: 80, targetPort: 3000 }
      ],
      selector: { app: 'rental-solutions-api' },
      sessionAffinity: 'None',
      endpoints: [
        { ip: '10.244.1.10', port: 3000, ready: true },
        { ip: '10.244.2.10', port: 3000, ready: true },
        { ip: '10.244.3.10', port: 3000, ready: true }
      ],
      status: 'active',
      created: Date.now(),
      labels: { app: 'rental-solutions-api' },
      annotations: {}
    };

    this.services.set(apiService.id, apiService);

    // Create pods for the deployment
    for (let i = 0; i < apiDeployment.replicas; i++) {
      const pod: Pod = {
        id: this.generateId(),
        name: `rental-solutions-api-${this.generateId().substr(0, 8)}-${i}`,
        namespace: 'default',
        status: 'running',
        phase: 'Running',
        containers: [apiDeployment.template.spec.containers[0]],
        node: `rental-solutions-cluster-node-${(i % 3) + 1}`,
        labels: { app: 'rental-solutions-api', 'pod-template-hash': this.generateId().substr(0, 8) },
        annotations: {},
        created: Date.now(),
        started: Date.now(),
        restartCount: 0,
        qosClass: 'Burstable'
      };
      this.pods.set(pod.id, pod);
    }

    // Create HPA for API
    const apiHPA: HorizontalPodAutoscaler = {
      id: this.generateId(),
      name: 'rental-solutions-api-hpa',
      namespace: 'default',
      targetRef: {
        kind: 'Deployment',
        name: 'rental-solutions-api'
      },
      minReplicas: 2,
      maxReplicas: 10,
      currentReplicas: 3,
      desiredReplicas: 3,
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: 70
            }
          }
        }
      ],
      status: 'active',
      conditions: [
        {
          type: 'AbleToScale',
          status: 'True',
          reason: 'ReadyForNewScale',
          message: 'recommended size matches current size',
          lastTransition: Date.now()
        }
      ],
      created: Date.now(),
      updated: Date.now()
    };

    this.autoscalers.set(apiHPA.id, apiHPA);
  }

  private setupClusterMonitoring(): void {
    // Monitor cluster health every 30 seconds
    setInterval(() => {
      this.updateClusterMetrics();
      this.checkPodHealth();
      this.evaluateAutoscaling();
    }, 30000);

    // Cleanup completed pods every 5 minutes
    setInterval(() => {
      this.cleanupCompletedPods();
    }, 300000);
  }

  private updateClusterMetrics(): void {
    const timestamp = Date.now();
    
    // Simulate resource usage metrics
    const cpuUsage = Math.random() * 80 + 10; // 10-90%
    const memoryUsage = Math.random() * 75 + 15; // 15-90%
    const storageUsage = Math.random() * 60 + 20; // 20-80%

    performanceAnalytics.recordMetric({
      name: 'Kubernetes CPU Usage',
      value: cpuUsage,
      unit: 'percent',
      category: 'infrastructure',
      tags: { cluster: this.config.cluster.name, region: this.config.cluster.region }
    });

    performanceAnalytics.recordMetric({
      name: 'Kubernetes Memory Usage',
      value: memoryUsage,
      unit: 'percent',
      category: 'infrastructure',
      tags: { cluster: this.config.cluster.name, region: this.config.cluster.region }
    });

    performanceAnalytics.recordMetric({
      name: 'Kubernetes Storage Usage',
      value: storageUsage,
      unit: 'percent',
      category: 'infrastructure',
      tags: { cluster: this.config.cluster.name, region: this.config.cluster.region }
    });
  }

  private checkPodHealth(): void {
    this.pods.forEach(pod => {
      pod.containers.forEach(container => {
        // Simulate health check (95% success rate)
        const isHealthy = Math.random() > 0.05;
        
        if (!isHealthy && container.status === 'running') {
          container.status = 'terminated';
          container.ready = false;
          pod.restartCount++;
          
          this.logEvent('pod_health_check_failed', {
            podName: pod.name,
            containerName: container.name,
            namespace: pod.namespace
          });
          
          // Simulate restart
          setTimeout(() => {
            container.status = 'running';
            container.ready = true;
          }, 10000);
        }
      });
    });
  }

  private evaluateAutoscaling(): void {
    this.autoscalers.forEach(hpa => {
      const deployment = Array.from(this.deployments.values())
        .find(d => d.name === hpa.targetRef.name);
        
      if (!deployment) return;

      // Simulate CPU metrics
      const avgCPUUtilization = Math.random() * 100;
      
      hpa.metrics.forEach(metric => {
        if (metric.type === 'Resource' && metric.resource?.name === 'cpu') {
          const targetUtilization = metric.resource.target.averageUtilization || 70;
          
          if (avgCPUUtilization > targetUtilization && hpa.currentReplicas < hpa.maxReplicas) {
            const newReplicas = Math.min(hpa.maxReplicas, hpa.currentReplicas + 1);
            this.scaleDeployment(deployment.id, newReplicas);
            hpa.currentReplicas = newReplicas;
            hpa.desiredReplicas = newReplicas;
            
            this.logEvent('autoscaler_scale_up', {
              hpaName: hpa.name,
              deploymentName: deployment.name,
              oldReplicas: hpa.currentReplicas - 1,
              newReplicas: newReplicas,
              reason: 'CPU utilization above target'
            });
          } else if (avgCPUUtilization < targetUtilization * 0.5 && hpa.currentReplicas > hpa.minReplicas) {
            const newReplicas = Math.max(hpa.minReplicas, hpa.currentReplicas - 1);
            this.scaleDeployment(deployment.id, newReplicas);
            hpa.currentReplicas = newReplicas;
            hpa.desiredReplicas = newReplicas;
            
            this.logEvent('autoscaler_scale_down', {
              hpaName: hpa.name,
              deploymentName: deployment.name,
              oldReplicas: hpa.currentReplicas + 1,
              newReplicas: newReplicas,
              reason: 'CPU utilization below target'
            });
          }
        }
      });
    });
  }

  private cleanupCompletedPods(): void {
    const podsToDelete: string[] = [];
    
    this.pods.forEach((pod, id) => {
      if (pod.status === 'succeeded' || (pod.status === 'failed' && pod.restartCount > 5)) {
        podsToDelete.push(id);
      }
    });

    podsToDelete.forEach(id => {
      this.pods.delete(id);
    });

    if (podsToDelete.length > 0) {
      this.logEvent('pods_cleaned_up', {
        count: podsToDelete.length,
        reason: 'Completed or failed pods cleanup'
      });
    }
  }

  // Public API methods
  async createDeployment(deploymentConfig: Omit<Deployment, 'id' | 'created' | 'updated' | 'conditions'>): Promise<string> {
    const deployment: Deployment = {
      id: this.generateId(),
      created: Date.now(),
      updated: Date.now(),
      conditions: [
        {
          type: 'Progressing',
          status: 'True',
          reason: 'NewReplicaSetCreated',
          message: 'Created new replica set',
          lastTransition: Date.now(),
          lastUpdate: Date.now()
        }
      ],
      ...deploymentConfig
    };

    this.deployments.set(deployment.id, deployment);
    
    // Create pods for the deployment
    for (let i = 0; i < deployment.replicas; i++) {
      await this.createPod(deployment);
    }

    this.logEvent('deployment_created', {
      deploymentId: deployment.id,
      name: deployment.name,
      namespace: deployment.namespace,
      replicas: deployment.replicas
    });

    return deployment.id;
  }

  async createService(serviceConfig: Omit<Service, 'id' | 'created'>): Promise<string> {
    const service: Service = {
      id: this.generateId(),
      created: Date.now(),
      ...serviceConfig
    };

    this.services.set(service.id, service);
    
    this.logEvent('service_created', {
      serviceId: service.id,
      name: service.name,
      namespace: service.namespace,
      type: service.type
    });

    return service.id;
  }

  async createPod(deployment: Deployment): Promise<string> {
    const pod: Pod = {
      id: this.generateId(),
      name: `${deployment.name}-${this.generateId().substr(0, 8)}`,
      namespace: deployment.namespace,
      status: 'pending',
      phase: 'Pending',
      containers: deployment.template.spec.containers.map(container => ({
        ...container,
        id: this.generateId(),
        status: 'waiting'
      })),
      node: this.selectNodeForPod(),
      labels: { ...deployment.template.metadata.labels },
      annotations: { ...deployment.template.metadata.annotations },
      created: Date.now(),
      restartCount: 0,
      qosClass: this.calculateQoSClass(deployment.template.spec.containers)
    };

    this.pods.set(pod.id, pod);
    
    // Simulate pod startup
    setTimeout(() => {
      pod.status = 'running';
      pod.phase = 'Running';
      pod.started = Date.now();
      pod.containers.forEach(container => {
        container.status = 'running';
        container.ready = true;
      });
    }, Math.random() * 30000 + 5000); // 5-35 seconds

    this.logEvent('pod_created', {
      podId: pod.id,
      name: pod.name,
      namespace: pod.namespace,
      node: pod.node
    });

    return pod.id;
  }

  async scaleDeployment(deploymentId: string, replicas: number): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const oldReplicas = deployment.replicas;
    deployment.replicas = replicas;
    deployment.updated = Date.now();

    // Scale up - create new pods
    if (replicas > oldReplicas) {
      for (let i = 0; i < replicas - oldReplicas; i++) {
        await this.createPod(deployment);
      }
    }
    // Scale down - remove pods
    else if (replicas < oldReplicas) {
      const podsToRemove = Array.from(this.pods.values())
        .filter(pod => pod.labels.app === deployment.selector.app)
        .slice(0, oldReplicas - replicas);
        
      podsToRemove.forEach(pod => {
        this.pods.delete(pod.id);
      });
    }

    deployment.availableReplicas = replicas;
    deployment.readyReplicas = replicas;
    deployment.updatedReplicas = replicas;

    this.logEvent('deployment_scaled', {
      deploymentId,
      name: deployment.name,
      oldReplicas,
      newReplicas: replicas
    });
  }

  async deletePod(podId: string): Promise<void> {
    const pod = this.pods.get(podId);
    if (!pod) {
      throw new Error(`Pod ${podId} not found`);
    }

    this.pods.delete(podId);
    
    this.logEvent('pod_deleted', {
      podId,
      name: pod.name,
      namespace: pod.namespace
    });
  }

  async createConfigMap(configMapData: Omit<ConfigMap, 'id' | 'created'>): Promise<string> {
    const configMap: ConfigMap = {
      id: this.generateId(),
      created: Date.now(),
      ...configMapData
    };

    this.configMaps.set(configMap.id, configMap);
    
    this.logEvent('configmap_created', {
      configMapId: configMap.id,
      name: configMap.name,
      namespace: configMap.namespace
    });

    return configMap.id;
  }

  async createSecret(secretData: Omit<Secret, 'id' | 'created'>): Promise<string> {
    const secret: Secret = {
      id: this.generateId(),
      created: Date.now(),
      ...secretData
    };

    this.secrets.set(secret.id, secret);
    
    this.logEvent('secret_created', {
      secretId: secret.id,
      name: secret.name,
      namespace: secret.namespace,
      type: secret.type
    });

    return secret.id;
  }

  private selectNodeForPod(): string {
    const clusters = Array.from(this.clusters.values());
    if (clusters.length === 0) return 'unknown';
    
    const cluster = clusters[0];
    const availableNodes = cluster.nodes.filter(node => node.status === 'ready');
    
    if (availableNodes.length === 0) return 'unknown';
    
    // Simple round-robin selection
    const randomIndex = Math.floor(Math.random() * availableNodes.length);
    return availableNodes[randomIndex].name;
  }

  private calculateQoSClass(containers: Container[]): 'Guaranteed' | 'Burstable' | 'BestEffort' {
    const hasLimits = containers.every(c => c.resources.limits.cpu && c.resources.limits.memory);
    const hasRequests = containers.every(c => c.resources.requests.cpu && c.resources.requests.memory);
    const limitsEqualRequests = containers.every(c => 
      c.resources.limits.cpu === c.resources.requests.cpu &&
      c.resources.limits.memory === c.resources.requests.memory
    );

    if (hasLimits && hasRequests && limitsEqualRequests) {
      return 'Guaranteed';
    } else if (hasRequests || hasLimits) {
      return 'Burstable';
    } else {
      return 'BestEffort';
    }
  }

  // Getter methods
  getClusters(): KubernetesCluster[] {
    return Array.from(this.clusters.values());
  }

  getPods(namespace?: string): Pod[] {
    const pods = Array.from(this.pods.values());
    return namespace ? pods.filter(pod => pod.namespace === namespace) : pods;
  }

  getServices(namespace?: string): Service[] {
    const services = Array.from(this.services.values());
    return namespace ? services.filter(service => service.namespace === namespace) : services;
  }

  getDeployments(namespace?: string): Deployment[] {
    const deployments = Array.from(this.deployments.values());
    return namespace ? deployments.filter(deployment => deployment.namespace === namespace) : deployments;
  }

  getConfigMaps(namespace?: string): ConfigMap[] {
    const configMaps = Array.from(this.configMaps.values());
    return namespace ? configMaps.filter(configMap => configMap.namespace === namespace) : configMaps;
  }

  getSecrets(namespace?: string): Secret[] {
    const secrets = Array.from(this.secrets.values());
    return namespace ? secrets.filter(secret => secret.namespace === namespace) : secrets;
  }

  getHorizontalPodAutoscalers(namespace?: string): HorizontalPodAutoscaler[] {
    const hpas = Array.from(this.autoscalers.values());
    return namespace ? hpas.filter(hpa => hpa.namespace === namespace) : hpas;
  }

  getClusterMetrics(): ClusterMetrics {
    const nodes = this.clusters.size > 0 ? this.clusters.values().next().value.nodes : [];
    const pods = Array.from(this.pods.values());
    const services = Array.from(this.services.values());
    const deployments = Array.from(this.deployments.values());

    // Calculate resource usage
    const totalCPU = nodes.reduce((sum: number, node: ClusterNode) => sum + parseFloat(node.capacity.cpu.replace('m', '')), 0);
    const totalMemory = nodes.reduce((sum: number, node: ClusterNode) => sum + this.parseMemory(node.capacity.memory), 0);
    const totalStorage = nodes.reduce((sum: number, node: ClusterNode) => sum + this.parseStorage(node.capacity.storage), 0);

    // Simulate usage (would be real metrics in production)
    const usedCPU = totalCPU * (Math.random() * 0.8 + 0.1); // 10-90% usage
    const usedMemory = totalMemory * (Math.random() * 0.75 + 0.15); // 15-90% usage
    const usedStorage = totalStorage * (Math.random() * 0.6 + 0.2); // 20-80% usage

    return {
      nodes: {
        total: nodes.length,
        ready: nodes.filter(node => node.status === 'ready').length,
        notReady: nodes.filter(node => node.status !== 'ready').length
      },
      pods: {
        total: pods.length,
        running: pods.filter(pod => pod.status === 'running').length,
        pending: pods.filter(pod => pod.status === 'pending').length,
        failed: pods.filter(pod => pod.status === 'failed').length
      },
      services: {
        total: services.length,
        active: services.filter(service => service.status === 'active').length,
        inactive: services.filter(service => service.status !== 'active').length
      },
      deployments: {
        total: deployments.length,
        available: deployments.filter(deployment => deployment.status === 'available').length,
        progressing: deployments.filter(deployment => deployment.status === 'progressing').length
      },
      resources: {
        cpu: {
          capacity: totalCPU,
          allocatable: totalCPU * 0.95,
          used: usedCPU,
          percentage: (usedCPU / totalCPU) * 100
        },
        memory: {
          capacity: totalMemory,
          allocatable: totalMemory * 0.9,
          used: usedMemory,
          percentage: (usedMemory / totalMemory) * 100
        },
        storage: {
          capacity: totalStorage,
          used: usedStorage,
          percentage: (usedStorage / totalStorage) * 100
        }
      },
      network: {
        ingressTraffic: Math.random() * 1000000, // bytes/sec
        egressTraffic: Math.random() * 800000, // bytes/sec
        activeConnections: Math.floor(Math.random() * 1000)
      }
    };
  }

  private parseMemory(memory: string): number {
    if (memory.endsWith('Gi')) {
      return parseFloat(memory.replace('Gi', '')) * 1024 * 1024 * 1024;
    } else if (memory.endsWith('Mi')) {
      return parseFloat(memory.replace('Mi', '')) * 1024 * 1024;
    } else if (memory.endsWith('Ki')) {
      return parseFloat(memory.replace('Ki', '')) * 1024;
    }
    return parseFloat(memory);
  }

  private parseStorage(storage: string): number {
    if (storage.endsWith('Gi')) {
      return parseFloat(storage.replace('Gi', '')) * 1024 * 1024 * 1024;
    } else if (storage.endsWith('Mi')) {
      return parseFloat(storage.replace('Mi', '')) * 1024 * 1024;
    } else if (storage.endsWith('Ki')) {
      return parseFloat(storage.replace('Ki', '')) * 1024;
    }
    return parseFloat(storage);
  }

  private logEvent(event: string, data?: any): void {
    console.log(`Container Event: ${event}`, data);
    
    performanceAnalytics.recordMetric({
      name: `Container ${event}`,
      value: 1,
      unit: 'count',
      category: 'infrastructure',
      tags: data
    });
  }

  private generateId(): string {
    return `k8s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    this.clusters.clear();
    this.pods.clear();
    this.services.clear();
    this.deployments.clear();
    this.configMaps.clear();
    this.secrets.clear();
    this.persistentVolumes.clear();
    this.persistentVolumeClaims.clear();
    this.autoscalers.clear();
  }
}

// Create singleton instance
export const containerService = new ContainerService();

// Convenience functions
export const createDeployment = (config: any) => containerService.createDeployment(config);
export const createService = (config: any) => containerService.createService(config);
export const scaleDeployment = (deploymentId: string, replicas: number) => containerService.scaleDeployment(deploymentId, replicas);
export const getPods = (namespace?: string) => containerService.getPods(namespace);
export const getServices = (namespace?: string) => containerService.getServices(namespace);
export const getDeployments = (namespace?: string) => containerService.getDeployments(namespace);
export const getClusterMetrics = () => containerService.getClusterMetrics();
