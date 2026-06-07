import { useEffect } from "react";
import { useLocation, Route, Switch, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import Login from "@/pages/login";
import Game from "@/pages/game";
import History from "@/pages/history";
import Leaderboard from "@/pages/leaderboard";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, useLayout = true, ...rest }: any) {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) setLocation("/");
  }, [token, setLocation]);

  if (!token) return null;

  if (!useLayout) return <Component {...rest} />;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function PublicRoute({ component: Component, ...rest }: any) {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (token) setLocation("/game");
  }, [token, setLocation]);

  if (token) return null;
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Login} />} />
      <Route path="/game" component={() => <ProtectedRoute component={Game} useLayout={false} />} />
      <Route path="/history" component={() => <ProtectedRoute component={History} />} />
      <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} useLayout={false} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
