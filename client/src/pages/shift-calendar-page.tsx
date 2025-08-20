import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  // Fetch employees data
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch shifts data for legend
  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/shifts'],
  });

  const { data: employeeShifts = [] } = useQuery({
    queryKey: ['/api/employee-shifts'],
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

  // Get week dates
  const getWeekDates = (date: Date) => {
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
  };

  const weekDates = getWeekDates(currentWeek);

  const formatWeekRange = () => {
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };
    
    const start = startDate.toLocaleDateString('en-US', formatOptions);
    const end = endDate.toLocaleDateString('en-US', formatOptions);
    const year = endDate.getFullYear();
    
    return `${start} – ${end}, ${year}`;
  };

  const getDayHeaders = () => {
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return weekDates.map((date, index) => ({
      dayName: dayNames[index],
      dayNumber: date.getDate(),
      fullDate: date
    }));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDepartments(prev => 
      prev.includes(departmentId) 
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const getShiftForDay = (employeeId: string, date: Date) => {
    // Find active shift assignment for this employee
    const activeShiftAssignment = (employeeShifts as any[]).find((assignment: any) => 
      assignment.employeeId === employeeId && 
      assignment.isActive &&
      (!assignment.endDate || new Date(assignment.endDate) >= date)
    );
    
    if (activeShiftAssignment) {
      // Find the actual shift details
      const assignedShift = (shifts as any[]).find((shift: any) => 
        shift.id === activeShiftAssignment.shiftId
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
          return { type: "off", label: "Off Day", color: "#E5E7EB" };
        }
        
        return { 
          type: "shift", 
          label: assignedShift.name,
          color: assignedShift.color || '#6B7280'
        };
      }
    }
    
    // Default for employees without shift assignment
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: "off", label: "Off Day", color: "#E5E7EB" };
    }
    
    return { type: "shift", label: "No Shift", color: "#6B7280" };
  };

  const renderShiftCell = (shift: { type: string; label: string; color: string }) => {
    if (shift.type === "off") {
      return (
        <div className="px-2 py-1 text-xs text-center bg-gray-200 text-gray-600 rounded">
          {shift.label}
        </div>
      );
    }
    return (
      <div 
        className="px-2 py-1 text-xs text-center text-white rounded"
        style={{ backgroundColor: shift.color }}
      >
        {shift.label}
      </div>
    );
  };

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
              onClick={() => navigateWeek('prev')}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
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
                {formatWeekRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentWeek}
                onSelect={(date) => {
                  if (date) {
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
              onClick={() => setViewMode("week")}
              className={viewMode === "week" ? "bg-black text-white" : ""}
              data-testid="button-week-view"
            >
              week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
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
                          return (
                            <td key={dayIndex} className="p-2 text-center">
                              {renderShiftCell(shift)}
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

        {/* Legend */}
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
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-gray-600">Off Day</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}