import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";
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

// Custom fetch function dengan JWT token
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem("utamahr_token");
  if (!token) {
    throw new Error("Token tidak ditemui");
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
      throw new Error("Token tidak sah");
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
        description: "Pekerja berjaya ditambah",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menambah Pekerja",
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
        description: "Pekerja berjaya dikemaskini",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Mengemaskini Pekerja",
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
        description: "Pekerja berjaya dihapuskan",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menghapus Pekerja",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create form
  const createForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      salary: "",
      status: "active",
    },
  });

  // Edit form
  const editForm = useForm<UpdateEmployee>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      salary: "",
      status: "active",
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
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      position: employee.position,
      department: employee.department,
      salary: employee.salary || "",
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
    if (confirm("Adakah anda pasti mahu menghapuskan pekerja ini?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Aktif", variant: "default" as const },
      inactive: { label: "Tidak Aktif", variant: "secondary" as const },
      terminated: { label: "Diberhentikan", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-employees-title">
              Pengurusan Pekerja
            </h2>
            <p className="text-gray-600" data-testid="text-employees-count">
              {employees ? `${employees.length} pekerja didaftarkan` : 'Memuat...'}
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-employee">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pekerja
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tambah Pekerja Baru</DialogTitle>
                <DialogDescription>
                  Masukkan maklumat pekerja baru untuk didaftarkan ke dalam sistem.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateEmployee)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Penuh</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-employee-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-employee-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-employee-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jawatan</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-employee-position" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jabatan</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-employee-department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gaji (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="RM 3000" data-testid="input-employee-salary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employee-status">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Tidak Aktif</SelectItem>
                            <SelectItem value="terminated">Diberhentikan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createEmployeeMutation.isPending}
                      data-testid="button-create-employee"
                    >
                      {createEmployeeMutation.isPending ? "Menyimpan..." : "Simpan Pekerja"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Employees Table */}
        <Card data-testid="card-employees-table">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <p>Memuat senarai pekerja...</p>
              </div>
            ) : !employees || employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Belum ada pekerja didaftarkan</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  data-testid="button-add-first-employee"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pekerja Pertama
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Jawatan</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh Mula</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>{new Date(employee.joinDate).toLocaleDateString('ms-MY')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/employee-details/${employee.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-view-employee-${employee.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                            data-testid={`button-edit-employee-${employee.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            disabled={deleteEmployeeMutation.isPending}
                            data-testid={`button-delete-employee-${employee.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
              <DialogTitle>Kemaskini Pekerja</DialogTitle>
              <DialogDescription>
                Kemaskini maklumat pekerja yang dipilih.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateEmployee)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Penuh</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-edit-employee-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jawatan</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-employee-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gaji</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="RM 3000" data-testid="input-edit-employee-salary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-employee-status">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                          <SelectItem value="terminated">Diberhentikan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateEmployeeMutation.isPending}
                    data-testid="button-update-employee"
                  >
                    {updateEmployeeMutation.isPending ? "Menyimpan..." : "Kemaskini Pekerja"}
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