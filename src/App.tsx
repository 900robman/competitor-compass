import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import ProjectsPage from "./pages/ProjectsPage";
import CompetitorListPage from "./pages/CompetitorListPage";
import CompetitorDetailPage from "./pages/CompetitorDetailPage";
import CompareCategoriesPage from "./pages/CompareCategoriesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/project/:projectId" element={<ProtectedRoute><CompetitorListPage /></ProtectedRoute>} />
            <Route path="/project/:projectId/competitor/:competitorId" element={<ProtectedRoute><CompetitorDetailPage /></ProtectedRoute>} />
            <Route path="/project/:projectId/compare" element={<ProtectedRoute><CompareCategoriesPage /></ProtectedRoute>} />
            <Route path="/project/:projectId/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
