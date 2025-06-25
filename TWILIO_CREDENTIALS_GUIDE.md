# 🔧 How to Get Your Twilio WhatsApp Credentials

## Quick Fix for WhatsApp Error

You're getting the "Twilio credentials not configured" error because your `.env` file has placeholder credentials instead of real ones.

### **Step 1: Create Free Twilio Account**
1. Go to **[twilio.com/try-twilio](https://www.twilio.com/try-twilio)**
2. Sign up for a **free account**
3. Verify your phone number
4. Complete the account setup

### **Step 2: Get Your Credentials**
1. Log into your **[Twilio Console](https://console.twilio.com)**
2. On the main dashboard, you'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click the eye icon to reveal)

### **Step 3: Update Your .env File**
In the Notepad window that just opened, replace these lines:

```env
# Replace these placeholders with your actual credentials:
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### **Example of Correct .env File:**
```env
VITE_SUPABASE_URL=https://vqdlsidkucrownbfuouq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENVIRONMENT=development

# Twilio WhatsApp Configuration
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### **Step 4: Save and Restart**
1. **Save** the `.env` file in Notepad
2. **Close** Notepad
3. **Restart** your development server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### **Step 5: Test WhatsApp (Optional)**
- The number `whatsapp:+14155238886` is Twilio's **sandbox number** for testing
- To test, you can send "join [code]" to that number from your phone
- For production, you'll need to apply for a WhatsApp Business number

### **Important Notes:**
- ✅ **Free Account**: Twilio gives you $15 credit to start
- ✅ **Sandbox Testing**: Use the sandbox number for development
- ✅ **Security**: Keep your Auth Token secret
- ⚠️ **Production**: For real business use, apply for WhatsApp Business API approval

### **Troubleshooting:**
- **Account SID format**: Must start with `AC` and be 34 characters
- **Auth Token format**: Exactly 32 characters
- **No extra spaces**: Make sure there are no spaces in the credentials

---

Once you add your real Twilio credentials, the WhatsApp payment notifications will work without errors! 🎉 