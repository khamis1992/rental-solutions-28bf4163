
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Note: We're simplifying this router as the main routing is now handled in App.tsx
// This prevents conflicts between the two routing systems
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);

export default router;
