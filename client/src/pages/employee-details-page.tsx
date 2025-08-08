import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

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

  Clock,
  Building,
  MapPin,
  Mail,
  Plus,
  Eye,
  Trash2,
  Car
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Employee, UpdateEmployee, WorkExperience, InsertWorkExperience, Employment, UpdateEmployment, CompanyAccess } from "@shared/schema";

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
  const [isWorkExperienceDialogOpen, setIsWorkExperienceDialogOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [employmentForm, setEmploymentForm] = useState<Partial<Employment>>({});
  
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
                className="bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-change-password"
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
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
          <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-6 mx-6 mt-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 border-4 border-white">
                    <AvatarImage src="/placeholder-avatar.png" />
                    <AvatarFallback className="bg-white text-teal-600 text-2xl font-bold">
                      {employee?.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{employee?.fullName || "N/A"}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="bg-blue-800 px-3 py-1 rounded text-sm">
                        {employee?.id || "N/A"}
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
                  <div className="font-semibold">Human Resource</div>
                  <div className="text-sm opacity-90 mt-2">Department</div>
                  <div className="font-semibold">{"Human Resource"}</div>
                </div>
              </div>
            </div>

            {/* Content Area with Navigation and Tab Content */}
            <div className="flex gap-6 p-6">
              {/* Left Navigation Tabs */}
              <div className="w-80 bg-white rounded-lg shadow-md border h-fit">
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
                              ? "bg-teal-100 text-teal-700 border-l-4 border-teal-500"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5" />
                          Personal Details
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                          className="text-white hover:bg-white/20"
                          data-testid="button-edit-personal"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          {isEditingPersonal ? "Cancel" : "Update"}
                        </Button>
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
                            className="bg-teal-600 hover:bg-teal-700"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Car className="w-5 h-5" />
                          Driving License Details
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingDriving(!isEditingDriving)}
                          className="text-white hover:bg-white/20"
                          data-testid="button-edit-driving"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          {isEditingDriving ? "Cancel" : "Update"}
                        </Button>
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
                            className="bg-teal-600 hover:bg-teal-700"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
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
                                className="bg-teal-600 hover:bg-teal-700"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
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
                            className="bg-white text-teal-600 hover:bg-gray-50"
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
                            className="bg-teal-600 hover:bg-teal-700"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
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
                            className="bg-white text-teal-600 hover:bg-gray-50"
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
                            className="bg-teal-600 hover:bg-teal-700"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
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
                            className="bg-white text-teal-600 hover:bg-gray-50"
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
                            className="bg-teal-600 hover:bg-teal-700"
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
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
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
                <Card>
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 block">Email</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          N/A
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 block">Phone</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          N/A
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Placeholder for other tabs */}
              {activeTab !== "personal-details" && activeTab !== "employment" && activeTab !== "contact" && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
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
    </DashboardLayout>
  );
}