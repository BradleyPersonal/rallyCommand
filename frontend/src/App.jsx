import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { VehicleFilterProvider } from "@/context/VehicleFilterContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import InventoryPage from "@/pages/InventoryPage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import GaragePage from "@/pages/GaragePage";
import VehicleDetailPage from "@/pages/VehicleDetailPage";
import VehicleSetupsPage from "@/pages/VehicleSetupsPage";
import VehicleRepairsPage from "@/pages/VehicleRepairsPage";
import RepairsPage from "@/pages/RepairsPage";
import SetupsPage from "@/pages/SetupsPage";
import "@/App.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full spinner" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full spinner" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <VehicleFilterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/:id"
              element={
                <ProtectedRoute>
                  <ItemDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/garage"
              element={
                <ProtectedRoute>
                  <GaragePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicle/:id"
              element={
                <ProtectedRoute>
                  <VehicleDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicle/:id/setups"
              element={
                <ProtectedRoute>
                  <VehicleSetupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicle/:id/repairs"
              element={
                <ProtectedRoute>
                  <VehicleRepairsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repairs"
              element={
                <ProtectedRoute>
                  <RepairsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setups"
              element={
                <ProtectedRoute>
                  <SetupsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'hsl(240 6% 7%)',
                border: '1px solid hsl(240 4% 16%)',
                color: 'hsl(0 0% 98%)',
              },
            }}
          />
        </BrowserRouter>
      </VehicleFilterProvider>
    </AuthProvider>
  );
}

export default App;
