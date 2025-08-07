import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardHome from "@/pages/dashboard-home";
import AuthPage from "@/pages/auth-page";
import EmployeesPage from "@/pages/employees-page";
import DebugPage from "@/pages/debug-page";
import MyRecordPage from "@/pages/my-record-page";
import ApplyLeavePage from "@/pages/apply-leave-page";
import ApplyClaimPage from "@/pages/apply-claim-page";
import ApplyTimeoffPage from "@/pages/apply-timeoff-page";
import AnnouncementPage from "@/pages/announcement-page";
import CalendarPage from "@/pages/calendar-page";
import ManageEmployeePage from "@/pages/manage-employee-page";
import LeaveApprovalPage from "@/pages/leave-approval-page";
import ClaimApprovalPage from "@/pages/claim-approval-page";
import TimeoffApprovalPage from "@/pages/timeoff-approval-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardHome} />
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/my-record" component={MyRecordPage} />
      <ProtectedRoute path="/apply/leave" component={ApplyLeavePage} />
      <ProtectedRoute path="/apply/claim" component={ApplyClaimPage} />
      <ProtectedRoute path="/apply/timeoff" component={ApplyTimeoffPage} />
      <ProtectedRoute path="/announcement" component={AnnouncementPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/manage-employee" component={ManageEmployeePage} />
      <ProtectedRoute path="/approval/leave" component={LeaveApprovalPage} />
      <ProtectedRoute path="/approval/claim" component={ClaimApprovalPage} />
      <ProtectedRoute path="/approval/timeoff" component={TimeoffApprovalPage} />
      <ProtectedRoute path="/debug" component={DebugPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
