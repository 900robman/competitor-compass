import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectWorkspacePage from "./pages/ProjectWorkspacePage";
import CompetitorDetailPage from "./pages/CompetitorDetailPage";
import CompareCategoriesPage from "./pages/CompareCategoriesPage";
import SettingsPage from "./pages/SettingsPage";
import InterviewChatPage from "./pages/InterviewChatPage";
import ProfilePage from "./pages/ProfilePage";
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
            <Route path="/interview/:token" element={<InterviewChatPage />} />
            <Route path="/" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/project/:projectId" element={<ProtectedRoute><ProjectWorkspacePage /></ProtectedRoute>} />
            <Route path="/project/:projectId/competitor/:competitorId" element={<ProtectedRoute><CompetitorDetailPage /></ProtectedRoute>} />
            <Route path="/project/:projectId/compare" element={<ProtectedRoute><CompareCategoriesPage /></ProtectedRoute>} />
            <Route path="/project/:projectId/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
