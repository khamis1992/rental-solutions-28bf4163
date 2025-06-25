# 🔧 Supabase Configuration Setup

## Problem
You're getting an "Invalid API key" error because your Supabase environment variables are not configured.

## Solution

### Step 1: Create .env file
Create a `.env` file in your project root directory with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development environment
VITE_APP_ENVIRONMENT=development
```

### Step 2: Get your Supabase credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one if needed)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use this for `VITE_SUPABASE_URL`
   - **Project API Keys** → **anon/public** → Use this for `VITE_SUPABASE_ANON_KEY`

### Step 3: Update your .env file
Replace the placeholder values in your `.env` file with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_actual_key
VITE_APP_ENVIRONMENT=development
```

### Step 4: Restart your development server
After creating/updating the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
# or
bun dev
```

## Security Notes
- ✅ The `.env` file is already in `.gitignore` so it won't be committed to git
- ✅ Never share your Supabase credentials publicly
- ✅ The anon key is safe to use in frontend applications
- ⚠️ Make sure to use the **anon/public** key, not the **service_role** key

## Part 2: WhatsApp/Twilio Configuration (Fix WhatsApp Error)

If you're getting "Twilio credentials not configured" error, you also need to set up WhatsApp messaging:

### Step 5: Get Twilio Credentials

1. Create a free account at [https://www.twilio.com](https://www.twilio.com)
2. Go to your [Twilio Console](https://console.twilio.com)
3. Find your **Account SID** (starts with `AC`)
4. Find your **Auth Token** (click the eye icon to reveal)

### Step 6: Update .env file with Twilio credentials

Add these lines to your `.env` file (they're already added as placeholders):

```env
# Replace with your actual Twilio credentials
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Note**: The WhatsApp number above is Twilio's sandbox number for testing. For production, you'll need your own WhatsApp Business number.

### Step 7: Test WhatsApp (Optional)

1. Navigate to `/whatsapp-test` in your app
2. Join the Twilio sandbox by sending "join <code>" to +1 (415) 523-8886
3. Test sending messages

For complete WhatsApp setup details, see `WHATSAPP_SETUP_GUIDE.md`

## Verification
Once configured correctly:
- ✅ Your login should work without the "Invalid API key" error
- ✅ WhatsApp features will work without "Twilio credentials not configured" error

If you still have issues, check the browser console for any remaining error messages. 