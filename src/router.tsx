
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Create a simple browser router that just renders the App component
// The actual routing is handled inside App.tsx
const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
  },
]);

export default router;
