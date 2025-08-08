import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ChevronRight,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  ChevronDown,
  FileText,
  Settings,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { Employee } from "@shared/schema";

export default function ManageEmployeePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("utama hr");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  
  // Fetch employees from API
  const { data: allEmployees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Mutation for creating user and employee
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: {
      // User data
      username: string;
      password: string;
      role: string;
      // Employee data
      firstName: string;
      lastName: string;
      phone: string;
      company: string;
      designation: string;
      department: string;
      email: string;
    }) => {
      // Step 1: Create user account first
      const userResponse = await apiRequest("POST", "/api/create-staff-user", {
        username: staffData.username,
        password: staffData.password,
        role: staffData.role,
      });
      
      const newUser = await userResponse.json();
      
      // Step 2: Create employee record linked to user
      const employeeResponse = await apiRequest("POST", "/api/employees", {
        userId: newUser.id, // Link employee to user
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        name: `${staffData.firstName} ${staffData.lastName}`,
        phone: staffData.phone,
        company: staffData.company,
        position: staffData.designation,
        department: staffData.department,
        email: staffData.email,
        status: "active"
      });
      
      return await employeeResponse.json();
    },
    onSuccess: () => {
      // Refresh employees list
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      toast({
        title: "Berjaya!",
        description: "Staff baru telah ditambah dengan jayanya.",
      });
      
      // Reset form and close dialog
      resetForm();
      setIsAddEmployeeOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: `Gagal menambah staff: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = allEmployees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "active") {
      return matchesSearch && employee.status === "active";
    } else {
      return matchesSearch && employee.status !== "active";
    }
  });

  // Check if passwords match
  const passwordsMatch = password === confirmPassword;
  const hasPasswordMismatch = password && confirmPassword && !passwordsMatch;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setCompany("utama hr");
    setDesignation("");
    setDepartment("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUserRole("");
  };

  const handleAddEmployee = () => {
    // Validation
    if (!firstName || !lastName || !email || !username || !password || !userRole) {
      toast({
        title: "Ralat",
        description: "Sila isi semua field yang diperlukan.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Ralat", 
        description: "Password dan confirm password tidak sama.",
        variant: "destructive",
      });
      return;
    }

    // Call the mutation
    createStaffMutation.mutate({
      username,
      password,
      role: userRole,
      firstName,
      lastName,
      phone,
      company,
      designation,
      department,
      email,
    });
  };

  const handleImportFile = () => {
    if (selectedFile) {
      console.log("Importing file:", selectedFile.name);
      // Import logic here
      setSelectedFile(null);
      setIsImportOpen(false);
    }
  };

  const downloadTemplate = () => {
    // Download template logic
    console.log("Downloading template");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Manage Employee</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Home</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Employee</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Helper Text */}
          <div className="mb-6">
            <p className="text-gray-600">
              Gunakan halaman ini untuk menambah, menyunting atau mengurus maklumat staf syarikat anda. 
              Anda juga boleh eksport dan import data staf secara pukal.
            </p>
          </div>

          {/* Tabs and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger 
                    value="active" 
                    className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    data-testid="tab-active-staff"
                  >
                    Active Staff
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resigned"
                    className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    data-testid="tab-resigned-staff"
                  >
                    Resigned Staff
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                        data-testid="button-add-new-staff"
                      >
                        Add New Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Staff</DialogTitle>
                        <div className="text-sm text-gray-500">Current: 2/50 Staff</div>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="bg-slate-100 px-3 py-2 rounded text-sm font-medium">
                          Account Information
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                            <Input
                              id="firstName"
                              placeholder="First Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="mt-1"
                              data-testid="input-first-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                            <Input
                              id="lastName"
                              placeholder="Last Name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="mt-1"
                              data-testid="input-last-name"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="Phone No."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1"
                            data-testid="input-phone"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                          <Input
                            id="company"
                            placeholder="Company Name"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="mt-1"
                            data-testid="input-company"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="designation" className="text-sm font-medium">Designation</Label>
                          <Input
                            id="designation"
                            placeholder="Designation"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            className="mt-1"
                            data-testid="input-designation"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                          <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger className="mt-1" data-testid="select-department">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="human-resource">Human Resource</SelectItem>
                              <SelectItem value="it">Information Technology</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="bg-slate-100 px-3 py-2 rounded text-sm font-medium">
                          Access Control
                        </div>
                        
                        <div>
                          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                          <Input
                            id="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1"
                            data-testid="input-username"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1"
                            data-testid="input-email"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1"
                            data-testid="input-password"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Enter Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`mt-1 ${hasPasswordMismatch ? 'border-red-500 focus:border-red-500' : ''}`}
                            data-testid="input-confirm-password"
                          />
                          {hasPasswordMismatch && (
                            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm" data-testid="password-mismatch-warning">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Password dan Confirm Password tidak sama</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="userRole" className="text-sm font-medium">User Role</Label>
                          <Select value={userRole} onValueChange={setUserRole}>
                            <SelectTrigger className="mt-1" data-testid="select-user-role">
                              <SelectValue placeholder="Select user role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="hr">HR</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddEmployeeOpen(false)}
                          data-testid="button-cancel-staff"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddEmployee}
                          disabled={!firstName || !lastName || !email || !username || !password || !userRole || hasPasswordMismatch || createStaffMutation.isPending}
                          className="bg-slate-700 hover:bg-slate-800"
                          data-testid="button-add-staff"
                        >
                          {createStaffMutation.isPending ? "Adding..." : "Add Staff"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                        data-testid="button-export-staff"
                      >
                        Export Staff
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Export Excel")}>
                        <FileText className="w-4 h-4 mr-2" />
                        Download as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log("Export PDF")}>
                        <FileText className="w-4 h-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                        data-testid="button-import-staff"
                      >
                        Import Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Import Staff Excel/CSV</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600">
                              {selectedFile ? selectedFile.name : "Choose file"}
                            </div>
                            <div className="text-xs text-red-500 mt-1">
                              {selectedFile ? "" : "No file chosen"}
                            </div>
                          </label>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div>📋 Limit to 5 MB size.</div>
                          <button 
                            onClick={downloadTemplate}
                            className="text-blue-600 hover:underline"
                          >
                            📥 Download Template
                          </button>
                        </div>
                      </div>
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsImportOpen(false)}
                          data-testid="button-cancel-import"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleImportFile}
                          disabled={!selectedFile}
                          className="bg-slate-700 hover:bg-slate-800"
                          data-testid="button-upload"
                        >
                          Upload
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <TabsContent value="active">
                <Card>
                  <CardHeader className="bg-teal-500 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle>List of Employees</CardTitle>
                      <div className="flex items-center gap-4">
                        <Settings className="w-5 h-5" />
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
                          <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                            data-testid="input-search"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">No.</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Employee No.</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Designation</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-gray-500">
                                Loading employees...
                              </td>
                            </tr>
                          ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map((employee, index) => (
                              <tr key={employee.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{index + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                      <span className="text-xs text-gray-600">👤</span>
                                    </div>
                                    {employee.name}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-1">
                                    <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                                      Employee
                                    </Badge>
                                    <Badge variant="secondary" className={`text-white text-xs ${employee.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}>
                                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-3 px-4">{employee.employeeId || '-'}</td>
                                <td className="py-3 px-4">{employee.position || '-'}</td>
                                <td className="py-3 px-4">{employee.phone || '-'}</td>
                                <td className="py-3 px-4">{employee.phone || '-'}</td>
                                <td className="py-3 px-4">{employee.email || '-'}</td>
                                <td className="py-3 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = `/employee-details/${employee.id}`}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                    data-testid={`button-view-details-${employee.id}`}
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-gray-500">
                                No data available in table
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                          1
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resigned">
                <Card>
                  <CardHeader className="bg-teal-500 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle>List of Resigned Employees</CardTitle>
                      <div className="flex items-center gap-4">
                        <Settings className="w-5 h-5" />
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
                          <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">No.</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Employee No.</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Designation</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-gray-500">
                              No data available in table
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}