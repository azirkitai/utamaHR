import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronRight,
  DollarSign,
  Clock,
  Upload,
  ExternalLink,
  CreditCard,
  Timer,
  FileText,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";

type ClaimCategory = 'main' | 'financial' | 'overtime';

const claimTypes = [
  'Medical Claim',
  'Travel Claim', 
  'Meal Allowance',
  'Parking Claim',
  'Phone Bill',
  'Internet Bill',
  'Training & Development'
];

export default function ApplyClaimPage() {
  const [selectedCategory, setSelectedCategory] = useState<ClaimCategory>('main');
  const [claimType, setClaimType] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [particulars, setParticulars] = useState("");
  const [remark, setRemark] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedRequestor, setSelectedRequestor] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"]
  });

  // Fetch all employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"]
  });

  // Logic untuk menentukan employees yang boleh dipilih berdasarkan role
  const getAvailableEmployees = () => {
    if (!currentUser || !Array.isArray(employees)) return [];
    
    const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
    const userRole = (currentUser as any)?.role;
    
    if (privilegedRoles.includes(userRole)) {
      // Role yang privileged boleh pilih semua employee
      return employees;
    } else {
      // Role lain hanya boleh pilih diri sendiri
      return employees.filter((emp: any) => emp.userId === (currentUser as any)?.id);
    }
  };

  const availableEmployees = getAvailableEmployees();

  // Set default requestor to current user if not privileged role
  React.useEffect(() => {
    if (currentUser && availableEmployees.length > 0 && !selectedRequestor) {
      const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
      const userRole = (currentUser as any)?.role;
      
      if (!privilegedRoles.includes(userRole)) {
        // For non-privileged users, auto-select themselves
        const currentEmployee = availableEmployees.find((emp: any) => emp.userId === (currentUser as any)?.id);
        if (currentEmployee) {
          setSelectedRequestor(currentEmployee.id);
        }
      }
    }
  }, [currentUser, availableEmployees, selectedRequestor]);

  const handleToggleExpand = (sectionId: string) => {
    setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId);
  };

  const calculateTotalHours = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedCategory === 'financial') {
      console.log({
        type: 'financial',
        claimType,
        claimAmount,
        claimDate,
        particulars,
        remark,
        uploadedFile
      });
    } else if (selectedCategory === 'overtime') {
      console.log({
        type: 'overtime',
        claimDate,
        startTime,
        endTime,
        totalHours: calculateTotalHours(),
        reason,
        additionalDescription
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {selectedCategory === 'main' ? 'Apply for Claim' : 
                 selectedCategory === 'financial' ? 'Apply for Financial Claim' : 
                 'Apply for Overtime Claim'}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Home</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Claim</span>
                {selectedCategory !== 'main' && (
                  <>
                    <ChevronRight className="w-4 h-4 mx-1" />
                    <span>{selectedCategory === 'financial' ? 'Financial' : 'Overtime'}</span>
                  </>
                )}
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Apply</span>
              </div>
            </div>
          </div>
        </div>

        {selectedCategory === 'main' && (
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-600">Please select claim category</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              {/* Financial Claim */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-teal-400 to-teal-500 text-white border-none"
                onClick={() => setSelectedCategory('financial')}
                data-testid="card-financial-claim"
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <DollarSign className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Financial Claim</h3>
                </CardContent>
              </Card>

              {/* Overtime Claim */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-teal-400 to-teal-500 text-white border-none"
                onClick={() => setSelectedCategory('overtime')}
                data-testid="card-overtime-claim"
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <Clock className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Overtime Claim</h3>
                </CardContent>
              </Card>

              {/* Coming Soon */}
              <Card className="opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 border-none">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <Timer className="w-16 h-16 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Coming Soon</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedCategory === 'financial' && (
          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* Summary Panel */}
              <div className="bg-gradient-to-r from-teal-400 to-blue-600 text-white p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">What you have claimed so far</h2>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => handleToggleExpand("financial-summary")}
                    data-testid="button-see-more-financial"
                  >
                    See More <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 p-4 rounded-lg">
                    <div className="text-xs text-teal-100 mb-1">FLIGHT TIX</div>
                    <div className="text-2xl font-bold">RM 0.00</div>
                    <div className="text-xs text-teal-100">Claim Approved</div>
                    <div className="mt-2 flex justify-center">
                      <CreditCard className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="bg-white/20 p-4 rounded-lg">
                    <div className="text-xs text-teal-100 mb-1">ANNUAL LIMIT</div>
                    <div className="text-2xl font-bold">RM 0.00 / RM 100.00</div>
                    <div className="text-xs text-teal-100">Annual Limit</div>
                    <div className="mt-2 flex justify-center">
                      <FileText className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                </div>

                {/* Expanded Financial Details */}
                {expandedSectionId === "financial-summary" && (
                  <div className="mt-6 bg-white/10 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Detailed Financial Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs text-teal-100 mb-1">MEDICAL CLAIM</div>
                        <div className="text-xl font-bold">RM 0.00</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs text-teal-100 mb-1">TRAVEL CLAIM</div>
                        <div className="text-xl font-bold">RM 0.00</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs text-teal-100 mb-1">MEAL ALLOWANCE</div>
                        <div className="text-xl font-bold">RM 0.00</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs text-teal-100 mb-1">PARKING CLAIM</div>
                        <div className="text-xl font-bold">RM 0.00</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs text-teal-100 mb-1">PHONE BILL</div>
                        <div className="text-xl font-bold">RM 0.00</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded">
                        <div className="text-xs text-teal-100 mb-1">TRAINING & DEV</div>
                        <div className="text-xl font-bold">RM 0.00</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Claim Application */}
              <Card>
                <CardHeader className="bg-slate-700 text-white rounded-t-lg">
                  <CardTitle>Recent Claim Application</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Claim Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No data available in table
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Apply Form */}
            <div className="w-80 p-6 bg-white border-l">
              <Card>
                <CardHeader className="bg-slate-600 text-white rounded-t-lg">
                  <CardTitle className="text-center">Apply Claim</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Requestor */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Requestor</Label>
                    <Select value={selectedRequestor} onValueChange={setSelectedRequestor}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select requestor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmployees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Claim Date */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Claim Date</Label>
                    <Input
                      type="date"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Particulars */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Particulars</Label>
                    <Input
                      placeholder="Particulars"
                      value={particulars}
                      onChange={(e) => setParticulars(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Claim Type */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Claim Type</Label>
                    <Select value={claimType} onValueChange={setClaimType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                      <SelectContent>
                        {claimTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Claim Amount */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Claim Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Remark */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Remark</Label>
                    <Textarea
                      placeholder="Please specify your reason"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  {/* Supporting Document */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Supporting document</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="relative">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose file
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                        />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {uploadedFile ? uploadedFile.name : "No file chosen"}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmit}
                    className="w-full bg-slate-600 hover:bg-slate-700"
                    disabled={!claimType || !claimAmount || !claimDate}
                  >
                    Submit Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedCategory === 'overtime' && (
          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* Summary Panel */}
              <div className="bg-gradient-to-r from-teal-400 to-blue-600 text-white p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Overtime you have taken so far</h2>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => handleToggleExpand("overtime-summary")}
                    data-testid="button-see-more-overtime"
                  >
                    See More <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-teal-100 mb-1">DAYS TAKEN (AUG)</div>
                    <div className="text-2xl font-bold">None</div>
                    <div className="mt-2 flex justify-center">
                      <Calendar className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="bg-white/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-teal-100 mb-1">HOURS TAKEN (AUG)</div>
                    <div className="text-2xl font-bold">None</div>
                    <div className="mt-2 flex justify-center">
                      <Clock className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="bg-white/20 p-4 rounded-lg text-center">
                    <div className="text-xs text-teal-100 mb-1">TOTAL AMOUNT</div>
                    <div className="text-2xl font-bold">None</div>
                    <div className="mt-2 flex justify-center">
                      <Timer className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                </div>

                {/* Expanded Overtime Details */}
                {expandedSectionId === "overtime-summary" && (
                  <div className="mt-6 bg-white/10 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Detailed Overtime Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">JAN 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">FEB 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">MAR 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">APR 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">MAY 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">JUN 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">JUL 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                      <div className="bg-white/20 p-3 rounded text-center">
                        <div className="text-xs text-teal-100 mb-1">AUG 2025</div>
                        <div className="text-xl font-bold">0 Hours</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Claim Application */}
              <Card>
                <CardHeader className="bg-slate-700 text-white rounded-t-lg">
                  <CardTitle>Recent Claim Application</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Claim Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No data available in table
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Apply Form */}
            <div className="w-80 p-6 bg-white border-l">
              <Card>
                <CardHeader className="bg-slate-600 text-white rounded-t-lg">
                  <CardTitle className="text-center">Apply Claim</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Applicant */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Applicant</Label>
                    <Select value={selectedRequestor} onValueChange={setSelectedRequestor}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select applicant" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmployees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Claim Date */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Claim Date</Label>
                    <Input
                      type="date"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Start Time & End Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Start Time</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">End Time</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Total Hours */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Total Hours</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                      <span className="text-lg font-semibold">{calculateTotalHours().toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">What is your reason to apply Overtime?</Label>
                    <Textarea
                      placeholder="Please specify your reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  {/* Additional Description */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Additional Description</Label>
                    <Textarea
                      placeholder="Please specify your description"
                      value={additionalDescription}
                      onChange={(e) => setAdditionalDescription(e.target.value)}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmit}
                    className="w-full bg-slate-600 hover:bg-slate-700"
                    disabled={!startTime || !endTime || !claimDate || !reason}
                  >
                    Submit Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}