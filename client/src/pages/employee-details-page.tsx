import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Calendar,
  Clock,
  Building,
  MapPin,
  Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Employee, UpdateEmployee } from "@shared/schema";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Active tab state for navigation
  const [activeTab, setActiveTab] = useState("personal-details");
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});

  // Get employee details
  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["/api/employees", id],
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
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: `Gagal kemaskini maklumat: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!employeeForm.fullName) {
      toast({
        title: "Ralat",
        description: "Sila isi nama penuh",
        variant: "destructive",
      });
      return;
    }

    updateEmployeeMutation.mutate({
      fullName: employeeForm.fullName,
      firstName: employeeForm.firstName,
      lastName: employeeForm.lastName,
    });
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
      icon: Calendar,
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

        <div className="flex">
          {/* Left Navigation Sidebar */}
          <div className="w-64 bg-white border-r min-h-screen">
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
                          ? "bg-teal-100 text-teal-700 border-r-2 border-teal-500"
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

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Employee Header Profile */}
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 border-4 border-white">
                    <AvatarImage src="/placeholder-avatar.png" />
                    <AvatarFallback className="bg-white text-teal-600 text-2xl font-bold">
                      {employee.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{employee.fullName || "N/A"}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="bg-blue-800 px-3 py-1 rounded text-sm">
                        {employee.id || "N/A"}
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

            {/* Tab Content Area */}
            <div className="p-6">
              {activeTab === "personal-details" && (
                <Card>
                  <CardHeader className="bg-teal-500 text-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Personal Details
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-white hover:bg-white/20"
                        data-testid="button-edit-personal"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {isEditing ? "Cancel" : "Update"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">First Name</Label>
                        {isEditing ? (
                          <Input
                            value={employeeForm.firstName || ""}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                            className="mt-1"
                            data-testid="input-first-name"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            {employee.firstName || "N/A"}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                        {isEditing ? (
                          <Input
                            value={employeeForm.lastName || ""}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                            className="mt-1"
                            data-testid="input-last-name"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            {employee.lastName || "N/A"}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">NRIC</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          NRIC
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          2025-08-08
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">NRIC (Old)</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          NRIC (Old)
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">NRIC Color</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select NRIC color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Place of Birth</Label>
                        <Input
                          placeholder="Place of Birth"
                          className="mt-1"
                          data-testid="input-place-birth"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Gender</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Race</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select race" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="malay">Malay</SelectItem>
                            <SelectItem value="chinese">Chinese</SelectItem>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Religion</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select religion" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="islam">Islam</SelectItem>
                            <SelectItem value="christian">Christian</SelectItem>
                            <SelectItem value="buddhist">Buddhist</SelectItem>
                            <SelectItem value="hindu">Hindu</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Blood Type</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select blood type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                            <SelectItem value="ab">AB</SelectItem>
                            <SelectItem value="o">O</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Education Level</Label>
                        <Input
                          placeholder="Education Level"
                          className="mt-1"
                          data-testid="input-education"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-2 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={updateEmployeeMutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700"
                          data-testid="button-save-changes"
                        >
                          {updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "employment" && (
                <Card>
                  <CardHeader className="bg-teal-500 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Employment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          {employee.id || "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Position</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          N/A
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Department</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          N/A
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Company</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          N/A
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "contact" && (
                <Card>
                  <CardHeader className="bg-teal-500 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          N/A
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
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
                  <CardHeader className="bg-teal-500 text-white">
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