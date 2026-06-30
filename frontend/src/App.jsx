import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "./services/authService";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import CashierTransaction from "./pages/CashierTransaction";
import QRISConfirmation from "./pages/QRISConfirmation";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/layout/Layout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  const checkAuth = () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  };

  // Helper function untuk mendapatkan default redirect berdasarkan role
  const getDefaultRedirect = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser?.role === "karyawan") {
      return "/products";
    }
    return "/dashboard";
  };

  useEffect(() => {
    checkAuth();
    setLoading(false);

    // Listen for storage changes (login from another tab)
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Custom event listener for same-tab login
  useEffect(() => {
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Tidak memerlukan autentikasi */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRedirect()} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRedirect()} replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRedirect()} replace />
            ) : (
              <ForgotPasswordPage />
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRedirect()} replace />
            ) : (
              <ResetPasswordPage />
            )
          }
        />

        {/* Protected Routes - Memerlukan autentikasi */}
        <Route
          path="/*"
          element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reports" element={<Reports />} />
          <Route path="transactions" element={<CashierTransaction />} />
          <Route path="qris-confirmation" element={<QRISConfirmation />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Root redirect */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? getDefaultRedirect() : "/login"}
              replace
            />
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
