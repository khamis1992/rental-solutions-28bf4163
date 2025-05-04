import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { agreementSchema } from './agreement.schema';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { FormProvider } from '@/components/forms/FormProvider';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { VehicleSearchDialog } from './VehicleSearchDialog';
import { CustomerSearchDialog } from './CustomerSearchDialog';
import { VehicleInfo } from '@/types/vehicle-assignment.types';
import { CustomerInfo } from '@/types/vehicle-assignment.types';
import { VehicleAssignmentDialog } from './VehicleAssignmentDialog';
import { formatDate } from '@/lib/date-utils';
import {
  asLeaseId,
  asVehicleId,
  asCustomerId,
  asLeaseStatus,
} from '@/lib/database/type-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaseStatus } from '@/types/database-common';
import { FormattedAgreement } from './AgreementsTable';
import { AgreementStatusBadge } from './AgreementStatusBadge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database } from '@/types/database.types';
import { DbId } from '@/types/database-common';
import { TrafficFine } from '@/hooks/use-traffic-fines';
import { TrafficFinesDialog } from './TrafficFinesDialog';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import { Payment } from '@/types/payment-history.types';
import { AgreementTabs } from './AgreementTabs';
import { AgreementNotes } from './AgreementNotes';
import { AgreementChecklist } from './AgreementChecklist';
import { AgreementActions } from './AgreementActions';
import { AgreementFiles } from './AgreementFiles';
import { AgreementTimeline } from './AgreementTimeline';
import { AgreementInvoices } from './AgreementInvoices';
import { AgreementContacts } from './AgreementContacts';
import { AgreementClauses } from './AgreementClauses';
import { AgreementHistory } from './AgreementHistory';
import { AgreementTasks } from './AgreementTasks';
import { AgreementReminders } from './AgreementReminders';
import { AgreementRecurringTasks } from './AgreementRecurringTasks';
import { AgreementExpenses } from './AgreementExpenses';
import { AgreementIncidents } from './AgreementIncidents';
import { AgreementInsurance } from './AgreementInsurance';
import { AgreementCommunication } from './AgreementCommunication';
import { AgreementAnalytics } from './AgreementAnalytics';
import { AgreementSatisfaction } from './AgreementSatisfaction';
import { AgreementReviews } from './AgreementReviews';
import { AgreementUpselling } from './AgreementUpselling';
import { AgreementCrossSelling } from './AgreementCrossSelling';
import { AgreementLoyaltyPrograms } from './AgreementLoyaltyPrograms';
import { AgreementReferrals } from './AgreementReferrals';
import { AgreementFeedback } from './AgreementFeedback';
import { AgreementSurveys } from './AgreementSurveys';
import { AgreementMarketingCampaigns } from './AgreementMarketingCampaigns';
import { AgreementSocialMedia } from './AgreementSocialMedia';
import { AgreementSEO } from './AgreementSEO';
import { AgreementPPC } from './AgreementPPC';
import { AgreementEmailMarketing } from './AgreementEmailMarketing';
import { AgreementContentMarketing } from './AgreementContentMarketing';
import { AgreementAffiliateMarketing } from './AgreementAffiliateMarketing';
import { AgreementInfluencerMarketing } from './AgreementInfluencerMarketing';
import { AgreementMobileMarketing } from './AgreementMobileMarketing';
import { AgreementVideoMarketing } from './AgreementVideoMarketing';
import { AgreementWebinars } from './AgreementWebinars';
import { AgreementPodcasts } from './AgreementPodcasts';
import { AgreementPrintMarketing } from './AgreementPrintMarketing';
import { AgreementEventMarketing } from './AgreementEventMarketing';
import { AgreementPublicRelations } from './AgreementPublicRelations';
import { AgreementCustomerService } from './AgreementCustomerService';
import { AgreementTraining } from './AgreementTraining';
import { AgreementDocumentation } from './AgreementDocumentation';
import { AgreementKnowledgeBase } from './AgreementKnowledgeBase';
import { AgreementFAQ } from './AgreementFAQ';
import { AgreementSupportForums } from './AgreementSupportForums';
import { AgreementChatSupport } from './AgreementChatSupport';
import { AgreementPhoneSupport } from './AgreementPhoneSupport';
import { AgreementEmailSupport } from './AgreementEmailSupport';
import { AgreementRemoteSupport } from './AgreementRemoteSupport';
import { AgreementOnsiteSupport } from './AgreementOnsiteSupport';
import { AgreementSelfService } from './AgreementSelfService';
import { AgreementCommunitySupport } from './AgreementCommunitySupport';
import { AgreementSuccessManagement } from './AgreementSuccessManagement';
import { AgreementAccountManagement } from './AgreementAccountManagement';
import { AgreementValueRealization } from './AgreementValueRealization';
import { AgreementAdoptionPrograms } from './AgreementAdoptionPrograms';
import { AgreementRetentionStrategies } from './AgreementRetentionStrategies';
import { AgreementRenewalManagement } from './AgreementRenewalManagement';
import { AgreementExpansionOpportunities } from './AgreementExpansionOpportunities';
import { AgreementAdvocacyPrograms } from './AgreementAdvocacyPrograms';
import { AgreementFeedbackLoops } from './AgreementFeedbackLoops';
import { AgreementContinuousImprovement } from './AgreementContinuousImprovement';
import { AgreementInnovationPrograms } from './AgreementInnovationPrograms';
import { AgreementStrategicPartnerships } from './AgreementStrategicPartnerships';
import { AgreementEcosystemDevelopment } from './AgreementEcosystemDevelopment';
import { AgreementIndustryEvents } from './AgreementIndustryEvents';
import { AgreementThoughtLeadership } from './AgreementThoughtLeadership';
import { AgreementMarketResearch } from './AgreementMarketResearch';
import { AgreementCompetitiveAnalysis } from './AgreementCompetitiveAnalysis';
import { AgreementTrendAnalysis } from './AgreementTrendAnalysis';
import { AgreementFuturePlanning } from './AgreementFuturePlanning';
import { AgreementRiskManagement } from './AgreementRiskManagement';
import { AgreementCompliance } from './AgreementCompliance';
import { AgreementLegalReview } from './AgreementLegalReview';
import { AgreementIntellectualProperty } from './AgreementIntellectualProperty';
import { AgreementDataPrivacy } from './AgreementDataPrivacy';
import { AgreementSecurityMeasures } from './AgreementSecurityMeasures';
import { AgreementDisasterRecovery } from './AgreementDisasterRecovery';
import { AgreementBusinessContinuity } from './AgreementBusinessContinuity';
import { AgreementEthicalConsiderations } from './AgreementEthicalConsiderations';
import { AgreementSocialResponsibility } from './AgreementSocialResponsibility';
import { AgreementEnvironmentalImpact } from './AgreementEnvironmentalImpact';
import { AgreementSustainabilityInitiatives } from './AgreementSustainabilityInitiatives';
import { AgreementCommunityEngagement } from './AgreementCommunityEngagement';
import { AgreementPhilanthropy } from './AgreementPhilanthropy';
import { AgreementVolunteerPrograms } from './AgreementVolunteerPrograms';
import { AgreementDiversityAndInclusion } from './AgreementDiversityAndInclusion';
import { AgreementEmployeeWellbeing } from './AgreementEmployeeWellbeing';
import { AgreementWorkLifeBalance } from './AgreementWorkLifeBalance';
import { AgreementHealthAndSafety } from './AgreementHealthAndSafety';
import { AgreementTrainingAndDevelopment } from './AgreementTrainingAndDevelopment';
import { AgreementCareerAdvancement } from './AgreementCareerAdvancement';
import { AgreementMentorshipPrograms } from './AgreementMentorshipPrograms';
import { AgreementLeadershipDevelopment } from './AgreementLeadershipDevelopment';
import { AgreementSuccessionPlanning } from './AgreementSuccessionPlanning';
import { AgreementOrganizationalCulture } from './AgreementOrganizationalCulture';
import { AgreementEmployeeRecognition } from './AgreementEmployeeRecognition';
import { AgreementTeamBuilding } from './AgreementTeamBuilding';
import { AgreementCommunicationStrategies } from './AgreementCommunicationStrategies';
import { AgreementFeedbackMechanisms } from './AgreementFeedbackMechanisms';
import { AgreementPerformanceManagement } from './AgreementPerformanceManagement';
import { AgreementGoalSetting } from './AgreementGoalSetting';
import { AgreementProgressTracking } from './AgreementProgressTracking';
import { AgreementReportingAndAnalytics } from './AgreementReportingAndAnalytics';
import { AgreementDataDrivenDecisionMaking } from './AgreementDataDrivenDecisionMaking';
import { AgreementKeyPerformanceIndicators } from './AgreementKeyPerformanceIndicators';
import { AgreementMetricsAndMeasurements } from './AgreementMetricsAndMeasurements';
import { AgreementBenchmarking } from './AgreementBenchmarking';
import { AgreementBestPractices } from './AgreementBestPractices';
import { AgreementContinuousLearning } from './AgreementContinuousLearning';
import { AgreementKnowledgeSharing } from './AgreementKnowledgeSharing';
import { AgreementInnovationCulture } from './AgreementInnovationCulture';
import { AgreementExperimentation } from './AgreementExperimentation';
import { AgreementResearchAndDevelopment } from './AgreementResearchAndDevelopment';
import { AgreementTechnologyAdoption } from './AgreementTechnologyAdoption';
import { AgreementDigitalTransformation } from './AgreementDigitalTransformation';
import { AgreementAutomation } from './AgreementAutomation';
import { AgreementArtificialIntelligence } from './AgreementArtificialIntelligence';
import { AgreementMachineLearning } from './AgreementMachineLearning';
import { AgreementDataScience } from './AgreementDataScience';
import { AgreementBigData } from './AgreementBigData';
import { AgreementCloudComputing } from './AgreementCloudComputing';
import { AgreementEdgeComputing } from './AgreementEdgeComputing';
import { AgreementInternetOfThings } from './AgreementInternetOfThings';
import { AgreementBlockchain } from './AgreementBlockchain';
import { AgreementCybersecurity } from './AgreementCybersecurity';
import { AgreementDataEncryption } from './AgreementDataEncryption';
import { AgreementAccessControl } from './AgreementAccessControl';
import { AgreementVulnerabilityManagement } from './AgreementVulnerabilityManagement';
import { AgreementIncidentResponse } from './AgreementIncidentResponse';
import { AgreementComplianceAudits } from './AgreementComplianceAudits';
import { AgreementRiskAssessments } from './AgreementRiskAssessments';
import { AgreementSecurityAwarenessTraining } from './AgreementSecurityAwarenessTraining';
import { AgreementPhysicalSecurity } from './AgreementPhysicalSecurity';
import { AgreementEnvironmentalSustainability } from './AgreementEnvironmentalSustainability';
import { AgreementEnergyEfficiency } from './AgreementEnergyEfficiency';
import { AgreementWasteReduction } from './AgreementWasteReduction';
import { AgreementWaterConservation } from './AgreementWaterConservation';
import { AgreementSustainableSourcing } from './AgreementSustainableSourcing';
import { AgreementCarbonFootprintReduction } from './AgreementCarbonFootprintReduction';
import { AgreementGreenBuildingPractices } from './AgreementGreenBuildingPractices';
import { AgreementRenewableEnergyAdoption } from './AgreementRenewableEnergyAdoption';
import { AgreementCircularEconomy } from './AgreementCircularEconomy';
import { AgreementSocialImpactMeasurement } from './AgreementSocialImpactMeasurement';
import { AgreementStakeholderEngagement } from './AgreementStakeholderEngagement';
import { AgreementEthicalSupplyChains } from './AgreementEthicalSupplyChains';
import { AgreementFairLaborPractices } from './AgreementFairLaborPractices';
import { AgreementHumanRights } from './AgreementHumanRights';
import { AgreementAntiCorruptionMeasures } from './AgreementAntiCorruptionMeasures';
import { AgreementTransparencyAndAccountability } from './AgreementTransparencyAndAccountability';
import { AgreementCommunityDevelopment } from './AgreementCommunityDevelopment';
import { AgreementEconomicEmpowerment } from './AgreementEconomicEmpowerment';
import { AgreementEducationAndSkillsTraining } from './AgreementEducationAndSkillsTraining';
import { AgreementHealthcareAccess } from './AgreementHealthcareAccess';
import { AgreementPovertyAlleviation } from './AgreementPovertyAlleviation';
import { AgreementFoodSecurity } from './AgreementFoodSecurity';
import { AgreementWaterSanitation } from './AgreementWaterSanitation';
import { AgreementAffordableHousing } from './AgreementAffordableHousing';
import { AgreementDisasterRelief } from './AgreementDisasterRelief';
import { AgreementHumanitarianAid } from './AgreementHumanitarianAid';
import { AgreementRefugeeSupport } from './AgreementRefugeeSupport';
import { AgreementConflictResolution } from './AgreementConflictResolution';
import { AgreementPeaceBuilding } from './AgreementPeaceBuilding';
import { AgreementGoodGovernance } from './AgreementGoodGovernance';
import { AgreementRuleOfLaw } from './AgreementRuleOfLaw';
import { AgreementDemocracyPromotion } from './AgreementDemocracyPromotion';
import { AgreementCivilSocietyEngagement } from './AgreementCivilSocietyEngagement';
import { AgreementMediaFreedom } from './AgreementMediaFreedom';
import { AgreementAccessToInformation } from './AgreementAccessToInformation';
import { AgreementDigitalInclusion } from './AgreementDigitalInclusion';
import { AgreementCybersecurityAwareness } from './AgreementCybersecurityAwareness';
import { AgreementDataLiteracy } from './AgreementDataLiteracy';
import { AgreementDigitalSkillsTraining } from './AgreementDigitalSkillsTraining';
import { AgreementOnlineSafety } from './AgreementOnlineSafety';
import { AgreementDigitalRights } from './AgreementDigitalRights';
import { AgreementDigitalEthics } from './AgreementDigitalEthics';
import { AgreementDigitalGovernance } from './AgreementDigitalGovernance';
import { AgreementDigitalTransformationStrategies } from './AgreementDigitalTransformationStrategies';
import { AgreementDigitalInnovation } from './AgreementDigitalInnovation';
import { AgreementDigitalLeadership } from './AgreementDigitalLeadership';
import { AgreementDigitalCulture } from './AgreementDigitalCulture';
import { AgreementDigitalWorkplace } from './AgreementDigitalWorkplace';
import { AgreementDigitalCustomerExperience } from './AgreementDigitalCustomerExperience';
import { AgreementDigitalMarketingStrategies } from './AgreementDigitalMarketingStrategies';
import { AgreementDigitalSalesStrategies } from './AgreementDigitalSalesStrategies';
import { AgreementDigitalServiceStrategies } from './AgreementDigitalServiceStrategies';
import { AgreementDigitalProductStrategies } from './AgreementDigitalProductStrategies';
import { AgreementDigitalBusinessModels } from './AgreementDigitalBusinessModels';
import { AgreementDigitalEcosystems } from './AgreementDigitalEcosystems';
import { AgreementDigitalPlatforms } from './AgreementDigitalPlatforms';
import { AgreementDigitalPartnerships } from './AgreementDigitalPartnerships';
import { AgreementDigitalInvestments } from './AgreementDigitalInvestments';
import { AgreementDigitalReturnOnInvestment } from './AgreementDigitalReturnOnInvestment';
import { AgreementDigitalPerformanceMetrics } from './AgreementDigitalPerformanceMetrics';
import { AgreementDigitalAnalyticsAndReporting } from './AgreementDigitalAnalyticsAndReporting';
import { AgreementDigitalContinuousImprovement } from './AgreementDigitalContinuousImprovement';
import { AgreementDigitalKnowledgeSharing } from './AgreementDigitalKnowledgeSharing';
import { AgreementDigitalInnovationCulture } from './AgreementDigitalInnovationCulture';
import { AgreementDigitalExperimentation } from './AgreementDigitalExperimentation';
import { AgreementDigitalResearchAndDevelopment } from './AgreementDigitalResearchAndDevelopment';
import { AgreementDigitalTechnologyAdoption } from './AgreementDigitalTechnologyAdoption';
import { AgreementDigitalTransformationRoadmap } from './AgreementDigitalTransformationRoadmap';
import { AgreementDigitalTransformationGovernance } from './AgreementDigitalTransformationGovernance';
import { AgreementDigitalTransformationLeadership } from './AgreementDigitalTransformationLeadership';
import { AgreementDigitalTransformationCulture } from './AgreementDigitalTransformationCulture';
import { AgreementDigitalTransformationWorkplace } from './AgreementDigitalTransformationWorkplace';
import { AgreementDigitalTransformationCustomerExperience } from './AgreementDigitalTransformationCustomerExperience';
import { AgreementDigitalTransformationMarketingStrategies } from './AgreementDigitalTransformationMarketingStrategies';
import { AgreementDigitalTransformationSalesStrategies } from './AgreementDigitalTransformationSalesStrategies';
import { AgreementDigitalTransformationServiceStrategies } from './AgreementDigitalTransformationServiceStrategies';
import { AgreementDigitalTransformationProductStrategies } from './AgreementDigitalTransformationProductStrategies';
import { AgreementDigitalTransformationBusinessModels } from './AgreementDigitalTransformationBusinessModels';
import { AgreementDigitalTransformationEcosystems } from './AgreementDigitalTransformationEcosystems';
import { AgreementDigitalTransformationPlatforms } from './AgreementDigitalTransformationPlatforms';
import { AgreementDigitalTransformationPartnerships } from './AgreementDigitalTransformationPartnerships';
import { AgreementDigitalTransformationInvestments } from './AgreementDigitalTransformationInvestments';
import { AgreementDigitalTransformationReturnOnInvestment } from './AgreementDigitalTransformationReturnOnInvestment';
import { AgreementDigitalTransformationPerformanceMetrics } from './AgreementDigitalTransformationPerformanceMetrics';
import { AgreementDigitalTransformationAnalyticsAndReporting } from './AgreementDigitalTransformationAnalyticsAndReporting';
import { AgreementDigitalTransformationContinuousImprovement } from './AgreementDigitalTransformationContinuousImprovement';
import { AgreementDigitalTransformationKnowledgeSharing } from './AgreementDigitalTransformationKnowledgeSharing';
import { AgreementDigitalTransformationInnovationCulture } from './AgreementDigitalTransformationInnovationCulture';
import { AgreementDigitalTransformationExperimentation } from './AgreementDigitalTransformationExperimentation';
import { AgreementDigitalTransformationResearchAndDevelopment } from './AgreementDigitalTransformationResearchAndDevelopment';
import { AgreementDigitalTransformationTechnologyAdoption } from './AgreementDigitalTransformationTechnologyAdoption';
import { AgreementDigitalTransformationChangeManagement } from './AgreementDigitalTransformationChangeManagement';
import { AgreementDigitalTransformationCommunication } from './AgreementDigitalTransformationCommunication';
import { AgreementDigitalTransformationTraining } from './AgreementDigitalTransformationTraining';
import { AgreementDigitalTransformationSkillsDevelopment } from './AgreementDigitalTransformationSkillsDevelopment';
import { AgreementDigitalTransformationLeadershipAlignment } from './AgreementDigitalTransformationLeadershipAlignment';
import { AgreementDigitalTransformationStakeholderEngagement } from './AgreementDigitalTransformationStakeholderEngagement';
import { AgreementDigitalTransformationRiskManagement } from './AgreementDigitalTransformationRiskManagement';
import { AgreementDigitalTransformationCompliance } from './AgreementDigitalTransformationCompliance';
import { AgreementDigitalTransformationSecurity } from './AgreementDigitalTransformationSecurity';
import { AgreementDigitalTransformationDataPrivacy } from './AgreementDigitalTransformationDataPrivacy';
import { AgreementDigitalTransformationEthicalConsiderations } from './AgreementDigitalTransformationEthicalConsiderations';
import { AgreementDigitalTransformationSocialResponsibility } from './AgreementDigitalTransformationSocialResponsibility';
import { AgreementDigitalTransformationEnvironmentalSustainability } from './AgreementDigitalTransformationEnvironmentalSustainability';
import { AgreementDigitalTransformationCommunityEngagement } from './AgreementDigitalTransformationCommunityEngagement';
import { AgreementDigitalTransformationEconomicEmpowerment } from './AgreementDigitalTransformationEconomicEmpowerment';
import { AgreementDigitalTransformationEducationAndSkillsTraining } from './AgreementDigitalTransformationEducationAndSkillsTraining';
import { AgreementDigitalTransformationHealthcareAccess } from './AgreementDigitalTransformationHealthcareAccess';
import { AgreementDigitalTransformationPovertyAlleviation } from './AgreementDigitalTransformationPovertyAlleviation';
import { AgreementDigitalTransformationFoodSecurity } from './AgreementDigitalTransformationFoodSecurity';
import { AgreementDigitalTransformationWaterSanitation } from './AgreementDigitalTransformationWaterSanitation';
import { AgreementDigitalTransformationAffordableHousing } from './AgreementDigitalTransformationAffordableHousing';
import { AgreementDigitalTransformationDisasterRelief } from './AgreementDigitalTransformationDisasterRelief';
import { AgreementDigitalTransformationHumanitarianAid } from './AgreementDigitalTransformationHumanitarianAid';
import { AgreementDigitalTransformationRefugeeSupport } from './AgreementDigitalTransformationRefugeeSupport';
import { AgreementDigitalTransformationConflictResolution } from './AgreementDigitalTransformationConflictResolution';
import { AgreementDigitalTransformationPeaceBuilding } from './AgreementDigitalTransformationPeaceBuilding';
import { AgreementDigitalTransformationGoodGovernance } from './AgreementDigitalTransformationGoodGovernance';
import { AgreementDigitalTransformationRuleOfLaw } from './AgreementDigitalTransformationRuleOfLaw';
import { AgreementDigitalTransformationDemocracyPromotion } from './AgreementDigitalTransformationDemocracyPromotion';
import { AgreementDigitalTransformationCivilSocietyEngagement } from './AgreementDigitalTransformationCivilSocietyEngagement';
import { AgreementDigitalTransformationMediaFreedom } from './AgreementDigitalTransformationMediaFreedom';
import { AgreementDigitalTransformationAccessToInformation } from './AgreementDigitalTransformationAccessToInformation';
import { AgreementDigitalTransformationDigitalInclusion } from './AgreementDigitalTransformationDigitalInclusion';
import { AgreementDigitalTransformationCybersecurityAwareness } from './AgreementDigitalTransformationCybersecurityAwareness';
import { AgreementDigitalTransformationDataLiteracy } from './AgreementDigitalTransformationDataLiteracy';
import { AgreementDigitalTransformationDigitalSkillsTraining } from './AgreementDigitalTransformationDigitalSkillsTraining';
import { AgreementDigitalTransformationOnlineSafety } from './AgreementDigitalTransformationOnlineSafety';
import { AgreementDigitalTransformationDigitalRights } from './AgreementDigitalTransformationDigitalRights';
import { AgreementDigitalTransformationDigitalEthics } from './AgreementDigitalTransformationDigitalEthics';
import { AgreementDigitalTransformationDigitalGovernance } from './AgreementDigitalTransformationDigitalGovernance';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'in_negotiation', label: 'In Negotiation' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'breached', label: 'Breached' },
  { value: 'renewed', label: 'Renewed' },
];

const paymentFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One Time' },
];

const agreementTypeOptions = [
  { value: 'lease', label: 'Lease' },
  { value: 'rental', label: 'Rental' },
  { value: 'service', label: 'Service' },
  { value: 'sales', label: 'Sales' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'nda', label: 'NDA' },
  { value: 'employment', label: 'Employment' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'license', label: 'License' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'franchise', label: 'Franchise' },
  { value: 'supply', label: 'Supply' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'loan', label: 'Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'investment', label: 'Investment' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'release', label: 'Release' },
  { value: 'waiver', label: 'Waiver' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'other', label: 'Other' },
];

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Other' },
];

const currencyOptions = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'qar', label: 'QAR' },
  { value: 'inr', label: 'INR' },
  { value: 'aud', label: 'AUD' },
  { value: 'cad', label: 'CAD' },
  { value: 'jpy', label: 'JPY' },
  { value: 'chf', label: 'CHF' },
  { value: 'cny', label: 'CNY' },
];

const leaseTermOptions = [
  { value: '6_months', label: '6 Months' },
  { value: '12_months', label: '12 Months' },
  { value: '24_months', label: '24 Months' },
  { value: '36_months', label: '36 Months' },
  { value: '48_months', label: '48 Months' },
  { value: '60_months', label: '60 Months' },
];

const lateFeeCalculationOptions = [
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'percentage_of_rent', label: 'Percentage of Rent' },
  { value: 'daily_rate', label: 'Daily Rate' },
];

const securityDepositOptions = [
  { value: 'one_month_rent', label: 'One Month Rent' },
  { value: 'two_month_rent', label: 'Two Month Rent' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
];

const renewalOptions = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'no_renewal', label: 'No Renewal' },
];

const terminationOptions = [
  { value: 'with_notice', label: 'With Notice' },
  { value: 'without_notice', label: 'Without Notice' },
  { value: 'mutual_agreement', label: 'Mutual Agreement' },
];

const disputeResolutionOptions = [
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'litigation', label: 'Litigation' },
];

const governingLawOptions = [
  { value: 'state_law', label: 'State Law' },
  { value: 'federal_law', label: 'Federal Law' },
  { value: 'international_law', label: 'International Law' },
];

const insuranceCoverageOptions = [
  { value: 'liability', label: 'Liability' },
  { value: 'property', label: 'Property' },
  { value: 'casualty', label: 'Casualty' },
];

const maintenanceResponsibilityOptions = [
  { value: 'landlord', label: 'Landlord' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'shared', label: 'Shared' },
];

const inspectionFrequencyOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'upon_request', label: 'Upon Request' },
];

const sublettingOptions = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: 'with_permission', label: 'With Permission' },
];

const petPolicyOptions = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: 'with_restrictions', label: 'With Restrictions' },
];

const smokingPolicyOptions = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: 'designated_areas', label: 'Designated Areas' },
];

const parkingPolicyOptions = [
  { value: 'assigned_spots', label: 'Assigned Spots' },
  { value: 'open_parking', label: 'Open Parking' },
  { value: 'street_parking', label: 'Street Parking' },
];

const noisePolicyOptions = [
  { value: 'reasonable', label: 'Reasonable' },
  { value: 'quiet_hours', label: 'Quiet Hours' },
  { value: 'no_excessive_noise', label: 'No Excessive Noise' },
];

const alterationPolicyOptions = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: 'with_permission', label: 'With Permission' },
];

const accessPolicyOptions = [
  { value: '24_7', label: '24/7' },
  { value: 'limited_hours', label: 'Limited Hours' },
  { value: 'with_notice', label: 'With Notice' },
];

const keyPolicyOptions = [
  { value: 'returned_upon_termination', label: 'Returned Upon Termination' },
  { value: 'lost_key_fee', label: 'Lost Key Fee' },
  { value: 'key_replacement', label: 'Key Replacement' },
];

const mailPolicyOptions = [
  { value: 'delivered_to_unit', label: 'Delivered to Unit' },
  { value: 'central_mailbox', label: 'Central Mailbox' },
  { value: 'package_delivery', label: 'Package Delivery' },
];

const trashPolicyOptions = [
  { value: 'designated_areas', label: 'Designated Areas' },
  { value: 'recycling_program', label: 'Recycling Program' },
  { value: 'bulk_trash_removal', label: 'Bulk Trash Removal' },
];

const commonAreaPolicyOptions = [
  { value: 'shared_responsibility', label: 'Shared Responsibility' },
  { value: 'rules_and_regulations', label: 'Rules and Regulations' },
  { value: 'reservation_system', label: 'Reservation System' },
];

const emergencyContactPolicyOptions = [
  { value: 'provided_by_tenant', label: 'Provided by Tenant' },
  { value: 'updated_annually', label: 'Updated Annually' },
  { value: 'verified_by_landlord', label: 'Verified by Landlord' },
];

const notificationPolicyOptions = [
  { value: 'written_notice', label: 'Written Notice' },
  { value: 'email_notification', label: 'Email Notification' },
  { value: 'phone_call', label: 'Phone Call' },
];

const amendmentPolicyOptions = [
  { value: 'written_agreement', label: 'Written Agreement' },
  { value: 'mutual_consent', label: 'Mutual Consent' },
  { value: 'signed_by_both_parties', label: 'Signed by Both Parties' },
];

const severabilityPolicyOptions = [
  { value: 'remaining_provisions_valid', label: 'Remaining Provisions Valid' },
  { value: 'invalid_provision_replaced', label: 'Invalid Provision Replaced' },
  { value: 'legal_interpretation', label: 'Legal Interpretation' },
];

const entireAgreementPolicyOptions = [
  { value: 'supersedes_prior_agreements', label: 'Supersedes Prior Agreements' },
  { value: 'no_oral_agreements', label: 'No Oral Agreements' },
  { value: 'written_modifications_only', label: 'Written Modifications Only' },
];

const waiverPolicyOptions = [
  { value: 'no_waiver_of_rights', label: 'No Waiver of Rights' },
  { value: 'written_waiver_required', label: 'Written Waiver Required' },
  { value: 'specific_circumstances_only', label: 'Specific Circumstances Only' },
];

const forceMajeurePolicyOptions = [
  { value: 'unforeseeable_events', label: 'Unforeseeable Events' },
  { value: 'reasonable_efforts_to_mitigate', label: 'Reasonable Efforts to Mitigate' },
  { value: 'termination_option', label: 'Termination Option' },
];

const noticePolicyOptions = [
  { value: 'written_notice', label: 'Written Notice' },
  { value: 'certified_mail', label: 'Certified Mail' },
  { value: 'email_with_confirmation', label: 'Email with Confirmation' },
];

const confidentialityPolicyOptions = [
  { value: 'non_disclosure_agreement', label: 'Non-Disclosure Agreement' },
  { value: 'limited_use_of_information', label: 'Limited Use of Information' },
  { value: 'return_of_confidential_materials', label: 'Return of Confidential Materials' },
];

const intellectualPropertyPolicyOptions = [
  { value: 'ownership_by_landlord', label: 'Ownership by Landlord' },
  { value: 'license_to_tenant', label: 'License to Tenant' },
  { value: 'no_unauthorized_use', label: 'No Unauthorized Use' },
];

const dataPrivacyPolicyOptions = [
  { value: 'compliance_with_privacy_laws', label: 'Compliance with Privacy Laws' },
  { value: 'data_security_measures', label: 'Data Security Measures' },
  { value: 'limited_data_collection', label: 'Limited Data Collection' },
];

const governingLawJurisdictionPolicyOptions = [
  { value: 'state_law', label: 'State Law' },
  { value: 'federal_law', label: 'Federal Law' },
  { value: 'specific_jurisdiction', label: 'Specific Jurisdiction' },
];

const disputeResolutionProcessPolicyOptions = [
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'litigation', label: 'Litigation' },
];

const attorneyFeesPolicyOptions = [
  { value: 'prevailing_party_pays', label: 'Prevailing Party Pays' },
  { value: 'each_party_responsible', label: 'Each Party Responsible' },
  { value: 'fee_shifting_provision', label: 'Fee Shifting Provision' },
];

const assignmentPolicyOptions = [
  { value: 'allowed_with_consent', label: 'Allowed with Consent' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: 'written_agreement_required', label: 'Written Agreement Required' },
];

const sublettingAssignmentPolicyOptions = [
  { value: 'allowed_with_consent', label: 'Allowed with Consent' },
  { value: 'not_allowed', label: 'Not Allowed' },
  { value: 'written_agreement_required', label: 'Written Agreement Required' },
];

const jointAndSeveralLiabilityPolicyOptions = [
  { value: 'each_party_fully_liable', label: 'Each Party Fully Liable' },
  { value: 'limited_liability', label: 'Limited Liability' },
  { value: 'proportional_liability', label: 'Proportional Liability' },
];

const thirdPartyBeneficiariesPolicyOptions = [
  { value: 'no_third_party_rights', label: 'No Third-Party Rights' },
  { value: 'specific_beneficiaries_named', label: 'Specific Beneficiaries Named' },
  { value: 'incidental_beneficiaries', label: 'Incidental Beneficiaries' },
];

const timeIsOfTheEssencePolicyOptions = [
  { value: 'strict_compliance', label: 'Strict Compliance' },
  { value: 'reasonable_delay_permitted', label: 'Reasonable Delay Permitted' },
  { value: 'grace_period_provided', label: 'Grace Period Provided' },
];
