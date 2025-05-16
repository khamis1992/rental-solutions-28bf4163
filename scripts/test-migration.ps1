#!/usr/bin/env pwsh
# Service Migration Testing Script
# Run this script to test all functionality after the service migration

Write-Host "=== Service Migration Testing Script ===" -ForegroundColor Cyan
Write-Host "This script will test the core functionality of migrated services" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
Set-Location "c:\Users\khamis\coodebase rental\rental-solutions-28bf4163"

# Step 1: Run type checking to verify no type errors
Write-Host "Step 1: Running TypeScript type checking..." -ForegroundColor Green
npm run type-check

# Check if type checking succeeded
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript type checking found errors. Please fix these before proceeding." -ForegroundColor Red
    Exit 1
}

Write-Host "Type checking succeeded!" -ForegroundColor Green
Write-Host ""

# Step 2: Run tests if they exist
Write-Host "Step 2: Running automated tests..." -ForegroundColor Green
if (Test-Path "package.json") {
    $packageJson = Get-Content -Raw "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        npm run test
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Tests failed. Please fix failing tests before proceeding." -ForegroundColor Red
        } else {
            Write-Host "Tests passed successfully!" -ForegroundColor Green
        }
    } else {
        Write-Host "No test script found in package.json. Skipping automated tests." -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 3: Start the development server for manual testing
Write-Host "Step 3: Starting development server for manual testing..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server once testing is complete." -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual Testing Checklist:" -ForegroundColor Cyan
Write-Host "1. Test Data Fetching:" -ForegroundColor White
Write-Host "   - Verify traffic fines list loads correctly with loading indicators" -ForegroundColor White
Write-Host "   - Verify legal cases list loads with proper loading states" -ForegroundColor White
Write-Host "   - Check that cached data is used when navigating back to a previously loaded page" -ForegroundColor White
Write-Host ""
Write-Host "2. Test Error Handling:" -ForegroundColor White
Write-Host "   - Try submitting invalid data to forms to check validation" -ForegroundColor White
Write-Host "   - Temporarily disconnect network to test offline error handling" -ForegroundColor White
Write-Host "   - Verify error messages are user-friendly and descriptive" -ForegroundColor White
Write-Host ""
Write-Host "3. Test Mutation Operations:" -ForegroundColor White
Write-Host "   - Create a new traffic fine using TrafficFineEntry" -ForegroundColor White
Write-Host "   - Update a traffic fine status (pay or dispute)" -ForegroundColor White
Write-Host "   - Create a new legal case" -ForegroundColor White
Write-Host "   - Update a legal case status" -ForegroundColor White
Write-Host ""
Write-Host "4. Test Component Integration:" -ForegroundColor White
Write-Host "   - Verify Reports.tsx loads traffic fine and legal case data correctly" -ForegroundColor White
Write-Host "   - Check that TrafficFineValidation.tsx can assign fines to customers" -ForegroundColor White
Write-Host "   - Verify AgreementTrafficFines shows correct fines for a specific agreement" -ForegroundColor White
Write-Host ""
Write-Host "Starting server now. Complete the manual testing as described above." -ForegroundColor Green

# Start the development server
npm run dev
