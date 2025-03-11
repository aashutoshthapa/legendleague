
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { NavigationType, createBrowserRouter, RouterProvider } from 'react-router-dom';

// Create a router with a basename if needed for production
const router = createBrowserRouter([{ path: "*", element: <App /> }], {
  basename: "/",
});

// This ensures proper handling of direct page loads in production
createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
