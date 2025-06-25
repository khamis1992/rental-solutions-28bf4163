# 📱 WhatsApp Integration Setup Guide

This guide covers the complete setup of WhatsApp messaging integration using Twilio's WhatsApp Business API, following the [official Twilio documentation](https://www.twilio.com/docs/whatsapp/quickstart).

## 🔧 Prerequisites

1. **Twilio Account**: Create a free account at [twilio.com](https://www.twilio.com)
2. **WhatsApp Business API**: Set up WhatsApp through Twilio Console
3. **Supabase Database**: Ensure the `whatsapp_messages` table exists

## 📋 Step 1: Twilio Account Setup

### 1.1 Get Your Credentials
1. Log into your [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** (starts with `AC`)
3. Find your **Auth Token** (click the eye icon to reveal)
4. Navigate to **Programmable Messaging** → **WhatsApp**
5. Use the Sandbox number: `whatsapp:+14155238886`

### 1.2 Configure Environment Variables
Add these to your `.env` file:

```env
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 📋 Step 2: WhatsApp Sandbox Setup

### 2.1 Join Sandbox
1. In Twilio Console, go to **Programmable Messaging** → **Try it out** → **Send a WhatsApp message**
2. Send the join code to the sandbox number: `join <your-code>`
3. You'll receive a confirmation message

### 2.2 Test Number Format
- Qatar numbers: `+97450000000`
- International format required
- System automatically adds Qatar prefix (+974) if missing

## 📋 Step 3: Database Setup

### 3.1 Supabase Table
Ensure this table exists in your Supabase database:

```sql
CREATE TABLE whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'pending',
  twilio_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cost DECIMAL(10,4) DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);
```

## 📋 Step 4: Implementation Overview

### 4.1 Service Architecture
- **TwilioWhatsAppService**: Main service class
- **WhatsAppReminders**: UI component for testing
- **Database logging**: All messages tracked in Supabase

### 4.2 Message Types
- `payment_reminder`: تذكير بدفعة مستحقة
- `overdue_payment`: تنبيه بدفعة متأخرة  
- `payment_received`: تأكيد استلام دفعة
- `general`: رسائل عامة

### 4.3 Key Features
- ✅ Arabic language support
- ✅ Qatar phone number formatting
- ✅ Cost calculation ($0.005/segment)
- ✅ Error handling and logging
- ✅ Message status tracking
- ✅ Webhook support

## 📋 Step 5: Testing

### 5.1 Use Test Interface
1. Navigate to `/whatsapp-test` in your app
2. Enter a test phone number (must be WhatsApp enabled)
3. Test different message types

### 5.2 Testing Checklist
- [ ] Payment reminder message
- [ ] Overdue payment alert
- [ ] Payment confirmation
- [ ] Statistics update
- [ ] Error handling

### 5.3 Common Test Scenarios
```javascript
// Test payment reminder
const result = await twilioWhatsAppService.sendPaymentReminder(
  '+97450000000',
  'أحمد محمد',
  500,
  '2024-01-15',
  'تأجير سيارة'
);

// Test overdue alert
const overdueResult = await twilioWhatsAppService.sendOverduePaymentAlert(
  '+97450000000',
  'أحمد محمد',
  500,
  15, // days overdue
  'تأجير سيارة'
);
```

## 📋 Step 6: Production Setup

### 6.1 WhatsApp Business Account
For production, you need an approved WhatsApp Business Account:
1. Apply through Twilio Console
2. Complete business verification
3. Get your own WhatsApp number
4. Set up message templates

### 6.2 Webhook Configuration
Set up webhooks to track message status:
```javascript
// Webhook endpoint to handle status updates
app.post('/webhook/whatsapp', (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;
  
  twilioWhatsAppService.processWebhook({
    MessageSid,
    MessageStatus,
    ErrorCode,
    ErrorMessage
  });
  
  res.status(200).send('OK');
});
```

## 📋 Step 7: Monitoring & Analytics

### 7.1 Dashboard Features
- Message statistics (sent/failed/cost)
- Success rate tracking
- Message type breakdown
- Real-time cost monitoring

### 7.2 Error Monitoring
Common error codes and solutions:
- **21211**: Invalid phone number format
- **21614**: Number not opted in to WhatsApp
- **21408**: Permission required
- **20003**: Authentication error

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install twilio @types/twilio

# Test the integration
npm run dev
# Navigate to: http://localhost:8080/whatsapp-test

# Check database
# Verify whatsapp_messages table has data
```

## 📞 Support & Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business API Pricing](https://www.twilio.com/whatsapp/pricing)
- [Twilio Console](https://console.twilio.com)
- [Twilio Support](https://support.twilio.com)

## 🔍 Troubleshooting

### Issue: Messages not sending
1. Check environment variables
2. Verify Twilio credentials
3. Ensure phone number is WhatsApp enabled
4. Check Twilio Console logs

### Issue: Authentication errors
1. Verify Account SID format (starts with AC)
2. Check Auth Token (32 characters)
3. Ensure no extra spaces in environment variables

### Issue: Phone number errors
1. Use international format (+974...)
2. Ensure number is WhatsApp enabled
3. Check if number opted into sandbox

---

**Status**: ✅ Fully Implemented & Tested
**Last Updated**: January 2024
**Documentation**: Following [Twilio Official Guide](https://www.twilio.com/docs/whatsapp/quickstart) 