import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import "leaflet/dist/leaflet.css";
import Login from "./pages/login.jsx";
import Home from "./pages/home.jsx";
import ApiarioPage from "./pages/apiario.jsx";
import ArniaPage from "./pages/arnia.jsx";
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />, // Componente che reindirizza alla pagina di login
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/apiario/:id',
    element: <ApiarioPage />,
  },
  {
    path: '/arnia/:id',
    element: <ArniaPage />,
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
