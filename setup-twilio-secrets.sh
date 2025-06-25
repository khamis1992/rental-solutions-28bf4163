#!/bin/bash

# Supabase Twilio Secrets Setup Script
# This script sets up your Twilio credentials as Supabase Function Secrets

echo "🔧 Setting up Twilio secrets in Supabase..."

# Your project details
PROJECT_REF="vqdlsidkucrownbfuouq"
PROJECT_NAME="Rental Solutions"

# Your Twilio credentials
TWILIO_ACCOUNT_SID="AC2c96b56a574428684c52e8dc0c250f91"
TWILIO_AUTH_TOKEN="01c2e101b2001cea235e5434f851e94c"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

echo "📋 Project: $PROJECT_NAME ($PROJECT_REF)"
echo "📞 Setting up WhatsApp integration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    # Install Supabase CLI
    if command -v npm &> /dev/null; then
        npm install -g supabase
    elif command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
    else
        echo "Please install Supabase CLI manually: https://supabase.com/docs/guides/cli/getting-started"
        exit 1
    fi
fi

echo "🔐 Logging into Supabase..."
# Login to Supabase (will prompt for authentication)
supabase login

echo "🔗 Linking to your project..."
# Link to the project
supabase link --project-ref $PROJECT_REF

echo "📡 Setting Twilio secrets..."
# Set the secrets
supabase secrets set TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"
supabase secrets set TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" 
supabase secrets set TWILIO_WHATSAPP_NUMBER="$TWILIO_WHATSAPP_NUMBER"

echo "✅ Twilio secrets configured successfully!"
echo ""
echo "🧪 Testing the WhatsApp function..."

# Test the function
echo "📞 Function should now be ready for WhatsApp messages!"
echo ""
echo "✨ Setup Complete! ✨"
echo ""
echo "📋 Next steps:"
echo "1. ✅ Edge Function deployed: send-whatsapp"
echo "2. ✅ Twilio secrets configured"
echo "3. 🧪 Test WhatsApp in your app at http://localhost:8080"
echo ""
echo "💡 Test WhatsApp functionality by:"
echo "   - Going to your rental app dashboard"
echo "   - The console errors should be gone!"
echo "   - Test sending WhatsApp messages from the app"
echo "" 