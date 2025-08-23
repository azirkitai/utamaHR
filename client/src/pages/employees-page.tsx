import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Building2, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { insertEmployeeSchema, updateEmployeeSchema, Employee, InsertEmployee, UpdateEmployee } from "@shared/schema";
import { z } from "zod";

// Custom fetch function with JWT token
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem("utamahr_token");
  if (!token) {
    throw new Error("Token not found");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("utamahr_token");
      window.location.href = "/auth";
      throw new Error("Token not valid");
    }
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export default function EmployeesPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Get current user data for role-based access
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Check if current user has admin access (Super Admin or Admin only)
  const hasPrivilegedAccess = () => {
    if (!currentUser) return false;
    const privilegedRoles = ["Super Admin", "Admin"];
    return privilegedRoles.includes(currentUser.role);
  };

  // Fetch employees
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: () => authenticatedFetch("/api/employees"),
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employee: InsertEmployee): Promise<Employee> => {
      return authenticatedFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify(employee),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Berjaya!",
        description: "Employee successfully ditambah",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menambah Employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, employee }: { id: string; employee: UpdateEmployee }): Promise<Employee> => {
      return authenticatedFetch(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(employee),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      editForm.reset();
      toast({
        title: "Berjaya!",
        description: "Employee successfully dikemaskini",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Mengemaskini Employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return authenticatedFetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Berjaya!",
        description: "Employee successfully dihapuskan",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menghapus Employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create form
  const createForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      userId: "",
      fullName: "",
      firstName: "",
      lastName: "",
      status: "employed",
    },
  });

  // Edit form
  const editForm = useForm<UpdateEmployee>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      fullName: "",
      firstName: "",
      lastName: "",
      status: "employed",
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleCreateEmployee = (data: InsertEmployee) => {
    createEmployeeMutation.mutate(data);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    editForm.reset({
      fullName: employee.fullName,
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      status: employee.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = (data: UpdateEmployee) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, employee: data });
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      employed: { label: "Employed", variant: "default" as const },
      terminated: { label: "Terminated", variant: "destructive" as const },
      retired: { label: "Retired", variant: "secondary" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.employed;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-employees-title">
              Employee Management
            </h2>
            <p className="text-gray-600" data-testid="text-employees-count">
              {employees ? `${employees.length} employees registered` : 'Loading...'}
            </p>
          </div>


        </div>

        {/* Employees Table */}
        <Card data-testid="card-employees-table">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading employees list...</p>
              </div>
            ) : !employees || employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No employees registered yet</p>

              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                      <TableCell className="font-medium">{employee.fullName}</TableCell>
                      <TableCell>{employee.contact?.email || "N/A"}</TableCell>
                      <TableCell>{employee.employment?.designation || "N/A"}</TableCell>
                      <TableCell>{employee.employment?.department || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>{employee.employment?.dateJoining ? new Date(employee.employment.dateJoining).toLocaleDateString('ms-MY') : new Date(employee.createdAt).toLocaleDateString('ms-MY')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {hasPrivilegedAccess() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              disabled={deleteEmployeeMutation.isPending}
                              data-testid={`button-delete-employee-${employee.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update the selected employee information.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateEmployee)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-employee-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateEmployeeMutation.isPending}
                    data-testid="button-update-employee"
                  >
                    {updateEmployeeMutation.isPending ? "Saving..." : "Update Employee"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}