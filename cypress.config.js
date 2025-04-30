const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: "67ij87",
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'e2e/support/e2e.js',
    specPattern: 'e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    defaultCommandTimeout: 8000,
  },
});
