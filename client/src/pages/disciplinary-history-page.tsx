import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Search,
  Calendar,
  User,
  FileText,
  Clock,
  Users,
  Filter,
  Download,
  Upload,
  Save
} from "lucide-react";

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
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  id: string;
  fullName: string;
  employment?: {
    employeeNo?: string;
    designation?: string;
    department?: string;
    status?: string;
  };
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
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Form state for adding new record
  const [newRecord, setNewRecord] = useState({
    employeeId: "",
    type: "",
    severity: "",
    subject: "",
    description: "",
    dateIssued: new Date().toISOString().split('T')[0],
    status: "active",
    followUpRequired: false,
    followUpDate: "",
    internalNotes: ""
  });

  // Check if user has HR access
  const hasHRAccess = user?.role && ['Super Admin', 'Admin', 'HR Manager'].includes(user.role);

  // Query employees for dropdown
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    enabled: !!user && hasHRAccess,
  });

  // Query disciplinary records
  const { data: disciplinaryRecords = [], isLoading } = useQuery<DisciplinaryRecord[]>({
    queryKey: ['/api/disciplinary-records'],
    enabled: !!user && hasHRAccess,
  });

  // Get selected employee details
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  
  // Filter records for selected employee
  const employeeRecords = disciplinaryRecords.filter(record => 
    record.employeeId === selectedEmployeeId
  );

  // Apply search and filters
  const filteredRecords = employeeRecords.filter(record => {
    const matchesSearch = record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || filterType === 'all' || record.type === filterType;
    const matchesStatus = !filterStatus || filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats for selected employee
  const summaryStats = {
    totalWarnings: employeeRecords.filter(r => r.type === 'written_warning').length,
    finalWarnings: employeeRecords.filter(r => r.type === 'final_warning').length,
    suspensions: employeeRecords.filter(r => r.type === 'suspension').length,
    others: employeeRecords.filter(r => !['written_warning', 'final_warning', 'suspension'].includes(r.type)).length,
  };

  // Create new disciplinary record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/disciplinary-records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disciplinary record created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disciplinary-records'] });
      // Reset form
      setNewRecord({
        employeeId: "",
        type: "",
        severity: "",
        subject: "",
        description: "",
        dateIssued: new Date().toISOString().split('T')[0],
        status: "active",
        followUpRequired: false,
        followUpDate: "",
        internalNotes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create disciplinary record",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newRecord.employeeId || !newRecord.type || !newRecord.subject) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createRecordMutation.mutate({
      ...newRecord,
      issuedBy: user?.id,
      issuedByName: user?.username || 'HR',
    });
  };

  if (!hasHRAccess) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Shield className="h-6 w-6 text-red-500" />
                Access Restricted
              </CardTitle>
              <CardDescription>
                You do not have permission to access disciplinary management. Please contact your administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Disciplinary Management
          </h1>
          <p className="text-muted-foreground">
            Manage and record disciplinary actions, warning letters, and related documents for employees.
          </p>
        </div>

        <Tabs defaultValue="records" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="records" data-testid="tab-records">
              <FileText className="h-4 w-4 mr-2" />
              View Records
            </TabsTrigger>
            <TabsTrigger value="add" data-testid="tab-add-action">
              <Plus className="h-4 w-4 mr-2" />
              Add Disciplinary Action
            </TabsTrigger>
          </TabsList>

          {/* View Records Tab */}
          <TabsContent value="records" className="space-y-6">
            {/* Employee Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="employee-select">Select Employee</Label>
                      <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.fullName} - {employee.employment?.employeeNo || 'N/A'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Employee Information Panel */}
                  {selectedEmployee && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Employee Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                          <p className="font-semibold">{selectedEmployee.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Staff ID</p>
                          <p className="font-semibold">{selectedEmployee.employment?.employeeNo || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Position</p>
                          <p className="font-semibold">{selectedEmployee.employment?.designation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Department</p>
                          <p className="font-semibold">{selectedEmployee.employment?.department || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            {selectedEmployeeId && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Warnings</p>
                        <p className="text-2xl font-bold">{summaryStats.totalWarnings}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Final Warnings</p>
                        <p className="text-2xl font-bold">{summaryStats.finalWarnings}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Suspensions</p>
                        <p className="text-2xl font-bold">{summaryStats.suspensions}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Other Actions</p>
                        <p className="text-2xl font-bold">{summaryStats.others}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters and Search */}
            {selectedEmployeeId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search records..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          data-testid="input-search"
                        />
                      </div>
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="verbal_warning">Verbal Warning</SelectItem>
                        <SelectItem value="written_warning">Written Warning</SelectItem>
                        <SelectItem value="final_warning">Final Warning</SelectItem>
                        <SelectItem value="suspension">Suspension</SelectItem>
                        <SelectItem value="termination">Termination</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="appealed">Appealed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Records Table */}
            {selectedEmployeeId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Employee Disciplinary Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No records found</h3>
                      <p className="text-muted-foreground">
                        {selectedEmployee?.fullName} has no disciplinary records yet.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type of Action</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {new Date(record.dateIssued).toLocaleDateString('en-GB')}
                            </TableCell>
                            <TableCell>
                              <Badge className={severityColors[record.severity]}>
                                {typeLabels[record.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.subject}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[record.status]}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedRecord(record)}
                                    data-testid={`button-view-${record.id}`}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Disciplinary Record Details</DialogTitle>
                                    <DialogDescription>
                                      Details of the disciplinary action issued
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedRecord && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground">Date Issued</p>
                                          <p>{new Date(selectedRecord.dateIssued).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                                          <Badge className={severityColors[selectedRecord.severity]}>
                                            {typeLabels[selectedRecord.type]}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Subject</p>
                                        <p>{selectedRecord.subject}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                                        <p className="text-sm">{selectedRecord.description}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground">Issued By</p>
                                        <p>{selectedRecord.issuedByName}</p>
                                      </div>
                                      {selectedRecord.internalNotes && (
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground">Internal Notes (HR Only)</p>
                                          <p className="text-sm text-gray-600">{selectedRecord.internalNotes}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" data-testid={`button-edit-${record.id}`}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm" data-testid={`button-delete-${record.id}`}>
                                  <Trash2 className="h-3 w-3" />
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
            )}
          </TabsContent>

          {/* Add Action Tab */}
          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Disciplinary Action
                </CardTitle>
                <CardDescription>
                  Create a new disciplinary record for an employee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-employee">Employee *</Label>
                    <Select value={newRecord.employeeId} onValueChange={(value) => 
                      setNewRecord(prev => ({ ...prev, employeeId: value }))
                    }>
                      <SelectTrigger data-testid="select-new-employee">
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName} - {employee.employment?.employeeNo || 'N/A'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-date">Date *</Label>
                    <Input
                      type="date"
                      value={newRecord.dateIssued}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, dateIssued: e.target.value }))}
                      data-testid="input-new-date"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-type">Type of Action *</Label>
                    <Select value={newRecord.type} onValueChange={(value) => 
                      setNewRecord(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger data-testid="select-new-type">
                        <SelectValue placeholder="Select action type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verbal_warning">Verbal Warning</SelectItem>
                        <SelectItem value="written_warning">Written Warning</SelectItem>
                        <SelectItem value="final_warning">Final Warning</SelectItem>
                        <SelectItem value="suspension">Suspension</SelectItem>
                        <SelectItem value="termination">Termination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-severity">Severity</Label>
                    <Select value={newRecord.severity} onValueChange={(value) => 
                      setNewRecord(prev => ({ ...prev, severity: value }))
                    }>
                      <SelectTrigger data-testid="select-new-severity">
                        <SelectValue placeholder="Select severity..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-subject">Subject / Reason *</Label>
                  <Input
                    placeholder="Brief description of the issue..."
                    value={newRecord.subject}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="input-new-subject"
                  />
                </div>

                <div>
                  <Label htmlFor="new-description">Detailed Description</Label>
                  <Textarea
                    placeholder="Provide detailed information about the disciplinary action..."
                    value={newRecord.description}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    data-testid="textarea-new-description"
                  />
                </div>

                <div>
                  <Label htmlFor="new-notes">Internal Notes (HR Only)</Label>
                  <Textarea
                    placeholder="Internal notes for HR reference..."
                    value={newRecord.internalNotes}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, internalNotes: e.target.value }))}
                    rows={3}
                    data-testid="textarea-new-notes"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-status">Status</Label>
                    <Select value={newRecord.status} onValueChange={(value) => 
                      setNewRecord(prev => ({ ...prev, status: value }))
                    }>
                      <SelectTrigger data-testid="select-new-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="follow-up"
                      checked={newRecord.followUpRequired}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                      data-testid="checkbox-follow-up"
                    />
                    <Label htmlFor="follow-up">Follow-up required</Label>
                  </div>
                </div>

                {newRecord.followUpRequired && (
                  <div>
                    <Label htmlFor="follow-up-date">Follow-up Date</Label>
                    <Input
                      type="date"
                      value={newRecord.followUpDate}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, followUpDate: e.target.value }))}
                      data-testid="input-follow-up-date"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    onClick={handleSubmit}
                    disabled={createRecordMutation.isPending}
                    className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
                    data-testid="button-save-record"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createRecordMutation.isPending ? 'Saving...' : 'Save Record'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}