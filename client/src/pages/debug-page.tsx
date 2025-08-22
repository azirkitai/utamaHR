import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Server
} from "lucide-react";

interface EnvCheckResult {
  name: string;
  exists: boolean;
  length?: number;
  status: 'OK' | 'MISSING' | 'EMPTY';
  message?: string;
}

interface EnvCheckSummary {
  allValid: boolean;
  results: EnvCheckResult[];
  timestamp: string;
  environment: string;
}

interface HealthCheck {
  status: string;
  timestamp: string;
  environment: string;
  secretsValid: boolean;
  version: string;
}

// Custom fetch function dengan JWT token
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem("utamahr_token");
  if (!token) {
    throw new Error("Token tidak ditemui");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("utamahr_token");
      window.location.href = "/auth";
      throw new Error("Token tidak valid");
    }
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export default function DebugPage() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch environment check
  const { data: envCheck, isLoading: envLoading, refetch: refetchEnv } = useQuery<EnvCheckSummary>({
    queryKey: ["/api/env-check"],
    queryFn: () => authenticatedFetch("/api/env-check"),
  });

  // Fetch health check (public endpoint)
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthCheck>({
    queryKey: ["/api/health"],
    queryFn: () => fetch("/api/health").then(res => res.json()),
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchEnv(), refetchHealth()]);
      toast({
        title: "Berjaya!",
        description: "Environment check telah dikemaskini",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal refresh environment check",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      OK: { label: "OK", variant: "default" as const, icon: <CheckCircle className="w-3 h-3" /> },
      MISSING: { label: "MISSING", variant: "destructive" as const, icon: <AlertTriangle className="w-3 h-3" /> },
      EMPTY: { label: "EMPTY", variant: "destructive" as const, icon: <AlertTriangle className="w-3 h-3" /> },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.OK;
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-debug-title">
              Environment Variables Check
            </h2>
            <p className="text-gray-600">
              Semak status semua secrets dan environment variables penting
            </p>
          </div>

          <Button 
            onClick={handleRefreshAll}
            disabled={isRefreshing || envLoading || healthLoading}
            data-testid="button-refresh-env"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Check */}
          <Card data-testid="card-health-check">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="text-center py-4">
                  <p>Loading health check...</p>
                </div>
              ) : health ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <Badge variant={health.status === 'OK' ? 'default' : 'destructive'}>
                      {health.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Environment:</span>
                    <Badge variant="secondary">{health.environment}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Secrets Valid:</span>
                    <Badge variant={health.secretsValid ? 'default' : 'destructive'}>
                      {health.secretsValid ? 'YES' : 'NO'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Version:</span>
                    <span className="text-sm text-gray-600">{health.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Timestamp:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(health.timestamp).toLocaleString('ms-MY')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-red-600">
                  <p>Failed to load health check</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Secrets Check */}
          <Card data-testid="card-env-secrets">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Environment Secrets
                {envCheck && (
                  <Badge variant={envCheck.allValid ? 'default' : 'destructive'} className="ml-2">
                    {envCheck.allValid ? 'ALL OK' : 'ISSUES FOUND'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {envLoading ? (
                <div className="text-center py-4">
                  <p>Checking environment secrets...</p>
                </div>
              ) : envCheck ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Last check: {new Date(envCheck.timestamp).toLocaleString('ms-MY')}
                  </div>
                  
                  {envCheck.results.map((result) => (
                    <div key={result.name} className="border rounded-lg p-4" data-testid={`env-result-${result.name}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{result.name}_EXISTS:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.exists ? 'default' : 'destructive'}>
                            {result.exists ? 'TRUE' : 'FALSE'}
                          </Badge>
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                      
                      {result.length && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Length:</span>
                          <span className="text-sm font-mono">{result.length} chars</span>
                        </div>
                      )}
                      
                      {result.message && (
                        <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          {result.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-red-600">
                  <p>Failed to load environment check</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6" data-testid="card-instructions">
          <CardHeader>
            <CardTitle>Cara Mengatasi Masalah Secrets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Jika ada secrets yang MISSING atau EMPTY:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Pergi ke tab "Secrets" dalam Replit workspace anda</li>
                  <li>Tambah atau kemaskini secret yang required:</li>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>JWT_SECRET</strong>: String random minimal 32 karakter</li>
                    <li><strong>SESSION_SECRET</strong>: String random minimal 32 karakter</li>
                    <li><strong>DATABASE_URL</strong>: Connection string PostgreSQL</li>
                  </ul>
                  <li>Selepas menambah secrets, click butang "Deploy" atau restart aplikasi</li>
                  <li>Click butang "Refresh" di atas untuk check semula</li>
                </ol>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Generate Random Secrets:</h4>
                <p className="text-gray-600">
                  Anda boleh generate random string menggunakan command ini dalam terminal:
                </p>
                <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}