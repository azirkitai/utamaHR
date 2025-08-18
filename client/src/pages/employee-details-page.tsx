import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Printer, 
  KeyRound, 
  RotateCcw, 
  Edit2,
  UserCheck,
  Phone,
  Users,
  DollarSign,
  FileText,
  Settings,
  ShieldCheck,
  Calculator,
  Clock,
  Building,
  MapPin,
  Mail,
  Plus,
  Eye,
  Trash2,
  Car,
  Camera
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Employee, UpdateEmployee, WorkExperience, InsertWorkExperience, Employment, UpdateEmployment, CompanyAccess } from "@shared/schema";
import { DocumentsTab } from "@/components/DocumentsTab";
import { EquipmentTab } from "@/components/EquipmentTab";
import { LeavePolicyTab } from "@/components/LeavePolicyTab";
import { ClaimPolicyTab } from "@/components/ClaimPolicyTab";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Active tab state for navigation
  const [activeTab, setActiveTab] = useState("personal-details");
  
  // Form states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingDriving, setIsEditingDriving] = useState(false);
  const [isEditingEmployment, setIsEditingEmployment] = useState(false);
  const [isEditingApproval, setIsEditingApproval] = useState(false);
  const [isEditingYearly, setIsEditingYearly] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  const [isEditingStatutoryDetails, setIsEditingStatutoryDetails] = useState(false);
  const [isEditingIncomeTaxDetails, setIsEditingIncomeTaxDetails] = useState(false);
  const [isWorkExperienceDialogOpen, setIsWorkExperienceDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isNewPasswordDialogOpen, setIsNewPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [employmentForm, setEmploymentForm] = useState<Partial<Employment>>({});
  const [contactForm, setContactForm] = useState({
    phoneNumber: "",
    email: "",
    personalEmail: "",
    address: "",
    mailingAddress: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });
  const [familyForm, setFamilyForm] = useState({
    relation: "",
    firstName: "",
    lastName: "",
    gender: "",
    nricPassport: "",
    dateOfBirth: new Date(),
    phoneNo: "",
    email: "",
    address: "",
    employmentStatus: "",
    okuStatus: ""
  });
  
  // Date picker states
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [drivingExpiryDate, setDrivingExpiryDate] = useState<Date | undefined>();
  const [dateJoining, setDateJoining] = useState<Date | undefined>();
  const [dateOfSign, setDateOfSign] = useState<Date | undefined>();
  
  // Work experience form states
  const [workExperienceForm, setWorkExperienceForm] = useState({
    previousCompany: "",
    position: "",
    startDate: new Date(),
    endDate: new Date()
  });

  // Get employee details
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", id],
    enabled: !!id
  });

  // Get work experiences for this employee
  const { data: workExperiences = [], isLoading: workExperiencesLoading } = useQuery<WorkExperience[]>({
    queryKey: ["/api/work-experiences", id],
    enabled: !!id
  });

  // Get employment details for this employee
  const { data: employment, isLoading: employmentLoading } = useQuery<Employment>({
    queryKey: ["/api/employment", id],
    enabled: !!id
  });

  // Get family members for this employee
  const { data: familyMembers = [], isLoading: familyMembersLoading } = useQuery<any[]>({
    queryKey: ["/api/family-members", id],
    enabled: !!id
  });

  // Get current user data for role-based access
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Get employee's user data to display correct role
  const { data: employeeUser } = useQuery<any>({
    queryKey: ["/api/users", employee?.userId],
    enabled: !!employee?.userId,
  });

  // Check if current user can manage roles
  const canManageRoles = () => {
    if (!currentUser) return false;
    const authorizedRoles = ["Super Admin", "Admin", "HR Manager", "PIC"];
    return authorizedRoles.includes(currentUser.role);
  };

  // Initialize forms when data loads
  useEffect(() => {
    if (employee) {
      setEmployeeForm(employee);
      setDateOfBirth(employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined);
      setDrivingExpiryDate(employee.drivingExpiryDate ? new Date(employee.drivingExpiryDate) : undefined);
    }
  }, [employee]);

  useEffect(() => {
    if (employment) {
      setEmploymentForm(employment);
      setDateJoining(employment.dateJoining ? new Date(employment.dateJoining) : undefined);
      setDateOfSign(employment.dateOfSign ? new Date(employment.dateOfSign) : undefined);
    }
  }, [employment]);

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: UpdateEmployee) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Maklumat pekerja telah dikemaskini",
      });
      setIsEditingPersonal(false);
      setIsEditingDriving(false);
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini maklumat pekerja",
        variant: "destructive",
      });
    },
  });

  // Update/Create employment mutation
  const updateEmploymentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check if employment record exists
      const method = employment?.id ? "PUT" : "POST";
      const url = employment?.id ? `/api/employment/${employment.id}` : "/api/employment";
      const response = await apiRequest(method, url, { ...data, employeeId: id });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Maklumat pekerjaan telah dikemaskini",
      });
      setIsEditingEmployment(false);
      setIsEditingApproval(false);
      setIsEditingYearly(false);
      queryClient.invalidateQueries({ queryKey: ["/api/employment", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini maklumat pekerjaan",
        variant: "destructive",
      });
    },
  });

  // Create work experience mutation
  const createWorkExperienceMutation = useMutation({
    mutationFn: async (data: InsertWorkExperience) => {
      const response = await apiRequest("POST", "/api/work-experiences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Pengalaman kerja telah ditambah",
      });
      setIsWorkExperienceDialogOpen(false);
      setWorkExperienceForm({
        previousCompany: "",
        position: "",
        startDate: new Date(),
        endDate: new Date()
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-experiences", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal menambah pengalaman kerja",
        variant: "destructive",
      });
    },
  });

  // Delete work experience mutation
  const deleteWorkExperienceMutation = useMutation({
    mutationFn: async (workExperienceId: string) => {
      const response = await apiRequest("DELETE", `/api/work-experiences/${workExperienceId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Pengalaman kerja telah dipadam",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-experiences", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal memadamkan pengalaman kerja",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const calculatePeriod = (startDate: Date, endDate: Date): string => {
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    
    let totalMonths = years * 12 + months;
    if (totalMonths < 0) totalMonths = 0;
    
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    
    if (displayYears > 0 && displayMonths > 0) {
      return `${displayYears} tahun ${displayMonths} bulan`;
    } else if (displayYears > 0) {
      return `${displayYears} tahun`;
    } else {
      return `${displayMonths} bulan`;
    }
  };

  // Profile picture upload handlers
  const handleGetProfileUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handleProfileUploadComplete = async (result: any) => {
    console.log("Profile upload complete result:", result);
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const profileImageURL = uploadedFile.uploadURL;
        
        console.log("Updating profile with image URL:", profileImageURL);

        // Update employee profile with the new image URL
        const response = await apiRequest("PUT", `/api/employees/${id}/profile-image`, {
          profileImageUrl: profileImageURL
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Profile image update response:", data);
          toast({
            title: "Berjaya",
            description: "Gambar profil telah dikemaskini",
          });
          // Refresh employee data to show new profile image
          queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
        }
      } else {
        console.error("No successful uploads in result:", result);
        throw new Error("Tiada fail berjaya dimuat naik");
      }
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast({
        title: "Ralat",
        description: `Gagal mengemaskini gambar profil: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleSavePersonalDetails = () => {
    const updatedData = { ...employeeForm };
    // Remove undefined fields to avoid validation errors
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key as keyof typeof updatedData] === undefined) {
        delete updatedData[key as keyof typeof updatedData];
      }
    });
    updateEmployeeMutation.mutate(updatedData);
  };

  const handleSaveDrivingLicense = () => {
    const updatedData = { ...employeeForm };
    // Remove undefined fields to avoid validation errors
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key as keyof typeof updatedData] === undefined) {
        delete updatedData[key as keyof typeof updatedData];
      }
    });
    updateEmployeeMutation.mutate(updatedData);
  };

  const handleAddWorkExperience = () => {
    if (!id) return;
    
    const period = calculatePeriod(workExperienceForm.startDate, workExperienceForm.endDate);
    
    const data: InsertWorkExperience = {
      employeeId: id,
      previousCompany: workExperienceForm.previousCompany,
      position: workExperienceForm.position,
      startDate: workExperienceForm.startDate,
      endDate: workExperienceForm.endDate,
      period: period,
    };
    
    createWorkExperienceMutation.mutate(data);
  };

  const handleDeleteWorkExperience = (workExperienceId: string) => {
    if (confirm("Adakah anda pasti untuk memadamkan pengalaman kerja ini?")) {
      deleteWorkExperienceMutation.mutate(workExperienceId);
    }
  };

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Maklumat contact telah dikemaskini",
      });
      setIsEditingContact(false);
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mengkemaskini maklumat contact",
        variant: "destructive",
      });
    },
  });

  const handleSaveContact = () => {
    const updatedData = { ...contactForm };
    updateContactMutation.mutate(updatedData);
  };

  // Create family member mutation
  const createFamilyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/family-members", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Ahli keluarga telah ditambah",
      });
      setIsFamilyDialogOpen(false);
      setFamilyForm({
        relation: "",
        firstName: "",
        lastName: "",
        gender: "",
        nricPassport: "",
        dateOfBirth: new Date(),
        phoneNo: "",
        email: "",
        address: "",
        employmentStatus: "",
        okuStatus: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/family-members", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal menambah ahli keluarga",
        variant: "destructive",
      });
    },
  });

  // Delete family member mutation
  const deleteFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      const response = await apiRequest("DELETE", `/api/family-members/${familyId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Ahli keluarga telah dipadam",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/family-members", id] });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal memadamkan ahli keluarga",
        variant: "destructive",
      });
    },
  });

  const handleAddFamily = () => {
    if (!id) return;
    
    const data = {
      employeeId: id,
      ...familyForm,
    };
    
    createFamilyMutation.mutate(data);
  };

  const handleDeleteFamily = (familyId: string) => {
    if (confirm("Adakah anda pasti untuk memadamkan ahli keluarga ini?")) {
      deleteFamilyMutation.mutate(familyId);
    }
  };

  // Change Password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PUT", `/api/employees/${id}/change-password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Password telah berjaya ditukar",
      });
      setIsChangePasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menukar password",
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = () => {
    // Validation
    if (!passwordForm.currentPassword) {
      toast({
        title: "Ralat",
        description: "Sila masukkan password lama",
        variant: "destructive",
      });
      return;
    }

    if (!passwordForm.newPassword) {
      toast({
        title: "Ralat", 
        description: "Sila masukkan password baru",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Ralat",
        description: "Password baru dan pengesahan password tidak sama",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Ralat",
        description: "Password baru mestilah sekurang-kurangnya 6 aksara",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  // Reset Password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/employees/${id}/reset-password`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPassword(data.newPassword);
      setIsResetPasswordDialogOpen(false);
      setIsNewPasswordDialogOpen(true);
      toast({
        title: "Berjaya",
        description: "Password telah berjaya direset",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mereset password",
        variant: "destructive",
      });
    },
  });

  const handleConfirmResetPassword = () => {
    resetPasswordMutation.mutate();
  };

  const navigationTabs = [
    {
      id: "personal-details",
      label: "Personal Detail",
      icon: UserCheck,
    },
    {
      id: "employment",
      label: "Employment",
      icon: Building,
    },
    {
      id: "contact",
      label: "Contact",
      icon: Phone,
    },
    {
      id: "family-detail",
      label: "Family Detail",
      icon: Users,
    },
    {
      id: "compensation",
      label: "Compensation",
      icon: DollarSign,
    },
    {
      id: "document",
      label: "Document",
      icon: FileText,
    },
    {
      id: "equipment",
      label: "Equipment",
      icon: Settings,
    },
    {
      id: "leave-policy",
      label: "Leave Policy",
      icon: Clock,
    },
    {
      id: "claim-policy",
      label: "Claim Policy",
      icon: ShieldCheck,
    },
  ];

  if (employeeLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading employee details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Employee not found</h2>
          <p className="text-gray-600 mt-2">The employee you're looking for doesn't exist.</p>
          <Button 
            onClick={() => setLocation("/employees")} 
            className="mt-4"
          >
            Back to Employees
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/employees")}
                className="text-blue-600 hover:text-blue-700"
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Employee List
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Employee Detail</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Home</span>
                  <span>›</span>
                  <span>Employee</span>
                  <span>›</span>
                  <span>Detail</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                data-testid="button-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                onClick={() => setIsChangePasswordDialogOpen(true)}
                data-testid="button-change-password"
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => setIsResetPasswordDialogOpen(true)}
                data-testid="button-reset-password"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Employee Header Profile */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-6 mx-6 mt-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-4 border-white cursor-pointer">
                      <AvatarImage 
                        src={employee?.profileImageUrl || ""} 
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="bg-white text-cyan-600 text-2xl font-bold">
                        {employee?.fullName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Upload Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleGetProfileUploadParameters}
                        onComplete={handleProfileUploadComplete}
                        buttonClassName="bg-transparent hover:bg-transparent border-none p-2"
                        resizeImages={true}
                        maxImageWidth={300}
                        maxImageHeight={300}
                        imageQuality={0.9}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </ObjectUploader>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{employee?.fullName || "N/A"}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="bg-blue-800 px-3 py-1 rounded text-sm">
                        {employment?.employeeNo || "Employee No."}
                      </span>
                      <span className="bg-green-600 px-3 py-1 rounded text-sm">N/A</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>N/A</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{"N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">User Role</div>
                  <div className="font-semibold">
                    {(() => {
                      // Determine the correct role to display
                      // Priority: employees.role if it's an approval role, otherwise users.role
                      const approvalRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
                      if (employee?.role && approvalRoles.includes(employee.role)) {
                        return employee.role;
                      } else if (employeeUser?.role && approvalRoles.includes(employeeUser.role)) {
                        return employeeUser.role;
                      } else {
                        return employee?.role || employeeUser?.role || "Staff/Employee";
                      }
                    })()}
                  </div>
                  <div className="text-sm opacity-90 mt-2">Department</div>
                  <div className="font-semibold">{employment?.department || "Human Resource"}</div>
                </div>
              </div>
            </div>

            {/* Content Area with Navigation and Tab Content */}
            <div className="flex gap-6 p-6">
              {/* Left Navigation Tabs */}
              <div className="w-80 bg-white rounded-lg shadow-md border min-h-[500px] h-fit sticky top-6">
                <div className="p-4">
                  <nav className="space-y-1">
                    {navigationTabs.map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            activeTab === tab.id
                              ? "bg-cyan-100 text-cyan-700 border-l-4 border-cyan-500"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                          data-testid={`nav-tab-${tab.id}`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Right Tab Content Area */}
              <div className="flex-1">
              {activeTab === "personal-details" && (
                <div className="space-y-6">
                  {/* Personal Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5" />
                          Personal Details
                        </CardTitle>
                        {!isEditingPersonal ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingPersonal(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-personal"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">First Name</Label>
                          {isEditingPersonal ? (
                            <Input
                              value={employeeForm.firstName || ""}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                              className="mt-1"
                              data-testid="input-first-name"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.firstName || "N/A"}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Last Name</Label>
                          {isEditingPersonal ? (
                            <Input
                              value={employeeForm.lastName || ""}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                              className="mt-1"
                              data-testid="input-last-name"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.lastName || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">NRIC</Label>
                          {isEditingPersonal ? (
                            <Input
                              value={employeeForm.nric || ""}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, nric: e.target.value })}
                              className="mt-1"
                              data-testid="input-nric"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.nric || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Date of Birth</Label>
                          {isEditingPersonal ? (
                            <Input
                              type="date"
                              value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ""}
                              onChange={(e) => {
                                const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                                setDateOfBirth(dateValue);
                                setEmployeeForm({ ...employeeForm, dateOfBirth: dateValue });
                              }}
                              className="mt-1"
                              data-testid="input-date-birth"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-MY') : "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">NRIC (Old)</Label>
                          {isEditingPersonal ? (
                            <Input
                              value={employeeForm.nricOld || ""}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, nricOld: e.target.value })}
                              className="mt-1"
                              data-testid="input-nric-old"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.nricOld || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Place of Birth</Label>
                          {isEditingPersonal ? (
                            <Input
                              value={employeeForm.placeOfBirth || ""}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, placeOfBirth: e.target.value })}
                              className="mt-1"
                              data-testid="input-place-birth"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.placeOfBirth || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Gender</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.gender || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, gender: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.gender || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Race</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.race || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, race: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select race" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Malay">Malay</SelectItem>
                                <SelectItem value="Chinese">Chinese</SelectItem>
                                <SelectItem value="Indian">Indian</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.race || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Religion</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.religion || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, religion: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select religion" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Islam">Islam</SelectItem>
                                <SelectItem value="Christian">Christian</SelectItem>
                                <SelectItem value="Buddhist">Buddhist</SelectItem>
                                <SelectItem value="Hindu">Hindu</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.religion || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Blood Type</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.bloodType || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, bloodType: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select blood type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="AB">AB</SelectItem>
                                <SelectItem value="O">O</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.bloodType || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Education Level</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.educationLevel || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, educationLevel: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select education level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Primary School">Primary School</SelectItem>
                                <SelectItem value="Secondary School">Secondary School</SelectItem>
                                <SelectItem value="Diploma">Diploma</SelectItem>
                                <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                                <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                                <SelectItem value="PhD">PhD</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.educationLevel || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Marital Status</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.maritalStatus || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, maritalStatus: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                                <SelectItem value="Divorced">Divorced</SelectItem>
                                <SelectItem value="Widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.maritalStatus || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Family Members</Label>
                          {isEditingPersonal ? (
                            <Input
                              type="number"
                              value={employeeForm.familyMembers || 0}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, familyMembers: parseInt(e.target.value) || 0 })}
                              className="mt-1"
                              data-testid="input-family-members"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.familyMembers || 0}
                            </div>
                          )}
                        </div>

                        {/* Role Dropdown - Only visible to authorized roles */}
                        {canManageRoles() && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Role</Label>
                            {isEditingPersonal ? (
                              <Select 
                                value={employeeForm.role || "Staff/Employee"} 
                                onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}
                              >
                                <SelectTrigger className="mt-1" data-testid="select-employee-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                  <SelectItem value="HR Manager">HR Manager</SelectItem>
                                  <SelectItem value="PIC">PIC</SelectItem>
                                  <SelectItem value="Finance/Account">Finance/Account</SelectItem>
                                  <SelectItem value="Manager/Supervisor">Manager/Supervisor</SelectItem>
                                  <SelectItem value="Staff/Employee">Staff/Employee</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {(() => {
                                  // Determine the correct role to display
                                  // Priority: employees.role if it's an approval role, otherwise users.role
                                  const approvalRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
                                  if (employee?.role && approvalRoles.includes(employee.role)) {
                                    return employee.role;
                                  } else if (employeeUser?.role && approvalRoles.includes(employeeUser.role)) {
                                    return employeeUser.role;
                                  } else {
                                    return employee?.role || employeeUser?.role || "Staff/Employee";
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Nationality</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.nationality || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, nationality: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select nationality" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Malaysian">Malaysian</SelectItem>
                                <SelectItem value="Foreigner">Foreigner</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.nationality || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Bumi Status</Label>
                          {isEditingPersonal ? (
                            <Select value={employeeForm.bumiStatus || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, bumiStatus: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select bumi status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bumiputera">Bumiputera</SelectItem>
                                <SelectItem value="Non-Bumiputera">Non-Bumiputera</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.bumiStatus || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditingPersonal && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingPersonal(false)}
                            data-testid="button-cancel-personal"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSavePersonalDetails}
                            disabled={updateEmployeeMutation.isPending}
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            data-testid="button-save-personal"
                          >
                            {updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Driving License Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Car className="w-5 h-5" />
                          Driving License Details
                        </CardTitle>
                        {!isEditingDriving ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingDriving(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-driving"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Driving License Number</Label>
                          {isEditingDriving ? (
                            <Input
                              value={employeeForm.drivingLicenseNumber || ""}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, drivingLicenseNumber: e.target.value })}
                              className="mt-1"
                              data-testid="input-driving-license-number"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.drivingLicenseNumber || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Driving Class</Label>
                          {isEditingDriving ? (
                            <Select value={employeeForm.drivingClass || ""} onValueChange={(value) => setEmployeeForm({ ...employeeForm, drivingClass: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select driving class" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="B2">B2 (Motorcycle)</SelectItem>
                                <SelectItem value="D">D (Car)</SelectItem>
                                <SelectItem value="DA">DA (Auto Car)</SelectItem>
                                <SelectItem value="E">E (Heavy Vehicle)</SelectItem>
                                <SelectItem value="E1">E1 (Lorry)</SelectItem>
                                <SelectItem value="E2">E2 (Heavy Lorry)</SelectItem>
                                <SelectItem value="F">F (Tractor)</SelectItem>
                                <SelectItem value="G">G (Road Roller)</SelectItem>
                                <SelectItem value="H">H (Bulldozer)</SelectItem>
                                <SelectItem value="I">I (Bus)</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.drivingClass || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Driving Expiry Date</Label>
                          {isEditingDriving ? (
                            <Input
                              type="date"
                              value={drivingExpiryDate ? drivingExpiryDate.toISOString().split('T')[0] : ""}
                              onChange={(e) => {
                                const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                                setDrivingExpiryDate(dateValue);
                                setEmployeeForm({ ...employeeForm, drivingExpiryDate: dateValue });
                              }}
                              className="mt-1"
                              data-testid="input-driving-expiry"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employee?.drivingExpiryDate ? new Date(employee.drivingExpiryDate).toLocaleDateString('en-MY') : "N/A"}
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditingDriving && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingDriving(false)}
                            data-testid="button-cancel-driving"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveDrivingLicense}
                            disabled={updateEmployeeMutation.isPending}
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            data-testid="button-save-driving"
                          >
                            {updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Work Experience Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Work Experience
                        </CardTitle>
                        <Dialog open={isWorkExperienceDialogOpen} onOpenChange={setIsWorkExperienceDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              data-testid="button-add-work-experience"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Add Work Experience</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="previous-company" className="text-right">
                                  Previous Company
                                </Label>
                                <Input
                                  id="previous-company"
                                  value={workExperienceForm.previousCompany}
                                  onChange={(e) => setWorkExperienceForm({ ...workExperienceForm, previousCompany: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="position" className="text-right">
                                  Position
                                </Label>
                                <Input
                                  id="position"
                                  value={workExperienceForm.position}
                                  onChange={(e) => setWorkExperienceForm({ ...workExperienceForm, position: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="start-date" className="text-right">
                                  Start Date
                                </Label>
                                <Input
                                  type="date"
                                  id="start-date"
                                  value={workExperienceForm.startDate ? workExperienceForm.startDate.toISOString().split('T')[0] : ""}
                                  onChange={(e) => setWorkExperienceForm({ ...workExperienceForm, startDate: e.target.value ? new Date(e.target.value) : new Date() })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="end-date" className="text-right">
                                  End Date
                                </Label>
                                <Input
                                  type="date"
                                  id="end-date"
                                  value={workExperienceForm.endDate ? workExperienceForm.endDate.toISOString().split('T')[0] : ""}
                                  onChange={(e) => setWorkExperienceForm({ ...workExperienceForm, endDate: e.target.value ? new Date(e.target.value) : new Date() })}
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="submit"
                                onClick={handleAddWorkExperience}
                                disabled={createWorkExperienceMutation.isPending}
                                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                              >
                                {createWorkExperienceMutation.isPending ? "Adding..." : "Add Experience"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left py-3 px-4 font-medium text-gray-700">No.</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Previous Company</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Position</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Period</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workExperiencesLoading ? (
                              <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                  Loading work experiences...
                                </td>
                              </tr>
                            ) : workExperiences.length > 0 ? (
                              workExperiences.map((experience, index) => (
                                <tr key={experience.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">{index + 1}</td>
                                  <td className="py-3 px-4">{experience.previousCompany}</td>
                                  <td className="py-3 px-4">{experience.position}</td>
                                  <td className="py-3 px-4">
                                    {experience.startDate ? new Date(experience.startDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'short' }) : "-"}
                                  </td>
                                  <td className="py-3 px-4">
                                    {experience.endDate ? new Date(experience.endDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'short' }) : "-"}
                                  </td>
                                  <td className="py-3 px-4">{experience.period || "-"}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteWorkExperience(experience.id)}
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        data-testid={`button-delete-experience-${experience.id}`}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                  No work experience recorded
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "employment" && (
                <div className="space-y-6">
                  {/* Employment Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Employment Details
                        </CardTitle>
                        {!isEditingEmployment ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingEmployment(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-employment"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Employee No.</Label>
                          {isEditingEmployment ? (
                            <Input
                              value={employmentForm.employeeNo || ""}
                              onChange={(e) => setEmploymentForm({ ...employmentForm, employeeNo: e.target.value })}
                              className="mt-1"
                              data-testid="input-employee-no"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.employeeNo || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Company</Label>
                          {isEditingEmployment ? (
                            <Select value={employmentForm.company || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, company: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UtamaHR Sdn Bhd">UtamaHR Sdn Bhd</SelectItem>
                                <SelectItem value="Digital Solutions Sdn Bhd">Digital Solutions Sdn Bhd</SelectItem>
                                <SelectItem value="Tech Innovation Sdn Bhd">Tech Innovation Sdn Bhd</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.company || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Designation</Label>
                          {isEditingEmployment ? (
                            <Input
                              value={employmentForm.designation || ""}
                              onChange={(e) => setEmploymentForm({ ...employmentForm, designation: e.target.value })}
                              className="mt-1"
                              data-testid="input-designation"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.designation || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Branch Location</Label>
                          {isEditingEmployment ? (
                            <Input
                              value={employmentForm.branchLocation || ""}
                              onChange={(e) => setEmploymentForm({ ...employmentForm, branchLocation: e.target.value })}
                              className="mt-1"
                              data-testid="input-branch-location"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.branchLocation || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Date Joining</Label>
                          {isEditingEmployment ? (
                            <Input
                              type="date"
                              value={dateJoining ? dateJoining.toISOString().split('T')[0] : ""}
                              onChange={(e) => {
                                const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                                setDateJoining(dateValue);
                                setEmploymentForm({ ...employmentForm, dateJoining: dateValue });
                              }}
                              className="mt-1"
                              data-testid="input-date-joining"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.dateJoining ? new Date(employmentForm.dateJoining).toLocaleDateString('en-MY') : "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Date of Sign (LO)</Label>
                          {isEditingEmployment ? (
                            <Input
                              type="date"
                              value={dateOfSign ? dateOfSign.toISOString().split('T')[0] : ""}
                              onChange={(e) => {
                                const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                                setDateOfSign(dateValue);
                                setEmploymentForm({ ...employmentForm, dateOfSign: dateValue });
                              }}
                              className="mt-1"
                              data-testid="input-date-of-sign"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.dateOfSign ? new Date(employmentForm.dateOfSign).toLocaleDateString('en-MY') : "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Employee Type</Label>
                          {isEditingEmployment ? (
                            <Select value={employmentForm.employmentType || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, employmentType: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select employee type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Permanent">Permanent</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Probation">Probation</SelectItem>
                                <SelectItem value="Internship">Internship</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.employmentType || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Department</Label>
                          {isEditingEmployment ? (
                            <Select value={employmentForm.department || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, department: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Human Resources">Human Resources</SelectItem>
                                <SelectItem value="Information Technology">Information Technology</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Operations">Operations</SelectItem>
                                <SelectItem value="Sales">Sales</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.department || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Employee Status</Label>
                          {isEditingEmployment ? (
                            <Select value={employmentForm.employmentStatus || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, employmentStatus: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select employee status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Employed">Employed</SelectItem>
                                <SelectItem value="Resigned">Resigned</SelectItem>
                                <SelectItem value="Terminated">Terminated</SelectItem>
                                <SelectItem value="Retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.employmentStatus || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">OKU Status</Label>
                          {isEditingEmployment ? (
                            <Select value={employmentForm.okuStatus || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, okuStatus: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select OKU status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="No">No</SelectItem>
                                <SelectItem value="Yes">Yes</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {employmentForm.okuStatus || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditingEmployment && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingEmployment(false)}
                            data-testid="button-cancel-employment"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            onClick={() => updateEmploymentMutation.mutate(employmentForm)}
                            disabled={updateEmploymentMutation.isPending}
                            data-testid="button-save-employment"
                          >
                            {updateEmploymentMutation.isPending ? "Menyimpan..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Approval Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5" />
                          Approval Details
                        </CardTitle>
                        {!isEditingApproval ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingApproval(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-approval"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Leave Supervisor */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">1) Leave Supervisor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">First Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.leaveFirstApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, leaveFirstApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.leaveFirstApproval || "N/A"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Second Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.leaveSecondApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, leaveSecondApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.leaveSecondApproval || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Claim Supervisor */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">2) Claim Supervisor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">First Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.claimFirstApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, claimFirstApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.claimFirstApproval || "N/A"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Second Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.claimSecondApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, claimSecondApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.claimSecondApproval || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Overtime Supervisor */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">3) Overtime Supervisor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">First Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.overtimeFirstApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, overtimeFirstApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.overtimeFirstApproval || "N/A"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Second Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.overtimeSecondApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, overtimeSecondApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.overtimeSecondApproval || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timeoff Supervisor */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">4) Timeoff Supervisor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">First Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.timeoffFirstApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, timeoffFirstApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.timeoffFirstApproval || "N/A"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Second Approval</Label>
                            {isEditingApproval ? (
                              <Select value={employmentForm.timeoffSecondApproval || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, timeoffSecondApproval: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                                  <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                                  <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                {employmentForm.timeoffSecondApproval || "N/A"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEditingApproval && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingApproval(false)}
                            data-testid="button-cancel-approval"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            onClick={() => updateEmploymentMutation.mutate(employmentForm)}
                            disabled={updateEmploymentMutation.isPending}
                            data-testid="button-save-approval"
                          >
                            {updateEmploymentMutation.isPending ? "Menyimpan..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Yearly Form Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Yearly Form
                        </CardTitle>
                        {!isEditingYearly ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingYearly(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-yearly"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">EA Person in Charge</Label>
                          {isEditingYearly ? (
                          <Select value={employmentForm.eaPersonInCharge || ""} onValueChange={(value) => setEmploymentForm({ ...employmentForm, eaPersonInCharge: value })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select EA person in charge" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ahmad Rahman">Ahmad Rahman</SelectItem>
                              <SelectItem value="Siti Nurhaliza">Siti Nurhaliza</SelectItem>
                              <SelectItem value="Tan Wei Ming">Tan Wei Ming</SelectItem>
                              <SelectItem value="Lim Swee Hock">Lim Swee Hock</SelectItem>
                              <SelectItem value="Fatimah Zahra">Fatimah Zahra</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            {employmentForm.eaPersonInCharge || "N/A"}
                          </div>
                        )}
                        </div>
                      </div>

                      {isEditingYearly && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingYearly(false)}
                            data-testid="button-cancel-yearly"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            onClick={() => updateEmploymentMutation.mutate(employmentForm)}
                            disabled={updateEmploymentMutation.isPending}
                            data-testid="button-save-yearly"
                          >
                            {updateEmploymentMutation.isPending ? "Menyimpan..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Company Access Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Company Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">UtamaHR Sdn Bhd</Label>
                          <div className="mt-1 p-2 bg-green-50 rounded border border-green-200 flex items-center justify-between">
                            <span className="text-sm text-green-700">Company Access</span>
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Active</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Digital Solutions Sdn Bhd</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                            <span className="text-sm text-gray-700">Company Access</span>
                            <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Inactive</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Tech Innovation Sdn Bhd</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                            <span className="text-sm text-gray-700">Company Access</span>
                            <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">Inactive</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "contact" && (
                <div className="space-y-6">
                  {/* Contact Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Phone className="w-5 h-5" />
                          Contact Details
                        </CardTitle>
                        {!isEditingContact ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingContact(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-contact"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Phone Number</Label>
                          {isEditingContact ? (
                            <Input
                              value={contactForm.phoneNumber || ""}
                              onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                              className="mt-1"
                              data-testid="input-phone-number"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.phoneNumber || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Email</Label>
                          {isEditingContact ? (
                            <Input
                              type="email"
                              value={contactForm.email || ""}
                              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                              className="mt-1"
                              data-testid="input-email"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.email || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Personal Email</Label>
                          {isEditingContact ? (
                            <Input
                              type="email"
                              value={contactForm.personalEmail || ""}
                              onChange={(e) => setContactForm({ ...contactForm, personalEmail: e.target.value })}
                              className="mt-1"
                              data-testid="input-personal-email"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.personalEmail || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Address</Label>
                          {isEditingContact ? (
                            <Input
                              value={contactForm.address || ""}
                              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                              className="mt-1"
                              data-testid="input-address"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.address || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium text-gray-700 block">Mailing Address</Label>
                          {isEditingContact ? (
                            <Input
                              value={contactForm.mailingAddress || ""}
                              onChange={(e) => setContactForm({ ...contactForm, mailingAddress: e.target.value })}
                              className="mt-1"
                              data-testid="input-mailing-address"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.mailingAddress || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Horizontal Line */}
                      <div className="my-6 border-t border-gray-200"></div>

                      {/* Emergency Contact Sub Header */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Emergency Contact</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Contact Name</Label>
                          {isEditingContact ? (
                            <Input
                              value={contactForm.emergencyContactName || ""}
                              onChange={(e) => setContactForm({ ...contactForm, emergencyContactName: e.target.value })}
                              className="mt-1"
                              data-testid="input-emergency-contact-name"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.emergencyContactName || "N/A"}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Contact Phone (Mobile)</Label>
                          {isEditingContact ? (
                            <Input
                              value={contactForm.emergencyContactPhone || ""}
                              onChange={(e) => setContactForm({ ...contactForm, emergencyContactPhone: e.target.value })}
                              className="mt-1"
                              data-testid="input-emergency-contact-phone"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              {contactForm.emergencyContactPhone || "N/A"}
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditingContact && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingContact(false)}
                            data-testid="button-cancel-contact"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveContact}
                            disabled={updateContactMutation.isPending}
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            data-testid="button-save-contact"
                          >
                            {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "family-detail" && (
                <div className="space-y-6">
                  {/* Family Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Family Details
                        </CardTitle>
                        <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white text-cyan-600 hover:bg-gray-50"
                              data-testid="button-add-family"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Add Family Details</DialogTitle>
                              <DialogDescription>
                                Add family member information to the employee record.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="text-lg font-medium text-gray-800 mb-4">Family Information</div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="relation">Relation</Label>
                                  <Select value={familyForm.relation} onValueChange={(value) => setFamilyForm({ ...familyForm, relation: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select family relation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Father">Father</SelectItem>
                                      <SelectItem value="Mother">Mother</SelectItem>
                                      <SelectItem value="Spouse">Spouse</SelectItem>
                                      <SelectItem value="Son">Son</SelectItem>
                                      <SelectItem value="Daughter">Daughter</SelectItem>
                                      <SelectItem value="Brother">Brother</SelectItem>
                                      <SelectItem value="Sister">Sister</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="first-name">First Name</Label>
                                  <Input
                                    id="first-name"
                                    value={familyForm.firstName}
                                    onChange={(e) => setFamilyForm({ ...familyForm, firstName: e.target.value })}
                                    placeholder="First Name"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="last-name">Last Name</Label>
                                  <Input
                                    id="last-name"
                                    value={familyForm.lastName}
                                    onChange={(e) => setFamilyForm({ ...familyForm, lastName: e.target.value })}
                                    placeholder="Last Name"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="gender">Gender</Label>
                                  <Select value={familyForm.gender} onValueChange={(value) => setFamilyForm({ ...familyForm, gender: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="nricPassport">NRIC/Passport</Label>
                                  <Input
                                    id="nricPassport"
                                    value={familyForm.nricPassport}
                                    onChange={(e) => setFamilyForm({ ...familyForm, nricPassport: e.target.value })}
                                    placeholder="NRIC/Passport"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="date-of-birth">Date of Birth</Label>
                                  <Input
                                    id="date-of-birth"
                                    type="date"
                                    value={familyForm.dateOfBirth ? familyForm.dateOfBirth.toISOString().split('T')[0] : ""}
                                    onChange={(e) => {
                                      const dateValue = e.target.value ? new Date(e.target.value) : new Date();
                                      setFamilyForm({ ...familyForm, dateOfBirth: dateValue });
                                    }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="phoneNo">Phone No.</Label>
                                  <Input
                                    id="phoneNo"
                                    value={familyForm.phoneNo}
                                    onChange={(e) => setFamilyForm({ ...familyForm, phoneNo: e.target.value })}
                                    placeholder="Phone No."
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={familyForm.email}
                                    onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })}
                                    placeholder="Email"
                                  />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="address">Address</Label>
                                  <Input
                                    id="address"
                                    value={familyForm.address}
                                    onChange={(e) => setFamilyForm({ ...familyForm, address: e.target.value })}
                                    placeholder="Address"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="employment-status">Employment Status</Label>
                                  <Select value={familyForm.employmentStatus} onValueChange={(value) => setFamilyForm({ ...familyForm, employmentStatus: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select family employment status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Employed">Employed</SelectItem>
                                      <SelectItem value="Unemployed">Unemployed</SelectItem>
                                      <SelectItem value="Student">Student</SelectItem>
                                      <SelectItem value="Retired">Retired</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="oku-status">OKU Status</Label>
                                  <Select value={familyForm.okuStatus} onValueChange={(value) => setFamilyForm({ ...familyForm, okuStatus: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select family OKU status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="No">No</SelectItem>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsFamilyDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddFamily}
                                disabled={createFamilyMutation.isPending}
                                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                              >
                                {createFamilyMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-700">No.</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Relation</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Age</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {familyMembers.length > 0 ? (
                              familyMembers.map((member, index) => (
                                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-4">{index + 1}</td>
                                  <td className="py-3 px-4">{`${member.firstName} ${member.lastName}`}</td>
                                  <td className="py-3 px-4">{member.relation}</td>
                                  <td className="py-3 px-4">
                                    {member.dateOfBirth ? 
                                      new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear() 
                                      : "N/A"
                                    }
                                  </td>
                                  <td className="py-3 px-4">{member.phoneNo || "N/A"}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteFamily(member.id)}
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        data-testid={`button-delete-family-${member.id}`}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                  No family members recorded
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "compensation" && (
                <div className="space-y-6">
                  {/* Bank Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Bank Details
                        </CardTitle>
                        {!isEditingBankDetails ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingBankDetails(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-bank-details"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Bank</Label>
                          {isEditingBankDetails ? (
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select bank" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="affin-bank">Affin Bank Berhad / Affin Islamic Bank</SelectItem>
                                <SelectItem value="alliance-bank">Alliance Bank Malaysia Berhad</SelectItem>
                                <SelectItem value="al-rajhi">Al-Rajhi Banking & Investment Corp (M) Berhad</SelectItem>
                                <SelectItem value="ambank">AmBank Berhad</SelectItem>
                                <SelectItem value="bank-islam">Bank Islam Malaysia Berhad</SelectItem>
                                <SelectItem value="bank-kerjasama">Bank Kerjasama Rakyat Malaysia</SelectItem>
                                <SelectItem value="bank-muamalat">Bank Muamalat</SelectItem>
                                <SelectItem value="bank-of-america">Bank of America</SelectItem>
                                <SelectItem value="bank-of-china">Bank of China (M) Berhad</SelectItem>
                                <SelectItem value="bank-of-tokyo">Bank of Tokyo-Mitsubishi UFJ (M) Berhad</SelectItem>
                                <SelectItem value="bank-pertanian">Bank Pertanian Malaysia Berhad (Agrobank)</SelectItem>
                                <SelectItem value="bank-simpanan">Bank Simpanan Nasional Berhad</SelectItem>
                                <SelectItem value="cimb">CIMB Bank Berhad</SelectItem>
                                <SelectItem value="citibank">Citibank Berhad</SelectItem>
                                <SelectItem value="deutsche-bank">Deutsche Bank (M) Berhad</SelectItem>
                                <SelectItem value="hong-leong">Hong Leong Bank</SelectItem>
                                <SelectItem value="hsbc">HSBC Bank Malaysia Berhad</SelectItem>
                                <SelectItem value="icbc">Industrial & Commercial Bank of China</SelectItem>
                                <SelectItem value="jp-morgan">J.P. Morgan Chase Bank Berhad</SelectItem>
                                <SelectItem value="kuwait-finance">Kuwait Finance House (M) Berhad</SelectItem>
                                <SelectItem value="maybank">Maybank Bank Berhad</SelectItem>
                                <SelectItem value="mizuho">Mizuho Corporate Bank Malaysia</SelectItem>
                                <SelectItem value="ocbc">OCBC Bank (Malaysia) Berhad</SelectItem>
                                <SelectItem value="public-bank">Public Bank Berhad</SelectItem>
                                <SelectItem value="rhb">RHB Bank</SelectItem>
                                <SelectItem value="standard-chartered">Standard Chartered Bank</SelectItem>
                                <SelectItem value="sumitomo-mitsui">Sumitomo Mitsui Banking Corporation Malaysia berha</SelectItem>
                                <SelectItem value="royal-bank-scotland">The Royal Bank of Scotland Berhad</SelectItem>
                                <SelectItem value="united-overseas">United Overseas Bank (Malaysia) Berhad</SelectItem>
                                <SelectItem value="bank-of-singapore">The Bank of Singapore Limited</SelectItem>
                                <SelectItem value="post-office">Post Office Savings Bank</SelectItem>
                                <SelectItem value="kfh-dana">KFH Dana Bank</SelectItem>
                                <SelectItem value="baiduri">Baiduri Bank Sendirian Berhad</SelectItem>
                                <SelectItem value="bank-islam-brunei">Bank Islam Brunei Darussalam</SelectItem>
                                <SelectItem value="mbsb">MBSB Bank Berhad</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              N/A
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Account Number</Label>
                          {isEditingBankDetails ? (
                            <Input
                              placeholder="Account Number"
                              className="mt-1"
                              data-testid="input-account-number"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              N/A
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Account Type</Label>
                          {isEditingBankDetails ? (
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="savings">Savings Account</SelectItem>
                                <SelectItem value="current">Current Account</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              N/A
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Branch</Label>
                          {isEditingBankDetails ? (
                            <Input
                              placeholder="Branch"
                              className="mt-1"
                              data-testid="input-branch"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              N/A
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 block">Account Status</Label>
                          {isEditingBankDetails ? (
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select account status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded border">
                              N/A
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditingBankDetails && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingBankDetails(false)}
                            data-testid="button-cancel-bank-details"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            data-testid="button-save-bank-details"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Statutory Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Statutory Details
                        </CardTitle>
                        {!isEditingStatutoryDetails ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingStatutoryDetails(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-statutory-details"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Employee Provident Fund (EPF) */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Provident Fund (EPF)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">EPF Number</Label>
                            {isEditingStatutoryDetails ? (
                              <Input
                                placeholder="EPF Number"
                                className="mt-1"
                                data-testid="input-epf-number"
                              />
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                N/A
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">EPF Contribution Start Date</Label>
                            {isEditingStatutoryDetails ? (
                              <Select>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="After 1 August 2001" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="after-aug-2001">After 1 August 2001</SelectItem>
                                  <SelectItem value="before-aug-2001">Before 1 August 2001</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                After 1 August 2001
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Social Security Organisation (SOCSO) */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Security Organisation (SOCSO)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">SOCSO Number</Label>
                            {isEditingStatutoryDetails ? (
                              <Input
                                placeholder="SOCSO Number"
                                className="mt-1"
                                data-testid="input-socso-number"
                              />
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                N/A
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">SOCSO Contribution Start Age</Label>
                            {isEditingStatutoryDetails ? (
                              <Input
                                placeholder="SOCSO Contribution Start Age"
                                className="mt-1"
                                data-testid="input-socso-age"
                              />
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                N/A
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">SOCSO Category</Label>
                            {isEditingStatutoryDetails ? (
                              <Select>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="category-1">Category 1</SelectItem>
                                  <SelectItem value="category-2">Category 2</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                None
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Employment Insurance System (EIS) */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Insurance System (EIS)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Contribution Rate</Label>
                            <div className="mt-1 p-2 bg-gray-50 rounded border flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Employee 0.2%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Employer 0.2%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Income Tax */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Income Tax</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Income Tax Number</Label>
                            {isEditingStatutoryDetails ? (
                              <Input
                                placeholder="Income Tax Number"
                                className="mt-1"
                                data-testid="input-income-tax-number"
                              />
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                N/A
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Value of Living Accommodation (VOLA)</Label>
                            {isEditingStatutoryDetails ? (
                              <Input
                                placeholder="0"
                                type="number"
                                className="mt-1"
                                data-testid="input-vola"
                              />
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                0
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEditingStatutoryDetails && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingStatutoryDetails(false)}
                            data-testid="button-cancel-statutory-details"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            data-testid="button-save-statutory-details"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Income Tax Details Card */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          Income Tax Details
                        </CardTitle>
                        {!isEditingIncomeTaxDetails ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingIncomeTaxDetails(true)}
                            className="bg-white text-cyan-600 hover:bg-gray-50"
                            data-testid="button-edit-income-tax-details"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Children Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Children Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Employee has Child</Label>
{isEditingIncomeTaxDetails ? (
                              <div className="flex items-center space-x-2 mt-1">
                                <input type="radio" id="child-yes" name="has-child" value="yes" className="radio" />
                                <Label htmlFor="child-yes" className="text-sm">Yes</Label>
                                <input type="radio" id="child-no" name="has-child" value="no" className="radio ml-4" />
                                <Label htmlFor="child-no" className="text-sm">No</Label>
                              </div>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                No
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Spouse Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Spouse Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Spouse is Working</Label>
{isEditingIncomeTaxDetails ? (
                              <div className="flex items-center space-x-2 mt-1">
                                <input type="radio" id="spouse-working" name="spouse-work" value="yes" className="radio" />
                                <Label htmlFor="spouse-working" className="text-sm">Yes</Label>
                                <input type="radio" id="spouse-not-working" name="spouse-work" value="no" className="radio ml-4" />
                                <Label htmlFor="spouse-not-working" className="text-sm">No</Label>
                              </div>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                No
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Spouse Gender</Label>
{isEditingIncomeTaxDetails ? (
                              <Select>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                N/A
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">Spouse is Disable</Label>
{isEditingIncomeTaxDetails ? (
                              <div className="flex items-center space-x-2 mt-1">
                                <input type="radio" id="spouse-disable" name="spouse-disable" value="yes" className="radio" />
                                <Label htmlFor="spouse-disable" className="text-sm">Yes</Label>
                                <input type="radio" id="spouse-not-disable" name="spouse-disable" value="no" className="radio ml-4" />
                                <Label htmlFor="spouse-not-disable" className="text-sm">No</Label>
                              </div>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                No
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Relief Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Relief Information</h3>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">
                              Contribution to Social Security Organisations (SOCSO) including contributions
                              to the Employment Insurance System (SIP)
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Employee Category */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Category</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 block">
                              Determine whether employee is Returning Expert Programme (REP), Knowledge
                              Worker or Specific Region (sarawak Malaysia) or neither
                            </Label>
{isEditingIncomeTaxDetails ? (
                              <Select>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="rep">Returning Expert Programme (REP)</SelectItem>
                                  <SelectItem value="knowledge-worker">Knowledge Worker</SelectItem>
                                  <SelectItem value="sarawak">Specific Region (Sarawak Malaysia)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="mt-1 p-2 bg-gray-50 rounded border">
                                None
                              </div>
                            )}
                          </div>
                        </div>
                      </div>



                      {isEditingIncomeTaxDetails && (
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingIncomeTaxDetails(false)}
                            data-testid="button-cancel-income-tax-details"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                            data-testid="button-save-income-tax-details"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Document Tab */}
              {activeTab === "document" && (
                <DocumentsTab employeeId={id!} />
              )}

              {/* Equipment Tab */}
              {activeTab === "equipment" && (
                <EquipmentTab employeeId={id!} />
              )}

              {/* Leave Policy Tab */}
              {activeTab === "leave-policy" && (
                <LeavePolicyTab employeeId={id!} />
              )}

              {/* Claim Policy Tab */}
              {activeTab === "claim-policy" && (
                <ClaimPolicyTab employeeId={id!} />
              )}

              {/* Placeholder for other tabs */}
              {!["personal-details", "employment", "contact", "family-detail", "compensation", "document", "equipment", "leave-policy", "claim-policy"].includes(activeTab) && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                    <CardTitle className="capitalize">
                      {activeTab.replace("-", " ")} Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12 text-gray-500">
                      <p>This section is under development.</p>
                      <p className="text-sm mt-2">Coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Tukar password anda dengan memasukkan password lama dan password baru.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Masukkan password lama"
                data-testid="input-current-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Masukkan password baru"
                data-testid="input-new-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Sahkan password baru"
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangePasswordDialogOpen(false);
                setPasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                });
              }}
              data-testid="button-cancel-password"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
              data-testid="button-save-password"
            >
              {changePasswordMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Adakah anda pasti untuk mereset password? Password lama akan dihapuskan dan password baru akan dijana secara automatik.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">!</span>
              </div>
              <div>
                <p className="font-medium text-amber-800">Amaran</p>
                <p className="text-sm text-amber-700">
                  Tindakan ini tidak boleh dibuat asal. Password lama akan dihapuskan secara kekal.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
              data-testid="button-cancel-reset"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Password Display Dialog */}
      <Dialog open={isNewPasswordDialogOpen} onOpenChange={setIsNewPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Baru</DialogTitle>
            <DialogDescription>
              Password baru telah dijana. Sila simpan password ini dengan selamat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-green-800">Berjaya Reset</p>
                  <p className="text-sm text-green-700">
                    Password telah berjaya direset
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password Baru:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-lg bg-gray-50"
                    data-testid="input-generated-password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      toast({
                        title: "Copied",
                        description: "Password telah disalin ke clipboard",
                      });
                    }}
                    data-testid="button-copy-password"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Penting:</strong> Sila simpan password ini dengan selamat. Password ini tidak akan ditunjukkan lagi selepas dialog ini ditutup.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => {
                setIsNewPasswordDialogOpen(false);
                setGeneratedPassword("");
              }}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
              data-testid="button-close-new-password"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}