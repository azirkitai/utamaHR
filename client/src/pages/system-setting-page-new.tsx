import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2,
  CalendarDays,
  DollarSign,
  Users,
  CreditCard,
  Bell,
  ClockIcon,
  BarChart3,
  Star,
  FileText,
  Upload,
  Plus,
  Link,
  Settings,
  User,
  Calendar,
  MapPin,
  Navigation,
  Loader2,
  Trash2
} from "lucide-react";
import { useLocation, Link as RouterLink } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialClaimPolicy, InsertFinancialClaimPolicy } from "@shared/schema";

const settingsMenuItems = [
  {
    id: "company",
    label: "Company",
    icon: Building2,
    href: "/system-setting/company"
  },
  {
    id: "leave",
    label: "Leave",
    icon: CalendarDays,
    href: "/system-setting/leave"
  },
  {
    id: "claim",
    label: "Claim",
    icon: DollarSign,
    href: "/system-setting/claim"
  },
  {
    id: "approval",
    label: "Approval",
    icon: Users,
    href: "/system-setting/approval"
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: CreditCard,
    href: "/system-setting/payroll"
  },
  {
    id: "announcement",
    label: "Announcement",
    icon: Bell,
    href: "/system-setting/announcement"
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClockIcon,
    href: "/system-setting/attendance"
  },
  {
    id: "overtime",
    label: "Overtime",
    icon: BarChart3,
    href: "/system-setting/overtime"
  },
  {
    id: "form",
    label: "Form",
    icon: Star,
    href: "/system-setting/form"
  },
  {
    id: "document",
    label: "Document",
    icon: FileText,
    href: "/system-setting/document"
  }
];

export default function SystemSettingPage() {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const [location] = useLocation();
  const { toast } = useToast();
  
  // All state hooks at top level
  const [activeTab, setActiveTab] = useState("leave");
  const [claimActiveTab, setClaimActiveTab] = useState("financial");
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // All queries at top level - never conditional
  const { data: companyLeaveTypes = [] } = useQuery({
    queryKey: ["/api/company-leave-types"]
  });
  
  const { data: allGroupPolicySettings = [] } = useQuery({
    queryKey: ["/api/group-policy-settings"]
  });
  
  const { data: activeLeaveTypesFromDB = [] } = useQuery<string[]>({
    queryKey: ["/api/active-leave-policies"]
  });
  
  const { data: approvalEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees/approval-roles"]
  });
  
  const { data: allEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"]
  });
  
  const { data: financialClaimPoliciesData } = useQuery({
    queryKey: ["/api/financial-claim-policies"],
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: overtimeApprovalSettings } = useQuery({
    queryKey: ["/api/overtime/approval-settings"]
  });
  
  const { data: overtimePolicyData = [] } = useQuery({
    queryKey: ["/api/overtime/policies"]
  });
  
  const { data: overtimeSettingsData } = useQuery({
    queryKey: ["/api/overtime/settings"]
  });
  
  const { data: currentLeavePolicySettings } = useQuery({
    queryKey: ["/api/leave-policy-settings", expandedPolicyId]
  });
  
  const { data: currentLeaveSettings } = useQuery({
    queryKey: ["/api/approval-settings/leave"],
    staleTime: 30000,
  });
  
  const { data: currentFinancialSettings } = useQuery({
    queryKey: ["/api/approval-settings/financial"],
    staleTime: 30000,
  });
  
  const { data: currentPaymentSettings } = useQuery({
    queryKey: ["/api/approval-settings/payment"],
    staleTime: 30000,
  });
  
  const { data: currentCompanySettings } = useQuery({
    queryKey: ["/api/company-settings"],
    staleTime: 30000,
  });
  
  // All mutations at top level
  const createFinancialPolicyMutation = useMutation({
    mutationFn: async (data: InsertFinancialClaimPolicy) => {
      return await apiRequest("POST", "/api/financial-claim-policies", data);
    },
    onSuccess: () => {
      toast({
        title: "Polisi claim disimpan",
        description: "Polisi claim kewangan successfully disimpan.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-claim-policies"] });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Ralat",
        description: "Gagal menyimpan polisi claim. Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });
  
  // Stable section calculation
  const currentSection = useMemo(() => {
    if (location === "/system-setting" || location === "/system-setting/company") {
      return "company";
    }
    return location.split("/").pop() || "company";
  }, [location]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 bg-clip-text text-transparent">
            System Settings
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 space-y-2">
            {settingsMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <RouterLink key={item.id} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all",
                      isActive
                        ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </RouterLink>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 bg-clip-text text-transparent">
                {settingsMenuItems.find(item => item.id === currentSection)?.label || "Settings"}
              </h2>
              
              {/* Content based on current section */}
              {currentSection === "company" && (
                <div className="space-y-4">
                  <p>Company settings will be implemented here.</p>
                </div>
              )}
              
              {currentSection === "leave" && (
                <div className="space-y-4">
                  <p>Leave settings will be implemented here.</p>
                </div>
              )}
              
              {currentSection === "claim" && (
                <div className="space-y-4">
                  <p>Claim settings will be implemented here.</p>
                </div>
              )}
              
              {/* Add other sections as needed */}
              {!["company", "leave", "claim"].includes(currentSection) && (
                <div className="space-y-4">
                  <p>This section is under development.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}