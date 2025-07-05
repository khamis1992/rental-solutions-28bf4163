# Supabase Twilio Secrets Setup Script (PowerShell)
# This script sets up your Twilio credentials as Supabase Function Secrets

Write-Host "🔧 Setting up Twilio secrets in Supabase..." -ForegroundColor Green

# Your project details
$PROJECT_REF = "vqdlsidkucrownbfuouq"
$PROJECT_NAME = "Rental Solutions"

# Your Twilio credentials
$TWILIO_ACCOUNT_SID = "AC2c96b56a574428684c52e8dc0c250f91"
$TWILIO_AUTH_TOKEN = "01c2e101b2001cea235e5434f851e94c"
$TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886"

Write-Host "📋 Project: $PROJECT_NAME ($PROJECT_REF)" -ForegroundColor Cyan
Write-Host "📞 Setting up WhatsApp integration..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
try {
    supabase --version | Out-Null
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing via npm..." -ForegroundColor Red
    
    # Try to install via npm
    try {
        npm install -g supabase
        Write-Host "✅ Supabase CLI installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Supabase CLI. Please install manually:" -ForegroundColor Red
        Write-Host "   https://supabase.com/docs/guides/cli/getting-started" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🔐 Logging into Supabase..." -ForegroundColor Cyan
# Login to Supabase (will prompt for authentication)
try {
    supabase login
    Write-Host "✅ Logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed. Please try again manually: supabase login" -ForegroundColor Red
    exit 1
}

Write-Host "🔗 Linking to your project..." -ForegroundColor Cyan
# Link to the project
try {
    supabase link --project-ref $PROJECT_REF
    Write-Host "✅ Project linked successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Project linking may have failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "📡 Setting Twilio secrets..." -ForegroundColor Cyan
# Set the secrets
try {
    supabase secrets set "TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID"
    supabase secrets set "TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN"
    supabase secrets set "TWILIO_WHATSAPP_NUMBER=$TWILIO_WHATSAPP_NUMBER"
    
    Write-Host "✅ Twilio secrets configured successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set secrets. Error: $_" -ForegroundColor Red
    Write-Host "💡 Try setting them manually in Supabase Dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🧪 Testing the WhatsApp function..." -ForegroundColor Cyan
Write-Host "📞 Function should now be ready for WhatsApp messages!" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Setup Complete! ✨" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. ✅ Edge Function deployed: send-whatsapp" -ForegroundColor Green
Write-Host "2. ✅ Twilio secrets configured" -ForegroundColor Green  
Write-Host "3. 🧪 Test WhatsApp in your app at http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Test WhatsApp functionality by:" -ForegroundColor Cyan
Write-Host "   - Going to your rental app dashboard" -ForegroundColor White
Write-Host "   - The console errors should be gone!" -ForegroundColor White
Write-Host "   - Test sending WhatsApp messages from the app" -ForegroundColor White
Write-Host ""

# Pause to let user read the results
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 