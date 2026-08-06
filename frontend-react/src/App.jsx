// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerificationPage from "./pages/VerificationPage";
import TutorialPage from "./pages/TutorialPage";
import AdminTutorialPage from "./pages/AdminTutorialPage";
import ModelWizardPage from "./pages/ModelWizardPage";
import ValidateDataPage from "./pages/ValidateDataPage";
import Design3DPage from "./pages/Design3DPage";
import ReportPage from "./pages/ReportPage";
import HistoryPage from "./pages/HistoryPage";
import AdminDesignDetailPage from "./pages/AdminDesignDetailPage";
import MaterialesPage from "./pages/MaterialesPage";
import SessionExpiredPage from "./pages/SessionExpiredPage";

import "./assets/styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Header />

          <main>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/verificacion" element={<VerificationPage />} />
              <Route path="/sesion-expirada" element={<SessionExpiredPage />} />

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
                path="/disenio-3d"
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

              <Route path="/" element={<LoginPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}