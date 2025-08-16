import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  FileText,
  Megaphone,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  CheckSquare,
  Clock,
  BarChart3,
  FileSpreadsheet,
  CreditCard,
  Building2,
  Star,
  DollarSign,
  CalendarDays,
  Timer,
  CalendarClock,
  ClockIcon,
  AlertTriangle,
  Banknote,
  Receipt,
  Bell,
  QrCode
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import utamaHRLogo from "@assets/eClaim_1754579086368.png";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  children?: SidebarItem[];
}

const navigationItems: { category: string; items: SidebarItem[] }[] = [
  {
    category: "Main Navigation",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
        href: "/",
      },
      {
        id: "qr-clockin",
        label: "QR Clock-In",
        icon: <QrCode className="w-4 h-4" />,
        href: "/qr-clockin",
      },
      {
        id: "my-record",
        label: "My Record",
        icon: <FileText className="w-4 h-4" />,
        href: "/my-record",
      },
      {
        id: "apply",
        label: "Apply",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        href: "/apply",
        children: [
          {
            id: "apply-leave",
            label: "Leave",
            icon: <CalendarDays className="w-3 h-3" />,
            href: "/apply/leave",
          },
          {
            id: "apply-claim",
            label: "Claim",
            icon: <DollarSign className="w-3 h-3" />,
            href: "/apply/claim",
          },

        ],
      },
      {
        id: "announcement",
        label: "Announcement",
        icon: <Megaphone className="w-4 h-4" />,
        href: "/announcement",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: <Calendar className="w-4 h-4" />,
        href: "/calendar",
      },
      {
        id: "performance",
        label: "Performance",
        icon: <TrendingUp className="w-4 h-4" />,
        href: "/performance",
        badge: "★",
      },
    ],
  },
  {
    category: "Administration",
    items: [
      {
        id: "employee",
        label: "Employee",
        icon: <Users className="w-4 h-4" />,
        href: "/manage-employee",
      },
      {
        id: "approval",
        label: "Approval",
        icon: <CheckSquare className="w-4 h-4" />,
        href: "/approval",
        children: [
          {
            id: "approval-leave",
            label: "Leave",
            icon: <CalendarDays className="w-3 h-3" />,
            href: "/approval/leave",
          },
          {
            id: "approval-claim",
            label: "Claim",
            icon: <DollarSign className="w-3 h-3" />,
            href: "/approval/claim",
          },

        ],
      },
      {
        id: "attendance",
        label: "Attendance",
        icon: <Clock className="w-4 h-4" />,
        href: "/attendance",
        children: [
          {
            id: "attendance-timesheet",
            label: "Timesheet",
            icon: <Timer className="w-3 h-3" />,
            href: "/attendance/timesheet",
          },
          {
            id: "attendance-shift-calendar",
            label: "Shift Calendar",
            icon: <CalendarClock className="w-3 h-3" />,
            href: "/attendance/shift-calendar",
          },
          {
            id: "attendance-overtime",
            label: "Overtime",
            icon: <ClockIcon className="w-3 h-3" />,
            href: "/attendance/overtime",
          },
          {
            id: "attendance-lateness",
            label: "Lateness",
            icon: <AlertTriangle className="w-3 h-3" />,
            href: "/attendance/lateness",
          },
        ],
      },
      {
        id: "evaluation",
        label: "Evaluation",
        icon: <BarChart3 className="w-4 h-4" />,
        href: "/evaluation",
        badge: "★",
      },
      {
        id: "yearly-form",
        label: "Yearly Form",
        icon: <FileText className="w-4 h-4" />,
        href: "/yearly-form",
      },
      {
        id: "payment",
        label: "Payment",
        icon: <CreditCard className="w-4 h-4" />,
        href: "/payment",
        children: [
          {
            id: "payment-salary-payroll",
            label: "Salary Payroll",
            icon: <Banknote className="w-3 h-3" />,
            href: "/payment/salary-payroll",
          },

          {
            id: "payment-voucher",
            label: "Payment Voucher",
            icon: <Receipt className="w-3 h-3" />,
            href: "/payment/voucher",
          },
        ],
      },
      {
        id: "system-setting",
        label: "System Setting",
        icon: <Settings className="w-4 h-4" />,
        href: "/system-setting",
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActiveRoute = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isExpanded = (itemId: string) => expandedItems.includes(itemId);

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ease-in-out flex flex-col h-full",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 relative">
        <div className="flex items-center justify-center">
          {!isCollapsed && (
            <img 
              src={utamaHRLogo} 
              alt="UTAMA Human Resources" 
              className="w-48 h-auto object-contain md:w-48 sm:w-40"
            />
          )}
          {isCollapsed && (
            <img 
              src={utamaHRLogo} 
              alt="UTAMA HR" 
              className="w-10 h-auto object-contain"
            />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="text-white hover:bg-slate-700 p-1 absolute top-2 right-2"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {navigationItems.map((section) => (
          <div key={section.category} className="mb-6">
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {section.category}
                </h3>
                <p className="text-xs text-slate-500">
                  Key Your Personal Record Here
                </p>
              </div>
            )}
            
            <nav className="space-y-1 px-2">
              {section.items.map((item) => (
                <div key={item.id}>
                  {/* Main Item */}
                  {item.children ? (
                    <Button
                      variant="ghost"
                      onClick={() => toggleExpanded(item.id)}
                      className={cn(
                        "w-full justify-start text-left h-10 px-3",
                        isActiveRoute(item.href)
                          ? "bg-cyan-600 text-white hover:bg-cyan-700"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white",
                        isCollapsed && "justify-center px-2"
                      )}
                      data-testid={`nav-${item.id}`}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="flex-shrink-0">
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-sm font-medium md:text-sm text-xs leading-tight">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs px-2 py-0",
                                  item.badge === "★" 
                                    ? "bg-yellow-500 text-yellow-900" 
                                    : "bg-slate-600 text-white"
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            <div className="flex-shrink-0">
                              {isExpanded(item.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </Button>
                  ) : (
                    <Link href={item.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left h-10 px-3",
                          isActiveRoute(item.href)
                            ? "bg-cyan-600 text-white hover:bg-cyan-700"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white",
                          isCollapsed && "justify-center px-2"
                        )}
                        data-testid={`nav-${item.id}`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="flex-shrink-0">
                            {item.icon}
                          </div>
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-sm font-medium md:text-sm text-xs leading-tight">
                                {item.label}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs px-2 py-0",
                                    item.badge === "★" 
                                      ? "bg-yellow-500 text-yellow-900" 
                                      : "bg-slate-600 text-white"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </Button>
                    </Link>
                  )}

                  {/* Submenu Items */}
                  {item.children && isExpanded(item.id) && !isCollapsed && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.id} href={child.href}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left h-8 px-3",
                              isActiveRoute(child.href)
                                ? "bg-cyan-600 text-white hover:bg-cyan-700"
                                : "text-slate-400 hover:bg-slate-700 hover:text-white"
                            )}
                            data-testid={`nav-${child.id}`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0">
                                {child.icon}
                              </div>
                              <span className="text-xs font-medium md:text-xs text-[10px] leading-tight">
                                {child.label}
                              </span>
                            </div>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer - Collapse hint */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 text-center">
            Manage Super And Approval
          </div>
        </div>
      )}
    </div>
  );
}