import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import { useEffect } from "react";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import EditProfile from "@/pages/dashboard/edit";
import Comunidade from "@/pages/dashboard/comunidade";
import Discover from "@/pages/discover";
import ProfilePage from "@/pages/profile";
import DevKeefnow from "@/pages/devkeefnow";
import Support from "@/pages/support";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/suporte" component={Support} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/edit" component={EditProfile} />
      <Route path="/dashboard/comunidade" component={Comunidade} />
      <Route path="/discover" component={Discover} />
      <Route path="/devkeefnow" component={DevKeefnow} />
      <Route path="/keefaren" component={DevKeefnow} />
      <Route path="/:username" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    if (apiUrl) {
      fetch(`${apiUrl}/api/healthz`, { method: 'GET', signal: AbortSignal.timeout(8000) }).catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
