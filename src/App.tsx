
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import EditVehicle from "./pages/EditVehicle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex bg-background">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/*"
              element={
                <>
                  <Sidebar />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    {/* Vehicle Management Routes */}
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/vehicles/add" element={<AddVehicle />} />
                    <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                    <Route path="/vehicles/edit/:id" element={<EditVehicle />} />
                    {/* Add other module routes here */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
