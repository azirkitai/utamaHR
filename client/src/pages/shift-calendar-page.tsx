import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function ShiftCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>(["human-resource"]);

  // Sample data
  const departments = [
    {
      id: "human-resource",
      name: "Human Resource",
      employees: [
        {
          id: 1,
          name: "SITI NADIAH SABRI"
        },
        {
          id: 2,
          name: "madrah samsi"
        }
      ]
    }
  ];

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

  const getShiftForDay = (employeeId: number, date: Date) => {
    const dayOfWeek = date.getDay();
    // Saturday (6) and Sunday (0) are off days
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: "off", label: "Off Day" };
    }
    return { type: "default", label: "Default Shift" };
  };

  const renderShiftCell = (shift: { type: string; label: string }) => {
    if (shift.type === "off") {
      return (
        <div className="px-2 py-1 text-xs text-center bg-gray-200 text-gray-600 rounded">
          {shift.label}
        </div>
      );
    }
    return (
      <div className="px-2 py-1 text-xs text-center bg-blue-600 text-white rounded">
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
          </div>

          <div className="text-xl font-bold text-gray-900">
            {formatWeekRange()}
          </div>

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
                {departments.map((department) => (
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
                    {expandedDepartments.includes(department.id) && department.employees.map((employee) => (
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
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Default Shift</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-gray-600">Off Day</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}