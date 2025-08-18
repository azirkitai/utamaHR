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
    id: "department",
    label: "Department",
    icon: Users,
    href: "/system-setting/department"
  },
  {
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    href: "/system-setting/payment"
  }
];

export default function SystemSettingPage() {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const [location] = useLocation();
  const { toast } = useToast();
  
  // All state hooks at top level - never conditional
  const [activeTab, setActiveTab] = useState("leave");
  const [claimActiveTab, setClaimActiveTab] = useState("financial");
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localPolicies, setLocalPolicies] = useState<any[]>([]);
  
  // Basic form states
  const [leaveApproval, setLeaveApproval] = useState({
    firstLevel: "",
    secondLevel: "",
  });
  const [timeoffApproval, setTimeoffApproval] = useState({
    firstLevel: "",
    secondLevel: "",
  });
  const [timeoffSettings, setTimeoffSettings] = useState({
    enableAttachment: true,
    applicationLimitHour: true,
    minHour: 0,
    maxHour: 4,
  });
  const [financialApproval, setFinancialApproval] = useState({
    firstLevel: "",
    secondLevel: "",
  });
  const [financialSettings, setFinancialSettings] = useState({
    cutoffDate: "31",
  });
  const [overtimeApproval, setOvertimeApproval] = useState({
    firstLevel: "",
    secondLevel: "",
  });
  const [overtimeSettings, setOvertimeSettings] = useState({
    countOvertimeInPayroll: true,
    workingDaysPerMonth: "26",
    overtimeCalculation: "basic-salary",
    overtimeCutoffDate: "31",
  });
  
  // Modal states
  const [showCreatePolicyDialog, setShowCreatePolicyDialog] = useState(false);
  const [policyType, setPolicyType] = useState<"financial" | "overtime">("financial");
  const [expandedFinancialPolicyId, setExpandedFinancialPolicyId] = useState<string | null>(null);
  const [excludedFinancialEmployees, setExcludedFinancialEmployees] = useState<string[]>([]);
  
  // Company form state
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyShortName: "",
    companyRegistrationNumber: "",
    companyType: "",
    industry: "",
    email: "",
    phoneNumber: "",
    faxNumber: "",
    address: "",
    state: "",
    city: "",
    postcode: "",
    country: "",
    logoUrl: "",
    bankName: "",
    bankAccountNumber: "",
    epfNumber: "",
    socsoNumber: "",
    incomeTaxNumber: "",
    employerNumber: "",
    lhdnBranch: "",
    originatorId: "",
    zakatNumber: "",
    cNumber: ""
  });
  
  // Payment settings form state
  const [paymentForm, setPaymentForm] = useState({
    currency: "MYR",
    hrdfContribution: "1.0",
    standardWorkingHour: "8",
    epfEnabled: true,
    socsoEnabled: true,
    eisEnabled: true,
    hrdfEnabled: true,
    pcb39Enabled: true
  });
  
  // Financial Policy Form State
  const [financialPolicyForm, setFinancialPolicyForm] = useState<{
    [key: string]: {
      claimName: string;
      annualLimit: string;
      annualLimitUnlimited: boolean;
      limitPerApplication: string;
      limitPerApplicationUnlimited: boolean;
      excludedEmployeeIds: string[];
      claimRemark: string;
    };
  }>({});
  
  // Group Policy settings state
  const [groupPolicySettings, setGroupPolicySettings] = useState<{
    [key: string]: { selected: boolean; days: string };
  }>({
    "Super Admin": { selected: false, days: "12" },
    "Admin": { selected: false, days: "12" },
    "HR Manager": { selected: false, days: "12" },
    "PIC": { selected: false, days: "12" },
    "Manager/Supervisor": { selected: false, days: "12" },
    "Employee": { selected: false, days: "12" }
  });
  
  // ALL QUERIES MUST BE CALLED UNCONDITIONALLY
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
  
  const { data: financialClaimPoliciesData = [] } = useQuery({
    queryKey: ["/api/financial-claim-policies"],
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: overtimeApprovalSettings = {} } = useQuery({
    queryKey: ["/api/overtime/approval-settings"]
  });
  
  const { data: overtimePolicyData = [] } = useQuery({
    queryKey: ["/api/overtime/policies"]
  });
  
  const { data: overtimeSettingsData = {} } = useQuery({
    queryKey: ["/api/overtime/settings"]
  });
  
  const { data: currentLeavePolicySettings = [] } = useQuery({
    queryKey: ["/api/leave-policy-settings", expandedPolicyId]
  });
  
  const { data: currentLeaveSettings = {} } = useQuery({
    queryKey: ["/api/approval-settings/leave"],
    staleTime: 30000,
  });
  
  const { data: currentFinancialSettings = {} } = useQuery({
    queryKey: ["/api/approval-settings/financial"],
    staleTime: 30000,
  });
  
  const { data: currentPaymentSettings = {} } = useQuery({
    queryKey: ["/api/approval-settings/payment"],
    staleTime: 30000,
  });
  
  const { data: currentCompanySettings = {} } = useQuery({
    queryKey: ["/api/company-settings"],
    staleTime: 30000,
  });
  
  // ALL MUTATIONS MUST BE CALLED UNCONDITIONALLY
  const createFinancialPolicyMutation = useMutation({
    mutationFn: async (data: InsertFinancialClaimPolicy) => {
      return await apiRequest("POST", "/api/financial-claim-policies", data);
    },
    onSuccess: () => {
      toast({
        title: "Policy saved",
        description: "Financial claim policy successfully saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-claim-policies"] });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save claim policy. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/company-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive",
      });
    },
  });
  
  const savePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/payment-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    },
  });
  
  // Effects for data initialization - AFTER all hooks
  useEffect(() => {
    if (currentCompanySettings && typeof currentCompanySettings === 'object') {
      const settings = currentCompanySettings as any;
      setCompanyForm({
        companyName: settings.companyName || "",
        companyShortName: settings.companyShortName || "",
        companyRegistrationNumber: settings.companyRegistrationNumber || "",
        companyType: settings.companyType || "",
        industry: settings.industry || "",
        email: settings.email || "",
        phoneNumber: settings.phoneNumber || "",
        faxNumber: settings.faxNumber || "",
        address: settings.address || "",
        state: settings.state || "",
        city: settings.city || "",
        postcode: settings.postcode || "",
        country: settings.country || "",
        logoUrl: settings.logoUrl || "",
        bankName: settings.bankName || "",
        bankAccountNumber: settings.bankAccountNumber || "",
        epfNumber: settings.epfNumber || "",
        socsoNumber: settings.socsoNumber || "",
        incomeTaxNumber: settings.incomeTaxNumber || "",
        employerNumber: settings.employerNumber || "",
        lhdnBranch: settings.lhdnBranch || "",
        originatorId: settings.originatorId || "",
        zakatNumber: settings.zakatNumber || "",
        cNumber: settings.cNumber || ""
      });
    }
  }, [currentCompanySettings]);
  
  useEffect(() => {
    if (currentPaymentSettings && typeof currentPaymentSettings === 'object') {
      const settings = currentPaymentSettings as any;
      setPaymentForm({
        currency: settings.currency || "MYR",
        hrdfContribution: settings.hrdfContribution || "1.0",
        standardWorkingHour: settings.standardWorkingHour || "8",
        epfEnabled: settings.epfEnabled !== undefined ? settings.epfEnabled : true,
        socsoEnabled: settings.socsoEnabled !== undefined ? settings.socsoEnabled : true,
        eisEnabled: settings.eisEnabled !== undefined ? settings.eisEnabled : true,
        hrdfEnabled: settings.hrdfEnabled !== undefined ? settings.hrdfEnabled : true,
        pcb39Enabled: settings.pcb39Enabled !== undefined ? settings.pcb39Enabled : true
      });
    }
  }, [currentPaymentSettings]);
  
  // Stable section calculation
  const currentSection = useMemo(() => {
    if (location === "/system-setting" || location === "/system-setting/company") {
      return "company";
    }
    return location.split("/").pop() || "company";
  }, [location]);

  // Helper functions
  const calculateMajorityEntitlement = useCallback((leaveTypeId: string) => {
    if (!Array.isArray(allGroupPolicySettings) || !Array.isArray(companyLeaveTypes)) {
      return 0;
    }
    
    const policiesForThisType = allGroupPolicySettings.filter((policy: any) => 
      policy.leaveType === leaveTypeId && policy.enabled
    );
    
    if (policiesForThisType.length === 0) {
      const companyType = companyLeaveTypes.find((ct: any) => ct.id === leaveTypeId);
      return companyType?.entitlementDays || 0;
    }
    
    const daysCounts: { [key: number]: number } = {};
    policiesForThisType.forEach((policy: any) => {
      const days = policy.entitlementDays || 0;
      daysCounts[days] = (daysCounts[days] || 0) + 1;
    });
    
    let maxCount = 0;
    let majorityDays = 0;
    for (const [days, count] of Object.entries(daysCounts)) {
      if (count > maxCount) {
        maxCount = count;
        majorityDays = parseInt(days);
      }
    }
    
    return majorityDays;
  }, [allGroupPolicySettings, companyLeaveTypes]);

  // Transform data for UI
  const leavePolicies = useMemo(() => 
    Array.isArray(companyLeaveTypes) ? companyLeaveTypes.map((leaveType: any) => ({
      id: leaveType.id,
      name: leaveType.leaveType,
      entitlement: `${calculateMajorityEntitlement(leaveType.id)} Day(s)`,
      enabled: leaveType.enabled || false
    })) : [], 
    [companyLeaveTypes, calculateMajorityEntitlement]
  );

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
              
              {/* Company Settings */}
              {currentSection === "company" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyForm.companyName}
                        onChange={(e) => setCompanyForm(prev => ({...prev, companyName: e.target.value}))}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyShortName">Company Short Name</Label>
                      <Input
                        id="companyShortName"
                        value={companyForm.companyShortName}
                        onChange={(e) => setCompanyForm(prev => ({...prev, companyShortName: e.target.value}))}
                        placeholder="Enter short name"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => saveCompanyMutation.mutate(companyForm)}
                    disabled={saveCompanyMutation.isPending}
                    className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
                  >
                    {saveCompanyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Save Company Settings
                  </Button>
                </div>
              )}
              
              {/* Payment Settings */}
              {currentSection === "payment" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={paymentForm.currency} 
                        onValueChange={(value) => setPaymentForm(prev => ({...prev, currency: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MYR">Malaysian Ringgit (MYR)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="SGD">Singapore Dollar (SGD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Statutory Contributions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Statutory Contributions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">EPF (Employee Provident Fund)</div>
                          <div className="text-sm text-gray-500">Mandatory retirement savings</div>
                        </div>
                        <Switch
                          checked={paymentForm.epfEnabled}
                          onCheckedChange={(checked) => setPaymentForm(prev => ({...prev, epfEnabled: checked}))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">SOCSO</div>
                          <div className="text-sm text-gray-500">Social Security Organization</div>
                        </div>
                        <Switch
                          checked={paymentForm.socsoEnabled}
                          onCheckedChange={(checked) => setPaymentForm(prev => ({...prev, socsoEnabled: checked}))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">EIS</div>
                          <div className="text-sm text-gray-500">Employment Insurance System</div>
                        </div>
                        <Switch
                          checked={paymentForm.eisEnabled}
                          onCheckedChange={(checked) => setPaymentForm(prev => ({...prev, eisEnabled: checked}))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">HRDF</div>
                          <div className="text-sm text-gray-500">Human Resources Development Fund</div>
                        </div>
                        <Switch
                          checked={paymentForm.hrdfEnabled}
                          onCheckedChange={(checked) => setPaymentForm(prev => ({...prev, hrdfEnabled: checked}))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">PCB39</div>
                          <div className="text-sm text-gray-500">Personal Income Tax</div>
                        </div>
                        <Switch
                          checked={paymentForm.pcb39Enabled}
                          onCheckedChange={(checked) => setPaymentForm(prev => ({...prev, pcb39Enabled: checked}))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => savePaymentMutation.mutate(paymentForm)}
                    disabled={savePaymentMutation.isPending}
                    className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
                  >
                    {savePaymentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Save Payment Settings
                  </Button>
                </div>
              )}
              
              {/* Other sections */}
              {currentSection === "leave" && (
                <div className="space-y-4">
                  <p>Leave settings configuration will be implemented here.</p>
                  <div className="text-sm text-gray-500">
                    Found {leavePolicies.length} leave policies configured.
                  </div>
                </div>
              )}
              
              {currentSection === "claim" && (
                <div className="space-y-4">
                  <p>Claim settings configuration will be implemented here.</p>
                  <div className="text-sm text-gray-500">
                    Found {Array.isArray(financialClaimPoliciesData) ? financialClaimPoliciesData.length : 0} financial claim policies configured.
                  </div>
                </div>
              )}
              
              {currentSection === "department" && (
                <div className="space-y-4">
                  <p>Department settings will be implemented here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}