const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: "67ij87",
  env: {
    VITE_SUPABASE_URL: 'https://vqdlsidkucrownbfuouq.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y',
  },
  e2e: {
    baseUrl: 'http://localhost:8082',
    supportFile: 'e2e/support/e2e.js',
    specPattern: 'e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    defaultCommandTimeout: 8000,
  },
});
