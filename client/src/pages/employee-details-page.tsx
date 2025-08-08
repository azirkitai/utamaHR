import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Printer, KeyRound, RotateCcw, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import type { Employee, UpdateEmployee, WorkExperience, InsertWorkExperience } from "@shared/schema";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Dialog states
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showAddWorkExperienceDialog, setShowAddWorkExperienceDialog] = useState(false);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [workExperienceForm, setWorkExperienceForm] = useState<Partial<InsertWorkExperience>>({
    employeeId: id,
    previousCompany: "",
    position: "",
    startDate: null,
    endDate: null,
    period: ""
  });

  // Get employee details
  const { data: employee, isLoading: employeeLoading, refetch: refetchEmployee } = useQuery({
    queryKey: ["/api/employees", id],
    enabled: !!id
  });

  // Get work experiences
  const { data: workExperiences, refetch: refetchWorkExperiences } = useQuery({
    queryKey: ["/api/work-experiences", id],
    enabled: !!id
  });

  // Initialize form when employee data loads
  useEffect(() => {
    if (employee) {
      setEmployeeForm(employee);
    }
  }, [employee]);

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
      refetchEmployee();
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini maklumat pekerja",
        variant: "destructive",
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const response = await apiRequest("PUT", `/api/employees/${id}/change-password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Password telah ditukar",
      });
      setShowChangePasswordDialog(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menukar password",
        variant: "destructive",
      });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/employees/${id}/reset-password`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Password telah direset",
      });
      setShowResetPasswordDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mereset password",
        variant: "destructive",
      });
    }
  });

  // Add work experience mutation
  const addWorkExperienceMutation = useMutation({
    mutationFn: async (data: InsertWorkExperience) => {
      const response = await apiRequest("POST", "/api/work-experiences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Pengalaman kerja telah ditambah",
      });
      refetchWorkExperiences();
      setShowAddWorkExperienceDialog(false);
      setWorkExperienceForm({
        employeeId: id,
        previousCompany: "",
        position: "",
        startDate: null,
        endDate: null,
        period: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menambah pengalaman kerja",
        variant: "destructive",
      });
    }
  });

  const handleSaveEmployee = () => {
    if (employeeForm) {
      updateEmployeeMutation.mutate(employeeForm);
    }
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Ralat",
        description: "Password baharu dan pengesahan tidak sama",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleAddWorkExperience = () => {
    if (workExperienceForm.employeeId && workExperienceForm.previousCompany && workExperienceForm.position) {
      addWorkExperienceMutation.mutate(workExperienceForm as InsertWorkExperience);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('ms-MY');
  };

  if (employeeLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pekerja tidak dijumpai</h1>
          <Link href="/employees">
            <Button className="mt-4">Kembali ke Senarai Pekerja</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/employees">
              <Button variant="outline" size="sm" data-testid="button-back-to-list">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Employee List
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Employee Detail
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-print">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowChangePasswordDialog(true)}
              data-testid="button-change-password"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowResetPasswordDialog(true)}
              data-testid="button-reset-password"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
          </div>
        </div>

        {/* Employee Header Card */}
        <Card className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-white">
                  <AvatarImage src={employee.profileImageUrl || ""} />
                  <AvatarFallback className="bg-white text-blue-800 text-xl font-bold">
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="text-white/90 text-lg">{employee.employeeId} • {employee.position}</p>
                  <p className="text-white/80">{employee.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/90">User Role</div>
                <div className="font-semibold">{employee.position}</div>
                <div className="text-white/90 mt-2">Department</div>
                <div className="font-semibold">{employee.department}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="personal" data-testid="tab-personal">Personal Detail</TabsTrigger>
            <TabsTrigger value="employment" data-testid="tab-employment">Employment</TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">Contact</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Document</TabsTrigger>
            <TabsTrigger value="work-experience" data-testid="tab-work-experience">Work Experience</TabsTrigger>
          </TabsList>

          {/* Personal Details */}
          <TabsContent value="personal">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Personal Details
                </CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => isEditing ? handleSaveEmployee() : setIsEditing(true)}
                  disabled={updateEmployeeMutation.isPending}
                  data-testid="button-edit-personal"
                >
                  {updateEmployeeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : isEditing ? null : (
                    <Edit2 className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? "Update" : "Update"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={employeeForm.firstName || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, firstName: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={employeeForm.lastName || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, lastName: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>NRIC</Label>
                    <Input
                      value={employeeForm.nric || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, nric: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-nric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={employeeForm.dateOfBirth ? new Date(employeeForm.dateOfBirth).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, dateOfBirth: new Date(e.target.value)}))}
                      disabled={!isEditing}
                      data-testid="input-date-of-birth"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>NRIC (Old)</Label>
                    <Input
                      value={employeeForm.nricOld || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, nricOld: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-nric-old"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Place of Birth</Label>
                    <Input
                      value={employeeForm.placeOfBirth || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, placeOfBirth: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-place-of-birth"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select 
                      value={employeeForm.gender || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, gender: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Race</Label>
                    <Select 
                      value={employeeForm.race || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, race: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-race">
                        <SelectValue placeholder="Select race" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Melayu">Melayu</SelectItem>
                        <SelectItem value="Cina">Cina</SelectItem>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Select 
                      value={employeeForm.religion || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, religion: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-religion">
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Buddha">Buddha</SelectItem>
                        <SelectItem value="Hindu">Hindu</SelectItem>
                        <SelectItem value="Kristian">Kristian</SelectItem>
                        <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select 
                      value={employeeForm.bloodType || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, bloodType: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-blood-type">
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="AB">AB</SelectItem>
                        <SelectItem value="O">O</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Education Level</Label>
                    <Select 
                      value={employeeForm.educationLevel || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, educationLevel: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-education-level">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPM">SPM</SelectItem>
                        <SelectItem value="STPM">STPM</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Degree">Degree</SelectItem>
                        <SelectItem value="Master">Master</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marital Status</Label>
                    <Select 
                      value={employeeForm.maritalStatus || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, maritalStatus: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-marital-status">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      value={employeeForm.nationality || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, nationality: e.target.value}))}
                      disabled={!isEditing}
                      placeholder="e.g., Malaysian"
                      data-testid="input-nationality"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bumi Status</Label>
                    <Select 
                      value={employeeForm.bumiStatus || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, bumiStatus: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-bumi-status">
                        <SelectValue placeholder="Select Bumi status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bumiputera">Bumiputera</SelectItem>
                        <SelectItem value="Non-Bumiputera">Non-Bumiputera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Family Members</Label>
                    <Input
                      type="number"
                      value={employeeForm.familyMembers || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, familyMembers: e.target.value}))}
                      disabled={!isEditing}
                      placeholder="Number of family members"
                      data-testid="input-family-members"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Details */}
          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input
                      value={employeeForm.employeeId || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, employeeId: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-employee-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={employeeForm.position || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, position: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-position"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={employeeForm.department || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, department: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-department"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Joined</Label>
                    <Input
                      type="date"
                      value={employeeForm.joinDate ? new Date(employeeForm.joinDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, joinDate: new Date(e.target.value)}))}
                      disabled={!isEditing}
                      data-testid="input-join-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Employment Status</Label>
                    <Select 
                      value={employeeForm.employmentStatus || ""} 
                      onValueChange={(value) => setEmployeeForm(prev => ({...prev, employmentStatus: value}))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-employment-status">
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Permanent">Permanent</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Probation">Probation</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Salary</Label>
                    <Input
                      type="number"
                      value={employeeForm.salary || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, salary: e.target.value}))}
                      disabled={!isEditing}
                      placeholder="Monthly salary (RM)"
                      data-testid="input-salary"
                    />
                  </div>
                </div>

                {/* Driving License Details */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">
                    Driving License Details
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Driving License Number</Label>
                      <Input
                        value={employeeForm.drivingLicenseNumber || ""}
                        onChange={(e) => setEmployeeForm(prev => ({...prev, drivingLicenseNumber: e.target.value}))}
                        disabled={!isEditing}
                        placeholder="Driving License No"
                        data-testid="input-driving-license-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driving Class</Label>
                      <Select 
                        value={employeeForm.drivingClass || ""} 
                        onValueChange={(value) => setEmployeeForm(prev => ({...prev, drivingClass: value}))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger data-testid="select-driving-class">
                          <SelectValue placeholder="Select driving class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B2">B2</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="DA">DA</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                          <SelectItem value="E1">E1</SelectItem>
                          <SelectItem value="E2">E2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Driving Expiry Date</Label>
                      <Input
                        type="date"
                        value={employeeForm.drivingExpiryDate ? new Date(employeeForm.drivingExpiryDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => setEmployeeForm(prev => ({...prev, drivingExpiryDate: new Date(e.target.value)}))}
                        disabled={!isEditing}
                        data-testid="input-driving-expiry-date"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={employeeForm.email || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, email: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={employeeForm.phone || ""}
                      onChange={(e) => setEmployeeForm(prev => ({...prev, phone: e.target.value}))}
                      disabled={!isEditing}
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Address</Label>
                  <Textarea
                    value={employeeForm.currentAddress || ""}
                    onChange={(e) => setEmployeeForm(prev => ({...prev, currentAddress: e.target.value}))}
                    disabled={!isEditing}
                    placeholder="Current residential address"
                    data-testid="textarea-current-address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Permanent Address</Label>
                  <Textarea
                    value={employeeForm.permanentAddress || ""}
                    onChange={(e) => setEmployeeForm(prev => ({...prev, permanentAddress: e.target.value}))}
                    disabled={!isEditing}
                    placeholder="Permanent address"
                    data-testid="textarea-permanent-address"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Document Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Document management feature will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Experience */}
          <TabsContent value="work-experience">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Work Experience
                </CardTitle>
                <Button
                  onClick={() => setShowAddWorkExperienceDialog(true)}
                  data-testid="button-add-work-experience"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {workExperiences && workExperiences.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Previous Company</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workExperiences.map((experience: WorkExperience, index: number) => (
                        <TableRow key={experience.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{experience.previousCompany}</TableCell>
                          <TableCell>{experience.position}</TableCell>
                          <TableCell>{formatDate(experience.startDate)}</TableCell>
                          <TableCell>{formatDate(experience.endDate)}</TableCell>
                          <TableCell>{experience.period}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" data-testid={`button-edit-experience-${experience.id}`}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No data available in table</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Change Password Dialog */}
        <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Update password for this employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User Name</Label>
                <Input value={employee.firstName + "_" + employee.lastName} disabled />
              </div>
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  placeholder="Place current password..."
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Place new password..."
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Repeat new password..."
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)} data-testid="button-cancel-password">
                Cancel
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                data-testid="button-update-password"
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset password for this user?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)} data-testid="button-cancel-reset">
                Cancel
              </Button>
              <Button 
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending}
                data-testid="button-reset-password-confirm"
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Work Experience Dialog */}
        <Dialog open={showAddWorkExperienceDialog} onOpenChange={setShowAddWorkExperienceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Work Experience</DialogTitle>
              <DialogDescription>
                Add new work experience for this employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Previous Company</Label>
                <Input
                  placeholder="Company name"
                  value={workExperienceForm.previousCompany || ""}
                  onChange={(e) => setWorkExperienceForm(prev => ({...prev, previousCompany: e.target.value}))}
                  data-testid="input-previous-company"
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  placeholder="Job position"
                  value={workExperienceForm.position || ""}
                  onChange={(e) => setWorkExperienceForm(prev => ({...prev, position: e.target.value}))}
                  data-testid="input-work-position"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={workExperienceForm.startDate ? new Date(workExperienceForm.startDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setWorkExperienceForm(prev => ({...prev, startDate: new Date(e.target.value)}))}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={workExperienceForm.endDate ? new Date(workExperienceForm.endDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setWorkExperienceForm(prev => ({...prev, endDate: new Date(e.target.value)}))}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Input
                  placeholder="e.g., 2 years 3 months"
                  value={workExperienceForm.period || ""}
                  onChange={(e) => setWorkExperienceForm(prev => ({...prev, period: e.target.value}))}
                  data-testid="input-period"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddWorkExperienceDialog(false)} data-testid="button-cancel-work-experience">
                Cancel
              </Button>
              <Button 
                onClick={handleAddWorkExperience}
                disabled={addWorkExperienceMutation.isPending}
                data-testid="button-save-work-experience"
              >
                {addWorkExperienceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}