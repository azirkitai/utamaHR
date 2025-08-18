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
    icon: <Building2 className="w-4 h-4" />,
    href: "/system-setting/company",
  },
  {
    id: "leave",
    label: "Leave", 
    icon: <CalendarDays className="w-4 h-4" />,
    href: "/system-setting/leave",
  },
  {
    id: "claim",
    label: "Claim",
    icon: <DollarSign className="w-4 h-4" />,
    href: "/system-setting/claim",
  },
  {
    id: "department",
    label: "Department",
    icon: <Users className="w-4 h-4" />,
    href: "/system-setting/department",
  },
  {
    id: "payment",
    label: "Payment",
    icon: <CreditCard className="w-4 h-4" />,
    href: "/system-setting/payment",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-4 h-4" />,
    href: "/system-setting/notifications",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: <ClockIcon className="w-4 h-4" />,
    href: "/system-setting/attendance",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    icon: <BarChart3 className="w-4 h-4" />,
    href: "/system-setting/evaluation",
  },

  {
    id: "yearly-form",
    label: "Yearly Form",
    icon: <FileText className="w-4 h-4" />,
    href: "/system-setting/yearly-form",
  },
  {
    id: "overtime-approval",
    label: "Overtime Approval",
    icon: <ClockIcon className="w-4 h-4" />,
    href: "/system-setting/overtime-approval",
  },
  {
    id: "overtime-policy",
    label: "Overtime Policy",
    icon: <Settings className="w-4 h-4" />,
    href: "/system-setting/overtime-policy",
  },
  {
    id: "overtime-settings",
    label: "Overtime Settings",
    icon: <BarChart3 className="w-4 h-4" />,
    href: "/system-setting/overtime-settings",
  },
];

// Initial leave policies data
const initialLeavePolicies = [
  { id: "annual", name: "Annual Leave", entitlement: "12 Day(s)", enabled: false },
  { id: "medical", name: "Medical Leave", entitlement: "90 Day(s)", enabled: false },
  { id: "compassionate-paternity", name: "Compassionate Leave - Paternity Leave", entitlement: "7 Day(s)", enabled: false },
  { id: "compassionate-maternity", name: "Compassionate Leave - Maternity Leave", entitlement: "98 Day(s)", enabled: false },
  { id: "compassionate-death", name: "Compassionate Leave - Death Of Family Member", entitlement: "3 Day(s)", enabled: false },
  { id: "sick-spouse", name: "Sick (Spouse, Child, Parent)", entitlement: "4 Day(s)", enabled: false },
  { id: "emergency", name: "Emergency Leave", entitlement: "5 Day(s)", enabled: false },
  { id: "unpaid", name: "Unpaid Leave", entitlement: "30 Day(s)", enabled: false },
  { id: "public-holiday", name: "Public Holiday", entitlement: "7 Day(s)", enabled: false },
  { id: "leave-in-lieu", name: "Leave in Lieu", entitlement: "14 Day(s)", enabled: false },
  { id: "exam", name: "Exam Leave", entitlement: "10 Day(s)", enabled: false },
  { id: "special-marriage", name: "Special Leave - Marriage Leave", entitlement: "3 Day(s)", enabled: false },
  { id: "special-umrah", name: "Special Leave - Umrah Leave", entitlement: "7 Day(s)", enabled: false },
  { id: "special-hajj", name: "Special Leave - Hajj Leave/ Others", entitlement: "30 Day(s)", enabled: false },
  { id: "carry-forward", name: "Carry Forward Leave", entitlement: "0 Day(s)", enabled: false },
  { id: "hospitalization", name: "Hospitalization Leave", entitlement: "60 Day(s)", enabled: false },
];

// Financial claim policies data
const financialClaimPolicies = [
  { id: "flight-tix", name: "Flight Tix", amount: "RM 100.00", enabled: true },
  { id: "parking", name: "Parking", amount: "RM 100.00", enabled: true },
  { id: "meal", name: "Meal", amount: "RM 100.00", enabled: true },
  { id: "hotel", name: "Hotel", amount: "RM 100.00", enabled: true },
  { id: "mileage", name: "Mileage (KM)", amount: "RM 100.00", enabled: true },
  { id: "medical", name: "Medical", amount: "RM 100.00", enabled: true },
  { id: "others", name: "Others/Misc", amount: "RM 100.00", enabled: true },
];

// Overtime policies data
const overtimePolicies = [
  { id: "normal-rate", name: "Normal Rate", rate: "1.5x of Salary", enabled: true },
  { id: "rest-day-rate", name: "Rest Day Rate", rate: "2.0x of Salary", enabled: true },
  { id: "public-holiday-rate", name: "Public Holiday Rate", rate: "3.0x of Salary", enabled: true },
];

export default function SystemSettingPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leave");
  const [claimActiveTab, setClaimActiveTab] = useState("financial");
  
  // Get real leave policies data from API
  const { data: companyLeaveTypes = [] } = useQuery({
    queryKey: ["/api/company-leave-types"]
  });

  // Get group policy settings for all leave types to calculate majority entitlement
  const { data: allGroupPolicySettings = [] } = useQuery({
    queryKey: ["/api/group-policy-settings"],
    enabled: true
  });

  // Overtime API queries
  const { data: overtimeApprovalSettings } = useQuery({
    queryKey: ["/api/overtime/approval-settings"]
  });

  const { data: overtimePolicyData = [] } = useQuery({
    queryKey: ["/api/overtime/policies"]
  });

  const { data: overtimeSettingsData } = useQuery({
    queryKey: ["/api/overtime/settings"]
  });

  // Overtime mutations
  const saveOvertimeApprovalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/overtime/approval-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime/approval-settings"] });
      toast({
        title: "Success",
        description: "Overtime approval settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save overtime approval settings",
        variant: "destructive",
      });
    }
  });

  const saveOvertimePolicyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/overtime/policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime/policies"] });
      toast({
        title: "Success",
        description: "Overtime policy updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update overtime policy",
        variant: "destructive",
      });
    }
  });

  const saveOvertimeSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/overtime/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime/settings"] });
      toast({
        title: "Success",
        description: "Overtime settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: "Failed to save overtime settings",
        variant: "destructive",
      });
    }
  });

  // Overtime policies state - moved from render function to top level
  const [localPolicies, setLocalPolicies] = useState<any[]>([]);

  useEffect(() => {
    if (overtimePolicyData && Array.isArray(overtimePolicyData) && overtimePolicyData.length > 0) {
      setLocalPolicies(overtimePolicyData);
    }
  }, [overtimePolicyData]);

  // Function to calculate majority entitlement for a leave type
  const calculateMajorityEntitlement = (leaveTypeId: string) => {
    if (!Array.isArray(allGroupPolicySettings) || !Array.isArray(companyLeaveTypes)) {
      return 0;
    }
    
    const policiesForThisType = allGroupPolicySettings.filter((policy: any) => 
      policy.leaveType === leaveTypeId && policy.enabled
    );
    
    if (policiesForThisType.length === 0) {
      // If no group policies set, return default from company leave type
      const companyType = companyLeaveTypes.find((ct: any) => ct.id === leaveTypeId);
      return companyType?.entitlementDays || 0;
    }
    
    // Count frequency of each entitlement day value
    const daysCounts: { [key: number]: number } = {};
    policiesForThisType.forEach((policy: any) => {
      const days = policy.entitlementDays || 0;
      daysCounts[days] = (daysCounts[days] || 0) + 1;
    });
    
    // Find the most frequent value (majority)
    let maxCount = 0;
    let majorityDays = 0;
    for (const [days, count] of Object.entries(daysCounts)) {
      if (count > maxCount) {
        maxCount = count;
        majorityDays = parseInt(days);
      }
    }
    
    return majorityDays;
  };

  // Transform real data to match our UI format with majority-based entitlement
  const leavePolicies = Array.isArray(companyLeaveTypes) ? companyLeaveTypes.map((leaveType: any) => ({
    id: leaveType.id,
    name: leaveType.leaveType,
    entitlement: `${calculateMajorityEntitlement(leaveType.id)} Day(s)`,
    enabled: leaveType.enabled || false
  })) : [];
  
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
  
  const [showCreatePolicyDialog, setShowCreatePolicyDialog] = useState(false);
  const [policyType, setPolicyType] = useState<"financial" | "overtime">("financial");
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [expandedFinancialPolicyId, setExpandedFinancialPolicyId] = useState<string | null>(null);
  const [excludedFinancialEmployees, setExcludedFinancialEmployees] = useState<string[]>([]);
  
  // Financial Policy State
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

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Group Policy settings state
  const [groupPolicySettings, setGroupPolicySettings] = useState({
    "Super Admin": { selected: false, days: "12" },
    "Admin": { selected: false, days: "12" },
    "HR Manager": { selected: false, days: "12" },
    "PIC": { selected: false, days: "12" },
    "Manager/Supervisor": { selected: false, days: "12" },
    "Employee": { selected: false, days: "12" }
  });
  
  // Exclude Employee state
  const [excludedEmployees, setExcludedEmployees] = useState<string[]>([]);
  const [newPolicyForm, setNewPolicyForm] = useState({
    claimName: "",
    mileageBased: false,
    annualLimit: "",
    limitUnlimited: true,
    limitPerApplication: "",
    limitPerAppUnlimited: true,
    excludeEmployee: "",
    claimRemark: "",
    // Overtime specific fields
    overtimeName: "",
    deductionType: "",
    overtimeRate: "",
    includedEmployee: "",
    remark: "",
  });

  // Department states
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [newDepartmentForm, setNewDepartmentForm] = useState({
    name: "",
    code: "",
  });
  const [departments, setDepartments] = useState([
    {
      id: 1,
      name: "Human Resource",
      code: "HR",
      employeeCount: 2,
    },
    {
      id: 2,
      name: "Information Technology",
      code: "IT",
      employeeCount: 5,
    },
    {
      id: 3,
      name: "Finance & Accounting",
      code: "FA",
      employeeCount: 3,
    },
    {
      id: 4,
      name: "Marketing",
      code: "MKT",
      employeeCount: 4,
    },
  ]);

  // Payment states
  const [paymentSettings, setPaymentSettings] = useState({
    currency: "RM",
    hrdfContribution: "choose",
    standardWorkingHour: "8",
    // Statutory Contributions Control
    epfEnabled: true,
    socsoEnabled: true,
    eisEnabled: true,
    hrdfEnabled: false,
    pcb39Enabled: true,
  });
  
  const [paymentApproval, setPaymentApproval] = useState({
    enableApproval: true,
    approvalLevel: "Second Level",
    firstLevel: "",
    secondLevel: "",
  });

  const [unpaidLeaveSettings, setUnpaidLeaveSettings] = useState({
    countIntoPayroll: true,
    wageCalculation: "Basic Salary",
    cutoffDate: "31",
    countMode: "Default",
  });

  const [claimSettings, setClaimSettings] = useState({
    enableClaim: true,
    choosePayment: "Payroll",
    cutoffDate: "31",
  });

  const [overtimeSettings2, setOvertimeSettings2] = useState({
    enableOvertime: true,
    choosePayment: "Payroll",
    wageCalculation: "Basic Salary",
    cutoffDate: "31",
    compensationRounded: "No Round",
    workingDaysInMonth: "26",
  });

  const [latenessSettings, setLatenessSettings] = useState({
    countIntoPayroll: false,
  });

  const [payslipSettings, setPayslipSettings] = useState({
    template: "Template One",
    showOvertimeDetails: true,
    showUnpaidLeaveDetails: true,
    showEPFDetails: false,
    showHRDFDetails: false,
    showYearToDateDetails: true,
  });

  // Notification states
  const [notificationSettings, setNotificationSettings] = useState({
    topBarNotification: true,
    userEmailNotification: true,
    leaveEmailNotification: true,
    claimEmailNotification: true,
    payrollEmailNotification: true,
  });

  // Attendance states
  const [attendanceSettings, setAttendanceSettings] = useState({
    reminderTime: "Before (Default)",
    reminderMinutes: "15",
  });

  const [shifts, setShifts] = useState([
    {
      id: 1,
      name: "Default Shift",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      description: "No description available.",
      clockIn: "08:30 AM",
      clockOut: "05:30 PM",
    }
  ]);



  // Dialog states
  const [showCreateLocationDialog, setShowCreateLocationDialog] = useState(false);
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false);
  const [showAssignShiftDialog, setShowAssignShiftDialog] = useState(false);
  const [showUpdateShiftDialog, setShowUpdateShiftDialog] = useState(false);
  const [showCreateShiftDialog, setShowCreateShiftDialog] = useState(false);

  // Location form state
  const [newLocationForm, setNewLocationForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: "50", // Default 50 meters
    useGPS: false,
    isActive: "true"
  });

  // Edit location state
  const [currentEditLocation, setCurrentEditLocation] = useState<any>(null);
  const [editLocationForm, setEditLocationForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: "50",
    useGPS: false,
    isActive: "true"
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Office locations state with React Query
  const { data: officeLocations = [], refetch: refetchLocations } = useQuery({
    queryKey: ["/api/office-locations"],
    enabled: true
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: typeof newLocationForm) => {
      const response = await apiRequest("POST", "/api/office-locations", {
        name: locationData.name,
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: locationData.radius,
        isActive: locationData.isActive
      });
      return response.json();
    },
    onSuccess: () => {
      refetchLocations();
      setShowCreateLocationDialog(false);
      setNewLocationForm({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: "50",
        useGPS: false,
        isActive: "true"
      });
    },
    onError: (error: Error) => {
      console.error("Create location error:", error);
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: typeof editLocationForm & { id: string }) => {
      const response = await apiRequest("PUT", `/api/office-locations/${locationData.id}`, {
        name: locationData.name,
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: locationData.radius,
        isActive: locationData.isActive
      });
      return response.json();
    },
    onSuccess: () => {
      refetchLocations();
      setShowEditLocationDialog(false);
      setCurrentEditLocation(null);
      setEditLocationForm({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: "50",
        useGPS: false,
        isActive: "true"
      });
    },
    onError: (error: Error) => {
      console.error("Update location error:", error);
    }
  });

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS tidak disokong oleh pelayar ini");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewLocationForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("GPS error:", error);
        alert("Gagal mendapatkan lokasi GPS");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Get GPS location for edit form
  const getCurrentLocationForEdit = () => {
    if (!navigator.geolocation) {
      alert("GPS tidak disokong oleh pelayar ini");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditLocationForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("GPS error:", error);
        alert("Gagal mendapatkan lokasi GPS");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Handle opening edit location dialog
  const handleEditLocation = (location: any) => {
    setCurrentEditLocation(location);
    setEditLocationForm({
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius,
      useGPS: false,
      isActive: location.isActive
    });
    setShowEditLocationDialog(true);
  };

  // Shift form state
  const [shiftForm, setShiftForm] = useState({
    name: "",
    description: "",
    clockIn: "08:30",
    clockOut: "17:30",
    enableOverwriteSetting: false,
    enableClockInOutSelfie: false,
    enableEarlyLateIndicator: false,
    displayAttendanceConfirmation: false,
    enableAutoClockOut: false,
    workdays: {
      Sunday: "Off Day",
      Monday: "Full Day", 
      Tuesday: "Full Day",
      Wednesday: "Full Day",
      Thursday: "Full Day",
      Friday: "Full Day",
      Saturday: "Half Day",
    },
    enableGeofencingLocation: false,
    enableBreakTime: false,
    enableOvertimeCalculation: false,
    enableLatenessCalculation: false,
  });

  // Assign shift state
  const [assignShiftTab, setAssignShiftTab] = useState("role");
  const [assignShiftData, setAssignShiftData] = useState([
    { id: 1, role: "Human Resource", clockIn: "08:30 AM", clockOut: "05:30 PM" },
    { id: 2, role: "Employee", clockIn: "08:30 AM", clockOut: "05:30 PM" },
  ]);

  // Yearly Form state
  const [yearlyFormSettings, setYearlyFormSettings] = useState({
    eaPersonInCharge: "",
  });

  // Mock employee data for EA Person In Charge dropdown
  const [employees, setEmployees] = useState([
    { id: 1, name: "Ahmad Hassan", position: "HR Manager" },
    { id: 2, name: "Siti Nurhaliza", position: "Accountant" },
    { id: 3, name: "Muhammad Ali", position: "Finance Manager" },
    { id: 4, name: "Fatimah Abdullah", position: "Admin Officer" },
    { id: 5, name: "Azmi Rahman", position: "HR Executive" },
  ]);

  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyData, setCompanyData] = useState({
    companyName: "utama hr",
    companyShortName: "KLINIK UTAMA 24 JAM",
    companyRegNo: "KLINIK UTAMA 24 JAM",
    companyType: "",
    industry: "Automotive",
    companyEmail: "syedmuhyazir.admin@klinikutama24jam.com",
    companyPhone: "0199076434",
    companyFax: "Fax",
    streetAddress: "Lot 5138S-A, Lorong 1g Mohd Amin, Jln Wan Hassan, Kg Batu 4",
    state: "Selangor", 
    city: "Bandar Baru Bangi",
    postcode: "43650",
    country: "Malaysia",
    logoUrl: null,
    bankName: "",
    bankAccountNo: "Bank Account No",
    epfNo: "EPF No",
    socsoNo: "SOCSO No",
    incomeTaxNo: "Income Tax No",
    employerNo: "Employer No",
    lhdnBranch: "LHDN Branch",
    originatorId: "Originator ID",
    zakatNo: "Zakat No",
    cNumber: "C-Number"
  });

  // Stable calculation of current section to prevent hooks order issues
  const currentSection = useMemo(() => {
    if (location === "/system-setting" || location === "/system-setting/company") {
      return "company";
    }
    return location.split("/").pop() || "company";
  }, [location]);

  // Load active leave policies from database to check which ones are enabled
  const { data: activeLeaveTypesFromDB = [] } = useQuery<string[]>({
    queryKey: ["/api/active-leave-policies"],
    enabled: true // Always enabled to prevent hooks order issues
  });

  // Fetch employees with approval roles (Super Admin, Admin, HR Manager, PIC)
  const { data: approvalEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees/approval-roles"],
    enabled: true
  });

  // Get all employees for exclude selection
  const { data: allEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: true
  });

  // Fetch financial claim policies from database
  const { data: financialClaimPoliciesData } = useQuery({
    queryKey: ["/api/financial-claim-policies"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create financial policy mutation
  const createFinancialPolicyMutation = useMutation({
    mutationFn: async (data: InsertFinancialClaimPolicy) => {
      return await apiRequest("POST", "/api/financial-claim-policies", data);
    },
    onSuccess: () => {
      toast({
        title: "Polisi claim disimpan",
        description: "Polisi claim kewangan berjaya disimpan.",
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

  // Update financial policy mutation
  const updateFinancialPolicyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertFinancialClaimPolicy> }) => {
      return await apiRequest("PUT", `/api/financial-claim-policies/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Polisi claim dikemaskini", 
        description: "Polisi claim kewangan berjaya dikemaskini.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-claim-policies"] });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini polisi claim. Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });

  // Delete financial policy mutation
  const deleteFinancialPolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🔥 Starting delete mutation for ID:', id);
      try {
        const result = await apiRequest("DELETE", `/api/financial-claim-policies/${id}`);
        console.log('✅ Delete API call successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Delete API call failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 Delete mutation successful:', data);
      toast({
        title: "Polisi claim dipadam",
        description: "Polisi claim kewangan berjaya dipadam dari sistem.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-claim-policies"] });
      // Close expanded policy if it was deleted
      setExpandedFinancialPolicyId(null);
      // Clean up form data for deleted policy
      setFinancialPolicyForm(prev => {
        const newForm = { ...prev };
        Object.keys(newForm).forEach(key => {
          if (key === data?.id || key === arguments[0]) {
            delete newForm[key];
          }
        });
        return newForm;
      });
    },
    onError: (error) => {
      console.error('💥 Delete mutation error:', error);
      toast({
        title: "Ralat",
        description: `Gagal memadamkan polisi claim: ${error.message || 'Sila cuba lagi'}`,
        variant: "destructive",
      });
    },
  });

  // Fetch leave policy settings for current expanded policy
  const { data: currentLeavePolicySettings } = useQuery({
    queryKey: ["/api/leave-policy-settings", expandedPolicyId],
    enabled: true // Always enabled to prevent hooks order issues
  });

  // Fetch current leave approval settings
  const { data: currentLeaveSettings } = useQuery({
    queryKey: ["/api/approval-settings/leave"],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch current financial approval settings
  const { data: currentFinancialSettings } = useQuery({
    queryKey: ["/api/approval-settings/financial"],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Sync financial approval state with API data
  useEffect(() => {
    if (currentFinancialSettings && typeof currentFinancialSettings === 'object' && 'firstLevelApprovalId' in currentFinancialSettings) {
      const settings = currentFinancialSettings as any;
      setFinancialApproval({
        firstLevel: settings.firstLevelApprovalId || "",
        secondLevel: settings.secondLevelApprovalId || "none",
      });
    }
  }, [currentFinancialSettings]);

  const { data: currentPaymentSettings } = useQuery({
    queryKey: ["/api/approval-settings/payment"],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch current company settings (currency and statutory contributions)
  const { data: currentCompanySettings } = useQuery({
    queryKey: ["/api/company-settings"],
    staleTime: 30000, // Cache for 30 seconds
  });

  // Sync payment approval state with API data
  useEffect(() => {
    if (currentPaymentSettings && typeof currentPaymentSettings === 'object') {
      const settings = currentPaymentSettings as any;
      setPaymentApproval({
        enableApproval: settings.enableApproval !== undefined ? settings.enableApproval : true,
        approvalLevel: settings.approvalLevel || "First Level",
        firstLevel: settings.firstLevelApprovalId || "",
        secondLevel: settings.secondLevelApprovalId || "",
      });
    }
  }, [currentPaymentSettings]);

  // Note: No need for useEffect to sync data since we're using live API data directly for leave settings

  // Load existing group policy settings when a policy is expanded
  useEffect(() => {
    if (expandedPolicyId) {
      const loadGroupPolicySettings = async () => {
        try {
          const token = localStorage.getItem("utamahr_token");
          if (!token) return;

          const response = await fetch(`/api/group-policy-settings/${encodeURIComponent(expandedPolicyId)}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const existingSettings = await response.json();
            
            // Reset all roles to false first
            setGroupPolicySettings(prev => {
              const resetSettings = Object.keys(prev).reduce((acc, role) => {
                acc[role] = { selected: false, days: prev[role].days };
                return acc;
              }, {} as typeof prev);
              
              // Then set existing settings to true with their entitlement days
              existingSettings.forEach((setting: any) => {
                if (resetSettings[setting.role]) {
                  resetSettings[setting.role] = {
                    selected: true,
                    days: setting.entitlementDays.toString()
                  };
                }
              });
              
              return resetSettings;
            });
            
            console.log(`📥 Memuat tetapan group policy untuk ${expandedPolicyId}:`, existingSettings);
          }
        } catch (error) {
          console.error("Error loading group policy settings:", error);
        }
      };

      loadGroupPolicySettings();
    } else {
      // Reset all selections when no policy is expanded
      setGroupPolicySettings(prev => {
        const resetSettings = Object.keys(prev).reduce((acc, role) => {
          acc[role] = { selected: false, days: prev[role].days };
          return acc;
        }, {} as typeof prev);
        return resetSettings;
      });
    }
  }, [expandedPolicyId]);

  // Logo upload functions
  const handleLogoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ralat",
          description: "Sila pilih fail imej yang sah (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ralat", 
          description: "Saiz fail terlalu besar. Maksimum 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogoToServer = async (file: File): Promise<string> => {
    try {
      setIsUploadingLogo(true);
      
      // Get upload URL from server
      const token = localStorage.getItem("utamahr_token");
      if (!token) {
        throw new Error("Token tidak dijumpai. Sila log masuk semula.");
      }

      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Gagal mendapatkan URL upload");
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file directly to object storage
      const fileUpload = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!fileUpload.ok) {
        throw new Error("Gagal memuat naik fail");
      }

      // Update logo ACL and get normalized path
      const updateResponse = await fetch("/api/company-logo", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          logoURL: uploadURL,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Gagal menyimpan maklumat logo");
      }

      const { objectPath } = await updateResponse.json();
      return objectPath;

    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Company settings mutation
  const updateCompanySettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("utamahr_token");
      if (!token) {
        throw new Error("Token tidak dijumpai. Sila log masuk semula.");
      }

      const response = await fetch("/api/company-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan maklumat syarikat");
      }

      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Berjaya!",
        description: "Maklumat syarikat telah disimpan dengan berjaya",
      });
      console.log("Data yang disimpan:", response);
      
      // Refresh company settings query
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menyimpan maklumat syarikat",
        variant: "destructive",
      });
    }
  });

  // Load existing company settings
  const { data: existingCompanySettings } = useQuery({
    queryKey: ["/api/company-settings"],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Update state when data changes (replaces deprecated onSuccess)
  useEffect(() => {
    if (existingCompanySettings) {
      // Update companyData state with real data from database
      setCompanyData({
        companyName: existingCompanySettings.companyName || "",
        companyShortName: existingCompanySettings.companyShortName || "",
        companyRegNo: existingCompanySettings.companyRegistrationNumber || "",
        companyType: existingCompanySettings.companyType || "",
        industry: existingCompanySettings.industry || "",
        companyEmail: existingCompanySettings.email || "",
        companyPhone: existingCompanySettings.phoneNumber || "",
        companyFax: existingCompanySettings.faxNumber || "",
        streetAddress: existingCompanySettings.address || "",
        state: existingCompanySettings.state || "",
        city: existingCompanySettings.city || "",
        postcode: existingCompanySettings.postcode || "",
        country: existingCompanySettings.country || "",
        logoUrl: existingCompanySettings.logoUrl || null,
        bankName: existingCompanySettings.bankName || "",
        bankAccountNo: existingCompanySettings.bankAccountNumber || "",
        epfNo: existingCompanySettings.epfNumber || "",
        socsoNo: existingCompanySettings.socsoNumber || "",
        incomeTaxNo: existingCompanySettings.incomeTaxNumber || "",
        employerNo: existingCompanySettings.employerNumber || "",
        lhdnBranch: existingCompanySettings.lhdnBranch || "",
        originatorId: existingCompanySettings.originatorId || "",
        zakatNo: existingCompanySettings.zakatNumber || "",
        cNumber: existingCompanySettings.cNumber || ""
      });
    }
  }, [existingCompanySettings]);

  const handleUpdate = async () => {
    try {
      let logoPath = companyData.logoUrl;

      // Upload logo first if there's a new file
      if (logoFile) {
        toast({
          title: "Memuat naik logo...",
          description: "Sila tunggu sementara logo sedang dimuat naik",
        });
        
        logoPath = await uploadLogoToServer(logoFile);
        
        // Update companyData with new logo path
        setCompanyData(prev => ({
          ...prev,
          logoUrl: logoPath
        }));
      }

      // Map frontend state to backend schema
      const companySettingsData = {
        companyName: companyData.companyName,
        companyShortName: companyData.companyShortName,
        companyRegistrationNumber: companyData.companyRegNo,
        companyType: companyData.companyType,
        industry: companyData.industry,
        email: companyData.companyEmail,
        phoneNumber: companyData.companyPhone,
        faxNumber: companyData.companyFax,
        address: companyData.streetAddress,
        city: companyData.city,
        postcode: companyData.postcode,
        state: companyData.state,
        country: companyData.country,
        logoUrl: logoPath,
        bankName: companyData.bankName,
        bankAccountNumber: companyData.bankAccountNo,
        epfNumber: companyData.epfNo,
        socsoNumber: companyData.socsoNo,
        incomeTaxNumber: companyData.incomeTaxNo,
        employerNumber: companyData.employerNo,
        lhdnBranch: companyData.lhdnBranch,
        originatorId: companyData.originatorId,
        zakatNumber: companyData.zakatNo,
        cNumber: companyData.cNumber
      };

      console.log("Saving company settings:", companySettingsData);
      updateCompanySettingsMutation.mutate(companySettingsData);

      // Clear uploaded file after successful save
      if (logoFile) {
        setLogoFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

    } catch (error) {
      toast({
        title: "Ralat",
        description: error instanceof Error ? error.message : "Gagal memuat naik logo",
        variant: "destructive",
      });
    }
  };

  const handleSaveLeaveApproval = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      console.log("Token from localStorage:", token);
      
      if (!token) {
        alert("Sila log masuk semula.");
        return;
      }

      console.log("Sending request with data:", {
        type: "leave",
        firstLevelApprovalId: leaveApproval.firstLevel,
        secondLevelApprovalId: leaveApproval.secondLevel,
      });

      const response = await fetch("/api/approval-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "leave",
          firstLevelApprovalId: leaveApproval.firstLevel,
          secondLevelApprovalId: leaveApproval.secondLevel,
        }),
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Success result:", result);
        alert("Tetapan kelulusan cuti berjaya disimpan!");
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save approval settings");
      }
    } catch (error) {
      console.error("Error saving leave approval:", error);
      alert(`Gagal menyimpan tetapan kelulusan cuti: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveFinancialApproval = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      
      if (!token) {
        alert("Sila log masuk semula.");
        return;
      }

      const response = await fetch("/api/approval-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "financial",
          firstLevelApprovalId: financialApproval.firstLevel,
          secondLevelApprovalId: financialApproval.secondLevel === "none" ? null : financialApproval.secondLevel,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Financial approval settings saved:", result);
        alert("Tetapan kelulusan kewangan berjaya disimpan!");
        queryClient.invalidateQueries({ queryKey: ["/api/approval-settings/financial"] });
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save financial approval settings");
      }
    } catch (error) {
      console.error("Error saving financial approval:", error);
      alert(`Gagal menyimpan tetapan kelulusan kewangan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSavePaymentApproval = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      
      if (!token) {
        alert("Sila log masuk semula.");
        return;
      }

      const response = await fetch("/api/approval-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "payment",
          enableApproval: paymentApproval.enableApproval,
          approvalLevel: paymentApproval.approvalLevel,
          firstLevelApprovalId: paymentApproval.firstLevel,
          secondLevelApprovalId: paymentApproval.approvalLevel === "Second Level" && paymentApproval.secondLevel !== "" ? paymentApproval.secondLevel : null,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Payment approval settings saved:", result);
        alert("Tetapan kelulusan bayaran berjaya disimpan!");
        queryClient.invalidateQueries({ queryKey: ["/api/approval-settings/payment"] });
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save payment approval settings");
      }
    } catch (error) {
      console.error("Error saving payment approval:", error);
      alert(`Gagal menyimpan tetapan kelulusan bayaran: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle saving payment settings (currency and statutory controls)
  const handleSavePaymentSettings = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      
      if (!token) {
        toast({
          title: "Error",
          description: "Sila log masuk semula.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/company-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(paymentSettings),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Payment settings saved:", result);
        // Create dynamic success message based on changes
        const currencyChanged = paymentSettings.currency !== (currentCompanySettings?.currency || 'RM');
        const contributionsChanged = Object.keys(paymentSettings).some(key => 
          key.endsWith('Enabled') && paymentSettings[key] !== currentCompanySettings?.[key]
        );
        
        let successMessage = "Tetapan pembayaran telah berjaya disimpan!";
        
        if (currencyChanged) {
          successMessage += ` Mata wang dikemas kini kepada ${paymentSettings.currency} - perubahan ini mempengaruhi seluruh sistem termasuk Master Salary, Payroll, dan semua modul kewangan.`;
        }
        
        if (contributionsChanged) {
          const enabledContributions = [];
          if (paymentSettings.epfEnabled) enabledContributions.push("EPF");
          if (paymentSettings.socsoEnabled) enabledContributions.push("SOCSO");
          if (paymentSettings.eisEnabled) enabledContributions.push("EIS");
          if (paymentSettings.hrdfEnabled) enabledContributions.push("HRDF");
          if (paymentSettings.pcb39Enabled) enabledContributions.push("PCB39");
          
          if (enabledContributions.length > 0) {
            successMessage += ` Caruman berkanun diaktifkan: ${enabledContributions.join(", ")}.`;
          }
        }
        
        toast({
          title: "Berjaya",
          description: successMessage,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save payment settings");
      }
    } catch (error) {
      console.error("Error saving payment settings:", error);
      toast({
        title: "Ralat",
        description: `Gagal menyimpan tetapan pembayaran: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveOvertimeApproval = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      
      if (!token) {
        alert("Sila log masuk semula.");
        return;
      }

      const response = await fetch("/api/overtime/approval-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstLevel: overtimeApproval.firstLevel,
          secondLevel: overtimeApproval.secondLevel === "none" ? null : overtimeApproval.secondLevel,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Overtime approval settings saved:", result);
        alert("Tetapan kelulusan lebih masa berjaya disimpan!");
        queryClient.invalidateQueries({ queryKey: ["/api/overtime/approval-settings"] });
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save overtime approval settings");
      }
    } catch (error) {
      console.error("Error saving overtime approval:", error);
      alert(`Gagal menyimpan tetapan kelulusan lebih masa: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveOvertimeSettings = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      
      if (!token) {
        alert("Sila log masuk semula.");
        return;
      }

      const response = await fetch("/api/overtime/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(overtimeSettings),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Overtime settings saved:", result);
        alert("Tetapan lebih masa berjaya disimpan!");
        queryClient.invalidateQueries({ queryKey: ["/api/overtime/settings"] });
      } else {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save overtime settings");
      }
    } catch (error) {
      console.error("Error saving overtime settings:", error);
      alert(`Gagal menyimpan tetapan lebih masa: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handler untuk toggle leave policy switch
  // Create mutation for updating company leave types
  const updateLeaveTypeMutation = useMutation({
    mutationFn: ({ leaveType, enabled }: { leaveType: string, enabled: boolean }) => 
      apiRequest("PATCH", `/api/company-leave-types/${encodeURIComponent(leaveType)}/toggle`, { enabled }),
    onSuccess: () => {
      // Refresh data after successful update to recalculate majority entitlement
      queryClient.invalidateQueries({ queryKey: ["/api/company-leave-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/group-policy-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/active-leave-policies"] });
    },
    onError: (error) => {
      console.error("Error updating leave type:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update leave policy. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Create mutation for updating leave policy settings
  const updateLeavePolicySettingMutation = useMutation({
    mutationFn: ({ leaveType, field, value }: { leaveType: string, field: string, value: any }) => 
      apiRequest("PATCH", `/api/leave-policy-settings/${encodeURIComponent(leaveType)}`, { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policy-settings", expandedPolicyId] });
    },
    onError: (error) => {
      console.error("Gagal mengemas kini tetapan polisi cuti:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update leave policy setting. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleToggleLeavePolicy = async (policyId: string, enabled: boolean) => {
    try {
      // Find the policy to get the leave type name
      const selectedPolicy = leavePolicies.find(p => p.id === policyId);
      if (!selectedPolicy) {
        throw new Error("Policy not found");
      }
      
      console.log(`🔄 Toggle leave policy ${selectedPolicy.name} to ${enabled}`);
      
      // Update company leave type enabled status using the name as leaveType parameter
      updateLeaveTypeMutation.mutate({ leaveType: selectedPolicy.name, enabled });
      
      // Show feedback to user
      toast({
        title: enabled ? "✅ Leave Policy Enabled" : "❌ Leave Policy Disabled",
        description: `Leave policy has been ${enabled ? 'activated' : 'deactivated'} successfully.`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Error toggling leave policy:", error);
    }
  };

  const handleToggleExpand = (policyId: string) => {
    setExpandedPolicyId(expandedPolicyId === policyId ? null : policyId);
  };

  const handleToggleFinancialExpand = (policyId: string) => {
    const newExpandedId = expandedFinancialPolicyId === policyId ? null : policyId;
    setExpandedFinancialPolicyId(newExpandedId);
    
    // Initialize form data when expanding a policy
    if (newExpandedId && !financialPolicyForm[policyId]) {
      const policy = financialClaimPoliciesData?.find((p: FinancialClaimPolicy) => p.id === policyId) ||
                   financialClaimPolicies.find(p => p.id === policyId);
      
      if (policy) {
        setFinancialPolicyForm(prev => ({
          ...prev,
          [policyId]: {
            claimName: policy.claimName || policy.name,
            annualLimit: policy.annualLimit || "100",
            annualLimitUnlimited: policy.annualLimitUnlimited || false,
            limitPerApplication: policy.limitPerApplication || "50", 
            limitPerApplicationUnlimited: policy.limitPerApplicationUnlimited || false,
            excludedEmployeeIds: policy.excludedEmployeeIds || [],
            claimRemark: policy.claimRemark || "",
          },
        }));
      }
    }
  };

;

  const handleGroupPolicyToggle = async (roleName: keyof typeof groupPolicySettings) => {
    const currentPolicy = groupPolicySettings[roleName];
    const willBeSelected = !currentPolicy.selected;
    
    // Update local state first
    setGroupPolicySettings(prev => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        selected: willBeSelected
      }
    }));
    
    // If toggling ON, save to database to grant entitlement
    if (willBeSelected && expandedPolicyId) {
      try {
        const token = localStorage.getItem("utamahr_token");
        if (!token) {
          alert("Sila log masuk semula.");
          return;
        }

        const response = await fetch("/api/group-policy-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            leaveType: expandedPolicyId,
            role: roleName,
            entitlementDays: parseInt(currentPolicy.days) || 0,
            enabled: true
          }),
        });
        
        if (response.ok) {
          console.log(`✅ Role ${roleName} diberi kelayakan ${currentPolicy.days} hari untuk ${expandedPolicyId}`);
          // Invalidate cache untuk memastikan data sentiasa terkini dan recalculate majority
          queryClient.invalidateQueries({ queryKey: [`/api/group-policy-settings/${expandedPolicyId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/group-policy-settings"] });
          queryClient.invalidateQueries({ queryKey: ["/api/company-leave-types"] });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal menyimpan tetapan dasar kumpulan");
        }
      } catch (error) {
        console.error("Error saving group policy:", error);
        alert("Gagal menyimpan tetapan. Sila cuba lagi.");
        // Revert state on error
        setGroupPolicySettings(prev => ({
          ...prev,
          [roleName]: {
            ...prev[roleName],
            selected: !willBeSelected
          }
        }));
      }
    } 
    // If toggling OFF, remove from database 
    else if (!willBeSelected && expandedPolicyId) {
      try {
        const token = localStorage.getItem("utamahr_token");
        if (!token) {
          alert("Sila log masuk semula.");
          return;
        }

        const response = await fetch(`/api/group-policy-settings/${encodeURIComponent(expandedPolicyId)}/${encodeURIComponent(roleName)}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          console.log(`❌ Role ${roleName} dikeluarkan dari kelayakan ${expandedPolicyId}`);
          // Invalidate cache untuk memastikan data sentiasa terkini dan recalculate majority
          queryClient.invalidateQueries({ queryKey: [`/api/group-policy-settings/${expandedPolicyId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/group-policy-settings"] });
          queryClient.invalidateQueries({ queryKey: ["/api/company-leave-types"] });
        } else {
          console.error("Gagal mengeluarkan tetapan dasar kumpulan");
        }
      } catch (error) {
        console.error("Error removing group policy:", error);
      }
    }
  };

  const handleGroupPolicyDaysChange = async (roleName: keyof typeof groupPolicySettings, newDays: string) => {
    const currentPolicy = groupPolicySettings[roleName];
    
    // Update local state first
    setGroupPolicySettings(prev => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        days: newDays
      }
    }));
    
    // If the role is already selected/enabled and we have a leave type, update the database
    if (currentPolicy.selected && expandedPolicyId) {
      try {
        const token = localStorage.getItem("utamahr_token");
        if (!token) {
          alert("Sila log masuk semula.");
          return;
        }

        const response = await fetch("/api/group-policy-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            leaveType: expandedPolicyId,
            role: roleName,
            entitlementDays: parseInt(newDays) || 0,
            enabled: true
          }),
        });
        
        if (response.ok) {
          console.log(`📝 Role ${roleName} kelayakan dikemaskini kepada ${newDays} hari untuk ${expandedPolicyId}`);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal mengemas kini tetapan dasar kumpulan");
        }
      } catch (error) {
        console.error("Error updating group policy days:", error);
        // Note: We don't revert here as user may still be typing
      }
    }
  };

  const handleSaveTimeoffApproval = async () => {
    try {
      const token = localStorage.getItem("utamahr_token");
      if (!token) {
        alert("Sila log masuk semula.");
        return;
      }

      const response = await fetch("/api/approval-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "timeoff",
          firstLevelApprovalId: timeoffApproval.firstLevel,
          secondLevelApprovalId: timeoffApproval.secondLevel,
        }),
      });
      
      if (response.ok) {
        console.log("Timeoff approval settings saved successfully");
        alert("Tetapan kelulusan timeoff berjaya disimpan!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save approval settings");
      }
    } catch (error) {
      console.error("Error saving timeoff approval:", error);
      alert("Gagal menyimpan tetapan kelulusan timeoff. Sila cuba lagi.");
    }
  };

  const handleSaveTimeoffSettings = () => {
    console.log("Save timeoff settings:", timeoffSettings);
  };



  const handleSaveFinancialSettings = async () => {
    console.log("Save financial settings:", financialSettings);
    
    try {
      const token = localStorage.getItem("utamahr_token");
      const response = await fetch("/api/financial-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          cutoffDate: parseInt(financialSettings.cutoffDate)
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Tetapan kewangan disimpan",
          description: `Tarikh tutup claim ditetapkan pada hari ke-${financialSettings.cutoffDate} setiap bulan.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save financial settings");
      }
    } catch (error) {
      console.error("Error saving financial settings:", error);
      toast({
        title: "Ralat",
        description: "Gagal menyimpan tetapan kewangan. Sila cuba lagi.",
        variant: "destructive",
      });
    }
  };



  // Handler untuk save changes
  const handleSaveFinancialPolicy = async (policyId: string) => {
    const policyData = financialPolicyForm[policyId];
    if (!policyData) return;

    const dataToSave: InsertFinancialClaimPolicy = {
      claimName: policyData.claimName,
      annualLimit: policyData.annualLimitUnlimited ? null : policyData.annualLimit,
      annualLimitUnlimited: policyData.annualLimitUnlimited,
      limitPerApplication: policyData.limitPerApplicationUnlimited ? null : policyData.limitPerApplication,
      limitPerApplicationUnlimited: policyData.limitPerApplicationUnlimited,
      excludedEmployeeIds: policyData.excludedEmployeeIds,
      claimRemark: policyData.claimRemark,
    };

    // Check if policy exists in database
    const existingPolicy = financialClaimPoliciesData?.find(
      (p: FinancialClaimPolicy) => p.id === policyId
    );

    if (existingPolicy) {
      updateFinancialPolicyMutation.mutate({ id: policyId, data: dataToSave });
    } else {
      createFinancialPolicyMutation.mutate(dataToSave);
    }
  };

  // Delete financial policy handler
  const handleDeleteFinancialPolicy = async (policyId: string) => {
    console.log('🗑️ Delete button clicked for policy:', policyId);
    
    // Get policy data from either form or API data
    const formData = financialPolicyForm[policyId];
    const existingPolicy = financialClaimPoliciesData?.find(
      (p: FinancialClaimPolicy) => p.id === policyId
    );
    
    console.log('Form data:', formData);
    console.log('Existing policy:', existingPolicy);
    
    const policyName = formData?.claimName || existingPolicy?.claimName || 'polisi ini';

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Adakah anda pasti untuk memadamkan polisi "${policyName}"? Tindakan ini tidak boleh dibatalkan.`
    );

    if (confirmed) {
      console.log('User confirmed deletion, calling mutation...');
      deleteFinancialPolicyMutation.mutate(policyId);
    } else {
      console.log('User cancelled deletion');
    }
  };

  // Handler untuk cancel changes
  const handleCancelFinancialPolicy = (policyId: string) => {
    // Reset form untuk policy ini ke nilai asal atau kosong
    const existingPolicy = financialClaimPoliciesData?.find(
      (p: FinancialClaimPolicy) => p.id === policyId
    );

    if (existingPolicy) {
      setFinancialPolicyForm(prev => ({
        ...prev,
        [policyId]: {
          claimName: existingPolicy.claimName,
          annualLimit: existingPolicy.annualLimit || "0",
          annualLimitUnlimited: existingPolicy.annualLimitUnlimited || false,
          limitPerApplication: existingPolicy.limitPerApplication || "0",
          limitPerApplicationUnlimited: existingPolicy.limitPerApplicationUnlimited || false,
          excludedEmployeeIds: existingPolicy.excludedEmployeeIds || [],
          claimRemark: existingPolicy.claimRemark || "",
        },
      }));
    } else {
      // Jika policy baru, reset ke default values
      setFinancialPolicyForm(prev => {
        const newForm = { ...prev };
        delete newForm[policyId];
        return newForm;
      });
    }
    setHasUnsavedChanges(false);
  };

  // Handler untuk update form field
  const updateFinancialPolicyField = (
    policyId: string,
    field: string,
    value: any
  ) => {
    setFinancialPolicyForm(prev => ({
      ...prev,
      [policyId]: {
        ...prev[policyId],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleOpenCreatePolicyDialog = (type: "financial" | "overtime") => {
    setPolicyType(type);
    setNewPolicyForm({
      claimName: "",
      mileageBased: false,
      annualLimit: "",
      limitUnlimited: true,
      limitPerApplication: "",
      limitPerAppUnlimited: true,
      excludeEmployee: "",
      claimRemark: "",
      // Overtime specific fields
      overtimeName: "",
      deductionType: "",
      overtimeRate: "",
      includedEmployee: "",
      remark: "",
    });
    setShowCreatePolicyDialog(true);
  };

  const handleCloseCreatePolicyDialog = () => {
    setShowCreatePolicyDialog(false);
  };

  const handleSaveNewPolicy = () => {
    console.log("Save new policy:", { type: policyType, data: newPolicyForm });
    
    if (policyType === "financial") {
      // Validate required fields
      if (!newPolicyForm.claimName.trim()) {
        alert("Sila masukkan nama claim.");
        return;
      }

      // Prepare data for financial policy
      const dataToSave: InsertFinancialClaimPolicy = {
        claimName: newPolicyForm.claimName,
        annualLimit: newPolicyForm.limitUnlimited ? null : Number(newPolicyForm.annualLimit) || 0,
        annualLimitUnlimited: newPolicyForm.limitUnlimited,
        limitPerApplication: newPolicyForm.limitPerAppUnlimited ? null : Number(newPolicyForm.limitPerApplication) || 0,
        limitPerApplicationUnlimited: newPolicyForm.limitPerAppUnlimited,
        excludedEmployeeIds: [],
        claimRemark: newPolicyForm.claimRemark,
      };

      createFinancialPolicyMutation.mutate(dataToSave);
    }
    
    setShowCreatePolicyDialog(false);
  };

  // Department handlers
  const handleOpenAddDepartmentDialog = () => {
    setNewDepartmentForm({
      name: "",
      code: "",
    });
    setShowAddDepartmentDialog(true);
  };

  const handleCloseAddDepartmentDialog = () => {
    setShowAddDepartmentDialog(false);
  };

  const handleSaveNewDepartment = () => {
    if (newDepartmentForm.name && newDepartmentForm.code) {
      const newDepartment = {
        id: departments.length + 1,
        name: newDepartmentForm.name,
        code: newDepartmentForm.code,
        employeeCount: 0,
      };
      setDepartments([...departments, newDepartment]);
      setShowAddDepartmentDialog(false);
    }
  };

  const renderCompanyForm = () => (
    <div className="space-y-6">
      {/* Company Details Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Company Details</h3>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-6">
        {/* Company Logo */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Company Logo</Label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              {(logoPreviewUrl || (companyData.logoUrl && !logoFile)) ? (
                <img 
                  src={logoPreviewUrl || (companyData.logoUrl ? `/objects/${companyData.logoUrl.replace('/objects/', '')}` : '')}
                  alt="Company Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogoUpload}
                disabled={isUploadingLogo}
                data-testid="button-upload-logo"
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memuat naik...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {logoFile ? 'Tukar Logo' : 'Muat Naik Logo'}
                  </>
                )}
              </Button>
              {logoFile && (
                <p className="text-xs text-green-600">
                  Logo baru dipilih: {logoFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG atau GIF (Max: 5MB)
              </p>
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
            <Input
              id="company-name"
              value={companyData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              data-testid="input-company-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-short-name" className="text-sm font-medium">Company Short Name</Label>
            <Input
              id="company-short-name"
              value={companyData.companyShortName}
              onChange={(e) => handleInputChange('companyShortName', e.target.value)}
              data-testid="input-company-short-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-reg-no" className="text-sm font-medium">Company Registration No</Label>
            <Input
              id="company-reg-no"
              value={companyData.companyRegNo}
              onChange={(e) => handleInputChange('companyRegNo', e.target.value)}
              data-testid="input-company-reg-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-type" className="text-sm font-medium">Company Type</Label>
            <Select value={companyData.companyType} onValueChange={(value) => handleInputChange('companyType', value)}>
              <SelectTrigger data-testid="select-company-type">
                <SelectValue placeholder="Select Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private-limited">Private Limited</SelectItem>
                <SelectItem value="public-limited">Public Limited</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
            <Select value={companyData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
              <SelectTrigger data-testid="select-industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-email" className="text-sm font-medium">Company Email</Label>
            <Input
              id="company-email"
              type="email"
              value={companyData.companyEmail}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              data-testid="input-company-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-phone" className="text-sm font-medium">Company Phone Number</Label>
            <Input
              id="company-phone"
              value={companyData.companyPhone}
              onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              data-testid="input-company-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-fax" className="text-sm font-medium">Company Fax</Label>
            <Input
              id="company-fax"
              value={companyData.companyFax}
              onChange={(e) => handleInputChange('companyFax', e.target.value)}
              placeholder="Fax"
              data-testid="input-company-fax"
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street-address" className="text-sm font-medium">Street Address</Label>
            <Textarea
              id="street-address"
              value={companyData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              rows={2}
              data-testid="textarea-street-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium">State</Label>
              <Select value={companyData.state} onValueChange={(value) => handleInputChange('state', value)}>
                <SelectTrigger data-testid="select-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selangor">Selangor</SelectItem>
                  <SelectItem value="kuala-lumpur">Kuala Lumpur</SelectItem>
                  <SelectItem value="johor">Johor</SelectItem>
                  <SelectItem value="penang">Penang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Select value={companyData.city} onValueChange={(value) => handleInputChange('city', value)}>
                <SelectTrigger data-testid="select-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bandar-baru-bangi">Bandar Baru Bangi</SelectItem>
                  <SelectItem value="kajang">Kajang</SelectItem>
                  <SelectItem value="putrajaya">Putrajaya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
              <Select value={companyData.postcode} onValueChange={(value) => handleInputChange('postcode', value)}>
                <SelectTrigger data-testid="select-postcode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="43650">43650</SelectItem>
                  <SelectItem value="43000">43000</SelectItem>
                  <SelectItem value="62000">62000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">Country</Label>
              <Select value={companyData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="malaysia">Malaysia</SelectItem>
                  <SelectItem value="singapore">Singapore</SelectItem>
                  <SelectItem value="indonesia">Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleUpdate}
            className="bg-blue-900 hover:bg-blue-800 text-white"
            data-testid="button-update-company"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Bank & Other Account Details */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Bank & Other Account Details</h3>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank-name" className="text-sm font-medium">Bank Name</Label>
            <Select value={companyData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
              <SelectTrigger data-testid="select-bank-name">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maybank">Maybank</SelectItem>
                <SelectItem value="cimb">CIMB Bank</SelectItem>
                <SelectItem value="public-bank">Public Bank</SelectItem>
                <SelectItem value="rhb">RHB Bank</SelectItem>
                <SelectItem value="hong-leong">Hong Leong Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-account-no" className="text-sm font-medium">Bank Account Number</Label>
            <Input
              id="bank-account-no"
              value={companyData.bankAccountNo}
              onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
              placeholder="Bank Account No"
              data-testid="input-bank-account-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epf-no" className="text-sm font-medium">EPF Account Number</Label>
            <Input
              id="epf-no"
              value={companyData.epfNo}
              onChange={(e) => handleInputChange('epfNo', e.target.value)}
              placeholder="EPF No"
              data-testid="input-epf-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socso-no" className="text-sm font-medium">SOCSO Account Number</Label>
            <Input
              id="socso-no"
              value={companyData.socsoNo}
              onChange={(e) => handleInputChange('socsoNo', e.target.value)}
              placeholder="SOCSO No"
              data-testid="input-socso-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-tax-no" className="text-sm font-medium">Income Tax No</Label>
            <Input
              id="income-tax-no"
              value={companyData.incomeTaxNo}
              onChange={(e) => handleInputChange('incomeTaxNo', e.target.value)}
              placeholder="Income Tax No"
              data-testid="input-income-tax-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer-no" className="text-sm font-medium">Employer No</Label>
            <Input
              id="employer-no"
              value={companyData.employerNo}
              onChange={(e) => handleInputChange('employerNo', e.target.value)}
              placeholder="Employer No"
              data-testid="input-employer-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lhdn-branch" className="text-sm font-medium">LHDN Branch</Label>
            <Input
              id="lhdn-branch"
              value={companyData.lhdnBranch}
              onChange={(e) => handleInputChange('lhdnBranch', e.target.value)}
              placeholder="LHDN Branch"
              data-testid="input-lhdn-branch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="originator-id" className="text-sm font-medium">Originator ID</Label>
            <Input
              id="originator-id"
              value={companyData.originatorId}
              onChange={(e) => handleInputChange('originatorId', e.target.value)}
              placeholder="Originator ID"
              data-testid="input-originator-id"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zakat-no" className="text-sm font-medium">Zakat Number</Label>
            <Input
              id="zakat-no"
              value={companyData.zakatNo}
              onChange={(e) => handleInputChange('zakatNo', e.target.value)}
              placeholder="Zakat No"
              data-testid="input-zakat-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-number" className="text-sm font-medium">C-Number</Label>
            <Input
              id="c-number"
              value={companyData.cNumber}
              onChange={(e) => handleInputChange('cNumber', e.target.value)}
              placeholder="C-Number"
              data-testid="input-c-number"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleUpdate}
            className="bg-blue-900 hover:bg-blue-800 text-white"
            data-testid="button-update-bank"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Company Subsidiary */}
      <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Company Subsidiary</h3>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex justify-end space-x-2">
          <Button 
            size="sm"
            className="bg-blue-900 hover:bg-blue-800 text-white"
            data-testid="button-add-new-subsidiary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="text-blue-900 border-blue-900"
            data-testid="button-link-existing-company"
          >
            <Link className="w-4 h-4 mr-2" />
            Link to Existing Company
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fax</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
          <span>Previous</span>
          <span>Next</span>
        </div>
      </div>
    </div>
  );

  const renderClaimForm = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setClaimActiveTab("financial")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            claimActiveTab === "financial"
              ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="tab-financial"
        >
          Financial
        </button>
        <button
          onClick={() => setClaimActiveTab("overtime")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            claimActiveTab === "overtime"
              ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="tab-overtime"
        >
          Overtime
        </button>
      </div>

      {/* Financial Tab Content */}
      {claimActiveTab === "financial" && (
        <>
          {/* Financial Approval */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Financial Approval</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={financialApproval.firstLevel} 
                  onValueChange={(value) => setFinancialApproval(prev => ({
                    ...prev, 
                    firstLevel: value,
                    secondLevel: prev.secondLevel === value ? "none" : prev.secondLevel
                  }))}
                >
                  <SelectTrigger data-testid="select-financial-first-level-approval">
                    <SelectValue placeholder="Select first financial approval" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalEmployees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={financialApproval.secondLevel} 
                  onValueChange={(value) => setFinancialApproval(prev => ({...prev, secondLevel: value}))}
                >
                  <SelectTrigger data-testid="select-financial-second-level-approval">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvalEmployees?.filter(employee => employee.id !== financialApproval.firstLevel).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  onClick={handleSaveFinancialApproval}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-save-financial-approval"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Financial Policy */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg flex items-center justify-between">
            <h3 className="text-lg font-semibold">Financial Policy</h3>
            <Button 
              variant="secondary"
              size="sm"
              className="bg-white text-cyan-600 hover:bg-gray-100"
              onClick={() => handleOpenCreatePolicyDialog("financial")}
              data-testid="button-create-financial-policy"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="divide-y">
              {(financialClaimPoliciesData || financialClaimPolicies).map((policy) => {
                const policyId = policy.id || policy.id;
                const formData = financialPolicyForm[policyId] || {
                  claimName: policy.claimName || policy.name,
                  annualLimit: policy.annualLimit || "100",
                  annualLimitUnlimited: policy.annualLimitUnlimited || false,
                  limitPerApplication: policy.limitPerApplication || "50",
                  limitPerApplicationUnlimited: policy.limitPerApplicationUnlimited || false,
                  excludedEmployeeIds: policy.excludedEmployeeIds || [],
                  claimRemark: policy.claimRemark || "",
                };

                return (
                <div key={policyId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{formData.claimName}</h4>
                      <p className="text-sm text-gray-500">
                        Tahunan: RM {formData.annualLimitUnlimited ? "Tanpa Had" : formData.annualLimit} | 
                        Per Permohonan: RM {formData.limitPerApplicationUnlimited ? "Tanpa Had" : formData.limitPerApplication}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-cyan-600 hover:text-cyan-700"
                        onClick={() => handleToggleFinancialExpand(policyId)}
                        data-testid={`button-see-more-${policyId}`}
                      >
                        {expandedFinancialPolicyId === policyId ? "See Less" : "See More"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteFinancialPolicy(policyId)}
                        disabled={deleteFinancialPolicyMutation.isPending}
                        data-testid={`button-delete-policy-${policyId}`}
                      >
                        {deleteFinancialPolicyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Financial Policy Details */}
                  {expandedFinancialPolicyId === policyId && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                        <p className="text-sm text-blue-700">
                          📝 Ubah maklumat di bawah dan klik Simpan untuk menyimpan perubahan
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 block">Had Tahunan</label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number"
                              placeholder="100"
                              className="w-24"
                              value={formData.annualLimit}
                              onChange={(e) => updateFinancialPolicyField(policyId, 'annualLimit', e.target.value)}
                              disabled={formData.annualLimitUnlimited}
                            />
                            <span className="text-sm text-gray-500">RM</span>
                            <Switch 
                              className="ml-2 data-[state=checked]:bg-blue-900" 
                              checked={formData.annualLimitUnlimited}
                              onCheckedChange={(checked) => updateFinancialPolicyField(policyId, 'annualLimitUnlimited', checked)}
                            />
                            <span className="text-sm text-gray-500">Tanpa Had</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 block">Had Setiap Permohonan</label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number"
                              placeholder="50"
                              className="w-24"
                              value={formData.limitPerApplication}
                              onChange={(e) => updateFinancialPolicyField(policyId, 'limitPerApplication', e.target.value)}
                              disabled={formData.limitPerApplicationUnlimited}
                            />
                            <span className="text-sm text-gray-500">RM</span>
                            <Switch 
                              className="ml-2 data-[state=checked]:bg-blue-900" 
                              checked={formData.limitPerApplicationUnlimited}
                              onCheckedChange={(checked) => updateFinancialPolicyField(policyId, 'limitPerApplicationUnlimited', checked)}
                            />
                            <span className="text-sm text-gray-500">Tanpa Had</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Kecualikan Pekerja</label>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value === "none") {
                              updateFinancialPolicyField(policyId, 'excludedEmployeeIds', []);
                            } else if (value && !formData.excludedEmployeeIds.includes(value)) {
                              updateFinancialPolicyField(policyId, 'excludedEmployeeIds', [...formData.excludedEmployeeIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              formData.excludedEmployeeIds.length > 0 
                                ? `${formData.excludedEmployeeIds.length} pekerja dipilih`
                                : "Pilih pekerja untuk dikecualikan"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tiada</SelectItem>
                            {allEmployees?.map((employee) => (
                              <SelectItem 
                                key={employee.id} 
                                value={employee.id}
                                disabled={formData.excludedEmployeeIds.includes(employee.id)}
                              >
                                {employee.fullName} ({employee.role || 'Tiada Jawatan'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Show selected employees */}
                        {formData.excludedEmployeeIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.excludedEmployeeIds.map((employeeId) => {
                              const employee = allEmployees?.find(emp => emp.id === employeeId);
                              return (
                                <div key={employeeId} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                  <span>{employee?.fullName || employeeId}</span>
                                  <button
                                    onClick={() => updateFinancialPolicyField(
                                      policyId, 
                                      'excludedEmployeeIds', 
                                      formData.excludedEmployeeIds.filter(id => id !== employeeId)
                                    )}
                                    className="ml-2 hover:bg-blue-200 rounded"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Remark</label>
                        <Textarea 
                          placeholder="Tambah nota atau keperluan tambahan untuk polisi claim ini..."
                          className="min-h-[80px]"
                          value={formData.claimRemark}
                          onChange={(e) => updateFinancialPolicyField(policyId, 'claimRemark', e.target.value)}
                        />
                      </div>

                      {/* Save/Cancel Buttons */}
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => handleCancelFinancialPolicy(policyId)}
                          disabled={createFinancialPolicyMutation.isPending || updateFinancialPolicyMutation.isPending}
                          data-testid={`button-cancel-policy-${policyId}`}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={() => handleSaveFinancialPolicy(policyId)}
                          disabled={createFinancialPolicyMutation.isPending || updateFinancialPolicyMutation.isPending}
                          className="bg-blue-900 hover:bg-blue-800 text-white"
                          data-testid={`button-save-policy-${policyId}`}
                        >
                          {createFinancialPolicyMutation.isPending || updateFinancialPolicyMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            'Simpan'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Financial Setting */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Financial Setting</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Monthly Cut-off Date for Claim Submission</h4>
              <p className="text-sm text-gray-500 mb-4">Here you can set the cut-off date for claim processing. After this date, any claims made will fall into the next month payment cycle.</p>
              
              <div className="flex items-center space-x-2 max-w-md">
                <Select 
                  value={financialSettings.cutoffDate} 
                  onValueChange={(value) => setFinancialSettings(prev => ({...prev, cutoffDate: value}))}
                >
                  <SelectTrigger data-testid="select-cutoff-date">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">of the Month</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveFinancialSettings}
                className="bg-blue-900 hover:bg-blue-800 text-white"
                data-testid="button-save-financial-settings"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Overtime Tab Content */}
      {claimActiveTab === "overtime" && (
        <>
          {/* Overtime Approval */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Overtime Approval</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={overtimeApproval.firstLevel} 
                  onValueChange={(value) => setOvertimeApproval(prev => ({
                    ...prev, 
                    firstLevel: value,
                    secondLevel: prev.secondLevel === value ? "none" : prev.secondLevel
                  }))}
                >
                  <SelectTrigger data-testid="select-overtime-first-level-approval">
                    <SelectValue placeholder="Select first overtime approval" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalEmployees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={overtimeApproval.secondLevel} 
                  onValueChange={(value) => setOvertimeApproval(prev => ({...prev, secondLevel: value}))}
                >
                  <SelectTrigger data-testid="select-overtime-second-level-approval">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvalEmployees?.filter(employee => employee.id !== overtimeApproval.firstLevel).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  onClick={handleSaveOvertimeApproval}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-save-overtime-approval"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Current Settings Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Approval Settings:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">First Level Approver:</span>{" "}
                  {overtimeApprovalSettings?.firstLevel ? 
                    approvalEmployees?.find(emp => emp.id === overtimeApprovalSettings.firstLevel)?.fullName || 'Loading...' 
                    : 'Not set'
                  }
                </div>
                <div>
                  <span className="font-medium">Second Level Approver:</span>{" "}
                  {overtimeApprovalSettings?.secondLevel ? 
                    approvalEmployees?.find(emp => emp.id === overtimeApprovalSettings.secondLevel)?.fullName || 'Loading...' 
                    : 'None'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Overtime Policy */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg flex items-center justify-between">
            <h3 className="text-lg font-semibold">Overtime Policy</h3>
            <Button 
              variant="secondary"
              size="sm"
              className="bg-white text-cyan-600 hover:bg-gray-100"
              onClick={() => handleOpenCreatePolicyDialog("overtime")}
              data-testid="button-create-overtime-policy"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="divide-y">
              {overtimePolicies.map((policy) => (
                <div key={policy.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{policy.name}</h4>
                    <p className="text-sm text-gray-500">{policy.rate}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">Default Rate</span>
                    <Switch 
                      checked={policy.enabled}
                      className="data-[state=checked]:bg-blue-900"
                      data-testid={`switch-overtime-${policy.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overtime Setting */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Overtime Setting</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border space-y-6">
            {/* Count Overtime in Payroll */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Count Overtime in Payroll</h4>
              </div>
              <Switch 
                checked={overtimeSettings.countOvertimeInPayroll}
                onCheckedChange={(checked) => setOvertimeSettings(prev => ({...prev, countOvertimeInPayroll: checked}))}
                className="data-[state=checked]:bg-blue-900"
                data-testid="switch-count-overtime-payroll"
              />
            </div>

            {/* Working Days a Month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Working Days a Month</Label>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={overtimeSettings.workingDaysPerMonth} 
                    onValueChange={(value) => setOvertimeSettings(prev => ({...prev, workingDaysPerMonth: value}))}
                  >
                    <SelectTrigger data-testid="select-working-days">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 31}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">days in a Month</span>
                </div>
              </div>
            </div>

            {/* Overtime Calculation */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overtime Calculation</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Calculate by</span>
                <Select 
                  value={overtimeSettings.overtimeCalculation} 
                  onValueChange={(value) => setOvertimeSettings(prev => ({...prev, overtimeCalculation: value}))}
                >
                  <SelectTrigger data-testid="select-overtime-calculation" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic-salary">Basic Salary</SelectItem>
                    <SelectItem value="gross-salary">Gross Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Overtime Cut-off Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overtime Cut-off Date</Label>
              <div className="flex items-center space-x-2">
                <Select 
                  value={overtimeSettings.overtimeCutoffDate} 
                  onValueChange={(value) => setOvertimeSettings(prev => ({...prev, overtimeCutoffDate: value}))}
                >
                  <SelectTrigger data-testid="select-overtime-cutoff-date" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">of the Month</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveOvertimeSettings}
                className="bg-blue-900 hover:bg-blue-800 text-white"
                data-testid="button-save-overtime-settings"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderLeaveForm = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("leave")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "leave"
              ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="tab-leave"
        >
          Leave
        </button>
        <button
          onClick={() => setActiveTab("timeoff")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "timeoff"
              ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="tab-timeoff"
        >
          Timeoff
        </button>
      </div>

      {/* Leave Tab Content */}
      {activeTab === "leave" && (
        <>
          {/* Leave Approval */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Leave Approval</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={leaveApproval.firstLevel} 
                  onValueChange={(value) => setLeaveApproval(prev => ({
                    ...prev, 
                    firstLevel: value,
                    secondLevel: prev.secondLevel === value ? "none" : prev.secondLevel
                  }))}
                >
                  <SelectTrigger data-testid="select-first-level-approval">
                    <SelectValue placeholder="Select first leave approval" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalEmployees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={leaveApproval.secondLevel} 
                  onValueChange={(value) => setLeaveApproval(prev => ({...prev, secondLevel: value}))}
                >
                  <SelectTrigger data-testid="select-second-level-approval">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvalEmployees?.filter(employee => employee.id !== leaveApproval.firstLevel).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  onClick={handleSaveLeaveApproval}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-save-leave-approval"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Current Settings Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Approval Settings:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">First Level Approver:</span>{" "}
                  {(currentLeaveSettings as any)?.firstLevelApprovalId ? 
                    approvalEmployees?.find(emp => emp.id === (currentLeaveSettings as any).firstLevelApprovalId)?.fullName || 'Loading...' 
                    : 'Not set'
                  }
                </div>
                <div>
                  <span className="font-medium">Second Level Approver:</span>{" "}
                  {(currentLeaveSettings as any)?.secondLevelApprovalId ? 
                    approvalEmployees?.find(emp => emp.id === (currentLeaveSettings as any).secondLevelApprovalId)?.fullName || 'Loading...' 
                    : 'None'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Leave Policy */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leave Policy</h3>
            <Button 
              variant="secondary"
              size="sm"
              className="bg-white text-cyan-600 hover:bg-gray-100"
              data-testid="button-create-leave-policy"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Leave Policy
            </Button>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="divide-y">
              {leavePolicies.map((policy) => (
                <div key={policy.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{policy.name}</h4>
                      <p className="text-sm text-gray-500">Entitlement {policy.entitlement}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-cyan-600 hover:text-cyan-700"
                        onClick={() => handleToggleExpand(policy.id)}
                        data-testid={`button-see-more-${policy.id}`}
                      >
                        See More
                      </Button>
                      <Switch 
                        checked={policy.enabled}
                        onCheckedChange={(checked) => handleToggleLeavePolicy(policy.id, checked)}
                        className="data-[state=checked]:bg-blue-900"
                        data-testid={`switch-${policy.id}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedPolicyId === policy.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                      {/* Auto-save notification */}
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                        <p className="text-sm text-blue-700">
                          💾 All changes are saved automatically
                        </p>
                      </div>
                      
                      {/* Group Policy Section */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 block">Group Policy</label>
                        <div className="space-y-3">
                          {Object.entries(groupPolicySettings).map(([roleName, settings]) => (
                            <div key={roleName} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center space-x-3">
                                <Switch 
                                  checked={settings.selected}
                                  onCheckedChange={() => handleGroupPolicyToggle(roleName as keyof typeof groupPolicySettings)}
                                  className="data-[state=checked]:bg-blue-900"
                                />
                                <Label className="text-sm font-medium">{roleName}</Label>
                              </div>
                              <Input 
                                type="number"
                                value={settings.days}
                                onChange={(e) => handleGroupPolicyDaysChange(roleName as keyof typeof groupPolicySettings, e.target.value)}
                                className="w-16 h-8 text-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exclude Employee */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Exclude Employee</label>
                        <Select
                          value={excludedEmployees.length > 0 ? excludedEmployees[0] : ""}
                          onValueChange={(value) => {
                            if (value && !excludedEmployees.includes(value)) {
                              setExcludedEmployees(prev => [...prev, value]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={
                              excludedEmployees.length > 0 
                                ? `${excludedEmployees.length} employees selected`
                                : "Choose employees to exclude"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {allEmployees?.map((employee) => (
                              <SelectItem 
                                key={employee.id} 
                                value={employee.id}
                                disabled={excludedEmployees.includes(employee.id)}
                              >
                                {employee.fullName} ({employee.department || 'No Department'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Show selected employees */}
                        {excludedEmployees.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {excludedEmployees.map((employeeId) => {
                              const employee = allEmployees?.find(emp => emp.id === employeeId);
                              return (
                                <div key={employeeId} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                  <span>{employee?.fullName || employeeId}</span>
                                  <button
                                    onClick={() => setExcludedEmployees(prev => prev.filter(id => id !== employeeId))}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Settings Switches */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <Label className="text-sm font-medium">Upload Attachment</Label>
                          <Switch 
                            checked={currentLeavePolicySettings?.uploadAttachment ?? true}
                            onCheckedChange={(checked) => 
                              updateLeavePolicySettingMutation.mutate({
                                leaveType: expandedPolicyId!,
                                field: "uploadAttachment",
                                value: checked
                              })
                            }
                            className="data-[state=checked]:bg-blue-900"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <Label className="text-sm font-medium">Reason</Label>
                          <Switch 
                            checked={currentLeavePolicySettings?.requireReason ?? false}
                            onCheckedChange={(checked) => 
                              updateLeavePolicySettingMutation.mutate({
                                leaveType: expandedPolicyId!,
                                field: "requireReason",
                                value: checked
                              })
                            }
                            className="data-[state=checked]:bg-blue-900"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <Label className="text-sm font-medium">Carry Forward</Label>
                          <Switch 
                            checked={currentLeavePolicySettings?.carryForward ?? true}
                            onCheckedChange={(checked) => 
                              updateLeavePolicySettingMutation.mutate({
                                leaveType: expandedPolicyId!,
                                field: "carryForward",
                                value: checked
                              })
                            }
                            className="data-[state=checked]:bg-blue-900"
                          />
                        </div>
                      </div>

                      {/* Pro-Rated Section */}
                      <div className="p-3 bg-white rounded border">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Pro-Rated</Label>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              checked={currentLeavePolicySettings?.proRated ?? true}
                              onCheckedChange={(checked) => 
                                updateLeavePolicySettingMutation.mutate({
                                  leaveType: expandedPolicyId!,
                                  field: "proRated",
                                  value: checked
                                })
                              }
                              className="data-[state=checked]:bg-blue-900"
                            />
                            <Select 
                              value={currentLeavePolicySettings?.roundingMethod ?? "round-up"}
                              onValueChange={(value) => 
                                updateLeavePolicySettingMutation.mutate({
                                  leaveType: expandedPolicyId!,
                                  field: "roundingMethod",
                                  value
                                })
                              }
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="round-up">Round Up</SelectItem>
                                <SelectItem value="round-down">Round Down</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select 
                              value={currentLeavePolicySettings?.minimumUnit ?? "1-day"}
                              onValueChange={(value) => 
                                updateLeavePolicySettingMutation.mutate({
                                  leaveType: expandedPolicyId!,
                                  field: "minimumUnit",
                                  value
                                })
                              }
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-day">1.0 Day</SelectItem>
                                <SelectItem value="half-day">0.5 Day</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Day Limit and Leave Remark */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Day Limit</Label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              className="w-20 h-8" 
                              value={currentLeavePolicySettings?.dayLimit ?? 5}
                              onChange={(e) => 
                                updateLeavePolicySettingMutation.mutate({
                                  leaveType: expandedPolicyId!,
                                  field: "dayLimit",
                                  value: parseInt(e.target.value) || 5
                                })
                              }
                            />
                            <span className="text-sm text-gray-500">days before Application</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Leave Remark</Label>
                          <Input 
                            placeholder="Leave Remarks"
                            value={currentLeavePolicySettings?.leaveRemark ?? "Leave Remarks"}
                            onChange={(e) => 
                              updateLeavePolicySettingMutation.mutate({
                                leaveType: expandedPolicyId!,
                                field: "leaveRemark",
                                value: e.target.value
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedPolicyId(null)}
                          data-testid="button-close-policy"
                        >
                          Close
                        </Button>
                        <Button 
                          className="bg-blue-900 hover:bg-blue-800 text-white"
                          size="sm"
                          onClick={() => {
                            // Show success message
                            toast({
                              title: "✅ Policy Settings Saved",
                              description: "All leave policy changes have been saved successfully.",
                              duration: 3000,
                            });
                          }}
                          data-testid="button-save-policy"
                        >
                          💾 Save Settings
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Timeoff Tab Content */}
      {activeTab === "timeoff" && (
        <>
          {/* Timeoff Approval */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Timeoff Approval</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={timeoffApproval.firstLevel} 
                  onValueChange={(value) => setTimeoffApproval(prev => ({
                    ...prev, 
                    firstLevel: value,
                    secondLevel: prev.secondLevel === value ? "none" : prev.secondLevel
                  }))}
                >
                  <SelectTrigger data-testid="select-timeoff-first-level-approval">
                    <SelectValue placeholder="Select first leave approval" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalEmployees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={timeoffApproval.secondLevel} 
                  onValueChange={(value) => setTimeoffApproval(prev => ({...prev, secondLevel: value}))}
                >
                  <SelectTrigger data-testid="select-timeoff-second-level-approval">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {approvalEmployees?.filter(employee => employee.id !== timeoffApproval.firstLevel).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  onClick={handleSaveTimeoffApproval}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-save-timeoff-approval"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Timeoff Settings */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Timeoff Setting</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border space-y-6">
            {/* Enable Attachment */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Enable Attachment</h4>
                <p className="text-sm text-gray-500">Turn on and off attachment compulsory for timeoff application</p>
              </div>
              <Switch 
                checked={timeoffSettings.enableAttachment}
                onCheckedChange={(checked) => setTimeoffSettings(prev => ({...prev, enableAttachment: checked}))}
                className="data-[state=checked]:bg-blue-900"
                data-testid="switch-enable-attachment"
              />
            </div>

            {/* Application Limit Hour */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Application Limit Hour</h4>
                  <p className="text-sm text-gray-500">Set the minimum and maximum hour limit per application</p>
                </div>
                <Switch 
                  checked={timeoffSettings.applicationLimitHour}
                  onCheckedChange={(checked) => setTimeoffSettings(prev => ({...prev, applicationLimitHour: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-application-limit-hour"
                />
              </div>

              {timeoffSettings.applicationLimitHour && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Minimum Hour(s)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={timeoffSettings.minHour}
                        onChange={(e) => setTimeoffSettings(prev => ({...prev, minHour: parseInt(e.target.value) || 0}))}
                        className="flex-1"
                        data-testid="input-min-hour"
                      />
                      <span className="text-sm text-gray-500">Hour(s)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Maximum Hour(s)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={timeoffSettings.maxHour}
                        onChange={(e) => setTimeoffSettings(prev => ({...prev, maxHour: parseInt(e.target.value) || 0}))}
                        className="flex-1"
                        data-testid="input-max-hour"
                      />
                      <span className="text-sm text-gray-500">Hour(s)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveTimeoffSettings}
                className="bg-blue-900 hover:bg-blue-800 text-white"
                data-testid="button-save-timeoff-settings"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Payment Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Payment Setting</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Currency</Label>
            <p className="text-xs text-gray-500">Choose currency applied by the company across the entire system</p>
            <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
              <p className="text-xs text-orange-700">
                <strong>Important:</strong> Changing the currency will apply to ALL parts of the system including Master Salary, Payroll, Payment Vouchers, Claims, and all financial calculations. This change affects all employees and existing data.
              </p>
            </div>
            <Select value={paymentSettings.currency} onValueChange={(value) => setPaymentSettings(prev => ({...prev, currency: value}))}>
              <SelectTrigger data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RM">RM (Malaysian Ringgit)</SelectItem>
                <SelectItem value="IDR">IDR (Indonesian Rupiah)</SelectItem>
                <SelectItem value="THB">THB (Thai Baht)</SelectItem>
                <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                <SelectItem value="MMK">MMK (Myanmar Kyat)</SelectItem>
                <SelectItem value="PHP">PHP (Philippine Peso)</SelectItem>
                <SelectItem value="VND">VND (Vietnamese Dong)</SelectItem>
                <SelectItem value="BND">BND (Brunei Dollar)</SelectItem>
                <SelectItem value="LAK">LAK (Lao Kip)</SelectItem>
                <SelectItem value="KHR">KHR (Cambodian Riel)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                <SelectItem value="CNY">CNY (Chinese Yuan)</SelectItem>
                <SelectItem value="KRW">KRW (South Korean Won)</SelectItem>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                <SelectItem value="HKD">HKD (Hong Kong Dollar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statutory Contributions Control */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Statutory Contributions Control</Label>
            <p className="text-xs text-gray-500">Global on/off control for all statutory contributions across the system</p>
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Disabling any contribution will prevent it from being calculated in all payroll processes. This setting affects all employees.
              </p>
            </div>
            
            {/* EPF Control */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">EPF</span>
                </div>
                <div>
                  <Label className="text-sm font-medium">EPF Contribution</Label>
                  <p className="text-xs text-gray-500">Employee Provident Fund</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-gray-400">Disabled</Label>
                <Switch 
                  checked={paymentSettings.epfEnabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({...prev, epfEnabled: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-epf-contribution"
                />
                <Label className="text-xs text-gray-400">Enabled</Label>
              </div>
            </div>

            {/* SOCSO Control */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">SO</span>
                </div>
                <div>
                  <Label className="text-sm font-medium">SOCSO Contribution</Label>
                  <p className="text-xs text-gray-500">Social Security Organization</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-gray-400">Disabled</Label>
                <Switch 
                  checked={paymentSettings.socsoEnabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({...prev, socsoEnabled: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-socso-contribution"
                />
                <Label className="text-xs text-gray-400">Enabled</Label>
              </div>
            </div>

            {/* EIS Control */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-orange-600">EIS</span>
                </div>
                <div>
                  <Label className="text-sm font-medium">EIS Contribution</Label>
                  <p className="text-xs text-gray-500">Employment Insurance System</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-gray-400">Disabled</Label>
                <Switch 
                  checked={paymentSettings.eisEnabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({...prev, eisEnabled: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-eis-contribution"
                />
                <Label className="text-xs text-gray-400">Enabled</Label>
              </div>
            </div>

            {/* HRDF Control */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">HR</span>
                </div>
                <div>
                  <Label className="text-sm font-medium">HRDF Contribution</Label>
                  <p className="text-xs text-gray-500">Human Resources Development Fund</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-gray-400">Disabled</Label>
                <Switch 
                  checked={paymentSettings.hrdfEnabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({...prev, hrdfEnabled: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-hrdf-contribution"
                />
                <Label className="text-xs text-gray-400">Enabled</Label>
              </div>
            </div>

            {/* PCB39 Control */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-red-600">PCB</span>
                </div>
                <div>
                  <Label className="text-sm font-medium">PCB39 Tax</Label>
                  <p className="text-xs text-gray-500">Personal Income Tax</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-gray-400">Disabled</Label>
                <Switch 
                  checked={paymentSettings.pcb39Enabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({...prev, pcb39Enabled: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-pcb39-contribution"
                />
                <Label className="text-xs text-gray-400">Enabled</Label>
              </div>
            </div>
          </div>

          {/* Standard Working Hour */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Standard Working Hour</Label>
            <p className="text-xs text-gray-500">Choose these option based on the company policy</p>
            <div className="flex gap-2">
              <Input 
                type="number"
                value={paymentSettings.standardWorkingHour}
                onChange={(e) => setPaymentSettings(prev => ({...prev, standardWorkingHour: e.target.value}))}
                className="flex-1"
                data-testid="input-working-hour"
              />
              <span className="flex items-center px-3 py-2 bg-gray-100 rounded text-sm">hour a Day</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              className="bg-blue-900 hover:bg-blue-800" 
              onClick={handleSavePaymentSettings}
              data-testid="button-save-payment-setting"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Approval */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Payment Approval</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Enable Approval */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Approval</Label>
              <p className="text-xs text-gray-500">If enabled, system will skip approval and close payroll when HR submit payroll</p>
            </div>
            <Switch 
              checked={paymentApproval.enableApproval}
              onCheckedChange={(checked) => setPaymentApproval(prev => ({...prev, enableApproval: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-payment-approval"
            />
          </div>

          {/* Choose Approval Level - Only show when approval is enabled */}
          {paymentApproval.enableApproval && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Choose Approval Level</Label>
              <p className="text-xs text-gray-500">Choose approval level (First or Second Level) according to company policy.</p>
              <Select value={paymentApproval.approvalLevel} onValueChange={(value) => setPaymentApproval(prev => ({...prev, approvalLevel: value}))}>
                <SelectTrigger data-testid="select-approval-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Level">First Level</SelectItem>
                  <SelectItem value="Second Level">Second Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* First Level Approval - Only show when approval is enabled */}
          {paymentApproval.enableApproval && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">First Level Approval</Label>
              <Select value={paymentApproval.firstLevel} onValueChange={(value) => setPaymentApproval(prev => ({...prev, firstLevel: value}))}>
                <SelectTrigger data-testid="select-first-level">
                  <SelectValue placeholder="Select First Payroll Approval" />
                </SelectTrigger>
                <SelectContent>
                  {approvalEmployees?.filter((employee) => 
                    ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes(employee.role)
                  ).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Second Level Approval - Only show when approval is enabled AND Second Level is selected */}
          {paymentApproval.enableApproval && paymentApproval.approvalLevel === "Second Level" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Second Level Approval</Label>
              <Select value={paymentApproval.secondLevel} onValueChange={(value) => setPaymentApproval(prev => ({...prev, secondLevel: value}))}>
                <SelectTrigger data-testid="select-second-level">
                  <SelectValue placeholder="Select Second Payroll Approval" />
                </SelectTrigger>
                <SelectContent>
                  {approvalEmployees?.filter((employee) => 
                    ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes(employee.role) &&
                    employee.id !== paymentApproval.firstLevel
                  ).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSavePaymentApproval}
              className="bg-blue-900 hover:bg-blue-800" 
              data-testid="button-save-payment-approval"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Unpaid Leave Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Unpaid Leave Setting</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Count approved Unpaid Leave */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Count approved Unpaid Leave into Payroll?</Label>
              <p className="text-xs text-gray-500">If enabled, system will calculate approved unpaid leave and add amount into payroll</p>
            </div>
            <Switch 
              checked={unpaidLeaveSettings.countIntoPayroll}
              onCheckedChange={(checked) => setUnpaidLeaveSettings(prev => ({...prev, countIntoPayroll: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-unpaid-leave"
            />
          </div>

          {/* Wage Calculation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Wage Calculation</Label>
            <p className="text-xs text-gray-500">Only applicable for every mode Monthly and hourly (From Salary Details)</p>
            <Select value={unpaidLeaveSettings.wageCalculation} onValueChange={(value) => setUnpaidLeaveSettings(prev => ({...prev, wageCalculation: value}))}>
              <SelectTrigger data-testid="select-unpaid-wage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Basic Salary">Basic Salary</SelectItem>
                <SelectItem value="Gross Salary">Gross Salary</SelectItem>
                <SelectItem value="Net Salary">Net Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unpaid Leave Cut-off Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Unpaid Leave Cut-off Date</Label>
            <p className="text-xs text-gray-500">Here you can set the cut-off date for unpaid leave processing. After this date, any unpaid leaves made will fall into the next month payroll cycle.</p>
            <div className="flex gap-2">
              <Select value={unpaidLeaveSettings.cutoffDate} onValueChange={(value) => setUnpaidLeaveSettings(prev => ({...prev, cutoffDate: value}))}>
                <SelectTrigger className="flex-1" data-testid="select-unpaid-cutoff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 31}, (_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center px-3 py-2 bg-gray-100 rounded text-sm">of the Month</span>
            </div>
          </div>

          {/* Count Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Count Mode</Label>
            <p className="text-xs text-gray-500">No description</p>
            <Select value={unpaidLeaveSettings.countMode} onValueChange={(value) => setUnpaidLeaveSettings(prev => ({...prev, countMode: value}))}>
              <SelectTrigger data-testid="select-count-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-unpaid-leave">
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Claim Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Claim Setting</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Enable count approved Claim */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable count approved Claim?</Label>
              <p className="text-xs text-gray-500">If enabled, system will calculate approved claim and add amount into payroll or payment voucher.</p>
            </div>
            <Switch 
              checked={claimSettings.enableClaim}
              onCheckedChange={(checked) => setClaimSettings(prev => ({...prev, enableClaim: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-claim-setting"
            />
          </div>

          {/* Choose Payment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Payment</Label>
            <Select value={claimSettings.choosePayment} onValueChange={(value) => setClaimSettings(prev => ({...prev, choosePayment: value}))}>
              <SelectTrigger data-testid="select-claim-payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Payroll">Payroll</SelectItem>
                <SelectItem value="Payment Voucher">Payment Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Claim Cut-off Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Claim Cut-off Date</Label>
            <p className="text-xs text-gray-500">Here you can set the cut-off date for claim processing. After this date, any claims made will fall into the next month payroll cycle.</p>
            <div className="flex gap-2">
              <Select value={claimSettings.cutoffDate} onValueChange={(value) => setClaimSettings(prev => ({...prev, cutoffDate: value}))}>
                <SelectTrigger className="flex-1" data-testid="select-claim-cutoff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 31}, (_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center px-3 py-2 bg-gray-100 rounded text-sm">of the Month</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-claim-setting">
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Overtime Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Overtime Setting</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Enable count approved Overtime */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable count approved Overtime?</Label>
              <p className="text-xs text-gray-500">If enabled, system will calculate approved overtime and add amount into payroll or payment voucher</p>
            </div>
            <Switch 
              checked={overtimeSettings2.enableOvertime}
              onCheckedChange={(checked) => setOvertimeSettings2(prev => ({...prev, enableOvertime: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-overtime-setting"
            />
          </div>

          {/* Choose Payment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Payment</Label>
            <Select value={overtimeSettings2.choosePayment} onValueChange={(value) => setOvertimeSettings2(prev => ({...prev, choosePayment: value}))}>
              <SelectTrigger data-testid="select-overtime-payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Payroll">Payroll</SelectItem>
                <SelectItem value="Payment Voucher">Payment Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wage Calculation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Wage Calculation</Label>
            <p className="text-xs text-gray-500">Only applicable for overtime type from Application and By Policy</p>
            <Select value={overtimeSettings2.wageCalculation} onValueChange={(value) => setOvertimeSettings2(prev => ({...prev, wageCalculation: value}))}>
              <SelectTrigger data-testid="select-overtime-wage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Basic Salary">Basic Salary</SelectItem>
                <SelectItem value="Gross Salary">Gross Salary</SelectItem>
                <SelectItem value="Net Salary">Net Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overtime Cut-off Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Overtime Cut-off Date</Label>
            <p className="text-xs text-gray-500">Here you can set the cut-off date for overtime processing. After this date, any overtime made will fall into the next month payroll cycle.</p>
            <div className="flex gap-2">
              <Select value={overtimeSettings2.cutoffDate} onValueChange={(value) => setOvertimeSettings2(prev => ({...prev, cutoffDate: value}))}>
                <SelectTrigger className="flex-1" data-testid="select-overtime-cutoff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 31}, (_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center px-3 py-2 bg-gray-100 rounded text-sm">of the Month</span>
            </div>
          </div>

          {/* Compensation Rounded */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Compensation Rounded</Label>
            <p className="text-xs text-gray-500">No description</p>
            <Select value={overtimeSettings2.compensationRounded} onValueChange={(value) => setOvertimeSettings2(prev => ({...prev, compensationRounded: value}))}>
              <SelectTrigger data-testid="select-compensation-rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No Round">No Round</SelectItem>
                <SelectItem value="Round Up">Round Up</SelectItem>
                <SelectItem value="Round Down">Round Down</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overtime working days in month */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Overtime working days in month</Label>
            <p className="text-xs text-gray-500">No description</p>
            <div className="flex gap-2">
              <Input 
                type="number"
                value={overtimeSettings2.workingDaysInMonth}
                onChange={(e) => setOvertimeSettings2(prev => ({...prev, workingDaysInMonth: e.target.value}))}
                className="flex-1"
                data-testid="input-overtime-working-days"
              />
              <span className="flex items-center px-3 py-2 bg-gray-100 rounded text-sm">days per Month</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-overtime-setting">
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Lateness Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Lateness Setting</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Count approved Lateness */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Count approved Lateness into Payroll?</Label>
              <p className="text-xs text-gray-500">If enabled, system will calculate approved lateness and add data into payroll</p>
            </div>
            <Switch 
              checked={latenessSettings.countIntoPayroll}
              onCheckedChange={(checked) => setLatenessSettings(prev => ({...prev, countIntoPayroll: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-lateness-setting"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-lateness-setting">
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Payslip Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Payslip Setting</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Template */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Template</Label>
            <p className="text-xs text-gray-500">May choose from any available templates</p>
            <div className="flex gap-2 items-center">
              <Select value={payslipSettings.template} onValueChange={(value) => setPayslipSettings(prev => ({...prev, template: value}))}>
                <SelectTrigger className="flex-1" data-testid="select-payslip-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Template One">Template One</SelectItem>
                  <SelectItem value="Template Two">Template Two</SelectItem>
                  <SelectItem value="Template Three">Template Three</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="link" className="text-cyan-600 text-sm" data-testid="button-view-template">
                👁 View Template
              </Button>
            </div>
          </div>

          {/* Show Overtime Remarks Details */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show Overtime Remarks Details</Label>
            <Switch 
              checked={payslipSettings.showOvertimeDetails}
              onCheckedChange={(checked) => setPayslipSettings(prev => ({...prev, showOvertimeDetails: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-show-overtime-details"
            />
          </div>

          {/* Show Unpaid Leave Remarks Details */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show Unpaid Leave Remarks Details</Label>
            <Switch 
              checked={payslipSettings.showUnpaidLeaveDetails}
              onCheckedChange={(checked) => setPayslipSettings(prev => ({...prev, showUnpaidLeaveDetails: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-show-unpaid-leave-details"
            />
          </div>

          {/* Show EPF Remarks Details */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show EPF Remarks Details</Label>
            <Switch 
              checked={payslipSettings.showEPFDetails}
              onCheckedChange={(checked) => setPayslipSettings(prev => ({...prev, showEPFDetails: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-show-epf-details"
            />
          </div>

          {/* Show HRDF Details */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show HRDF Details</Label>
            <Switch 
              checked={payslipSettings.showHRDFDetails}
              onCheckedChange={(checked) => setPayslipSettings(prev => ({...prev, showHRDFDetails: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-show-hrdf-details"
            />
          </div>

          {/* Show Year To Date Details */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show Year To Date Details</Label>
            <Switch 
              checked={payslipSettings.showYearToDateDetails}
              onCheckedChange={(checked) => setPayslipSettings(prev => ({...prev, showYearToDateDetails: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-show-year-to-date-details"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-payslip-setting">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceForm = () => (
    <div className="space-y-6">
      

      {/* Attendance Location */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg flex items-center justify-between">
          <h3 className="font-semibold">Attendance Location</h3>
          <Button 
            variant="secondary"
            size="sm"
            className="bg-white text-blue-900 hover:bg-gray-100"
            onClick={() => setShowCreateLocationDialog(true)}
            data-testid="button-create-location"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Location
          </Button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Ensure all clock-ins and outs are restricted to a set radius. Create location now!</p>
          {(officeLocations as any[]).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No locations created yet.</p>
          ) : (
            <div className="space-y-2">
              {(officeLocations as any[]).map((location: any) => (
                <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {location.name}
                      {location.isActive === "true" && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500">{location.address}</p>
                    <p className="text-xs text-gray-400">Radius: {location.radius}m</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditLocation(location)}
                      data-testid={`button-edit-location-${location.id}`}
                    >
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" data-testid={`button-delete-location-${location.id}`}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shift Manager */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg flex items-center justify-between">
          <h3 className="font-semibold">Shift Manager</h3>
          <Button 
            variant="secondary"
            size="sm"
            className="bg-white text-blue-900 hover:bg-gray-100"
            onClick={() => setShowCreateShiftDialog(true)}
            data-testid="button-create-shift"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Shift
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-lg">{shift.name}</h4>
                  <Button variant="link" size="sm" className="text-cyan-600" data-testid={`button-see-more-${shift.id}`}>
                    See More
                  </Button>
                  <Switch defaultChecked className="data-[state=checked]:bg-blue-900" data-testid={`switch-shift-${shift.id}`} />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAssignShiftDialog(true)}
                    data-testid={`button-assign-shift-${shift.id}`}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Assign Shift
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowUpdateShiftDialog(true)}
                    data-testid={`button-update-shift-${shift.id}`}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Update Shift
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {shift.days.map((day, index) => (
                  <span key={index} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                    {day}
                  </span>
                ))}
              </div>
              
              <p className="text-sm text-gray-500">{shift.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderYearlyForm = () => (
    <div className="space-y-6">
      {/* EA Form Section */}
      <div className="bg-white rounded-lg border">
        <div className="text-white p-3 rounded-t-lg shadow-sm bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800">
          <h3 className="font-semibold text-white">EA Form</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">EA Person In Charge</Label>
              <Select 
                value={yearlyFormSettings.eaPersonInCharge} 
                onValueChange={(value) => setYearlyFormSettings(prev => ({...prev, eaPersonInCharge: value}))}
              >
                <SelectTrigger className="w-full" data-testid="select-ea-person-in-charge">
                  <SelectValue placeholder="Select PIC" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white shadow-sm" 
              data-testid="button-save-yearly-form"
              onClick={() => {
                // Handle save functionality
                console.log("Yearly Form settings saved:", yearlyFormSettings);
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationForm = () => (
    <div className="space-y-6">
      {/* Notification Setting */}
      <div className="bg-white rounded-lg border">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-3 rounded-t-lg shadow-sm">
          <h3 className="font-semibold text-white">Notification Setting</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Top Bar Notification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">Top Bar Notification</Label>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.topBarNotification}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, topBarNotification: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-top-bar-notification"
            />
          </div>

          {/* User Email Notification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">User Email Notification</Label>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.userEmailNotification}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, userEmailNotification: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-user-email-notification"
            />
          </div>

          {/* Leave Email Notification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">Leave Email Notification</Label>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.leaveEmailNotification}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, leaveEmailNotification: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-leave-email-notification"
            />
          </div>

          {/* Claim Email Notification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">Claim Email Notification</Label>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.claimEmailNotification}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, claimEmailNotification: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-claim-email-notification"
            />
          </div>

          {/* Payroll Email Notification */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">Payroll Email Notification</Label>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.payrollEmailNotification}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, payrollEmailNotification: checked}))}
              className="data-[state=checked]:bg-blue-900"
              data-testid="switch-payroll-email-notification"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-notification-settings">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDepartmentForm = () => (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg flex items-center justify-between">
        <h3 className="text-lg font-semibold">Department</h3>
        <Button 
          variant="secondary"
          size="sm"
          className="bg-white text-cyan-600 hover:bg-gray-100"
          onClick={handleOpenAddDepartmentDialog}
          data-testid="button-add-department"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Department List */}
      <div className="bg-white rounded-lg border">
        <div className="divide-y">
          {departments.map((department) => (
            <div key={department.id} className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{department.name}</h4>
                <p className="text-sm text-gray-500">{department.employeeCount} Employee(s)</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-cyan-600 hover:text-cyan-700"
                  data-testid={`button-see-more-${department.id}`}
                >
                  See More
                </Button>
                <Switch 
                  defaultChecked={true}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid={`switch-department-${department.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Overtime Approval Form
  const renderOvertimeApprovalForm = () => {
    const handleSubmitOvertimeApproval = () => {
      saveOvertimeApprovalMutation.mutate({
        firstLevel: overtimeApproval.firstLevel || null,
        secondLevel: overtimeApproval.secondLevel || null
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border">
          <div className="text-white p-3 rounded-t-lg shadow-sm bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800">
            <h3 className="font-semibold text-white">Overtime Approval Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* First Level Approval */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={overtimeApproval.firstLevel}
                  onValueChange={(value) => setOvertimeApproval(prev => ({...prev, firstLevel: value}))}
                  data-testid="select-overtime-first-level"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select first level approver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Second Level Approval */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={overtimeApproval.secondLevel}
                  onValueChange={(value) => setOvertimeApproval(prev => ({...prev, secondLevel: value}))}
                  data-testid="select-overtime-second-level"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second level approver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white shadow-sm" 
                onClick={handleSubmitOvertimeApproval}
                disabled={saveOvertimeApprovalMutation.isPending}
                data-testid="button-save-overtime-approval"
              >
                {saveOvertimeApprovalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Overtime Policy Form
  const renderOvertimePolicyForm = () => {
    const handlePolicyChange = (policyId: string, field: string, value: any) => {
      setLocalPolicies(prev => prev.map(policy => 
        policy.id === policyId ? { ...policy, [field]: value } : policy
      ));
    };

    const handleSaveOvertimePolicies = () => {
      localPolicies.forEach(policy => {
        const originalPolicy = Array.isArray(overtimePolicyData) ? overtimePolicyData.find((p: any) => p.id === policy.id) : null;
        if (originalPolicy && (
          originalPolicy.multiplier !== policy.multiplier || 
          originalPolicy.enabled !== policy.enabled ||
          originalPolicy.policyName !== policy.policyName
        )) {
          saveOvertimePolicyMutation.mutate({
            id: policy.id,
            data: {
              policyName: policy.policyName,
              multiplier: policy.multiplier,
              enabled: policy.enabled,
              description: policy.description
            }
          });
        }
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border">
          <div className="text-white p-3 rounded-t-lg shadow-sm bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800">
            <h3 className="font-semibold text-white">Overtime Rate Policies</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Array.isArray(localPolicies) && localPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <Label className="text-sm font-medium">{policy.policyName}</Label>
                        <p className="text-xs text-gray-500">{policy.description}</p>
                      </div>
                      <div>
                        <Input 
                          value={policy.multiplier}
                          onChange={(e) => handlePolicyChange(policy.id, 'multiplier', e.target.value)}
                          placeholder="1.5"
                          data-testid={`input-rate-${policy.id}`}
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <Switch 
                          checked={policy.enabled}
                          onCheckedChange={(checked) => handlePolicyChange(policy.id, 'enabled', checked)}
                          className="data-[state=checked]:bg-blue-900"
                          data-testid={`switch-overtime-policy-${policy.id}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white shadow-sm" 
                onClick={handleSaveOvertimePolicies}
                disabled={saveOvertimePolicyMutation.isPending}
                data-testid="button-save-overtime-policies"
              >
                {saveOvertimePolicyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Move these hooks to top level to fix hooks ordering violation
  const [localOvertimeSettings, setLocalOvertimeSettings] = useState({
    countOvertimeInPayroll: true,
    workingDaysPerMonth: 26,
    workingHoursPerDay: 8,
    overtimeCalculation: 'basic-salary',
    overtimeCutoffDate: 31
  });

  useEffect(() => {
    if (overtimeSettingsData && typeof overtimeSettingsData === 'object') {
      setLocalOvertimeSettings({
        countOvertimeInPayroll: overtimeSettingsData.countOvertimeInPayroll ?? true,
        workingDaysPerMonth: overtimeSettingsData.workingDaysPerMonth ?? 26,
        workingHoursPerDay: overtimeSettingsData.workingHoursPerDay ?? 8,
        overtimeCalculation: overtimeSettingsData.overtimeCalculation ?? 'basic-salary',
        overtimeCutoffDate: overtimeSettingsData.overtimeCutoffDate ?? 31
      });
    }
  }, [overtimeSettingsData]);

  // Overtime Settings Form
  const renderOvertimeSettingsForm = () => {

    const handleSaveOvertimeSettings = () => {
      saveOvertimeSettingsMutation.mutate(localOvertimeSettings);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border">
          <div className="text-white p-3 rounded-t-lg shadow-sm bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800">
            <h3 className="font-semibold text-white">Overtime Calculation Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Count Overtime in Payroll */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Count Overtime in Payroll</Label>
                  <p className="text-xs text-gray-500">Include overtime payments in payroll calculations</p>
                </div>
              </div>
              <Switch 
                checked={localOvertimeSettings.countOvertimeInPayroll}
                onCheckedChange={(checked) => setLocalOvertimeSettings(prev => ({...prev, countOvertimeInPayroll: checked}))}
                className="data-[state=checked]:bg-blue-900"
                data-testid="switch-count-overtime-payroll"
              />
            </div>

            {/* Working Days and Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Working Days Per Month</Label>
                <Input 
                  type="number"
                  value={localOvertimeSettings.workingDaysPerMonth}
                  onChange={(e) => setLocalOvertimeSettings(prev => ({...prev, workingDaysPerMonth: parseInt(e.target.value) || 26}))}
                  placeholder="26"
                  data-testid="input-working-days-month"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Working Hours Per Day</Label>
                <Input 
                  type="number"
                  value={localOvertimeSettings.workingHoursPerDay}
                  onChange={(e) => setLocalOvertimeSettings(prev => ({...prev, workingHoursPerDay: parseInt(e.target.value) || 8}))}
                  placeholder="8"
                  data-testid="input-working-hours-day"
                />
              </div>
            </div>

            {/* Overtime Calculation Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overtime Calculation</Label>
              <Select 
                value={localOvertimeSettings.overtimeCalculation}
                onValueChange={(value) => setLocalOvertimeSettings(prev => ({...prev, overtimeCalculation: value}))}
                data-testid="select-overtime-calculation"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calculation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic-salary">Basic Salary</SelectItem>
                  <SelectItem value="gross-salary">Gross Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Overtime Cutoff Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overtime Cutoff Date</Label>
              <Input 
                type="number"
                value={localOvertimeSettings.overtimeCutoffDate}
                onChange={(e) => setLocalOvertimeSettings(prev => ({...prev, overtimeCutoffDate: parseInt(e.target.value) || 31}))}
                placeholder="31"
                min="1"
                max="31"
                data-testid="input-overtime-cutoff-date"
              />
              <p className="text-xs text-gray-500">Day of month when overtime calculations reset</p>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white shadow-sm" 
                onClick={handleSaveOvertimeSettings}
                disabled={saveOvertimeSettingsMutation.isPending}
                data-testid="button-save-overtime-settings"
              >
                {saveOvertimeSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaceholderContent = (section: string) => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold capitalize">{section} Settings</h3>
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <p className="text-gray-500">Settings for {section} will be available here.</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex h-screen">
        {/* Left Sidebar Navigation */}
        <div className="w-80 bg-white border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-cyan-600" />
              <h1 className="text-xl font-bold text-gray-900">Manage Setting</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Home &gt; Setting</p>
          </div>

          {/* Navigation Menu */}
          <div className="p-2">
            <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-3 rounded-t-lg">
              <h2 className="font-semibold">Setting</h2>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-b-lg">
              <nav className="py-2">
                {settingsMenuItems.map((item) => (
                  <RouterLink key={item.id} href={item.href}>
                    <button
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 text-left text-sm hover:bg-gray-100 hover:text-white transition-colors rounded-l-lg",
                        (currentSection === item.id || (currentSection === "company" && item.id === "company"))
                          ? "text-gray-800 border-r-4 shadow-sm"
                          : "text-gray-700"
                      )}
                      style={(currentSection === item.id || (currentSection === "company" && item.id === "company")) ? 
                        { background: "linear-gradient(to right, #0f172a, #1e3a8a, #0891b2)", borderRightColor: "#1e3a8a", color: "white" } : 
                        {}
                      }
                      data-testid={`nav-setting-${item.id}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </RouterLink>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentSection === "company" ? renderCompanyForm() : 
             currentSection === "leave" ? renderLeaveForm() : 
             currentSection === "claim" ? renderClaimForm() :
             currentSection === "department" ? renderDepartmentForm() :
             currentSection === "payment" ? renderPaymentForm() :
             currentSection === "notifications" ? renderNotificationForm() :
             currentSection === "attendance" ? renderAttendanceForm() :
             currentSection === "yearly-form" ? renderYearlyForm() :
             currentSection === "overtime-approval" ? renderOvertimeApprovalForm() :
             currentSection === "overtime-policy" ? renderOvertimePolicyForm() :
             currentSection === "overtime-settings" ? renderOvertimeSettingsForm() :
             renderPlaceholderContent(currentSection)}
          </div>
        </div>
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={showCreatePolicyDialog} onOpenChange={setShowCreatePolicyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-cyan-800 bg-clip-text text-transparent">
              {policyType === "financial" ? "Financial Policy" : "Overtime Policy"}
            </DialogTitle>
            <DialogDescription>
              {policyType === "financial" 
                ? "Create a new financial claim policy with limits and settings"
                : "Create a new overtime policy with rates and deduction settings"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Financial Policy Fields */}
            {policyType === "financial" && (
              <>
                {/* Claim Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Claim Name</Label>
                  <Input
                    value={newPolicyForm.claimName}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, claimName: e.target.value}))}
                    placeholder="Claim Name"
                    data-testid="input-claim-name"
                  />
                </div>

                {/* Mileage Based Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mileage-based"
                    checked={newPolicyForm.mileageBased}
                    onCheckedChange={(checked) => setNewPolicyForm(prev => ({...prev, mileageBased: checked as boolean}))}
                    data-testid="checkbox-mileage-based"
                  />
                  <Label htmlFor="mileage-based" className="text-sm">Mileage Based</Label>
                </div>

                {/* Annual Limit */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Annual Limit</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">RM</span>
                    <Input
                      type="number"
                      value={newPolicyForm.annualLimit}
                      onChange={(e) => setNewPolicyForm(prev => ({...prev, annualLimit: e.target.value}))}
                      placeholder="0"
                      className="flex-1"
                      data-testid="input-annual-limit"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unlimited-annual"
                      checked={newPolicyForm.limitUnlimited}
                      onCheckedChange={(checked) => setNewPolicyForm(prev => ({...prev, limitUnlimited: checked as boolean}))}
                      data-testid="checkbox-unlimited-annual"
                    />
                    <Label htmlFor="unlimited-annual" className="text-sm">Unlimited</Label>
                  </div>
                </div>

                {/* Limit per Application */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Limit per Application</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">RM</span>
                    <Input
                      type="number"
                      value={newPolicyForm.limitPerApplication}
                      onChange={(e) => setNewPolicyForm(prev => ({...prev, limitPerApplication: e.target.value}))}
                      placeholder="0"
                      className="flex-1"
                      data-testid="input-limit-per-application"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unlimited-per-app"
                      checked={newPolicyForm.limitPerAppUnlimited}
                      onCheckedChange={(checked) => setNewPolicyForm(prev => ({...prev, limitPerAppUnlimited: checked as boolean}))}
                      data-testid="checkbox-unlimited-per-app"
                    />
                    <Label htmlFor="unlimited-per-app" className="text-sm">Unlimited</Label>
                  </div>
                </div>

                {/* Exclude Employee */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Exclude Employee</Label>
                  <Input
                    value={newPolicyForm.excludeEmployee}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, excludeEmployee: e.target.value}))}
                    placeholder="Exclude Employee"
                    data-testid="input-exclude-employee"
                  />
                </div>

                {/* Claim Remark */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Claim Remark</Label>
                  <Textarea
                    value={newPolicyForm.claimRemark}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, claimRemark: e.target.value}))}
                    placeholder="Claim Remark"
                    rows={3}
                    data-testid="textarea-claim-remark"
                  />
                </div>
              </>
            )}

            {/* Overtime Policy Fields */}
            {policyType === "overtime" && (
              <>
                {/* Overtime Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Overtime Name</Label>
                  <Input
                    value={newPolicyForm.overtimeName}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, overtimeName: e.target.value}))}
                    placeholder="Overtime Name"
                    data-testid="input-overtime-name"
                  />
                </div>

                {/* Deduction Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deduction Type</Label>
                  <Select 
                    value={newPolicyForm.deductionType} 
                    onValueChange={(value) => setNewPolicyForm(prev => ({...prev, deductionType: value}))}
                  >
                    <SelectTrigger data-testid="select-deduction-type">
                      <SelectValue placeholder="Select overtime type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="rest-day">Rest Day</SelectItem>
                      <SelectItem value="public-holiday">Public Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Overtime Rate */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Overtime Rate</Label>
                  <Input
                    type="number"
                    value={newPolicyForm.overtimeRate}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, overtimeRate: e.target.value}))}
                    placeholder="0.00"
                    data-testid="input-overtime-rate"
                  />
                </div>

                {/* Included Employee */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Included Employee</Label>
                  <Input
                    value={newPolicyForm.includedEmployee}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, includedEmployee: e.target.value}))}
                    placeholder="Included Employee"
                    data-testid="input-included-employee"
                  />
                </div>

                {/* Remark */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Remark</Label>
                  <Textarea
                    value={newPolicyForm.remark}
                    onChange={(e) => setNewPolicyForm(prev => ({...prev, remark: e.target.value}))}
                    placeholder="Overtime Remark"
                    rows={3}
                    data-testid="textarea-overtime-remark"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCloseCreatePolicyDialog}
              data-testid="button-cancel-policy"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewPolicy}
              className="bg-blue-900 hover:bg-blue-800 text-white"
              data-testid="button-save-policy"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={showAddDepartmentDialog} onOpenChange={setShowAddDepartmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-cyan-800 bg-clip-text text-transparent">
              Department
            </DialogTitle>
            <DialogDescription>
              Create a new department with name and code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Department Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department Name</Label>
              <Input
                value={newDepartmentForm.name}
                onChange={(e) => setNewDepartmentForm(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g. Human Resource Management"
                data-testid="input-department-name"
              />
            </div>

            {/* Department Code */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Code</Label>
              <Input
                value={newDepartmentForm.code}
                onChange={(e) => setNewDepartmentForm(prev => ({...prev, code: e.target.value}))}
                placeholder="e.g. HRM"
                data-testid="input-department-code"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCloseAddDepartmentDialog}
              data-testid="button-cancel-department"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewDepartment}
              className="bg-blue-900 hover:bg-blue-800 text-white"
              data-testid="button-save-department"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Assign Shift Dialog */}
      <Dialog open={showAssignShiftDialog} onOpenChange={setShowAssignShiftDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Assign Shift
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Tab Navigation */}
            <div className="flex border-b">
              {["role", "department", "employee"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    assignShiftTab === tab 
                      ? "border-b-2 border-blue-600 text-blue-600" 
                      : "text-gray-500"
                  }`}
                  onClick={() => setAssignShiftTab(tab)}
                  data-testid={`tab-${tab}`}
                >
                  By {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label>Search:</Label>
              <Input placeholder="Search..." data-testid="input-search-assign" />
            </div>

            {/* Assignment Table */}
            <div className="border rounded-lg">
              <div className="bg-gray-50 p-3 rounded-t-lg">
                <div className="grid grid-cols-3 gap-4 font-medium">
                  <span>Role</span>
                  <span>Clock In</span>
                  <span>Clock Out</span>
                </div>
              </div>
              <div className="divide-y">
                {assignShiftData.map((item) => (
                  <div key={item.id} className="p-3">
                    <div className="grid grid-cols-3 gap-4">
                      <span>{item.role}</span>
                      <span>{item.clockIn}</span>
                      <span>{item.clockOut}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" data-testid="button-previous">Previous</Button>
              <span className="text-sm text-gray-600">1</span>
              <Button variant="outline" size="sm" data-testid="button-next">Next</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignShiftDialog(false)} data-testid="button-cancel-assign">
              Cancel
            </Button>
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-assign">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shift Dialog */}
      <Dialog open={showCreateShiftDialog} onOpenChange={setShowCreateShiftDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Create New Shift
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Shift Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Shift Information</h4>
              <p className="text-sm text-gray-500">All employees will comply to this shift information.</p>
              
              <div className="space-y-2">
                <Label>Shift Name</Label>
                <Input
                  placeholder="Shift Name"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm(prev => ({...prev, name: e.target.value}))}
                  data-testid="input-shift-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Shift Description</Label>
                <Textarea
                  placeholder="Shift Description"
                  value={shiftForm.description}
                  onChange={(e) => setShiftForm(prev => ({...prev, description: e.target.value}))}
                  data-testid="textarea-shift-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shift Clock In</Label>
                  <Input
                    type="time"
                    value={shiftForm.clockIn}
                    onChange={(e) => setShiftForm(prev => ({...prev, clockIn: e.target.value}))}
                    data-testid="input-shift-clock-in"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift Clock Out</Label>
                  <Input
                    type="time"
                    value={shiftForm.clockOut}
                    onChange={(e) => setShiftForm(prev => ({...prev, clockOut: e.target.value}))}
                    data-testid="input-shift-clock-out"
                  />
                </div>
              </div>
            </div>

            {/* Shift Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Shift Setting</h4>
              <p className="text-sm text-gray-500">All employees will comply to this shift setting.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable employee overwrite setting</Label>
                  <Switch
                    checked={shiftForm.enableOverwriteSetting}
                    onCheckedChange={(checked) => setShiftForm(prev => ({...prev, enableOverwriteSetting: checked}))}
                    data-testid="switch-overwrite-setting"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Enable employee clock in/out selfie</Label>
                  <Switch
                    checked={shiftForm.enableClockInOutSelfie}
                    onCheckedChange={(checked) => setShiftForm(prev => ({...prev, enableClockInOutSelfie: checked}))}
                    data-testid="switch-selfie"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Enable early & late indicator</Label>
                  <Switch
                    checked={shiftForm.enableEarlyLateIndicator}
                    onCheckedChange={(checked) => setShiftForm(prev => ({...prev, enableEarlyLateIndicator: checked}))}
                    data-testid="switch-early-late"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Display attendance confirmation before submit</Label>
                  <Switch
                    checked={shiftForm.displayAttendanceConfirmation}
                    onCheckedChange={(checked) => setShiftForm(prev => ({...prev, displayAttendanceConfirmation: checked}))}
                    data-testid="switch-confirmation"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Enable Auto Clock Out</Label>
                  <Switch
                    checked={shiftForm.enableAutoClockOut}
                    onCheckedChange={(checked) => setShiftForm(prev => ({...prev, enableAutoClockOut: checked}))}
                    data-testid="switch-auto-clock-out"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateShiftDialog(false)} data-testid="button-cancel-shift">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const newShift = {
                  id: shifts.length + 1,
                  name: shiftForm.name || "New Shift",
                  days: Object.entries(shiftForm.workdays)
                    .filter(([_, type]) => type !== "Off Day")
                    .map(([day, _]) => day),
                  description: shiftForm.description || "No description available.",
                  clockIn: shiftForm.clockIn,
                  clockOut: shiftForm.clockOut,
                };
                setShifts(prev => [...prev, newShift]);
                setShowCreateShiftDialog(false);
              }}
              className="bg-blue-900 hover:bg-blue-800"
              data-testid="button-save-shift"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Shift Dialog */}
      <Dialog open={showUpdateShiftDialog} onOpenChange={setShowUpdateShiftDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Update Shift Setting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Shift Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Shift Information</h4>
              <p className="text-sm text-gray-500">All employees will comply to this shift information.</p>
              
              <div className="space-y-2">
                <Label>Shift Name</Label>
                <Input
                  value="Default Shift"
                  readOnly
                  className="bg-gray-50"
                  data-testid="input-update-shift-name"
                />
              </div>
            </div>

            {/* Workday Setting */}
            <div className="space-y-4">
              <h4 className="font-medium">Workday Setting</h4>
              <p className="text-sm text-gray-500">All employees will comply to this workday setting.</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 font-medium text-sm">
                  <span>Working</span>
                  <span>Full Day</span>
                  <span>Half Day</span>
                  <span>Off Day</span>
                </div>
                
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className="grid grid-cols-4 gap-4 items-center">
                    <span className="text-sm">{day}</span>
                    <div className="flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${day === "Sunday" ? "bg-gray-400" : "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800"}`}></div>
                    </div>
                    <div className="flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${day === "Saturday" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800" : "bg-gray-400"}`}></div>
                    </div>
                    <div className="flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${day === "Sunday" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800" : "bg-gray-400"}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Attendance Location</h4>
              <p className="text-sm text-gray-500">All employees will comply to this location setting, clock-ins and clock-outs are restricted within radius area.</p>
              
              <div className="flex items-center justify-between">
                <Label>Enable geofencing location</Label>
                <Switch data-testid="switch-update-geofencing" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Break Setting</h4>
              <p className="text-sm text-gray-500">Schedule break will enable employees to record break time in and out within your shift.</p>
              
              <div className="flex items-center justify-between">
                <Label>Enable Break Time</Label>
                <Switch data-testid="switch-update-break" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Overtime Setting</h4>
              <p className="text-sm text-gray-500">All employees will comply to this shift's attendance overtime setting.</p>
              
              <div className="flex items-center justify-between">
                <Label>Enable overtime calculation</Label>
                <Switch data-testid="switch-update-overtime" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Lateness Setting</h4>
              <p className="text-sm text-gray-500">Shift's attendance lateness setting to count lateness within your clock in and shift clock in.</p>
              
              <div className="flex items-center justify-between">
                <Label>Enable lateness calculation</Label>
                <Switch data-testid="switch-update-lateness" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateShiftDialog(false)} data-testid="button-cancel-update">
              Cancel
            </Button>
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="button-save-update">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog open={showCreateLocationDialog} onOpenChange={setShowCreateLocationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Create Office Location
            </DialogTitle>
            <DialogDescription>
              Set up a new office location for attendance tracking with GPS coordinates and radius validation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Location Name</Label>
              <Input
                id="location-name"
                placeholder="e.g., Main Office"
                value={newLocationForm.name}
                onChange={(e) => setNewLocationForm(prev => ({...prev, name: e.target.value}))}
                data-testid="input-location-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-address">Address</Label>
              <Input
                id="location-address"
                placeholder="Office address"
                value={newLocationForm.address}
                onChange={(e) => setNewLocationForm(prev => ({...prev, address: e.target.value}))}
                data-testid="input-location-address"
              />
            </div>

            <div className="space-y-3">
              <Label>GPS Coordinates</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2"
                  data-testid="button-get-gps"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  {isGettingLocation ? "Getting GPS..." : "Get Current GPS"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-sm">Latitude</Label>
                  <Input
                    placeholder="e.g., 3.1390"
                    value={newLocationForm.latitude}
                    onChange={(e) => setNewLocationForm(prev => ({...prev, latitude: e.target.value}))}
                    data-testid="input-latitude"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Longitude</Label>
                  <Input
                    placeholder="e.g., 101.6869"
                    value={newLocationForm.longitude}
                    onChange={(e) => setNewLocationForm(prev => ({...prev, longitude: e.target.value}))}
                    data-testid="input-longitude"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-radius">Allowed Radius (meters)</Label>
              <Input
                id="location-radius"
                type="number"
                placeholder="50"
                value={newLocationForm.radius}
                onChange={(e) => setNewLocationForm(prev => ({...prev, radius: e.target.value}))}
                data-testid="input-radius"
              />
              <p className="text-xs text-gray-500">Employees must be within this radius to clock in/out</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-status">Status</Label>
              <Select 
                value={newLocationForm.isActive} 
                onValueChange={(value) => setNewLocationForm(prev => ({...prev, isActive: value}))}
              >
                <SelectTrigger data-testid="select-location-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateLocationDialog(false)}
              data-testid="button-cancel-create-location"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createLocationMutation.mutate(newLocationForm)}
              disabled={createLocationMutation.isPending || !newLocationForm.name || !newLocationForm.latitude || !newLocationForm.longitude}
              className="bg-blue-900 hover:bg-blue-800"
              data-testid="button-save-location"
            >
              {createLocationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={showEditLocationDialog} onOpenChange={setShowEditLocationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Edit Office Location
            </DialogTitle>
            <DialogDescription>
              Update office location settings for attendance tracking with GPS coordinates and radius validation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location-name">Location Name</Label>
              <Input
                id="edit-location-name"
                placeholder="e.g., Main Office"
                value={editLocationForm.name}
                onChange={(e) => setEditLocationForm(prev => ({...prev, name: e.target.value}))}
                data-testid="input-edit-location-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location-address">Address</Label>
              <Input
                id="edit-location-address"
                placeholder="Office address"
                value={editLocationForm.address}
                onChange={(e) => setEditLocationForm(prev => ({...prev, address: e.target.value}))}
                data-testid="input-edit-location-address"
              />
            </div>

            <div className="space-y-3">
              <Label>GPS Coordinates</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={getCurrentLocationForEdit}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2"
                  data-testid="button-edit-get-gps"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  {isGettingLocation ? "Getting GPS..." : "Get Current GPS"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-sm">Latitude</Label>
                  <Input
                    placeholder="e.g., 3.1390"
                    value={editLocationForm.latitude}
                    onChange={(e) => setEditLocationForm(prev => ({...prev, latitude: e.target.value}))}
                    data-testid="input-edit-latitude"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Longitude</Label>
                  <Input
                    placeholder="e.g., 101.6869"
                    value={editLocationForm.longitude}
                    onChange={(e) => setEditLocationForm(prev => ({...prev, longitude: e.target.value}))}
                    data-testid="input-edit-longitude"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location-radius">Allowed Radius (meters)</Label>
              <Input
                id="edit-location-radius"
                type="number"
                placeholder="50"
                value={editLocationForm.radius}
                onChange={(e) => setEditLocationForm(prev => ({...prev, radius: e.target.value}))}
                data-testid="input-edit-radius"
              />
              <p className="text-xs text-gray-500">Employees must be within this radius to clock in/out</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location-status">Status</Label>
              <Select 
                value={editLocationForm.isActive} 
                onValueChange={(value) => setEditLocationForm(prev => ({...prev, isActive: value}))}
              >
                <SelectTrigger data-testid="select-edit-location-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditLocationDialog(false)}
              data-testid="button-cancel-edit-location"
            >
              Cancel
            </Button>
            <Button
              onClick={() => currentEditLocation && updateLocationMutation.mutate({...editLocationForm, id: currentEditLocation.id})}
              disabled={updateLocationMutation.isPending || !editLocationForm.name || !editLocationForm.latitude || !editLocationForm.longitude}
              className="bg-blue-900 hover:bg-blue-800"
              data-testid="button-save-edit-location"
            >
              {updateLocationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Update Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
