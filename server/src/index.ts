import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import { sendScheduledReports } from './scripts/send-scheduled-reports';

// Load environment variables
config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Schedule daily report sending at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled reports...');
  try {
    await sendScheduledReports(supabase);
    console.log('Scheduled reports completed successfully');
  } catch (error) {
    console.error('Failed to send scheduled reports:', error);
  }
});

// Start the server
const port = process.env.PORT || 3001;
console.log(`Server started on port ${port}`); 