# 🔧 Supabase Function Secrets Setup for WhatsApp

## Problem
The WhatsApp service is showing "Edge Function returned a non-2xx status code" because the Twilio credentials are not configured as **Supabase Function Secrets**.

## What are Function Secrets?
Function Secrets are server-side environment variables that are securely stored in Supabase and accessible only by your Edge Functions. They're different from your local `.env` file.

## Step-by-Step Setup

### Step 1: Get Your Twilio Credentials
1. Go to **[Twilio Console](https://console.twilio.com)**
2. Find your **Account SID** (starts with `AC`)
3. Find your **Auth Token** (click the eye icon to reveal)
4. Get your **WhatsApp Number** (e.g., `whatsapp:+14155238886` for sandbox)

### Step 2: Set Supabase Function Secrets
1. Go to your **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project
3. Go to **Edge Functions** → **Settings** (or **Project Settings** → **Edge Functions**)
4. Look for **"Secrets"** or **"Environment Variables"** section
5. Add these three secrets:

```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886
```

### Step 3: Alternative Method - CLI
If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4: Deploy/Restart Functions
After setting secrets:
1. Go to **Edge Functions** in Supabase Dashboard
2. Find the **`send-whatsapp`** function
3. Click **"Deploy"** or **"Restart"** to pick up the new secrets

### Step 5: Test the Service
1. Go to your app: `http://localhost:8080`
2. Navigate to **Dashboard** or any page with WhatsApp features
3. The console errors should be gone
4. Test WhatsApp functionality in the app

## Important Notes

✅ **Security**: Function Secrets are stored securely on Supabase servers  
✅ **Scope**: These secrets are only accessible by your Edge Functions  
✅ **Production**: This setup works for both development and production  
⚠️ **Sandbox**: Use `whatsapp:+14155238886` for testing (Twilio sandbox)  
⚠️ **Production**: For real business use, get an approved WhatsApp Business number  

## Verification

Once configured correctly:
- ✅ Console errors will disappear
- ✅ WhatsApp test messages will work
- ✅ Payment reminders will send successfully
- ✅ Service status will show "available"

## Troubleshooting

### "Secrets not found"
- Make sure you added all 3 secrets exactly as shown
- Check spelling: `TWILIO_ACCOUNT_SID` (not `VITE_TWILIO_ACCOUNT_SID`)
- Restart the Edge Function after adding secrets

### "Invalid credentials"
- Verify your Twilio Account SID and Auth Token are correct
- Make sure there are no extra spaces in the secret values
- Test credentials directly in Twilio Console

### "Function not found"
- The `send-whatsapp` function should exist in `supabase/functions/send-whatsapp/`
- Deploy functions if needed: `supabase functions deploy`

---

**Status**: ⚠️ Needs Setup - Add Twilio secrets to Supabase Functions  
**Next Step**: Add the 3 secrets to your Supabase project settings 