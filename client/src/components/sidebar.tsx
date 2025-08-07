import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Megaphone,
  Calendar,
  TrendingUp,
  Users,
  Shield,
  CheckSquare,
  Clock,
  BarChart3,
  FileSpreadsheet,
  CreditCard,
  Building2,
  Star
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

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
      {
        id: "invite-friends",
        label: "Invite Friends",
        icon: <Users className="w-4 h-4" />,
        href: "/invite-friends",
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
        href: "/employees",
      },
      {
        id: "approval",
        label: "Approval",
        icon: <CheckSquare className="w-4 h-4" />,
        href: "/approval",
      },
      {
        id: "attendance",
        label: "Attendance",
        icon: <Clock className="w-4 h-4" />,
        href: "/attendance",
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
      },
      {
        id: "debug",
        label: "Debug Environment",
        icon: <Shield className="w-4 h-4" />,
        href: "/debug",
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

  const isActiveRoute = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ease-in-out flex flex-col h-full",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-lg font-bold text-white">UTAMA HR</h1>
                <p className="text-xs text-slate-300">HR Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-white hover:bg-slate-700 p-1"
            data-testid="button-toggle-sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
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
                <Link key={item.id} href={item.href}>
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
                          <span className="flex-1 text-sm font-medium">
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