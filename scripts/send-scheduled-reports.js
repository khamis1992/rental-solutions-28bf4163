import nodemailer from 'nodemailer';
import cron from 'node-cron';
import fs from 'fs';

const configPath = new URL('../scheduled-reports.json', import.meta.url);
let schedules = [];
try {
  schedules = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch {
  console.log('No scheduled-reports.json found, using empty list');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendReport(schedule) {
  // TODO: Generate report file based on schedule.type
  const message = {
    from: process.env.SMTP_FROM || 'reports@example.com',
    to: schedule.recipients.join(','),
    subject: `Scheduled Report: ${schedule.name}`,
    text: 'Please find the attached report.',
    attachments: [
      {
        filename: 'report.csv',
        path: 'sample-report.csv' // placeholder attachment
      }
    ]
  };
  await transporter.sendMail(message);
  console.log(`Sent report ${schedule.id} to ${message.to}`);
}

function scheduleJobs() {
  schedules.forEach(sch => {
    if (!sch.cron) return;
    cron.schedule(sch.cron, () => sendReport(sch));
  });
}

scheduleJobs();
