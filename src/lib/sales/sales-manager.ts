import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { financialManager } from '@/lib/financial/financial-manager';

export interface SalesLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'website' | 'referral' | 'marketing' | 'walk_in' | 'call';
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'closed_won' | 'closed_lost';
  interested_vehicle_type: string;
  budget_range: string;
  rental_duration: string;
  notes: string;
  assigned_to: string;
  created_at: Date;
  updated_at: Date;
  follow_up_date?: Date;
  conversion_probability: number;
}

export interface SalesOpportunity {
  id: string;
  lead_id: string;
  vehicle_id?: string;
  customer_id?: string;
  estimated_value: number;
  probability: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost';
  expected_close_date: Date;
  actual_close_date?: Date;
  notes: string;
  created_by: string;
  updated_at: Date;
}

export interface SalesTarget {
  id: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  target_amount: number;
  achieved_amount: number;
  target_count: number;
  achieved_count: number;
  start_date: Date;
  end_date: Date;
  assigned_to: string;
  status: 'active' | 'achieved' | 'missed';
}

export interface SalesMetrics {
  total_leads: number;
  qualified_leads: number;
  conversion_rate: number;
  average_deal_size: number;
  sales_cycle_length: number;
  pipeline_value: number;
  won_deals: number;
  lost_deals: number;
  revenue_generated: number;
  target_achievement: number;
}

export class SalesManager {
  private static instance: SalesManager;

  private constructor() {}

  public static getInstance(): SalesManager {
    if (!SalesManager.instance) {
      SalesManager.instance = new SalesManager();
    }
    return SalesManager.instance;
  }

  // Lead Management
  async createLead(lead: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .insert({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: 'new',
          interested_vehicle_type: lead.interested_vehicle_type,
          budget_range: lead.budget_range,
          rental_duration: lead.rental_duration,
          notes: lead.notes,
          assigned_to: lead.assigned_to,
          conversion_probability: this.calculateInitialProbability(lead),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create follow-up task
      await this.createFollowUpTask(data.id, lead.assigned_to);

      toast.success('Lead created successfully');
      return data.id;
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast.error('Failed to create lead');
      throw error;
    }
  }

  async updateLeadStatus(leadId: string, status: SalesLead['status'], notes?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Update probability based on status
      updateData.conversion_probability = this.getProbabilityByStatus(status);

      const { error } = await supabase
        .from('sales_leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      // Create opportunity if lead is qualified
      if (status === 'qualified') {
        await this.createOpportunityFromLead(leadId);
      }

      toast.success('Lead status updated');
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
      throw error;
    }
  }

  // Opportunity Management
  async createOpportunityFromLead(leadId: string): Promise<string> {
    try {
      const { data: lead, error: leadError } = await supabase
        .from('sales_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      const estimatedValue = this.calculateEstimatedValue(lead);
      const expectedCloseDate = this.calculateExpectedCloseDate(lead);

      const { data: opportunity, error } = await supabase
        .from('sales_opportunities')
        .insert({
          lead_id: leadId,
          estimated_value: estimatedValue,
          probability: lead.conversion_probability,
          stage: 'qualification',
          expected_close_date: expectedCloseDate.toISOString(),
          notes: `Opportunity created from lead: ${lead.name}`,
          created_by: lead.assigned_to,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Opportunity created successfully');
      return opportunity.id;
    } catch (error) {
      console.error('Failed to create opportunity:', error);
      toast.error('Failed to create opportunity');
      throw error;
    }
  }

  async updateOpportunityStage(opportunityId: string, stage: SalesOpportunity['stage']): Promise<void> {
    try {
      const updateData: any = {
        stage,
        probability: this.getProbabilityByStage(stage),
        updated_at: new Date().toISOString()
      };

      if (stage === 'won' || stage === 'lost') {
        updateData.actual_close_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sales_opportunities')
        .update(updateData)
        .eq('id', opportunityId);

      if (error) throw error;

      // If won, create agreement and record transaction
      if (stage === 'won') {
        await this.processWonOpportunity(opportunityId);
      }

      toast.success('Opportunity stage updated');
    } catch (error) {
      console.error('Failed to update opportunity stage:', error);
      toast.error('Failed to update opportunity stage');
      throw error;
    }
  }

  // Sales Metrics and Reporting
  async getSalesMetrics(startDate: Date, endDate: Date, userId?: string): Promise<SalesMetrics> {
    try {
      let leadsQuery = supabase
        .from('sales_leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (userId) {
        leadsQuery = leadsQuery.eq('assigned_to', userId);
      }

      const { data: leads, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      let opportunitiesQuery = supabase
        .from('sales_opportunities')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (userId) {
        opportunitiesQuery = opportunitiesQuery.eq('created_by', userId);
      }

      const { data: opportunities, error: opportunitiesError } = await opportunitiesQuery;
      if (opportunitiesError) throw opportunitiesError;

      const totalLeads = leads?.length || 0;
      const qualifiedLeads = leads?.filter(l => l.status === 'qualified').length || 0;
      const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

      const wonDeals = opportunities?.filter(o => o.stage === 'won').length || 0;
      const lostDeals = opportunities?.filter(o => o.stage === 'lost').length || 0;
      const totalDeals = wonDeals + lostDeals;

      const revenueGenerated = opportunities
        ?.filter(o => o.stage === 'won')
        .reduce((sum, o) => sum + o.estimated_value, 0) || 0;

      const averageDealSize = wonDeals > 0 ? revenueGenerated / wonDeals : 0;

      const pipelineValue = opportunities
        ?.filter(o => !['won', 'lost'].includes(o.stage))
        .reduce((sum, o) => sum + (o.estimated_value * o.probability / 100), 0) || 0;

      const averageSalesCycle = await this.calculateAverageSalesCycle(startDate, endDate, userId);

      return {
        total_leads: totalLeads,
        qualified_leads: qualifiedLeads,
        conversion_rate: conversionRate,
        average_deal_size: averageDealSize,
        sales_cycle_length: averageSalesCycle,
        pipeline_value: pipelineValue,
        won_deals: wonDeals,
        lost_deals: lostDeals,
        revenue_generated: revenueGenerated,
        target_achievement: await this.calculateTargetAchievement(startDate, endDate, userId)
      };
    } catch (error) {
      console.error('Failed to get sales metrics:', error);
      throw error;
    }
  }

  // Sales Targets Management
  async createSalesTarget(target: Omit<SalesTarget, 'id' | 'achieved_amount' | 'achieved_count'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .insert({
          period: target.period,
          target_amount: target.target_amount,
          achieved_amount: 0,
          target_count: target.target_count,
          achieved_count: 0,
          start_date: target.start_date.toISOString(),
          end_date: target.end_date.toISOString(),
          assigned_to: target.assigned_to,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Sales target created successfully');
      return data.id;
    } catch (error) {
      console.error('Failed to create sales target:', error);
      toast.error('Failed to create sales target');
      throw error;
    }
  }

  async updateSalesTargetProgress(): Promise<void> {
    try {
      const { data: targets, error } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      for (const target of targets || []) {
        const metrics = await this.getSalesMetrics(
          new Date(target.start_date),
          new Date(target.end_date),
          target.assigned_to
        );

        const achievementPercentage = (metrics.revenue_generated / target.target_amount) * 100;
        let status: SalesTarget['status'] = 'active';

        if (achievementPercentage >= 100) {
          status = 'achieved';
        } else if (new Date() > new Date(target.end_date)) {
          status = 'missed';
        }

        await supabase
          .from('sales_targets')
          .update({
            achieved_amount: metrics.revenue_generated,
            achieved_count: metrics.won_deals,
            status
          })
          .eq('id', target.id);
      }
    } catch (error) {
      console.error('Failed to update sales target progress:', error);
    }
  }

  // Customer Conversion
  async convertLeadToCustomer(leadId: string): Promise<string> {
    try {
      const { data: lead, error: leadError } = await supabase
        .from('sales_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Create customer profile
      const { data: customer, error: customerError } = await supabase
        .from('profiles')
        .insert({
          full_name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: 'sales_lead',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Update lead with customer reference
      await supabase
        .from('sales_leads')
        .update({
          status: 'closed_won',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      // Update opportunity if exists
      const { data: opportunity } = await supabase
        .from('sales_opportunities')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (opportunity) {
        await supabase
          .from('sales_opportunities')
          .update({
            customer_id: customer.id,
            stage: 'won',
            actual_close_date: new Date().toISOString()
          })
          .eq('id', opportunity.id);
      }

      toast.success('Lead converted to customer successfully');
      return customer.id;
    } catch (error) {
      console.error('Failed to convert lead to customer:', error);
      toast.error('Failed to convert lead to customer');
      throw error;
    }
  }

  // Private helper methods
  private calculateInitialProbability(lead: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>): number {
    let probability = 20; // Base probability

    // Adjust based on source
    switch (lead.source) {
      case 'referral':
        probability += 30;
        break;
      case 'website':
        probability += 10;
        break;
      case 'marketing':
        probability += 15;
        break;
      case 'walk_in':
        probability += 20;
        break;
      case 'call':
        probability += 5;
        break;
    }

    // Adjust based on budget range
    if (lead.budget_range.includes('high') || lead.budget_range.includes('premium')) {
      probability += 15;
    }

    // Adjust based on rental duration
    if (lead.rental_duration.includes('long') || lead.rental_duration.includes('year')) {
      probability += 10;
    }

    return Math.min(probability, 90); // Cap at 90%
  }

  private getProbabilityByStatus(status: SalesLead['status']): number {
    switch (status) {
      case 'new':
        return 10;
      case 'contacted':
        return 25;
      case 'qualified':
        return 50;
      case 'proposal_sent':
        return 60;
      case 'negotiating':
        return 75;
      case 'closed_won':
        return 100;
      case 'closed_lost':
        return 0;
      default:
        return 20;
    }
  }

  private getProbabilityByStage(stage: SalesOpportunity['stage']): number {
    switch (stage) {
      case 'prospecting':
        return 10;
      case 'qualification':
        return 25;
      case 'proposal':
        return 50;
      case 'negotiation':
        return 75;
      case 'closing':
        return 90;
      case 'won':
        return 100;
      case 'lost':
        return 0;
      default:
        return 20;
    }
  }

  private calculateEstimatedValue(lead: SalesLead): number {
    // Basic calculation - would be more sophisticated in real system
    const baseValue = 3000; // Base monthly rental
    const durationMultiplier = lead.rental_duration.includes('year') ? 12 : 
                              lead.rental_duration.includes('month') ? 6 : 3;

    return baseValue * durationMultiplier;
  }

  private calculateExpectedCloseDate(lead: SalesLead): Date {
    const averageSalesCycle = 14; // 14 days average
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + averageSalesCycle);
    return closeDate;
  }

  private async createFollowUpTask(leadId: string, assignedTo: string): Promise<void> {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1); // Next day

    await supabase
      .from('tasks')
      .insert({
        title: 'Follow up with new lead',
        description: `Follow up with lead ${leadId}`,
        assigned_to: assignedTo,
        due_date: followUpDate.toISOString(),
        priority: 'medium',
        type: 'follow_up',
        reference_id: leadId,
        status: 'pending'
      });
  }

  private async processWonOpportunity(opportunityId: string): Promise<void> {
    try {
      const { data: opportunity, error } = await supabase
        .from('sales_opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();

      if (error) throw error;

      // Record revenue transaction
      await financialManager.recordTransaction({
        type: 'income',
        category: 'Sales Revenue',
        amount: opportunity.estimated_value,
        currency: 'QAR',
        date: new Date(),
        description: `Sales revenue from opportunity ${opportunityId}`,
        reference_id: opportunityId,
        reference_type: 'customer',
        payment_method: 'card',
        status: 'completed',
        created_by: opportunity.created_by
      });

      // Update sales target progress
      await this.updateSalesTargetProgress();
    } catch (error) {
      console.error('Failed to process won opportunity:', error);
    }
  }

  private async calculateAverageSalesCycle(startDate: Date, endDate: Date, userId?: string): Promise<number> {
    try {
      let query = supabase
        .from('sales_opportunities')
        .select('created_at, actual_close_date')
        .not('actual_close_date', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data: closedOpportunities, error } = await query;
      if (error) throw error;

      if (!closedOpportunities || closedOpportunities.length === 0) {
        return 0;
      }

      const totalDays = closedOpportunities.reduce((sum, opp) => {
        const created = new Date(opp.created_at);
        const closed = new Date(opp.actual_close_date);
        const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);

      return totalDays / closedOpportunities.length;
    } catch (error) {
      console.error('Failed to calculate average sales cycle:', error);
      return 0;
    }
  }

  private async calculateTargetAchievement(startDate: Date, endDate: Date, userId?: string): Promise<number> {
    try {
      let targetQuery = supabase
        .from('sales_targets')
        .select('*')
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());

      if (userId) {
        targetQuery = targetQuery.eq('assigned_to', userId);
      }

      const { data: targets, error } = await targetQuery;
      if (error) throw error;

      if (!targets || targets.length === 0) {
        return 0;
      }

      const totalTarget = targets.reduce((sum, t) => sum + t.target_amount, 0);
      const totalAchieved = targets.reduce((sum, t) => sum + t.achieved_amount, 0);

      return totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    } catch (error) {
      console.error('Failed to calculate target achievement:', error);
      return 0;
    }
  }
}

export const salesManager = SalesManager.getInstance();