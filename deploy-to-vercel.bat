@echo off
echo Deploying to Vercel...
echo.

echo Step 1: Adding all changes to Git...
git add .

echo Step 2: Committing changes...
git commit -m "Force Vercel sync - Smart alerts, customer button, real analytics"

echo Step 3: Pushing to GitHub...
git push origin main

echo Step 4: Checking status...
git status

echo.
echo Deployment completed! Vercel will auto-deploy in 2-3 minutes.
echo Check: https://vercel.com/dashboard
pause 