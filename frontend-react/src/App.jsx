// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AvisoSesion from "./components/layout/AvisoSesion";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecuperarContrasenaPage from "./pages/RecuperarContrasenaPage";
import RestablecerContrasenaPage from "./pages/RestablecerContrasenaPage";
import VerificationPage from "./pages/VerificationPage";
import TutorialPage from "./pages/TutorialPage";
import AdminTutorialPage from "./pages/AdminTutorialPage";
import ModelWizardPage from "./pages/ModelWizardPage";
import ValidateDataPage from "./pages/ValidateDataPage";
// El archivo en disco es Design3dPage.jsx: el import debe respetar esa
// capitalización, porque en Linux/CI (filesystems case-sensitive) un
// "./pages/Design3DPage" no resolvería y el build fallaría. En Windows
// funcionaba por casualidad.
import Design3DPage from "./pages/Design3dPage";
import ReportPage from "./pages/ReportPage";
import HistoryPage from "./pages/HistoryPage";
import AdminDesignDetailPage from "./pages/AdminDesignDetailPage";
import MaterialesPage from "./pages/MaterialesPage";
import ClientesPage from "./pages/ClientesPage";
import FacturasPage from "./pages/FacturasPage";
import SessionExpiredPage from "./pages/SessionExpiredPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

import "./assets/styles/global.css";

// Muestra el Header y el Footer fuera de las rutas de autenticación: en "/"
// y "/login" la pantalla ocupa todo el viewport, igual que el prototipo.
// useLocation debe leerse dentro de BrowserRouter, por eso el árbol real
// vive en este componente interno y App solo monta Router + AuthProvider.
function CuerpoAplicacion() {
  const { pathname } = useLocation();
  const enAuth = pathname === "/" || pathname === "/login";

  return (
    <div className="app-shell">
      {!enAuth && <Header />}

      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          {/* Recuperación de contraseña: paso 1 pide el enlace por correo;
              paso 2, la ruta /restablecer/:token, lleva el token de un solo
              uso que abre el formulario de la contraseña nueva. */}
          <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
          <Route path="/restablecer/:token" element={<RestablecerContrasenaPage />} />
          <Route path="/verificacion" element={<VerificationPage />} />
          <Route path="/sesion-expirada" element={<SessionExpiredPage />} />

          <Route
            path="/inicio"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutorial"
            element={
              <ProtectedRoute rolRequerido="Carpintero">
                <TutorialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutorial-admin"
            element={
              <ProtectedRoute rolRequerido="Administrador">
                <AdminTutorialPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/formulario-datos"
            element={
              <ProtectedRoute rolRequerido="Carpintero">
                <ModelWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validar-datos"
            element={
              <ProtectedRoute rolRequerido="Carpintero">
                <ValidateDataPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diseno-3d"
            element={
              <ProtectedRoute rolRequerido="Carpintero">
                <Design3DPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reporte"
            element={
              <ProtectedRoute rolRequerido="Carpintero">
                <ReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historial"
            element={
              <ProtectedRoute rolRequerido="Administrador">
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/detalle-admin/:id"
            element={
              <ProtectedRoute rolRequerido="Administrador">
                <AdminDesignDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materiales"
            element={
              <ProtectedRoute rolRequerido="Administrador">
                <MaterialesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute rolRequerido="Administrador">
                <ClientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas"
            element={
              <ProtectedRoute rolRequerido="Administrador">
                <FacturasPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<LoginPage />} />

          {/* Catch-all: cualquier URL desconocida muestra una pantalla
              404 propia en vez de dejar el cuerpo en blanco. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!enAuth && <Footer />}

      {/* Aviso emergente de sesión por cerrarse. Se monta aquí, fuera de
          las rutas, para que pueda aparecer sobre cualquier pantalla;
          solo se dibuja si hay un aviso activo. */}
      <AvisoSesion />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CuerpoAplicacion />
      </AuthProvider>
    </BrowserRouter>
  );
}