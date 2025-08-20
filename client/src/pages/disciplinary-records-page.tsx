import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  FileText,
  Clock,
  User,
  CheckCircle,
  Download
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

export default function DisciplinaryRecordsPage() {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  
  // Query current user's employee data
  const { data: currentEmployee } = useQuery<any>({
    queryKey: ["/api/user/employee"],
    enabled: Boolean(user),
  });
  
  // Query user's disciplinary records only
  const { data: userRecords = [], isLoading } = useQuery<DisciplinaryRecord[]>({
    queryKey: ['/api/disciplinary-records/my-records'],
    enabled: Boolean(user && currentEmployee),
  });

  // Calculate summary stats
  const summaryStats = {
    totalWarnings: userRecords.filter(r => r.type === 'written_warning').length,
    finalWarnings: userRecords.filter(r => r.type === 'final_warning').length,
    suspensions: userRecords.filter(r => r.type === 'suspension').length,
    others: userRecords.filter(r => !['written_warning', 'final_warning', 'suspension'].includes(r.type)).length,
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          My Disciplinary Records
        </h1>
        <p className="text-muted-foreground">
          This page shows your disciplinary history, including warning letters and other actions, if any.
        </p>
      </div>

      {/* User Information Panel */}
      {currentEmployee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="font-semibold">{currentEmployee.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff ID</p>
                <p className="font-semibold">{currentEmployee.employment?.employeeNo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p className="font-semibold">{currentEmployee.employment?.designation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="font-semibold">{currentEmployee.employment?.department || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {userRecords.length > 0 && (
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
                  <p className="text-sm font-medium text-muted-foreground">Others</p>
                  <p className="text-2xl font-bold">{summaryStats.others}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Section - Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Disciplinary Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userRecords.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No disciplinary records found</h3>
              <p className="text-muted-foreground">Keep up the good work! ✅</p>
            </div>
          ) : (
            // Records Table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type of Action</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRecords.map((record) => (
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
                              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                                  <div className="flex gap-2 mt-2">
                                    {selectedRecord.attachments.map((attachment, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Document {index + 1}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}