import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AutoBestsellerPage from "./pages/AutoBestsellerPage";
import KdpLaunchPage from "./pages/KdpLaunchPage";
import DashboardReal from "./pages/Dashboard"; // La tua nuova Home Platino

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auto-bestseller" element={<AutoBestsellerPage />} />
          <Route path="/kdp-launch" element={<KdpLaunchPage />} />
          {/* Aggiungeremo qui le altre rotte man mano che colleghiamo i moduli */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
