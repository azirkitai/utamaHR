import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Printer, Eye, Check, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type TabType = "approval" | "report" | "summary" | "balance-carry-forward";

interface LeaveRecord {
  id: string;
  employeeId: string;
  applicant: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

// Debug component to isolate the issue - Step 4: Added core tab structure
export default function LeaveApprovalPageDebug() {
  const [activeTab, setActiveTab] = useState<TabType>("approval");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Test useQuery - real API call
  const { data: leaveApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications"],
  });

  // Simple render function test - minimal table
  const renderApprovalTable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveApplications.slice(0, 3).map((application: any) => (
            <TableRow key={application.id}>
              <TableCell>{application.employee?.fullName || "Unknown"}</TableCell>
              <TableCell>{application.leaveType || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={application.status === "Pending" ? "outline" : "secondary"}>
                  {application.status || "Pending"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1>Debug: Leave Approval Page - Step 4</h1>
        <p>Testing core structure with real data:</p>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(["approval", "report", "summary", "balance-carry-forward"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm",
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-64"
          />
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg border">
          {activeTab === "approval" && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Leave Applications for Approval</h3>
              {renderApprovalTable()}
            </div>
          )}
          
          {activeTab === "report" && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Leave Report</h3>
              <p>Report view working!</p>
            </div>
          )}
          
          {activeTab === "summary" && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Leave Summary</h3>
              <p>Summary view working!</p>
            </div>
          )}
          
          {activeTab === "balance-carry-forward" && (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Balance Carry Forward</h3>
              <p>Balance view working!</p>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Total Applications: {leaveApplications.length}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}