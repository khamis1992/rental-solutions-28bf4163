
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';
import router from './router';
import App from './App';

createRoot(document.getElementById("root")!).render(
  <App>
    <RouterProvider router={router} />
  </App>
);
