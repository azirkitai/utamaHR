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
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Save,
  X,
  Paperclip
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
  attachmentNames?: string;
  attachmentCount?: number;
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
  const [editingRecord, setEditingRecord] = useState<DisciplinaryRecord | null>(null);
  const [editData, setEditData] = useState({
    status: '',
    followUpRequired: false,
    followUpDate: '',
    internalNotes: ''
  });
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
    internalNotes: "",
    attachments: [] as File[]
  });

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setNewRecord(prev => ({ 
        ...prev, 
        attachments: [...prev.attachments, ...newFiles] 
      }));
    }
  };

  const removeFile = (index: number) => {
    setNewRecord(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
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
      internalNotes: "",
      attachments: [] as File[]
    });
  };

  // Check if user has HR access
  const hasHRAccess = user?.role && ['Super Admin', 'Admin', 'HR Manager'].includes(user.role);

  // Query employees for dropdown
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    enabled: !!user && !!hasHRAccess,
  });

  // Query disciplinary records with timestamp to force fresh data
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: disciplinaryRecords = [], isLoading, refetch: refetchRecords } = useQuery<DisciplinaryRecord[]>({
    queryKey: ['/api/disciplinary-records', refreshKey],
    enabled: !!user && !!hasHRAccess,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache
    refetchOnWindowFocus: true,
  });

  // Get selected employee details
  const selectedEmployee = (employees as Employee[]).find((emp: Employee) => emp.id === selectedEmployeeId);
  
  // Filter records for selected employee
  const employeeRecords = (disciplinaryRecords as DisciplinaryRecord[]).filter((record: DisciplinaryRecord) => 
    record.employeeId === selectedEmployeeId
  );

  // Apply search and filters
  const filteredRecords = employeeRecords.filter((record: DisciplinaryRecord) => {
    const matchesSearch = record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || filterType === 'all' || record.type === filterType;
    const matchesStatus = !filterStatus || filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats for selected employee
  const summaryStats = {
    totalWarnings: employeeRecords.filter((r: DisciplinaryRecord) => r.type === 'written_warning').length,
    finalWarnings: employeeRecords.filter((r: DisciplinaryRecord) => r.type === 'final_warning').length,
    suspensions: employeeRecords.filter((r: DisciplinaryRecord) => r.type === 'suspension').length,
    others: employeeRecords.filter((r: DisciplinaryRecord) => !['written_warning', 'final_warning', 'suspension'].includes(r.type)).length,
  };

  // Create new disciplinary record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/disciplinary-records', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disciplinary record created successfully",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/disciplinary-records'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create disciplinary record",
        variant: "destructive",
      });
    }
  });

  // Update disciplinary record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/disciplinary-records/${data.id}`, data);
    },
    onSuccess: async (updatedRecord) => {
      console.log('Update successful, refreshing data...');
      toast({
        title: "Success",
        description: "Disciplinary record updated successfully",
      });
      closeEditDialog();
      // Force refresh by updating the key
      setRefreshKey(prev => prev + 1);
      console.log('Data refresh completed with new key:', refreshKey + 1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update disciplinary record",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (record: DisciplinaryRecord) => {
    setEditingRecord(record);
    setEditData({
      status: record.status,
      followUpRequired: record.followUpRequired,
      followUpDate: record.followUpDate || '',
      internalNotes: record.internalNotes || ''
    });
  };

  const handleUpdateSubmit = () => {
    if (!editingRecord) return;
    
    updateRecordMutation.mutate({
      id: editingRecord.id,
      ...editData
    });
  };

  const closeEditDialog = () => {
    setEditingRecord(null);
    setEditData({
      status: '',
      followUpRequired: false,
      followUpDate: '',
      internalNotes: ''
    });
  };

  const handleSubmit = () => {
    if (!newRecord.employeeId || !newRecord.type || !newRecord.subject) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submissionData = {
      ...newRecord,
      issuedBy: user?.id,
      issuedByName: user?.username || 'HR',
      attachmentCount: newRecord.attachments.length,
      attachmentNames: JSON.stringify(newRecord.attachments.map(f => f.name)),
      // Note: In a real implementation, files would be uploaded to server storage first
      // and then the URLs would be included in the submission data
    };

    // Remove the actual File objects from submission (they can't be JSON stringified)
    const { attachments, ...dataToSubmit } = submissionData;

    createRecordMutation.mutate(dataToSubmit);
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
                          {(employees as Employee[]).map((employee: Employee) => (
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
                        {filteredRecords.map((record: DisciplinaryRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {new Date(record.dateIssued).toLocaleDateString('en-GB')}
                            </TableCell>
                            <TableCell>
                              <Badge className={severityColors[record.severity as keyof typeof severityColors]}>
                                {typeLabels[record.type as keyof typeof typeLabels]}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.subject}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[record.status as keyof typeof statusColors]}>
                                {record.status === 'active' ? 'Active' : 
                                 record.status === 'resolved' ? 'Resolved' : 
                                 record.status === 'appealed' ? 'Appealed' : 
                                 record.status === 'closed' ? 'Closed' : 
                                 String(record.status).charAt(0).toUpperCase() + String(record.status).slice(1)}
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
                                          <Badge className={severityColors[selectedRecord.severity as keyof typeof severityColors]}>
                                            {typeLabels[selectedRecord.type as keyof typeof typeLabels]}
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
                                      {selectedRecord.attachmentNames && JSON.parse(selectedRecord.attachmentNames).length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground mb-2">Attached Documents</p>
                                          <div className="space-y-2">
                                            {JSON.parse(selectedRecord.attachmentNames).map((fileName: string, index: number) => (
                                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium">{fileName}</span>
                                                <div className="ml-auto flex gap-1">
                                                  <Button variant="ghost" size="sm" className="h-6 px-2">
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">View</span>
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="h-6 px-2">
                                                    <Download className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Download</span>
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog open={editingRecord?.id === record.id} onOpenChange={(open) => !open && closeEditDialog()}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(record)} data-testid={`button-edit-${record.id}`}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Edit Disciplinary Record</DialogTitle>
                                      <DialogDescription>
                                        Update record status and follow-up information
                                      </DialogDescription>
                                    </DialogHeader>
                                    {editingRecord && (
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="edit-status">Status</Label>
                                          <Select value={editData.status} onValueChange={(value) => 
                                            setEditData(prev => ({ ...prev, status: value }))
                                          }>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="active">Active</SelectItem>
                                              <SelectItem value="resolved">Resolved</SelectItem>
                                              <SelectItem value="appealed">Appealed</SelectItem>
                                              <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id="edit-follow-up"
                                            checked={editData.followUpRequired}
                                            onChange={(e) => setEditData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                                          />
                                          <Label htmlFor="edit-follow-up">Follow-up required</Label>
                                        </div>

                                        {editData.followUpRequired && (
                                          <div>
                                            <Label htmlFor="edit-follow-up-date">Follow-up Date</Label>
                                            <Input
                                              type="date"
                                              value={editData.followUpDate}
                                              onChange={(e) => setEditData(prev => ({ ...prev, followUpDate: e.target.value }))}
                                            />
                                          </div>
                                        )}

                                        <div>
                                          <Label htmlFor="edit-notes">Internal Notes</Label>
                                          <Textarea
                                            value={editData.internalNotes}
                                            onChange={(e) => setEditData(prev => ({ ...prev, internalNotes: e.target.value }))}
                                            rows={3}
                                            placeholder="Add internal notes..."
                                          />
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                          <Button 
                                            onClick={handleUpdateSubmit}
                                            disabled={updateRecordMutation.isPending}
                                            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white"
                                          >
                                            <Save className="h-4 w-4 mr-2" />
                                            {updateRecordMutation.isPending ? 'Updating...' : 'Update Record'}
                                          </Button>
                                          <Button variant="outline" onClick={closeEditDialog}>
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
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
                        {(employees as Employee[]).map((employee: Employee) => (
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

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Formal Letter Attachments
                  </Label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm text-gray-600">
                          Click to upload formal letters or drag and drop
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX files up to 10MB
                        </p>
                      </Label>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        data-testid="input-file-upload"
                      />
                    </div>
                  </div>

                  {/* Display uploaded files */}
                  {newRecord.attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Uploaded Files:</Label>
                      {newRecord.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm truncate max-w-xs" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            data-testid={`button-remove-file-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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