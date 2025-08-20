import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { 
  FileX, 
  AlertTriangle, 
  Plus, 
  Eye, 
  Edit, 
  Search,
  Calendar,
  User,
  FileText,
  Clock,
  History,
  Save,
  Filter
} from "lucide-react";

// Schema for disciplinary action form
const disciplinaryActionSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: z.enum(['verbal_warning', 'written_warning', 'final_warning', 'suspension', 'termination']),
  severity: z.enum(['minor', 'moderate', 'major', 'severe']),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

type DisciplinaryActionFormData = z.infer<typeof disciplinaryActionSchema>;

interface DisciplinaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'termination';
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  subject: string;
  description: string;
  dateIssued: string;
  issuedBy: string;
  issuedByName: string;
  status: 'active' | 'resolved' | 'appealed' | 'closed';
  expiryDate?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

const severityColors = {
  minor: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  major: "bg-orange-100 text-orange-800 border-orange-200",
  severe: "bg-red-100 text-red-800 border-red-200"
};

const typeLabels = {
  verbal_warning: "Verbal Warning",
  written_warning: "Written Warning", 
  final_warning: "Final Warning",
  suspension: "Suspension",
  termination: "Termination"
};

const statusColors = {
  active: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  appealed: "bg-purple-100 text-purple-800 border-purple-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function DisciplinaryHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("history");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);

  // Check if user has privileged access (Admin, HR Manager, or Super Admin)
  const hasPrivilegedAccess = user?.role && ['Super Admin', 'Admin', 'HR Manager'].includes(user.role);

  // Form for creating disciplinary action
  const form = useForm<DisciplinaryActionFormData>({
    resolver: zodResolver(disciplinaryActionSchema),
    defaultValues: {
      employeeId: "",
      type: "verbal_warning",
      severity: "minor",
      subject: "",
      description: "",
      followUpRequired: false,
      followUpDate: "",
      expiryDate: "",
    },
  });

  // Query disciplinary records
  const { data: disciplinaryRecords = [], isLoading } = useQuery<DisciplinaryRecord[]>({
    queryKey: ['/api/disciplinary-records'],
    enabled: Boolean(user && hasPrivilegedAccess),
  });

  // Query employees for dropdown
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: Boolean(user && hasPrivilegedAccess),
  });

  // Create disciplinary action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: DisciplinaryActionFormData) => {
      return apiRequest('/api/disciplinary-records', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disciplinary action has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disciplinary-records'] });
      form.reset();
      setActiveTab("history");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create disciplinary action.",
        variant: "destructive",
      });
    },
  });

  // Filter records based on search and filters
  const filteredRecords = (disciplinaryRecords as DisciplinaryRecord[]).filter((record: DisciplinaryRecord) => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = !selectedEmployee || record.employeeId === selectedEmployee;
    const matchesSeverity = !selectedSeverity || record.severity === selectedSeverity;
    
    return matchesSearch && matchesEmployee && matchesSeverity;
  });

  const onSubmit = (data: DisciplinaryActionFormData) => {
    createActionMutation.mutate(data);
  };

  if (!hasPrivilegedAccess) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <FileX className="h-6 w-6 text-red-500" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              You do not have permission to access disciplinary history. Please contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileX className="h-8 w-8 text-orange-600" />
            Disciplinary History & Add Action
          </h1>
          <p className="text-muted-foreground mt-1">
            View disciplinary history and create new disciplinary actions
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="h-4 w-4 mr-2" />
            Disciplinary History
          </TabsTrigger>
          <TabsTrigger value="add-action" data-testid="tab-add-action">
            <Plus className="h-4 w-4 mr-2" />
            Add New Action
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Records</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Employee name or subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-records"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger data-testid="select-employee">
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All employees</SelectItem>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName || emp.name || `Employee ${emp.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All severities</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedEmployee("");
                      setSelectedSeverity("");
                    }}
                    className="w-full"
                    data-testid="button-clear-filters"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Disciplinary History ({filteredRecords.length})</span>
                <Badge variant="outline" className="text-sm">
                  All Records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading disciplinary history...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FileX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No disciplinary records found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || selectedEmployee || selectedSeverity 
                      ? "Try adjusting your search filters"
                      : "No records have been created yet"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} data-testid={`row-record-${record.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{record.employeeName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {typeLabels[record.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${severityColors[record.severity]}`}>
                              {record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{record.subject}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{new Date(record.dateIssued).toLocaleDateString('en-GB')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${statusColors[record.status]}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                              data-testid={`button-view-${record.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Action Tab */}
        <TabsContent value="add-action">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Disciplinary Action
              </CardTitle>
              <CardDescription>
                Add a new disciplinary action for an employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-form-employee">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.fullName || emp.name || `Employee ${emp.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Type *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-action-type">
                                <SelectValue placeholder="Select action type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="verbal_warning">Verbal Warning</SelectItem>
                                <SelectItem value="written_warning">Written Warning</SelectItem>
                                <SelectItem value="final_warning">Final Warning</SelectItem>
                                <SelectItem value="suspension">Suspension</SelectItem>
                                <SelectItem value="termination">Termination</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-severity-form">
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minor">Minor</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="major">Major</SelectItem>
                                <SelectItem value="severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief subject of the disciplinary action"
                              {...field}
                              data-testid="input-subject"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed description of the incident and action taken..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="followUpDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Follow-up Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-followup-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-expiry-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      data-testid="button-cancel-form"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
                      disabled={createActionMutation.isPending}
                      data-testid="button-submit-form"
                    >
                      {createActionMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Create Action
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Record Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Disciplinary Record Details
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && `Record for ${selectedRecord.employeeName}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Employee</Label>
                  <p className="text-sm">{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <p className="text-sm">{typeLabels[selectedRecord.type]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Severity</Label>
                  <Badge className={`text-xs ${severityColors[selectedRecord.severity]}`}>
                    {selectedRecord.severity.charAt(0).toUpperCase() + selectedRecord.severity.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={`text-xs ${statusColors[selectedRecord.status]}`}>
                    {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date Issued</Label>
                  <p className="text-sm">{new Date(selectedRecord.dateIssued).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Issued By</Label>
                  <p className="text-sm">{selectedRecord.issuedByName}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Subject</Label>
                <p className="text-sm font-medium">{selectedRecord.subject}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.description}</p>
              </div>
              
              {selectedRecord.followUpRequired && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Follow-up Required</Label>
                  <p className="text-sm">
                    Yes {selectedRecord.followUpDate && `- Due: ${new Date(selectedRecord.followUpDate).toLocaleDateString('en-GB')}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}