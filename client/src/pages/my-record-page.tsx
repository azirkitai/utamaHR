import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";
import { CalendarIcon, Download, Filter, Search, ChevronLeft, ChevronRight, Calendar as CalendarLucide, Clock, FileText, CreditCard, Users, DollarSign, Image, StickyNote, Eye, File, Share } from "lucide-react";
import type { AttendanceRecord } from "@shared/schema";

type TabType = "leave" | "timeoff" | "claim" | "overtime" | "attendance" | "payment";

interface FilterState {
  dateFrom: Date;
  dateTo: Date;
  searchTerm: string;
  pageSize: number;
}

export default function MyRecordPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("leave");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
    searchTerm: "",
    pageSize: 10
  });

  // Check if user has admin access to view other employees' data
  const hasAdminAccess = user?.role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes(user.role);

  // Fetch attendance records from database
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance-records', filters.dateFrom, filters.dateTo, hasAdminAccess ? null : user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: format(filters.dateFrom, 'yyyy-MM-dd'),
        dateTo: format(filters.dateTo, 'yyyy-MM-dd'),
      });
      
      // Only add employeeId if user doesn't have admin access
      if (!hasAdminAccess && user?.id) {
        params.append('employeeId', user.id);
      }
      
      const response = await fetch(`/api/attendance-records?${params}`);
      if (!response.ok) throw new Error('Failed to fetch attendance records');
      const data = await response.json();
      return data as AttendanceRecord[];
    },
    enabled: !!user && activeTab === 'attendance'
  });

  const tabs = [
    { id: "leave", label: "Leave", icon: <CalendarLucide className="w-4 h-4 text-gray-600" /> },
    { id: "timeoff", label: "Timeoff", icon: <Clock className="w-4 h-4 text-gray-600" /> },
    { id: "claim", label: "Financial Claim", icon: <DollarSign className="w-4 h-4 text-gray-600" /> },
    { id: "overtime", label: "Overtime", icon: <Clock className="w-4 h-4 text-gray-600" /> },
    { id: "attendance", label: "Attendance", icon: <FileText className="w-4 h-4 text-gray-600" /> },
    { id: "payment", label: "Payment", icon: <CreditCard className="w-4 h-4 text-gray-600" /> }
  ];

  const formatDateRange = () => {
    return `${format(filters.dateFrom, "dd/MM/yyyy")} - ${format(filters.dateTo, "dd/MM/yyyy")}`;
  };

  const handleDateSelect = (date: Date | undefined, type: "from" | "to") => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        [type === "from" ? "dateFrom" : "dateTo"]: date
      }));
    }
  };

  const renderLeaveTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Leave Record</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Period</label>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-date-period"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">From Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleDateSelect(date, "from")}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">To Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleDateSelect(date, "to")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Leave Type</label>
          <Select defaultValue="all-leave-type" data-testid="select-leave-type">
            <SelectTrigger>
              <SelectValue placeholder="All leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-leave-type">All leave type</SelectItem>
              <SelectItem value="annual-leave">Annual Leave</SelectItem>
              <SelectItem value="medical-leave">Medical Leave</SelectItem>
              <SelectItem value="compassionate-paternity">Compassionate Leave - Paternity Leave</SelectItem>
              <SelectItem value="compassionate-maternity">Compassionate Leave - Maternity Leave</SelectItem>
              <SelectItem value="compassionate-death">Compassionate Leave - Death of Family Member</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Leave Status</label>
          <Select defaultValue="all-leave-status" data-testid="select-leave-status">
            <SelectTrigger>
              <SelectValue placeholder="All leave status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-leave-status">All leave status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="approved-level1">Approved [Level 1]</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-download">
                <Download className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-download-excel">
                  <Download className="h-4 w-4 mr-2" />
                  Download as Excel
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="button-download-pdf">
                  <Download className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value={filters.pageSize.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, pageSize: parseInt(value) }))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input 
            className="w-64" 
            placeholder="Search..." 
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Day(s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTimeoffTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Timeoff Record</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-timeoff-date-period"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">From Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleDateSelect(date, "from")}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">To Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleDateSelect(date, "to")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Timeoff Status</label>
          <Select defaultValue="all-timeoff-status" data-testid="select-timeoff-status">
            <SelectTrigger>
              <SelectValue placeholder="All timeoff status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-timeoff-status">All timeoff status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-timeoff-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-timeoff-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value="10">
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input className="w-64" placeholder="Search..." data-testid="input-timeoff-search" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Total Hour</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-timeoff-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-timeoff-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderClaimTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Claim Record</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-claim-date-period"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">From Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleDateSelect(date, "from")}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">To Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleDateSelect(date, "to")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Claim Type</label>
          <Select defaultValue="all-claim-type" data-testid="select-claim-type">
            <SelectTrigger>
              <SelectValue placeholder="All claim type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-claim-type">All claim type</SelectItem>
              <SelectItem value="flight-tix">Flight Tix</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
              <SelectItem value="meal">Meal</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
              <SelectItem value="mileage">Mileage (KM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Claim Status</label>
          <Select defaultValue="all-claim-status" data-testid="select-claim-status">
            <SelectTrigger>
              <SelectValue placeholder="All claim status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-claim-status">All claim status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-claim-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-claim-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value="10">
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input className="w-64" placeholder="Search..." data-testid="input-claim-search" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead>Claim Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Claim For</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-claim-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-claim-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOvertimeTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Overtime Record</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-overtime-date-period"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">From Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleDateSelect(date, "from")}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">To Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleDateSelect(date, "to")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Overtime Status</label>
          <Select defaultValue="all-overtime-status" data-testid="select-overtime-status">
            <SelectTrigger>
              <SelectValue placeholder="All overtime status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-overtime-status">All overtime status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-overtime-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-overtime-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value="10">
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input className="w-64" placeholder="Search..." data-testid="input-overtime-search" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Total Hour</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-overtime-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-overtime-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Attendance Record</h2>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-attendance-date-period"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">From Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleDateSelect(date, "from")}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">To Date</h4>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleDateSelect(date, "to")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-attendance-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-attendance-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Show Picture and Show Note buttons */}
      <div className="flex gap-4">
        <Button 
          variant={showPictures ? "default" : "outline"} 
          onClick={() => setShowPictures(!showPictures)}
          data-testid="button-show-picture"
        >
          <Image className="h-4 w-4 mr-2 text-gray-600" />
          Show Picture
        </Button>
        <Button 
          variant={showNotes ? "default" : "outline"} 
          onClick={() => setShowNotes(!showNotes)}
          data-testid="button-show-note"
        >
          <StickyNote className="h-4 w-4 mr-2 text-gray-600" />
          Show Note
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              {hasAdminAccess && <TableHead>Employee</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Clock In</TableHead>
              {showPictures && <TableHead>Clock In Image</TableHead>}
              <TableHead>Clock Out</TableHead>
              {showPictures && <TableHead>Clock Out Image</TableHead>}
              <TableHead>Total Hour(s)</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingAttendance ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 8 : 6) : (showPictures ? 7 : 5)} className="text-center py-8 text-gray-500">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : attendanceRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 8 : 6) : (showPictures ? 7 : 5)} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            ) : (
              attendanceRecords.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell>{index + 1}</TableCell>
                  {hasAdminAccess && <TableCell>{record.employeeId}</TableCell>}
                  <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{record.clockInTime ? format(new Date(record.clockInTime), 'HH:mm') : '-'}</TableCell>
                  {showPictures && (
                    <TableCell>
                      {record.clockInImage ? (
                        <img 
                          src={record.clockInImage} 
                          alt="Clock In" 
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open(record.clockInImage, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{record.clockOutTime ? format(new Date(record.clockOutTime), 'HH:mm') : '-'}</TableCell>
                  {showPictures && (
                    <TableCell>
                      {record.clockOutImage ? (
                        <img 
                          src={record.clockOutImage} 
                          alt="Clock Out" 
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open(record.clockOutImage, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{record.totalHours.toFixed(2)}h</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid={`button-view-${record.id}`}>
                        <Eye className="h-3 w-3 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid={`button-edit-${record.id}`}>
                        <File className="h-3 w-3 text-gray-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-attendance-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-attendance-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const [paymentSubTab, setPaymentSubTab] = useState<"salary" | "voucher" | "yearly">("salary");

  const renderPaymentTab = () => {
    const paymentTabs = [
      { id: "salary", label: "Salary Payroll" },
      { id: "voucher", label: "Payment Voucher" },
      { id: "yearly", label: "Yearly Statement" }
    ];

    const renderSalaryPayroll = () => (
      <div className="space-y-4">
        {/* Show entries and search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input className="w-64" placeholder="Search..." data-testid="input-salary-search" />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Payroll Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</div>
      </div>
    );

    const renderPaymentVoucher = () => (
      <div className="space-y-4">
        {/* Show entries and search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input className="w-64" placeholder="Search..." data-testid="input-voucher-search" />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</div>
      </div>
    );

    const renderYearlyStatement = () => (
      <div className="space-y-4">
        {/* Show entries and search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input className="w-64" placeholder="Search..." data-testid="input-yearly-search" />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Salary Statement</TableHead>
                <TableHead>CP21 Form</TableHead>
                <TableHead>CP22 Form</TableHead>
                <TableHead>EA Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>2023</TableCell>
                <TableCell>No payroll available</TableCell>
                <TableCell>No Data Available</TableCell>
                <TableCell>No Data Available</TableCell>
                <TableCell className="flex items-center gap-2">
                  Document for 2023
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid="button-view-ea">
                      <Eye className="h-3 w-3 text-gray-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid="button-download-ea">
                      <File className="h-3 w-3 text-gray-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid="button-share-ea">
                      <Share className="h-3 w-3 text-gray-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Showing 1 to 1 of 1 entries</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled data-testid="button-yearly-previous">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white" data-testid="button-yearly-current">
              1
            </Button>
            <Button variant="outline" size="sm" disabled data-testid="button-yearly-next">
              Next
            </Button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
          <h2 className="text-xl font-semibold">Payment Record</h2>
        </div>
        
        {/* Payment Sub-tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {paymentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPaymentSubTab(tab.id as "salary" | "voucher" | "yearly")}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm",
                  paymentSubTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Payment Sub-tab Content */}
        {paymentSubTab === "salary" && renderSalaryPayroll()}
        {paymentSubTab === "voucher" && renderPaymentVoucher()}
        {paymentSubTab === "yearly" && renderYearlyStatement()}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500" data-testid="breadcrumb">
          Home &gt; MyRecord &gt; {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">My Record</h1>
        </div>

        {/* Main Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                data-testid={`tab-${tab.id}`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "leave" && renderLeaveTab()}
          {activeTab === "timeoff" && renderTimeoffTab()}
          {activeTab === "claim" && renderClaimTab()}
          {activeTab === "overtime" && renderOvertimeTab()}
          {activeTab === "attendance" && renderAttendanceTab()}
          {activeTab === "payment" && renderPaymentTab()}
        </div>
      </div>
    </DashboardLayout>
  );
}