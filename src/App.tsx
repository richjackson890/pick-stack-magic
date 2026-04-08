import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LiquidSpinner } from "@/components/LiquidSpinner";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Share from "./pages/Share";
import PublicView from "./pages/PublicView";
import ManualSaveTest from "./pages/ManualSaveTest";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";

const queryClient = new QueryClient();

// Use system preference or light mode by default
function useTheme() {
  useEffect(() => {
    // Respect saved theme preference or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profileComplete, teamVerified, recheckProfile, recheckTeam, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // After Google OAuth redirect, check for pending invite token
  const pendingInvite = localStorage.getItem('pending_invite_token');
  if (pendingInvite) {
    return <Navigate to={`/invite?token=${encodeURIComponent(pendingInvite)}`} replace />;
  }

  // Invite-only: check team membership
  if (teamVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidSpinner size="lg" />
      </div>
    );
  }

  if (!teamVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🔒</div>
        <h2 className="text-lg font-bold">초대받지 않은 계정입니다</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          이 서비스는 초대받은 팀원만 사용할 수 있습니다.<br />
          관리자에게 초대 링크를 요청하세요.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // Block UI until profile is complete (display_name set)
  if (profileComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidSpinner size="lg" />
      </div>
    );
  }

  if (!profileComplete) {
    return <ProfileSetupModal onComplete={recheckProfile} />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects to home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    // Check pending invite before redirecting to home
    const pendingInvite = localStorage.getItem('pending_invite_token');
    if (pendingInvite) {
      return <Navigate to={`/invite?token=${encodeURIComponent(pendingInvite)}`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// App wrapper to apply theme
function AppRoutes() {
  useTheme();
  
  return (
    <Routes>
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/p/:code" element={<PublicView />} />
      <Route path="/share" element={
        <ProtectedRoute>
          <Share />
        </ProtectedRoute>
      } />
      <Route path="/manual-save" element={
        <ProtectedRoute>
          <ManualSaveTest />
        </ProtectedRoute>
      } />
      <Route path="/invite" element={<Invite />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <PwaInstallBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
