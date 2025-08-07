import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Building2, 
  LogOut,
  BarChart3,
  Calendar,
  DollarSign
} from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = (username: string): string => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900" data-testid="text-app-title">
                UtamaHR
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white text-sm font-medium">
                    {user ? getUserInitials(user.username) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700" data-testid="text-username">
                  {user?.username || "User"}
                </span>
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isPending ? "Signing Out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-welcome">
            Selamat Datang ke UtamaHR Dashboard
          </h2>
          <p className="text-gray-600" data-testid="text-welcome-message">
            Sistem Pengurusan Pekerja Terpadu untuk organisasi anda.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Employees Card */}
          <Card data-testid="card-employees">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Jumlah Pekerja
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-employee-count">0</div>
              <p className="text-xs text-muted-foreground">
                Belum ada pekerja didaftarkan
              </p>
            </CardContent>
          </Card>

          {/* Attendance Card */}
          <Card data-testid="card-attendance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kehadiran Hari Ini
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-attendance-count">0</div>
              <p className="text-xs text-muted-foreground">
                Tiada rekod kehadiran
              </p>
            </CardContent>
          </Card>

          {/* Reports Card */}
          <Card data-testid="card-reports">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Laporan Bulanan
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-report-count">0</div>
              <p className="text-xs text-muted-foreground">
                Tiada laporan dijana
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Tindakan Pantas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-testid="button-add-employee">
                <Users className="h-6 w-6" />
                <span>Tambah Pekerja</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-testid="button-manage-attendance">
                <Calendar className="h-6 w-6" />
                <span>Urus Kehadiran</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-testid="button-process-payroll">
                <DollarSign className="h-6 w-6" />
                <span>Proses Gaji</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" data-testid="button-view-reports">
                <BarChart3 className="h-6 w-6" />
                <span>Lihat Laporan</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="mt-8 text-center">
          <Card data-testid="card-system-info">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">
                <p data-testid="text-system-status">
                  ✅ Sistem berjalan dengan normal
                </p>
                <p className="mt-2" data-testid="text-user-info">
                  Login sebagai: <span className="font-medium">{user?.username}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}