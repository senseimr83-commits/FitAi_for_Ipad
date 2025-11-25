import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import FitnessDashboard from "@/pages/FitnessDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <FitnessDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/trends">
        <ProtectedRoute>
          <FitnessDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/sleep">
        <ProtectedRoute>
          <FitnessDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/stats">
        <ProtectedRoute>
          <FitnessDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
