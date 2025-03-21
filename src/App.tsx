
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";

// Auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import EditVehicle from "./pages/EditVehicle";
import UserSettings from "./pages/UserSettings";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="auth" element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
              </Route>
              
              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <>
                      <Sidebar />
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* Vehicle Management Routes */}
                        <Route path="/vehicles" element={<Vehicles />} />
                        <Route path="/vehicles/add" element={<AddVehicle />} />
                        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                        <Route path="/vehicles/edit/:id" element={<EditVehicle />} />
                        
                        {/* User Management Routes */}
                        <Route path="/settings" element={<UserSettings />} />
                        <Route 
                          path="/users" 
                          element={
                            <ProtectedRoute roles={["admin"]}>
                              <UserManagement />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Add other module routes here */}
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </TooltipProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
