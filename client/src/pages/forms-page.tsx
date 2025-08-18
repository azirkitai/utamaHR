import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FormInput, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock,
  Users,
  Building2,
  Settings,
  Plus,
  Download,
  Upload
} from "lucide-react";

interface FormCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  forms: FormItem[];
  color: string;
}

interface FormItem {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "archived";
  lastModified: string;
  href: string;
}

const formCategories: FormCategory[] = [
  {
    id: "employee",
    title: "Employee Forms",
    description: "Forms related to employee management and HR processes",
    icon: <Users className="w-5 h-5" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    forms: [
      {
        id: "employee-registration",
        name: "Employee Registration",
        description: "New employee onboarding form",
        status: "active",
        lastModified: "2025-08-15",
        href: "/forms/employee-registration"
      },
      {
        id: "personal-data-update",
        name: "Personal Data Update",
        description: "Update employee personal information",
        status: "active",
        lastModified: "2025-08-14",
        href: "/forms/personal-data-update"
      },
      {
        id: "emergency-contact",
        name: "Emergency Contact",
        description: "Emergency contact information form",
        status: "active",
        lastModified: "2025-08-13",
        href: "/forms/emergency-contact"
      }
    ]
  },
  {
    id: "leave",
    title: "Leave Forms",
    description: "Leave application and management forms",
    icon: <Calendar className="w-5 h-5" />,
    color: "bg-green-50 text-green-700 border-green-200",
    forms: [
      {
        id: "annual-leave",
        name: "Annual Leave Application",
        description: "Apply for annual leave",
        status: "active",
        lastModified: "2025-08-16",
        href: "/forms/annual-leave"
      },
      {
        id: "medical-leave",
        name: "Medical Leave",
        description: "Medical leave application form",
        status: "active",
        lastModified: "2025-08-15",
        href: "/forms/medical-leave"
      },
      {
        id: "emergency-leave",
        name: "Emergency Leave",
        description: "Emergency leave application",
        status: "active",
        lastModified: "2025-08-14",
        href: "/forms/emergency-leave"
      }
    ]
  },
  {
    id: "claims",
    title: "Claims Forms",
    description: "Financial claims and reimbursement forms",
    icon: <DollarSign className="w-5 h-5" />,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    forms: [
      {
        id: "travel-claim",
        name: "Travel Claim",
        description: "Business travel expense claim",
        status: "active",
        lastModified: "2025-08-17",
        href: "/forms/travel-claim"
      },
      {
        id: "medical-claim",
        name: "Medical Claim",
        description: "Medical expense reimbursement",
        status: "active",
        lastModified: "2025-08-16",
        href: "/forms/medical-claim"
      },
      {
        id: "meal-allowance",
        name: "Meal Allowance",
        description: "Daily meal allowance claim",
        status: "active",
        lastModified: "2025-08-15",
        href: "/forms/meal-allowance"
      }
    ]
  },
  {
    id: "attendance",
    title: "Attendance Forms",
    description: "Time tracking and attendance related forms",
    icon: <Clock className="w-5 h-5" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    forms: [
      {
        id: "overtime-request",
        name: "Overtime Request",
        description: "Request for overtime work",
        status: "active",
        lastModified: "2025-08-18",
        href: "/forms/overtime-request"
      },
      {
        id: "shift-change",
        name: "Shift Change Request",
        description: "Request to change work shift",
        status: "active",
        lastModified: "2025-08-17",
        href: "/forms/shift-change"
      },
      {
        id: "attendance-correction",
        name: "Attendance Correction",
        description: "Correct attendance records",
        status: "active",
        lastModified: "2025-08-16",
        href: "/forms/attendance-correction"
      }
    ]
  },
  {
    id: "company",
    title: "Company Forms",
    description: "Official company and administrative forms",
    icon: <Building2 className="w-5 h-5" />,
    color: "bg-gray-50 text-gray-700 border-gray-200",
    forms: [
      {
        id: "letter-request",
        name: "Letter Request",
        description: "Request for official letters",
        status: "active",
        lastModified: "2025-08-18",
        href: "/forms/letter-request"
      },
      {
        id: "facility-booking",
        name: "Facility Booking",
        description: "Book company facilities",
        status: "active",
        lastModified: "2025-08-17",
        href: "/forms/facility-booking"
      },
      {
        id: "equipment-request",
        name: "Equipment Request",
        description: "Request for office equipment",
        status: "draft",
        lastModified: "2025-08-15",
        href: "/forms/equipment-request"
      }
    ]
  }
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success" className="text-xs">Active</Badge>;
    case "draft":
      return <Badge variant="secondary" className="text-xs">Draft</Badge>;
    case "archived":
      return <Badge variant="destructive" className="text-xs">Archived</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function FormsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800">
                <FormInput className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
                <p className="text-gray-600">Manage and access all company forms</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Form
            </Button>
            <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Form
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Forms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formCategories.reduce((total, category) => total + category.forms.length, 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{formCategories.length}</p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Forms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formCategories.reduce((total, category) => 
                      total + category.forms.filter(form => form.status === "active").length, 0)}
                  </p>
                </div>
                <Plus className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Draft Forms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formCategories.reduce((total, category) => 
                      total + category.forms.filter(form => form.status === "draft").length, 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Categories */}
        <div className="space-y-6">
          {formCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className={`${category.color} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription className="text-sm opacity-80">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white/50">
                    {category.forms.length} forms
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                  {category.forms.map((form) => (
                    <div key={form.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{form.name}</h3>
                        {getStatusBadge(form.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {form.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Modified: {new Date(form.lastModified).toLocaleDateString('ms-MY')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}