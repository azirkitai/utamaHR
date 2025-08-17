import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";
import { ClaimPolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClaimPolicyTabProps {
  employeeId: string;
}

export function ClaimPolicyTab({ employeeId }: ClaimPolicyTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company financial claim policies (these are the policies configured in System Settings)
  const { data: financialClaimPolicies = [], isLoading } = useQuery({
    queryKey: ["/api/financial-claim-policies"],
  });

  // Transform financial claim policies to match the expected ClaimPolicy format
  const claimPolicies = financialClaimPolicies.map((policy: any) => ({
    id: policy.id,
    employeeId: employeeId,
    claimType: policy.claimName,
    annualLimit: policy.annualLimit,
    balance: policy.annualLimit, // Initially full limit available
    remarks: policy.claimRemark,
    isEnabled: policy.enabled && !policy.excludedEmployeeIds?.includes(employeeId), // Check if employee is not excluded
  }));

  // Update policy status mutation - adds/removes employee from exclusion list
  const updateStatusMutation = useMutation({
    mutationFn: async ({ policyId, isEnabled }: { policyId: string; isEnabled: boolean }) => {
      // If isEnabled is false, add employee to excluded list
      // If isEnabled is true, remove employee from excluded list
      const action = isEnabled ? "remove" : "add";
      await apiRequest(`/api/financial-claim-policies/${policyId}/exclude-employee`, "PUT", { 
        employeeId,
        action 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-claim-policies"] });
      toast({
        title: "Berjaya",
        description: "Status polisi claim berjaya dikemaskini",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini status polisi",
        variant: "destructive",
      });
    },
  });

  // Filter policies based on search
  const filteredPolicies = claimPolicies.filter((policy) =>
    policy.claimType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle toggle for including/excluding employee from policy
  const handleStatusToggle = (policyId: string, isEnabled: boolean) => {
    updateStatusMutation.mutate({ policyId, isEnabled });
  };



  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-cyan-400 to-blue-700 text-white">
          <CardTitle>Claim Policies</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-cyan-400 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>Claim Policies</CardTitle>
            <Badge variant="secondary" className="bg-white text-cyan-600">
              System Policies
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex justify-end mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-claim-policies"
              />
            </div>
          </div>

          {/* Claim Policies Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Annual Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Included
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        {searchTerm ? "No claim policies found matching your search." : "No data available in table"}
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {policy.claimType || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {policy.annualLimit ? `RM ${Number(policy.annualLimit).toFixed(2)}` : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {policy.balance !== null && policy.balance !== undefined 
                              ? `RM ${Number(policy.balance).toFixed(2)}` 
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {policy.remarks || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <span className="text-gray-400 text-xs">
                            System Policy
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Switch
                              checked={policy.isEnabled || false}
                              onCheckedChange={(checked) => handleStatusToggle(policy.id, checked)}
                              disabled={updateStatusMutation.isPending}
                              data-testid={`switch-included-${policy.id}`}
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {policy.isEnabled ? "Yes" : "No"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredPolicies.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div>
                Showing {filteredPolicies.length} of {claimPolicies.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </>
  );
}