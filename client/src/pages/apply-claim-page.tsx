import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { FinancialClaimPolicy, InsertClaimApplication } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
import { apiRequest } from "@/lib/queryClient";

type ClaimCategory = 'main' | 'financial' | 'overtime';

// Static fallback - will be replaced by database data
const fallbackClaimTypes = [
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
  const [validationError, setValidationError] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create claim application mutation
  const createClaimMutation = useMutation({
    mutationFn: async (claimData: InsertClaimApplication) => {
      console.log('Sending claim data:', claimData);
      const token = localStorage.getItem('utamahr_token');
      const response = await fetch('/api/claim-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(claimData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.log('Server validation error:', error);
        throw new Error(error.error || 'Gagal menghantar permohonan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Berjaya!",
        description: "Permohonan tuntutan telah berjaya dihantar dan akan diproses oleh financial approver",
        variant: "default",
      });
      
      // Reset form
      setClaimType("");
      setClaimAmount("");
      setClaimDate("");
      setParticulars("");
      setRemark("");
      setStartTime("");
      setEndTime("");
      setReason("");
      setAdditionalDescription("");
      setUploadedFile(null);
      setValidationError("");
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/claim-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claim-applications/type/financial'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claim-applications/type/overtime'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Gagal menghantar permohonan tuntutan";
      setValidationError(errorMessage);
      toast({
        title: "Ralat",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"]
  });

  // Fetch all employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"]
  });

  // Fetch financial claim policies from database
  const { data: financialClaimPolicies = [] } = useQuery({
    queryKey: ["/api/financial-claim-policies"]
  });

  // Fetch recent financial claim applications
  const { data: recentFinancialClaims = [] } = useQuery({
    queryKey: ["/api/claim-applications/type/financial"]
  });

  // Fetch recent overtime claim applications
  const { data: recentOvertimeClaims = [] } = useQuery({
    queryKey: ["/api/claim-applications/type/overtime"]
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

  // Get claim types from database
  const claimTypes = React.useMemo(() => {
    if (Array.isArray(financialClaimPolicies) && financialClaimPolicies.length > 0) {
      return (financialClaimPolicies as FinancialClaimPolicy[])
        .filter(policy => policy.enabled)
        .map(policy => policy.claimName);
    }
    return fallbackClaimTypes;
  }, [financialClaimPolicies]);

  // Get selected policy details
  const selectedPolicy = React.useMemo(() => {
    if (!claimType || !Array.isArray(financialClaimPolicies)) return null;
    return (financialClaimPolicies as FinancialClaimPolicy[])
      .find(policy => policy.claimName === claimType);
  }, [claimType, financialClaimPolicies]);

  // Validation states
  const [isValidating, setIsValidating] = useState(false);

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

  // Validation function for claim submission
  const validateClaimSubmission = async (): Promise<{ isValid: boolean; error: string }> => {
    setIsValidating(true);
    
    try {
      // Basic validation
      if (!claimType || !claimAmount || !claimDate || !selectedRequestor) {
        return { isValid: false, error: "Sila isi semua field yang diperlukan" };
      }

      const amount = parseFloat(claimAmount);
      if (isNaN(amount) || amount <= 0) {
        return { isValid: false, error: "Jumlah claim mesti lebih besar daripada 0" };
      }

      // Check if policy exists
      if (!selectedPolicy) {
        return { isValid: false, error: "Policy untuk claim type ini tidak dijumpai" };
      }

      // Check per application limit
      if (!selectedPolicy.limitPerApplicationUnlimited) {
        const limitPerApp = parseFloat(selectedPolicy.limitPerApplication || "0");
        if (amount > limitPerApp) {
          return { 
            isValid: false, 
            error: `Jumlah claim (RM${amount}) melebihi had setiap permohonan (RM${limitPerApp}) untuk ${claimType}` 
          };
        }
      }

      // Check annual limit (would need to fetch user's current usage from database)
      if (!selectedPolicy.annualLimitUnlimited) {
        const annualLimit = parseFloat(selectedPolicy.annualLimit || "0");
        // For now, we'll just check if the single claim exceeds annual limit
        // In a real system, you'd check current year's total claims for this user + this new claim
        if (amount > annualLimit) {
          return { 
            isValid: false, 
            error: `Jumlah claim (RM${amount}) melebihi had tahunan (RM${annualLimit}) untuk ${claimType}` 
          };
        }
      }

      // Check if user is excluded from this policy
      const currentUserId = (currentUser as any)?.id;
      const currentEmployeeId = availableEmployees.find((emp: any) => emp.userId === currentUserId)?.id;
      
      if (selectedPolicy.excludedEmployeeIds && 
          currentEmployeeId && 
          selectedPolicy.excludedEmployeeIds.includes(currentEmployeeId)) {
        return { 
          isValid: false, 
          error: `Anda tidak layak untuk membuat claim ${claimType} berdasarkan policy syarikat` 
        };
      }

      return { isValid: true, error: "" };
    } catch (error) {
      return { isValid: false, error: "Error semasa validasi. Sila cuba lagi." };
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, category:', selectedCategory);
    console.log('Form values:', { 
      claimType, 
      claimAmount, 
      claimDate, 
      selectedRequestor, 
      startTime, 
      endTime, 
      reason 
    });
    setValidationError("");

    if (selectedCategory === 'financial') {
      // Run validation for financial claims
      const validation = await validateClaimSubmission();
      if (!validation.isValid) {
        setValidationError(validation.error);
        toast({
          title: "Submission Ditolak",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      // Handle file upload to create supporting documents array
      let supportingDocuments: string[] = [];
      
      if (uploadedFile) {
        try {
          console.log('Processing uploaded file:', uploadedFile.name);
          
          // Get JWT token for authorization
          const token = localStorage.getItem('utamahr_token');
          if (!token) {
            throw new Error('No authentication token found');
          }

          // Step 1: Get presigned upload URL from object storage
          const uploadUrlResponse = await fetch('/api/objects/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!uploadUrlResponse.ok) {
            throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`);
          }

          const { uploadURL } = await uploadUrlResponse.json();
          console.log('Got upload URL from object storage');

          // Step 2: Upload file directly to the presigned URL
          const fileUploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: uploadedFile,
            headers: {
              'Content-Type': uploadedFile.type,
            },
          });

          if (!fileUploadResponse.ok) {
            throw new Error(`File upload to object storage failed: ${fileUploadResponse.status} ${fileUploadResponse.statusText}`);
          }

          // Step 3: Set ACL policy for the uploaded file
          const aclResponse = await fetch('/api/objects/set-acl', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ objectUrl: uploadURL }),
          });

          if (!aclResponse.ok) {
            throw new Error(`Failed to set ACL policy: ${aclResponse.status} ${aclResponse.statusText}`);
          }

          const { objectPath } = await aclResponse.json();
          supportingDocuments.push(objectPath);
          console.log('File uploaded successfully to object storage with ACL:', objectPath);
        } catch (error) {
          console.error('Error uploading file:', error);
          setValidationError('Failed to upload supporting document: ' + (error instanceof Error ? error.message : 'Unknown error'));
          toast({
            title: "File Upload Error",
            description: 'Failed to upload supporting document. Please try again.',
            variant: "destructive",
          });
          return;
        }
      }

      // Create financial claim application
      const claimData: InsertClaimApplication = {
        employeeId: selectedRequestor,
        claimType: 'financial',
        claimCategory: 'financial',
        financialPolicyName: claimType,
        amount: claimAmount,
        claimDate: new Date(claimDate),
        particulars,
        remark,
        supportingDocuments, // Include the uploaded documents
        status: 'pending',
        dateSubmitted: new Date(),
      };

      console.log('Submitting claim with supporting documents:', supportingDocuments);
      createClaimMutation.mutate(claimData);
    } else if (selectedCategory === 'overtime') {
      // Basic validation for overtime
      if (!reason || !claimDate || !startTime || !endTime || !selectedRequestor) {
        const error = "Sila isi semua field yang diperlukan untuk overtime claim";
        setValidationError(error);
        toast({
          title: "Submission Ditolak",
          description: error,
          variant: "destructive",
        });
        return;
      }

      const totalHours = calculateTotalHours();
      if (totalHours <= 0) {
        const error = "Masa tamat mesti selepas masa mula";
        setValidationError(error);
        toast({
          title: "Submission Ditolak",
          description: error,
          variant: "destructive",
        });
        return;
      }

      // Handle file upload for overtime claims too
      let supportingDocuments: string[] = [];
      
      if (uploadedFile) {
        try {
          console.log('Processing uploaded file for overtime:', uploadedFile.name);
          
          // Get JWT token for authorization
          const token = localStorage.getItem('utamahr_token');
          if (!token) {
            throw new Error('No authentication token found');
          }

          // Step 1: Get presigned upload URL from object storage
          const uploadUrlResponse = await fetch('/api/objects/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!uploadUrlResponse.ok) {
            throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`);
          }

          const { uploadURL } = await uploadUrlResponse.json();
          console.log('Got upload URL from object storage for overtime');

          // Step 2: Upload file directly to the presigned URL
          const fileUploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: uploadedFile,
            headers: {
              'Content-Type': uploadedFile.type,
            },
          });

          if (!fileUploadResponse.ok) {
            throw new Error(`File upload to object storage failed: ${fileUploadResponse.status} ${fileUploadResponse.statusText}`);
          }

          // Step 3: Set ACL policy for the uploaded file
          const aclResponse = await fetch('/api/objects/set-acl', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ objectUrl: uploadURL }),
          });

          if (!aclResponse.ok) {
            throw new Error(`Failed to set ACL policy: ${aclResponse.status} ${aclResponse.statusText}`);
          }

          const { objectPath } = await aclResponse.json();
          supportingDocuments.push(objectPath);
          console.log('Overtime file uploaded successfully to object storage with ACL:', objectPath);
        } catch (error) {
          console.error('Error uploading overtime file:', error);
          setValidationError('Failed to upload supporting document: ' + (error instanceof Error ? error.message : 'Unknown error'));
          toast({
            title: "File Upload Error",
            description: 'Failed to upload supporting document. Please try again.',
            variant: "destructive",
          });
          return;
        }
      }

      // Create overtime claim application
      const claimData: InsertClaimApplication = {
        employeeId: selectedRequestor,
        claimType: 'overtime',
        claimCategory: 'overtime',
        claimDate: new Date(claimDate),
        startTime: startTime,
        endTime: endTime,
        reason: reason,
        remark: additionalDescription,
        supportingDocuments, // Include the uploaded documents
        status: 'pending',
        dateSubmitted: new Date(),
      };

      console.log('Submitting overtime claim with supporting documents:', supportingDocuments);
      createClaimMutation.mutate(claimData);
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
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Pemohon</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Claim Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(recentFinancialClaims) && recentFinancialClaims.length > 0 ? (
                          (recentFinancialClaims as any[]).map((claim: any) => (
                            <tr key={claim.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                {availableEmployees.find((emp: any) => emp.id === claim.employeeId)?.fullName || 'Unknown'}
                              </td>
                              <td className="py-3 px-4">{claim.financialPolicyName || claim.claimType}</td>
                              <td className="py-3 px-4">RM {parseFloat(claim.amount || 0).toFixed(2)}</td>
                              <td className="py-3 px-4">
                                {new Date(claim.claimDate || claim.dateSubmitted).toLocaleDateString('en-MY')}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  claim.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : claim.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {claim.status === 'pending' ? 'Pending' : 
                                   claim.status === 'approved' ? 'Approved' :
                                   claim.status === 'rejected' ? 'Rejected' : 'Unknown'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-500">
                              No data available in table
                            </td>
                          </tr>
                        )}
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
                        {claimTypes.map((type, index) => (
                          <SelectItem key={`${type}-${index}`} value={type}>{type}</SelectItem>
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

                  {/* Validation Error Display */}
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {validationError}
                      </div>
                    </div>
                  )}

                  {/* Policy Limits Display */}
                  {selectedPolicy && claimType && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                      <div className="font-medium mb-1">Had untuk {claimType}:</div>
                      <div className="text-xs space-y-1">
                        <div>• Had tahunan: {selectedPolicy.annualLimitUnlimited ? "Tanpa had" : `RM${selectedPolicy.annualLimit}`}</div>
                        <div>• Had setiap permohonan: {selectedPolicy.limitPerApplicationUnlimited ? "Tanpa had" : `RM${selectedPolicy.limitPerApplication}`}</div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={() => {
                      console.log('Submit button clicked for financial claim');
                      console.log('Button disabled state:', !claimType || !claimAmount || !claimDate || !selectedRequestor || isValidating || createClaimMutation.isPending);
                      console.log('Form values:', { claimType, claimAmount, claimDate, selectedRequestor, isValidating, isPending: createClaimMutation.isPending });
                      handleSubmit();
                    }}
                    className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!claimType || !claimAmount || !claimDate || !selectedRequestor || isValidating || createClaimMutation.isPending}
                    data-testid="button-submit-claim"
                  >
                    {isValidating || createClaimMutation.isPending ? "Memproses..." : "Submit Now"}
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
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Pemohon</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Claim Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Hours</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(recentOvertimeClaims) && recentOvertimeClaims.length > 0 ? (
                          (recentOvertimeClaims as any[]).map((claim: any) => (
                            <tr key={claim.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                {availableEmployees.find((emp: any) => emp.id === claim.employeeId)?.fullName || 'Unknown'}
                              </td>
                              <td className="py-3 px-4">Overtime</td>
                              <td className="py-3 px-4">
                                {claim.totalHours ? `${parseFloat(claim.totalHours).toFixed(1)} hrs` : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                {new Date(claim.claimDate || claim.dateSubmitted).toLocaleDateString('en-MY')}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  claim.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : claim.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {claim.status === 'pending' ? 'Pending' : 
                                   claim.status === 'approved' ? 'Approved' :
                                   claim.status === 'rejected' ? 'Rejected' : 'Unknown'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-500">
                              No data available in table
                            </td>
                          </tr>
                        )}
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

                  {/* Validation Error Display */}
                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {validationError}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={() => {
                      console.log('Submit button clicked for overtime claim');
                      console.log('Button disabled state:', !startTime || !endTime || !claimDate || !reason || !selectedRequestor || isValidating || createClaimMutation.isPending);
                      console.log('Form values:', { startTime, endTime, claimDate, reason, selectedRequestor, isValidating, isPending: createClaimMutation.isPending });
                      handleSubmit();
                    }}
                    className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!startTime || !endTime || !claimDate || !reason || !selectedRequestor || isValidating || createClaimMutation.isPending}
                    data-testid="button-submit-overtime"
                  >
                    {isValidating || createClaimMutation.isPending ? "Memproses..." : "Submit Now"}
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