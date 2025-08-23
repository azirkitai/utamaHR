import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon
} from "lucide-react";

export default function ShiftCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [preserveManualStates, setPreserveManualStates] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employees data
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch shifts data for legend
  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/shifts'],
  });

  const { data: employeeShifts = [], refetch: refetchEmployeeShifts } = useQuery({
    queryKey: ['/api/employee-shifts'],
  });

  // Mutation for updating employee shift assignment
  const updateShiftMutation = useMutation({
    mutationFn: async ({ employeeId, shiftId, assignedDate }: { employeeId: string; shiftId: string; assignedDate: string }) => {
      console.log('Updating shift assignment:', { employeeId, shiftId, assignedDate });
      const response = await apiRequest("POST", `/api/employees/${employeeId}/assign-shift`, { shiftId, assignedDate });
      console.log('Shift assignment response:', response);
      return response;
    },
    onSuccess: async () => {
      console.log('Shift assignment successful, invalidating cache');
      await queryClient.invalidateQueries({ queryKey: ['/api/employee-shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      await queryClient.refetchQueries({ queryKey: ['/api/employee-shifts'] });
      await queryClient.refetchQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Berjaya",
        description: "Shift telah dikemaskini",
      });
    },
    onError: (error: any) => {
      console.error('Shift assignment error:', error);
      toast({
        title: "Ralat",
        description: error?.message || "Gagal mengubah shift",
        variant: "destructive",
      });
    }
  });

  // Group employees by department
  const departments = React.useMemo(() => {
    const deptMap = new Map();
    
    (employees as any[]).forEach((employee: any) => {
      const deptName = employee.employment?.department || 'Lain-lain';
      const deptId = deptName.toLowerCase().replace(/\s+/g, '-');
      
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          id: deptId,
          name: deptName.toUpperCase(),
          employees: []
        });
      }
      
      deptMap.get(deptId).employees.push({
        id: employee.id,
        name: employee.fullName || `${employee.firstName} ${employee.lastName}`.trim()
      });
    });
    
    return Array.from(deptMap.values());
  }, [employees]);

  // Auto-expand first department
  React.useEffect(() => {
    if (departments.length > 0 && expandedDepartments.length === 0) {
      setExpandedDepartments([departments[0].id]);
    }
  }, [departments]);

  // Get dates based on view mode
  const getDatesForView = (date: Date) => {
    if (viewMode === "week") {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        weekDates.push(currentDate);
      }
      return weekDates;
    } else if (viewMode === "month") {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const monthDates = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        monthDates.push(currentDate);
      }
      return monthDates;
    }
    return [];
  };

  const viewDates = getDatesForView(currentWeek);

  const formatDateRange = () => {
    if (viewMode === "week") {
      const startDate = viewDates[0];
      const endDate = viewDates[6];
      
      const formatOptions: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric'
      };
      
      const start = startDate.toLocaleDateString('en-US', formatOptions);
      const end = endDate.toLocaleDateString('en-US', formatOptions);
      const year = endDate.getFullYear();
      
      return `${start} – ${end}, ${year}`;
    } else if (viewMode === "month") {
      const formatOptions: Intl.DateTimeFormatOptions = { 
        month: 'long', 
        year: 'numeric'
      };
      
      return currentWeek.toLocaleDateString('en-US', formatOptions);
    }
    return "";
  };

  const getDayHeaders = () => {
    if (viewMode === "week") {
      const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return viewDates.map((date, index) => ({
        dayName: dayNames[index],
        dayNumber: date.getDate(),
        fullDate: date
      }));
    } else if (viewMode === "month") {
      return viewDates.map((date) => ({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })[0], // Just first letter
        dayNumber: date.getDate(),
        fullDate: date
      }));
    }
    return [];
  };

  const navigateView = (direction: 'prev' | 'next') => {
    // Prevent navigation if user has unsaved changes in edit mode
    if (editMode && Object.keys(manualShiftStates).length > 0) {
      toast({
        title: "Simpan Perubahan Dahulu",
        description: "Sila simpan perubahan shift sebelum navigasi ke minggu/bulan lain",
        variant: "destructive",
      });
      return;
    }

    const newDate = new Date(currentWeek);
    
    if (viewMode === "week") {
      newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === "month") {
      newDate.setMonth(currentWeek.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentWeek(newDate);
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments(prev => 
      prev.includes(departmentId) 
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const getShiftForDay = (employeeId: string, date: Date) => {
    // Normalize date to start of day for comparison
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Find shift assignment for this employee on this specific date
    const specificShiftAssignment = (employeeShifts as any[]).find((assignment: any) => {
      if (assignment.employeeId !== employeeId) return false;
      if (!assignment.assignedDate) return false;
      
      const assignedDate = new Date(assignment.assignedDate);
      assignedDate.setHours(0, 0, 0, 0);
      
      return assignedDate.getTime() === targetDate.getTime();
    });
    
    if (specificShiftAssignment) {
      // Find the actual shift details
      const assignedShift = (shifts as any[]).find((shift: any) => 
        shift.id === specificShiftAssignment.shiftId
      );
      
      if (assignedShift) {
        const dayOfWeek = date.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dayOfWeek];
        
        // Check workdays configuration for this day
        let workdays = {};
        try {
          workdays = JSON.parse(assignedShift.workdays || '{}');
        } catch (e) {
          // Default workdays if parsing fails
          workdays = {
            Sunday: "Off Day",
            Monday: "Full Day", 
            Tuesday: "Full Day",
            Wednesday: "Full Day",
            Thursday: "Full Day",
            Friday: "Full Day",
            Saturday: "Half Day"
          };
        }
        
        const workdayStatus = (workdays as any)[dayName] || "Full Day";
        
        if (workdayStatus === "Off Day") {
          return { type: "off", label: "Off Day", color: "#E5E7EB", shiftId: specificShiftAssignment.shiftId };
        }
        
        return { 
          type: "shift", 
          label: assignedShift.name,
          color: assignedShift.color || '#6B7280',
          shiftId: specificShiftAssignment.shiftId
        };
      }
    }
    
    // Default for employees without shift assignment on this date
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: "off", label: "Off Day", color: "#E5E7EB", shiftId: "" };
    }
    
    return { type: "shift", label: "No Shift", color: "#6B7280", shiftId: "" };
  };

  // Manual state management to handle per-date shift assignments
  const [manualShiftStates, setManualShiftStates] = useState<Record<string, string>>({});

  // Memoized mutation handler that updates manual state immediately for specific date
  const handleShiftChange = useCallback((employeeId: string, shiftId: string, date: Date) => {
    console.log('Handling shift change:', { employeeId, shiftId, date });
    
    // Create unique key for employee + date combination
    const stateKey = `${employeeId}-${date.toISOString()}`;
    setManualShiftStates(prev => ({
      ...prev,
      [stateKey]: shiftId === "no-shift" ? "" : shiftId
    }));
    
    // Don't make individual API calls - just track changes in manual state
    // API calls will only happen when Save button is pressed
    console.log('Shift change tracked in manual state:', { employeeId, shiftId, date: date.toISOString() });
  }, []);

  // Independent Shift Cell Component with manual state bypass
  const IndependentShiftCell = React.memo(({
    employeeId,
    dayDate,
    dayIndex,
    shift,
    editMode,
    shifts,
    onShiftChange,
    manualState
  }: {
    employeeId: string;
    dayDate: Date;
    dayIndex: number;
    shift: { type: string; label: string; color: string; shiftId?: string };
    editMode: boolean;
    shifts: any[];
    onShiftChange: (employeeId: string, shiftId: string, date: Date) => void;
    manualState?: string;
  }) => {
    const uniqueId = `${employeeId}-${dayDate.toISOString()}-${dayIndex}`;
    
    // Use manual state if available, otherwise use shift data
    const currentShiftId = manualState !== undefined ? manualState : (shift?.shiftId || '');
    const displayValue = currentShiftId === '' ? 'no-shift' : currentShiftId;

    console.log(`Cell ${uniqueId} rendering with value: ${displayValue} (manual: ${manualState}, shift: ${shift?.shiftId})`);

    if (editMode) {
      return (
        <Select
          value={displayValue}
          onValueChange={(newShiftId) => {
            console.log(`Cell ${uniqueId} changing from ${displayValue} to ${newShiftId}`);
            onShiftChange(employeeId, newShiftId, dayDate);
          }}
        >
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="Select shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-shift">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-gray-300"></div>
                <span>No Shift</span>
              </div>
            </SelectItem>
            {shifts.map((shiftOption: any) => (
              <SelectItem key={shiftOption.id} value={shiftOption.id}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: shiftOption.color }}
                  ></div>
                  <span>{shiftOption.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // View mode: Show shift badge
    return (
      <div className="flex items-center justify-center">
        <Badge
          variant="secondary"
          className="text-xs px-2 py-1 min-w-20"
          style={{
            backgroundColor: shift.color,
            color: '#fff',
            borderColor: shift.color,
          }}
        >
          {shift.label}
        </Badge>
      </div>
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <span>Home &gt; Attendance &gt; Shift</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Shift Calendar</h1>
          </div>
        </div>

        {/* Shift Calendar Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Shift Calendar</h3>
        </div>

        {/* Navigation and Week Range */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateView('prev')}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateView('next')}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white hover:opacity-90"
              data-testid="button-today"
            >
              Today
            </Button>
          </div>

          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="text-xl font-bold text-gray-900 border-gray-300 hover:bg-gray-50 h-auto py-2 px-4"
                data-testid="button-date-picker"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentWeek}
                onSelect={(date) => {
                  if (date) {
                    // Prevent date change if user has unsaved changes in edit mode
                    if (editMode && Object.keys(manualShiftStates).length > 0) {
                      toast({
                        title: "Simpan Perubahan Dahulu",
                        description: "Sila simpan perubahan shift sebelum tukar tarikh",
                        variant: "destructive",
                      });
                      setShowDatePicker(false);
                      return;
                    }
                    setCurrentWeek(date);
                    setShowDatePicker(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                // Prevent view mode change if user has unsaved changes in edit mode
                if (editMode && Object.keys(manualShiftStates).length > 0) {
                  toast({
                    title: "Simpan Perubahan Dahulu",
                    description: "Sila simpan perubahan shift sebelum tukar ke week view",
                    variant: "destructive",
                  });
                  return;
                }
                setViewMode("week");
              }}
              className={viewMode === "week" ? "bg-black text-white" : ""}
              data-testid="button-week-view"
            >
              week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                // Prevent view mode change if user has unsaved changes in edit mode
                if (editMode && Object.keys(manualShiftStates).length > 0) {
                  toast({
                    title: "Simpan Perubahan Dahulu",
                    description: "Sila simpan perubahan shift sebelum tukar ke month view",
                    variant: "destructive",
                  });
                  return;
                }
                setViewMode("month");
              }}
              className={viewMode === "month" ? "bg-black text-white" : ""}
              data-testid="button-month-view"
            >
              month
            </Button>
          </div>
        </div>

        {/* Shift Calendar Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 font-medium text-gray-900 w-64">
                    Employee
                  </th>
                  {getDayHeaders().map((day, index) => (
                    <th key={index} className="text-center p-4 font-medium text-gray-900 min-w-32">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{day.dayNumber} {day.dayName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : departments.map((department) => (
                  <React.Fragment key={department.id}>
                    {/* Department Header Row */}
                    <tr className="bg-gray-100 border-b">
                      <td colSpan={8} className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDepartment(department.id)}
                          className="flex items-center space-x-2 text-left w-full justify-start p-0 h-auto"
                          data-testid={`toggle-department-${department.id}`}
                        >
                          {expandedDepartments.includes(department.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className="font-medium text-gray-700">
                            {department.name}
                          </span>
                        </Button>
                      </td>
                    </tr>

                    {/* Employee Rows */}
                    {expandedDepartments.includes(department.id) && department.employees.map((employee: any) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">
                          {employee.name}
                        </td>
                        {getDayHeaders().map((day, dayIndex) => {
                          const shift = getShiftForDay(employee.id, day.fullDate);
                          const uniqueKey = `cell-${employee.id}-${day.fullDate}-${dayIndex}`;
                          return (
                            <td key={uniqueKey} className="p-2 text-center">
                              <IndependentShiftCell
                                key={uniqueKey}
                                employeeId={employee.id}
                                dayDate={day.fullDate}
                                dayIndex={dayIndex}
                                shift={shift}
                                editMode={editMode}
                                shifts={shifts as any[]}
                                onShiftChange={handleShiftChange}
                                manualState={manualShiftStates[`${employee.id}-${day.fullDate.toISOString()}`]}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend and Edit Button */}
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {(shifts as any[]).map((shift: any) => (
              <div key={shift.id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: shift.color || '#6B7280' }}
                ></div>
                <span className="text-gray-600">{shift.name}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    // Get all manual state changes that need to be saved
                    const savePromises = Object.entries(manualShiftStates).map(([key, shiftId]) => {
                      // Key format: employeeId-ISODateString
                      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars including dashes)
                      // So we extract first 36 chars as employeeId, rest as date
                      const employeeId = key.substring(0, 36);
                      const assignedDate = key.substring(37); // Skip the dash after UUID
                      
                      console.log('Saving shift:', { employeeId, shiftId, assignedDate });
                      console.log('Date type:', typeof assignedDate, 'Date value:', assignedDate);
                      
                      return apiRequest("POST", `/api/employees/${employeeId}/assign-shift`, { 
                        shiftId: shiftId === "" ? "" : shiftId,
                        assignedDate 
                      });
                    });
                    
                    // Execute all saves
                    await Promise.all(savePromises);
                    
                    // Clear manual states after successful save
                    setManualShiftStates({});
                    
                    // Refresh data with force reload
                    await queryClient.invalidateQueries({ queryKey: ['/api/employee-shifts'] });
                    await queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
                    await refetchEmployeeShifts(); // Direct refetch
                    
                    toast({
                      title: "Berjaya",
                      description: `${savePromises.length} perubahan shift telah disimpan ke database`,
                    });
                    
                    // Exit edit mode after 2 seconds to allow user to see the changes
                    setTimeout(() => {
                      setEditMode(false);
                    }, 2000);
                  } catch (error: any) {
                    console.error('Bulk save error:', error);
                    toast({
                      title: "Ralat",
                      description: error?.message || "Gagal menyimpan perubahan",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                data-testid="button-save-shifts"
                disabled={Object.keys(manualShiftStates).length === 0}
              >
                Save ({Object.keys(manualShiftStates).length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className={`${editMode ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'}`}
              data-testid="button-edit-shifts"
            >
              {editMode ? 'Exit Edit' : 'Edit Shifts'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}