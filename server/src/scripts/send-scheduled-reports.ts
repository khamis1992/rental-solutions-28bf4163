import { SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { Database } from '../../../src/integrations/supabase/types';

type Tables = Database['public']['Tables'];

export async function sendScheduledReports(supabase: SupabaseClient) {
  // Get pending insights
  const { data: insights, error } = await supabase
    .from('analytics_insights')
    .select('*')
    .eq('status', 'pending')
    .lte('analyzed_at', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to fetch insights: ${error.message}`);
  }

  if (!insights?.length) {
    console.log('No insights to send');
    return;
  }

  // Configure email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Process each insight
  for (const insight of insights) {
    try {
      // Generate report content
      const content = await generateReportContent(supabase, insight);

      // Send email
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.REPORT_RECIPIENT_EMAIL,
        subject: `Analytics Insight: ${insight.category}`,
        html: content,
      });

      // Update insight status
      await supabase
        .from('analytics_insights')
        .update({ 
          status: 'sent',
          action_taken: true,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', insight.id);

      console.log(`Insight ${insight.id} sent successfully`);
    } catch (error) {
      console.error(`Failed to process insight ${insight.id}:`, error);
      
      // Update insight status to failed
      await supabase
        .from('analytics_insights')
        .update({ 
          status: 'failed',
          action_taken: false
        })
        .eq('id', insight.id);
    }
  }
}

async function generateReportContent(
  supabase: SupabaseClient,
  insight: Tables['analytics_insights']['Row']
): Promise<string> {
  // Generate HTML content based on insight data
  return `
    <h1>Analytics Insight Report</h1>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${insight.category}</h2>
      <p><strong>Insight:</strong> ${insight.insight}</p>
      ${insight.data_points ? `
        <h3>Data Points:</h3>
        <pre>${JSON.stringify(insight.data_points, null, 2)}</pre>
      ` : ''}
      ${insight.confidence_score ? `
        <p><strong>Confidence Score:</strong> ${insight.confidence_score}%</p>
      ` : ''}
      ${insight.priority ? `
        <p><strong>Priority:</strong> ${insight.priority}</p>
      ` : ''}
    </div>
  `;
} 