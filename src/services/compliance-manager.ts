import { securityService } from './security-service';
import { performanceAnalytics } from './performance-analytics';

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  requirements: ComplianceRequirement[];
  assessmentSchedule: AssessmentSchedule;
  isActive: boolean;
  lastAssessment?: number;
  nextAssessment?: number;
  overallScore: number;
  certificationStatus: 'certified' | 'in_progress' | 'expired' | 'not_certified';
}

export interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'pending';
  score: number; // 0-100
  evidence: Evidence[];
  controls: Control[];
  lastVerified?: number;
  nextReview?: number;
  responsible: string;
  dueDate?: number;
  remediation?: RemediationPlan;
}

export interface Evidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'certificate' | 'policy' | 'procedure';
  title: string;
  description: string;
  url?: string;
  uploadedAt: number;
  uploadedBy: string;
  expiresAt?: number;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: number;
}

export interface Control {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  implementation: 'manual' | 'automated' | 'hybrid';
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  effectiveness: number; // 0-100
  lastTested?: number;
  nextTest?: number;
  owner: string;
  status: 'active' | 'inactive' | 'pending' | 'failed';
}

export interface AssessmentSchedule {
  frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  assessor: 'internal' | 'external' | 'third_party';
  scope: string[];
  duration: number; // in days
  cost?: number;
}

export interface RemediationPlan {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  estimatedEffort: number; // in hours
  estimatedCost?: number;
  startDate?: number;
  dueDate: number;
  completedDate?: number;
  tasks: RemediationTask[];
  progress: number; // 0-100
}

export interface RemediationTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo: string;
  dueDate: number;
  completedDate?: number;
  dependencies: string[];
  effort: number; // in hours
}

export interface DataPrivacyRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  subjectId: string;
  subjectEmail: string;
  requestDate: number;
  dueDate: number;
  status: 'received' | 'processing' | 'completed' | 'rejected' | 'extended';
  assignedTo?: string;
  description: string;
  response?: string;
  completedDate?: number;
  dataCategories: string[];
  legalBasis?: string;
  processingActivities: string[];
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: number; // in days
  crossBorderTransfers: boolean;
  safeguards?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  dpia?: DataProtectionImpactAssessment;
  lastReviewed: number;
  nextReview: number;
  owner: string;
  status: 'active' | 'inactive' | 'under_review';
}

export interface DataProtectionImpactAssessment {
  id: string;
  activityId: string;
  conductedBy: string;
  conductedDate: number;
  riskIdentification: Risk[];
  mitigationMeasures: MitigationMeasure[];
  residualRisk: 'low' | 'medium' | 'high' | 'very_high';
  recommendation: string;
  approvedBy?: string;
  approvedDate?: number;
  nextReview: number;
}

export interface Risk {
  id: string;
  category: string;
  description: string;
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number; // 0-100
  affectedDataSubjects: number;
}

export interface MitigationMeasure {
  id: string;
  riskId: string;
  description: string;
  type: 'technical' | 'organizational' | 'legal';
  implementation: 'implemented' | 'planned' | 'not_applicable';
  effectiveness: number; // 0-100
  cost?: number;
  timeline?: number; // in days
}

export interface ComplianceReport {
  id: string;
  type: 'assessment' | 'audit' | 'certification' | 'incident' | 'breach';
  frameworkId?: string;
  title: string;
  description: string;
  generatedDate: number;
  period: {
    start: number;
    end: number;
  };
  scope: string[];
  findings: Finding[];
  recommendations: Recommendation[];
  overallScore: number;
  status: 'draft' | 'final' | 'submitted' | 'approved';
  generatedBy: string;
  approvedBy?: string;
  approvedDate?: number;
  submittedTo?: string[];
  dueDate?: number;
}

export interface Finding {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  title: string;
  description: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: number;
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  timeline: number; // in days
  dependencies: string[];
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

class ComplianceManager {
  private frameworks: Map<string, ComplianceFramework> = new Map();
  private privacyRequests: DataPrivacyRequest[] = [];
  private processingActivities: DataProcessingActivity[] = [];
  private reports: ComplianceReport[] = [];
  private remediationPlans: RemediationPlan[] = [];

  constructor() {
    this.initializeFrameworks();
    this.startComplianceMonitoring();
  }

  private initializeFrameworks(): void {
    // GDPR Framework
    this.frameworks.set('gdpr', {
      id: 'gdpr',
      name: 'General Data Protection Regulation',
      version: '2018',
      description: 'EU regulation on data protection and privacy',
      isActive: true,
      overallScore: 95,
      certificationStatus: 'certified',
      assessmentSchedule: {
        frequency: 'annually',
        assessor: 'external',
        scope: ['data_processing', 'privacy_rights', 'security_measures'],
        duration: 30
      },
      requirements: [
        {
          id: 'gdpr_art_5',
          frameworkId: 'gdpr',
          category: 'Data Processing Principles',
          title: 'Lawfulness, fairness and transparency',
          description: 'Personal data shall be processed lawfully, fairly and in a transparent manner',
          priority: 'critical',
          status: 'compliant',
          score: 98,
          evidence: [],
          controls: [],
          responsible: 'Data Protection Officer',
          lastVerified: Date.now() - 30 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 90 * 24 * 60 * 60 * 1000
        },
        {
          id: 'gdpr_art_6',
          frameworkId: 'gdpr',
          category: 'Legal Basis',
          title: 'Lawfulness of processing',
          description: 'Processing shall be lawful only if and to the extent that at least one legal basis applies',
          priority: 'critical',
          status: 'compliant',
          score: 96,
          evidence: [],
          controls: [],
          responsible: 'Legal Team',
          lastVerified: Date.now() - 15 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 180 * 24 * 60 * 60 * 1000
        },
        {
          id: 'gdpr_art_25',
          frameworkId: 'gdpr',
          category: 'Data Protection by Design',
          title: 'Data protection by design and by default',
          description: 'Implement appropriate technical and organisational measures',
          priority: 'high',
          status: 'partial',
          score: 85,
          evidence: [],
          controls: [],
          responsible: 'Engineering Team',
          lastVerified: Date.now() - 45 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 60 * 24 * 60 * 60 * 1000
        },
        {
          id: 'gdpr_art_32',
          frameworkId: 'gdpr',
          category: 'Security',
          title: 'Security of processing',
          description: 'Implement appropriate technical and organisational measures to ensure security',
          priority: 'critical',
          status: 'compliant',
          score: 94,
          evidence: [],
          controls: [],
          responsible: 'Security Team',
          lastVerified: Date.now() - 7 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 30 * 24 * 60 * 60 * 1000
        }
      ]
    });

    // SOC 2 Framework
    this.frameworks.set('soc2', {
      id: 'soc2',
      name: 'SOC 2 Type II',
      version: '2017',
      description: 'Service Organization Control 2 for service providers',
      isActive: true,
      overallScore: 92,
      certificationStatus: 'certified',
      assessmentSchedule: {
        frequency: 'annually',
        assessor: 'third_party',
        scope: ['security', 'availability', 'confidentiality'],
        duration: 45,
        cost: 50000
      },
      requirements: [
        {
          id: 'soc2_cc1',
          frameworkId: 'soc2',
          category: 'Control Environment',
          title: 'Control Environment',
          description: 'The entity demonstrates a commitment to integrity and ethical values',
          priority: 'critical',
          status: 'compliant',
          score: 95,
          evidence: [],
          controls: [],
          responsible: 'Management',
          lastVerified: Date.now() - 60 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 120 * 24 * 60 * 60 * 1000
        },
        {
          id: 'soc2_cc6',
          frameworkId: 'soc2',
          category: 'Logical Access',
          title: 'Logical and Physical Access Controls',
          description: 'The entity implements logical access security software and infrastructure',
          priority: 'critical',
          status: 'compliant',
          score: 93,
          evidence: [],
          controls: [],
          responsible: 'IT Security',
          lastVerified: Date.now() - 30 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 90 * 24 * 60 * 60 * 1000
        },
        {
          id: 'soc2_a1',
          frameworkId: 'soc2',
          category: 'Availability',
          title: 'Availability',
          description: 'The entity maintains commitments and system requirements for availability',
          priority: 'high',
          status: 'partial',
          score: 88,
          evidence: [],
          controls: [],
          responsible: 'Operations Team',
          lastVerified: Date.now() - 20 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 60 * 24 * 60 * 60 * 1000
        }
      ]
    });

    // ISO 27001 Framework
    this.frameworks.set('iso27001', {
      id: 'iso27001',
      name: 'ISO/IEC 27001:2013',
      version: '2013',
      description: 'Information security management systems requirements',
      isActive: true,
      overallScore: 89,
      certificationStatus: 'in_progress',
      assessmentSchedule: {
        frequency: 'annually',
        assessor: 'external',
        scope: ['information_security', 'risk_management', 'business_continuity'],
        duration: 60,
        cost: 75000
      },
      requirements: [
        {
          id: 'iso27001_a5',
          frameworkId: 'iso27001',
          category: 'Information Security Policies',
          title: 'Information security policies',
          description: 'Management direction and support for information security',
          priority: 'critical',
          status: 'compliant',
          score: 92,
          evidence: [],
          controls: [],
          responsible: 'CISO',
          lastVerified: Date.now() - 90 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 180 * 24 * 60 * 60 * 1000
        },
        {
          id: 'iso27001_a9',
          frameworkId: 'iso27001',
          category: 'Access Control',
          title: 'Access control',
          description: 'To limit access to information and information processing facilities',
          priority: 'critical',
          status: 'compliant',
          score: 90,
          evidence: [],
          controls: [],
          responsible: 'Access Control Team',
          lastVerified: Date.now() - 45 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 90 * 24 * 60 * 60 * 1000
        },
        {
          id: 'iso27001_a12',
          frameworkId: 'iso27001',
          category: 'Operations Security',
          title: 'Operations security',
          description: 'To ensure correct and secure operations of information processing facilities',
          priority: 'high',
          status: 'partial',
          score: 85,
          evidence: [],
          controls: [],
          responsible: 'Operations Team',
          lastVerified: Date.now() - 30 * 24 * 60 * 60 * 1000,
          nextReview: Date.now() + 60 * 24 * 60 * 60 * 1000
        }
      ]
    });
  }

  private startComplianceMonitoring(): void {
    // Monitor compliance status every hour
    setInterval(() => {
      this.assessComplianceStatus();
      this.checkDueDates();
      this.updateScores();
    }, 60 * 60 * 1000);

    // Daily privacy request processing
    setInterval(() => {
      this.processPrivacyRequests();
    }, 24 * 60 * 60 * 1000);

    // Initial assessment
    setTimeout(() => this.assessComplianceStatus(), 5000);
  }

  private assessComplianceStatus(): void {
    this.frameworks.forEach(framework => {
      let totalScore = 0;
      let compliantRequirements = 0;
      
      framework.requirements.forEach(requirement => {
        totalScore += requirement.score;
        if (requirement.status === 'compliant') {
          compliantRequirements++;
        }
      });
      
      framework.overallScore = totalScore / framework.requirements.length;
      
      // Update certification status based on score
      if (framework.overallScore >= 95) {
        framework.certificationStatus = 'certified';
      } else if (framework.overallScore >= 80) {
        framework.certificationStatus = 'in_progress';
      } else {
        framework.certificationStatus = 'not_certified';
      }
      
      // Report metrics
      performanceAnalytics.recordMetric({
        name: `Compliance Score - ${framework.name}`,
        value: framework.overallScore,
        unit: 'percentage',
        category: 'compliance',
        tags: { framework: framework.id }
      });
    });
  }

  private checkDueDates(): void {
    const now = Date.now();
    const warningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Check requirement review dates
    this.frameworks.forEach(framework => {
      framework.requirements.forEach(requirement => {
        if (requirement.nextReview && requirement.nextReview - now < warningThreshold) {
          this.createComplianceAlert({
            type: 'review_due',
            severity: 'medium',
            title: `Compliance Review Due: ${requirement.title}`,
            description: `Review due for ${framework.name} requirement`,
            dueDate: requirement.nextReview,
            frameworkId: framework.id,
            requirementId: requirement.id
          });
        }
      });
    });
    
    // Check privacy request due dates
    this.privacyRequests.forEach(request => {
      if (request.status !== 'completed' && request.dueDate - now < warningThreshold) {
        this.createComplianceAlert({
          type: 'privacy_request_due',
          severity: 'high',
          title: `Privacy Request Due: ${request.type}`,
          description: `Privacy request from ${request.subjectEmail} is due soon`,
          dueDate: request.dueDate,
          requestId: request.id
        });
      }
    });
  }

  private updateScores(): void {
    // Update requirement scores based on recent security events
    const recentEvents = securityService.getSecurityEvents(24 * 60 * 60 * 1000); // Last 24 hours
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;
    
    this.frameworks.forEach(framework => {
      framework.requirements.forEach(requirement => {
        // Reduce scores for security-related requirements if there are incidents
        if (requirement.category.toLowerCase().includes('security')) {
          const penalty = (criticalEvents * 5) + (highEvents * 2);
          requirement.score = Math.max(0, requirement.score - penalty);
          
          if (requirement.score < 80) {
            requirement.status = 'partial';
          } else if (requirement.score < 60) {
            requirement.status = 'non_compliant';
          }
        }
      });
    });
  }

  private processPrivacyRequests(): void {
    const now = Date.now();
    
    this.privacyRequests.forEach(request => {
      if (request.status === 'received') {
        // Auto-assign to appropriate team member
        request.assignedTo = this.getAssigneeForRequestType(request.type);
        request.status = 'processing';
        
        this.logComplianceActivity({
          type: 'privacy_request_assigned',
          description: `Privacy request ${request.id} assigned to ${request.assignedTo}`,
          timestamp: now,
          metadata: { requestId: request.id, type: request.type }
        });
      }
      
      // Check for overdue requests
      if (request.status === 'processing' && now > request.dueDate) {
        this.createComplianceAlert({
          type: 'privacy_request_overdue',
          severity: 'critical',
          title: `Overdue Privacy Request: ${request.type}`,
          description: `Privacy request from ${request.subjectEmail} is overdue`,
          dueDate: request.dueDate,
          requestId: request.id
        });
      }
    });
  }

  private getAssigneeForRequestType(type: string): string {
    switch (type) {
      case 'access':
      case 'portability':
        return 'data-team@company.com';
      case 'rectification':
      case 'erasure':
        return 'privacy-team@company.com';
      case 'restriction':
      case 'objection':
        return 'legal-team@company.com';
      default:
        return 'privacy-officer@company.com';
    }
  }

  private createComplianceAlert(alert: any): void {
    // In a real implementation, this would create alerts in the system
    console.log('Compliance Alert:', alert);
    
    // Log as security event
    securityService.getSecurityEvents(); // This would trigger the security service
  }

  private logComplianceActivity(activity: any): void {
    // Log compliance activities for audit trail
    console.log('Compliance Activity:', activity);
  }

  // Public API methods
  getFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  getFramework(id: string): ComplianceFramework | undefined {
    return this.frameworks.get(id);
  }

  getComplianceScore(frameworkId?: string): number {
    if (frameworkId) {
      const framework = this.frameworks.get(frameworkId);
      return framework?.overallScore || 0;
    }
    
    // Overall compliance score across all frameworks
    const frameworks = Array.from(this.frameworks.values());
    const totalScore = frameworks.reduce((sum, f) => sum + f.overallScore, 0);
    return frameworks.length > 0 ? totalScore / frameworks.length : 0;
  }

  getRequirementsByStatus(status: string, frameworkId?: string): ComplianceRequirement[] {
    const requirements: ComplianceRequirement[] = [];
    
    const frameworksToCheck = frameworkId ? 
      [this.frameworks.get(frameworkId)].filter(Boolean) : 
      Array.from(this.frameworks.values());
    
    frameworksToCheck.forEach(framework => {
      if (framework) {
        requirements.push(...framework.requirements.filter(r => r.status === status));
      }
    });
    
    return requirements;
  }

  async submitPrivacyRequest(request: Omit<DataPrivacyRequest, 'id' | 'requestDate' | 'dueDate' | 'status'>): Promise<DataPrivacyRequest> {
    const privacyRequest: DataPrivacyRequest = {
      id: this.generateId(),
      requestDate: Date.now(),
      dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days as per GDPR
      status: 'received',
      ...request
    };
    
    this.privacyRequests.push(privacyRequest);
    
    this.logComplianceActivity({
      type: 'privacy_request_submitted',
      description: `New ${request.type} request from ${request.subjectEmail}`,
      timestamp: Date.now(),
      metadata: { requestId: privacyRequest.id, type: request.type }
    });
    
    return privacyRequest;
  }

  getPrivacyRequests(status?: string): DataPrivacyRequest[] {
    let requests = [...this.privacyRequests];
    
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    
    return requests.sort((a, b) => b.requestDate - a.requestDate);
  }

  async processPrivacyRequest(requestId: string, response: string, status: 'completed' | 'rejected'): Promise<boolean> {
    const request = this.privacyRequests.find(r => r.id === requestId);
    if (!request) return false;
    
    request.status = status;
    request.response = response;
    request.completedDate = Date.now();
    
    this.logComplianceActivity({
      type: 'privacy_request_processed',
      description: `Privacy request ${requestId} ${status}`,
      timestamp: Date.now(),
      metadata: { requestId, status, response }
    });
    
    return true;
  }

  addProcessingActivity(activity: Omit<DataProcessingActivity, 'id' | 'lastReviewed' | 'nextReview'>): DataProcessingActivity {
    const processingActivity: DataProcessingActivity = {
      id: this.generateId(),
      lastReviewed: Date.now(),
      nextReview: Date.now() + (365 * 24 * 60 * 60 * 1000), // Annual review
      ...activity
    };
    
    this.processingActivities.push(processingActivity);
    
    this.logComplianceActivity({
      type: 'processing_activity_added',
      description: `New processing activity: ${activity.name}`,
      timestamp: Date.now(),
      metadata: { activityId: processingActivity.id }
    });
    
    return processingActivity;
  }

  getProcessingActivities(riskLevel?: string): DataProcessingActivity[] {
    let activities = [...this.processingActivities];
    
    if (riskLevel) {
      activities = activities.filter(a => a.riskLevel === riskLevel);
    }
    
    return activities.sort((a, b) => b.lastReviewed - a.lastReviewed);
  }

  generateComplianceReport(frameworkId: string, type: 'assessment' | 'audit' | 'certification'): ComplianceReport {
    const framework = this.frameworks.get(frameworkId);
    if (!framework) {
      throw new Error(`Framework ${frameworkId} not found`);
    }
    
    const report: ComplianceReport = {
      id: this.generateId(),
      type,
      frameworkId,
      title: `${framework.name} ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      description: `Comprehensive ${type} report for ${framework.name} compliance`,
      generatedDate: Date.now(),
      period: {
        start: Date.now() - (90 * 24 * 60 * 60 * 1000), // Last 90 days
        end: Date.now()
      },
      scope: framework.assessmentSchedule.scope,
      findings: this.generateFindings(framework),
      recommendations: this.generateRecommendations(framework),
      overallScore: framework.overallScore,
      status: 'draft',
      generatedBy: 'system'
    };
    
    this.reports.push(report);
    
    this.logComplianceActivity({
      type: 'report_generated',
      description: `${type} report generated for ${framework.name}`,
      timestamp: Date.now(),
      metadata: { reportId: report.id, frameworkId }
    });
    
    return report;
  }

  private generateFindings(framework: ComplianceFramework): Finding[] {
    const findings: Finding[] = [];
    
    framework.requirements.forEach(requirement => {
      if (requirement.status === 'non_compliant' || requirement.status === 'partial') {
        findings.push({
          id: this.generateId(),
          category: requirement.category,
          severity: requirement.priority === 'critical' ? 'critical' : 
                   requirement.priority === 'high' ? 'high' : 'medium',
          title: `Non-compliance: ${requirement.title}`,
          description: requirement.description,
          evidence: requirement.evidence.map(e => e.title),
          impact: `Compliance score: ${requirement.score}%`,
          recommendation: `Address gaps in ${requirement.title}`,
          status: 'open',
          assignedTo: requirement.responsible
        });
      }
    });
    
    return findings;
  }

  private generateRecommendations(framework: ComplianceFramework): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Generate recommendations based on framework requirements
    const partialRequirements = framework.requirements.filter(r => r.status === 'partial');
    
    partialRequirements.forEach(requirement => {
      recommendations.push({
        id: this.generateId(),
        priority: requirement.priority,
        title: `Improve ${requirement.title}`,
        description: `Enhance compliance for ${requirement.title} to achieve full compliance`,
        benefit: `Increase compliance score and reduce regulatory risk`,
        effort: requirement.priority === 'critical' ? 'high' : 'medium',
        cost: requirement.priority === 'critical' ? 'high' : 'medium',
        timeline: requirement.priority === 'critical' ? 30 : 90,
        dependencies: [],
        status: 'proposed'
      });
    });
    
    return recommendations;
  }

  getReports(frameworkId?: string): ComplianceReport[] {
    let reports = [...this.reports];
    
    if (frameworkId) {
      reports = reports.filter(r => r.frameworkId === frameworkId);
    }
    
    return reports.sort((a, b) => b.generatedDate - a.generatedDate);
  }

  getComplianceDashboard(): {
    overallScore: number;
    frameworkScores: { [key: string]: number };
    criticalFindings: number;
    pendingRequests: number;
    upcomingReviews: number;
    certificationStatus: { [key: string]: string };
  } {
    const frameworks = Array.from(this.frameworks.values());
    const overallScore = this.getComplianceScore();
    
    const frameworkScores: { [key: string]: number } = {};
    const certificationStatus: { [key: string]: string } = {};
    
    frameworks.forEach(framework => {
      frameworkScores[framework.id] = framework.overallScore;
      certificationStatus[framework.id] = framework.certificationStatus;
    });
    
    const criticalFindings = this.getRequirementsByStatus('non_compliant').filter(
      r => r.priority === 'critical'
    ).length;
    
    const pendingRequests = this.getPrivacyRequests('processing').length;
    
    const upcomingReviews = frameworks.reduce((count, framework) => {
      const reviewsInNext30Days = framework.requirements.filter(r => 
        r.nextReview && r.nextReview - Date.now() < 30 * 24 * 60 * 60 * 1000
      ).length;
      return count + reviewsInNext30Days;
    }, 0);
    
    return {
      overallScore,
      frameworkScores,
      criticalFindings,
      pendingRequests,
      upcomingReviews,
      certificationStatus
    };
  }

  private generateId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    this.frameworks.clear();
    this.privacyRequests = [];
    this.processingActivities = [];
    this.reports = [];
    this.remediationPlans = [];
  }
}

// Create singleton instance
export const complianceManager = new ComplianceManager();

// Convenience functions
export const getComplianceScore = (frameworkId?: string) => 
  complianceManager.getComplianceScore(frameworkId);

export const submitPrivacyRequest = (request: any) => 
  complianceManager.submitPrivacyRequest(request);

export const getComplianceDashboard = () => 
  complianceManager.getComplianceDashboard();

export const generateComplianceReport = (frameworkId: string, type: any) => 
  complianceManager.generateComplianceReport(frameworkId, type); 