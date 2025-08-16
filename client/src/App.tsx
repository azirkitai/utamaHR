import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardHome from "@/pages/dashboard-home";
import AuthPage from "@/pages/auth-page";
import EmployeesPage from "@/pages/employees-page";
import EmployeeDetailsPage from "@/pages/employee-details-page";
import SystemSettingPage from "@/pages/system-setting-page";
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
import AttendanceTimesheetPage from "@/pages/attendance-timesheet-page";
import ShiftCalendarPage from "@/pages/shift-calendar-page";
import OvertimePage from "@/pages/overtime-page";
import LatenessPage from "@/pages/lateness-page";
import SalaryPayrollPage from "@/pages/salary-payroll-page";
import SalaryPayrollPageEmployee from "@/pages/salary-payroll-page";
import PaymentVoucherPage from "@/pages/payment-voucher-page";
import VoucherDetailsPage from "@/pages/voucher-details-page";
import EmployeeSalaryDetailsPage from "@/pages/employee-salary-details-page";

import PayrollDetailPage from "@/pages/payroll-detail-page";
import QRClockInPage from "@/pages/qr-clockin-page";
import MobileClockInPage from "@/pages/mobile-clockin-page";
import MobileClockOutPage from "@/pages/mobile-clockout-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardHome} />
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/employee-details/:id" component={EmployeeDetailsPage} />
      <ProtectedRoute path="/my-record" component={MyRecordPage} />
      <ProtectedRoute path="/my-record/payment/salary-payroll" component={SalaryPayrollPageEmployee} />
      <ProtectedRoute path="/apply/leave" component={ApplyLeavePage} />
      <ProtectedRoute path="/apply/claim" component={ApplyClaimPage} />
      <ProtectedRoute path="/apply/timeoff" component={ApplyTimeoffPage} />
      <ProtectedRoute path="/announcement" component={AnnouncementPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/manage-employee" component={ManageEmployeePage} />
      <ProtectedRoute path="/approval" component={LeaveApprovalPage} />
      <ProtectedRoute path="/approval/leave" component={LeaveApprovalPage} />
      <ProtectedRoute path="/leave-approval" component={LeaveApprovalPage} />
      <ProtectedRoute path="/approval/claim" component={ClaimApprovalPage} />
      <ProtectedRoute path="/approval/timeoff" component={TimeoffApprovalPage} />
      <ProtectedRoute path="/attendance/timesheet" component={AttendanceTimesheetPage} />
      <ProtectedRoute path="/attendance/shift-calendar" component={ShiftCalendarPage} />
      <ProtectedRoute path="/attendance/overtime" component={OvertimePage} />
      <ProtectedRoute path="/attendance/lateness" component={LatenessPage} />
      <ProtectedRoute path="/payment/salary-payroll" component={SalaryPayrollPage} />
      <ProtectedRoute path="/payroll" component={SalaryPayrollPage} />
      <ProtectedRoute path="/payment/salary-payroll/view/:id" component={PayrollDetailPage} />
      <ProtectedRoute path="/payroll/:employeeId" component={PayrollDetailPage} />
      <ProtectedRoute path="/employee-salary/:employeeId" component={EmployeeSalaryDetailsPage} />

      <ProtectedRoute path="/payment/voucher" component={PaymentVoucherPage} />
      <ProtectedRoute path="/voucher-details/:voucherId" component={VoucherDetailsPage} />
      <ProtectedRoute path="/qr-clockin" component={QRClockInPage} />
      <ProtectedRoute path="/system-setting/*" component={SystemSettingPage} />
      <ProtectedRoute path="/system-setting" component={SystemSettingPage} />
      <ProtectedRoute path="/system-settings/*" component={SystemSettingPage} />
      <ProtectedRoute path="/system-settings" component={SystemSettingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/mobile-clockin" component={MobileClockInPage} />
      <ProtectedRoute path="/mobile-clockout" component={MobileClockOutPage} />
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
