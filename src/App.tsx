import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DominationProvider } from "@/contexts/DominationContext";
import { MollyProvider } from "@/molly/MollyProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import AutoBestsellerPage from "./pages/AutoBestsellerPage.tsx";
import UsagePage from "./pages/UsagePage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import KdpLaunchPage from "./pages/KdpLaunchPage.tsx";
import DownloadsPage from "./pages/DownloadsPage.tsx";
import InstallPage from "./pages/InstallPage.tsx";
import { DevModeBadge } from "@/components/DevModeBadge";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ScriptoraSplashScreen } from "@/components/app/ScriptoraSplashScreen";



const queryClient = new QueryClient();

if (typeof document !== "undefined" && !document.getElementById("scriptora-splash-keyframes")) {
  const style = document.createElement("style");
  style.id = "scriptora-splash-keyframes";
  style.innerHTML = `
    @keyframes scriptoraLoad {
      0% { transform: translateX(-120%); opacity: 0.35; }
      50% { transform: translateX(60%); opacity: 1; }
      100% { transform: translateX(220%); opacity: 0.35; }
    }
    @keyframes scriptoraPulse {
      0%, 100% { transform: scale(1); opacity: 0.92; }
      50% { transform: scale(1.04); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem("scriptora_splash_seen");
    if (seen) {
      setShowSplash(false);
      return;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem("scriptora_splash_seen", "1");
      setShowSplash(false);
    }, 1900);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <DominationProvider>
              <MollyProvider>
                <Toaster />
                <Sonner />
                {showSplash && <ScriptoraSplashScreen />}
                <AppErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/auto-bestseller" element={<ProtectedRoute><AutoBestsellerPage /></ProtectedRoute>} />
                  <Route path="/usage" element={<ProtectedRoute><UsagePage /></ProtectedRoute>} />
                  <Route path="/kdp-launch" element={<ProtectedRoute><KdpLaunchPage /></ProtectedRoute>} />
                  <Route path="/downloads" element={<ProtectedRoute><DownloadsPage /></ProtectedRoute>} />
                  <Route path="/install" element={<InstallPage />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </AppErrorBoundary>
                <DevModeBadge />
              </MollyProvider>
            </DominationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
