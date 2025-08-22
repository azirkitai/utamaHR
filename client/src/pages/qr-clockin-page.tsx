import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Clock, MapPin, Camera, Smartphone, RefreshCw, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import QRCodeLib from "qrcode";

interface QrToken {
  token: string;
  qrCodeUrl: string;
  expiresAt: string;
  message: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInLatitude: string | null;
  clockInLongitude: string | null;
  clockOutLatitude: string | null;
  clockOutLongitude: string | null;
  clockInLocationStatus: "valid" | "invalid" | null;
  clockOutLocationStatus: "valid" | "invalid" | null;
  clockInImage?: string;
  clockOutImage?: string;
  totalHours: string | null;
  status: string;
  // Compliance fields
  isLateClockIn?: boolean;
  isLateBreakOut?: boolean;
  clockInRemarks?: string;
  breakOutRemarks?: string;
  shiftId?: string;
}

interface TodayAttendanceStatus {
  hasAttendanceToday: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  breakOutTime: string | null;
  breakInTime: string | null;
  isClockInCompleted: boolean;
  isClockOutCompleted: boolean;
  isBreakOutCompleted: boolean;
  isBreakInCompleted: boolean;
  needsClockOut: boolean;
  needsBreakOut: boolean;
  needsBreakIn: boolean;
  nextAction: 'clock-in' | 'break-out' | 'break-in' | 'clock-out' | 'completed';
  enforceBreakClockOut: boolean; // Based on employee setting
}

export default function QRClockInPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrToken, setQrToken] = useState<QrToken | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [lastAttendanceStatus, setLastAttendanceStatus] = useState<TodayAttendanceStatus | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Query for today's attendance status
  const { data: attendanceStatus, isLoading: statusLoading } = useQuery<TodayAttendanceStatus>({
    queryKey: ["/api/today-attendance-status"],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
    refetchOnWindowFocus: true, // Refresh when window gets focus
    refetchOnMount: true, // Always refresh on mount
  });

  // Query for attendance history (clock-in and clock-out)
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery<{attendanceRecords: AttendanceRecord[]}>({
    queryKey: ["/api/clockin-history"],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
    refetchOnWindowFocus: true, // Refresh when window gets focus
    refetchOnMount: true, // Always refresh on mount
  });

  // Generate QR Code mutation
  const generateQrMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/qr-generate");
      return await res.json();
    },
    onSuccess: async (data: QrToken) => {
      setQrToken(data);
      
      // Generate QR code image
      try {
        const qrDataUrl = await QRCodeLib.toDataURL(data.qrCodeUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: "#1e40af",
            light: "#FFFFFF"
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error("QR code generation error:", error);
        toast({
          title: "Ralat QR Code",
          description: "Gagal menjana QR Code visual",
          variant: "destructive",
        });
      }

      // Refresh attendance status after generating QR
      queryClient.invalidateQueries({ queryKey: ["/api/today-attendance-status"] });
      
      toast({
        title: "QR Code Dijana",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      console.error("Generate QR error:", error);
      toast({
        title: "Ralat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Countdown timer effect with auto refresh after clock-in
  useEffect(() => {
    if (!qrToken) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(qrToken.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setQrToken(null);
        setQrCodeDataUrl("");
        // Refresh data after QR expires (might have been used)
        queryClient.invalidateQueries({ queryKey: ["/api/today-attendance-status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/clockin-history"] });
        
        toast({
          title: "QR Code Expired",
          description: "Please generate a new QR Code for clock-in",
          variant: "destructive",
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [qrToken, toast, queryClient]);

  // Auto refresh on window focus and visibility change (when user returns from mobile)
  useEffect(() => {
    const handleFocus = () => {
      // Immediate refresh when user comes back to page
      queryClient.invalidateQueries({ queryKey: ["/api/today-attendance-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clockin-history"] });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Immediate refresh when page becomes visible
        queryClient.invalidateQueries({ queryKey: ["/api/today-attendance-status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/clockin-history"] });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      // Check for mobile clock-in completion trigger
      if (e.key === 'mobile-clockin-completed' && e.newValue) {
        console.log("Mobile clock-in/out detected, refreshing main page data");
        queryClient.invalidateQueries({ queryKey: ["/api/today-attendance-status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/clockin-history"] });
        
        // Clear the trigger
        localStorage.removeItem('mobile-clockin-completed');
      }
    };

    // Add event listeners
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  // Additional polling for real-time updates during active use
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/today-attendance-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clockin-history"] });
    }, 3000); // Poll every 3 seconds for immediate updates

    return () => clearInterval(refreshInterval);
  }, [queryClient]);

  // Detect attendance status changes and notify user
  useEffect(() => {
    if (!attendanceStatus || !lastAttendanceStatus) {
      setLastAttendanceStatus(attendanceStatus || null);
      return;
    }

    // Check if clock-in status changed
    if (!lastAttendanceStatus.isClockInCompleted && attendanceStatus.isClockInCompleted) {
      toast({
        title: "Clock-In Successful!",
        description: "Attendance record has been updated",
        variant: "default",
      });
      // Clear QR token since it was used successfully
      setQrToken(null);
      setQrCodeDataUrl("");
    }

    // Check if clock-out status changed  
    if (!lastAttendanceStatus.isClockOutCompleted && attendanceStatus.isClockOutCompleted) {
      toast({
        title: "Clock-Out Successful!",
        description: "Today's attendance has been completed",
        variant: "default",
      });
      // Clear QR token since it was used successfully
      setQrToken(null);
      setQrCodeDataUrl("");
    }

    setLastAttendanceStatus(attendanceStatus);
  }, [attendanceStatus, lastAttendanceStatus, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateTime: string) => {
    const utcDate = new Date(dateTime);
    if (isNaN(utcDate.getTime())) return 'Invalid Date';
    return utcDate.toLocaleString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kuala_Lumpur'
    });
  };

  const getLocationStatusBadge = (status: string, distance?: number) => {
    if (status === "valid") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Within Area</Badge>;
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Outside Area {distance ? `(${distance}m)` : ''}
        </Badge>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div 
            className="rounded-lg p-6 shadow-sm bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              QR Code Clock-In System
            </h1>
            <p className="text-blue-100 text-lg">
              Employee clock-in system using QR code with GPS location validation and selfie
            </p>
          </div>
        </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* QR Code Generation Section */}
        <div className="space-y-6">
          <Card className="border-2 border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800">
                    {attendanceStatus?.nextAction === 'clock-in' && "Generate QR Clock-In"}
                    {attendanceStatus?.nextAction === 'break-out' && "Generate QR Break Time"}
                    {attendanceStatus?.nextAction === 'break-in' && "Generate QR Break Return"}
                    {attendanceStatus?.nextAction === 'clock-out' && "Generate QR Clock-Out"}
                    {attendanceStatus?.nextAction === 'completed' && "Generate QR Code"}
                  </CardTitle>
                  <CardDescription>
                    {attendanceStatus?.nextAction === 'clock-in' && "QR code for employee clock-in (valid for 2 minutes)"}
                    {attendanceStatus?.nextAction === 'break-out' && "QR code for break time - start break/lunch (valid for 2 minutes)"}
                    {attendanceStatus?.nextAction === 'break-in' && "QR code for break return - return from break/lunch (valid for 2 minutes)"}
                    {attendanceStatus?.nextAction === 'clock-out' && "QR code for employee clock-out (valid for 2 minutes)"}
                    {attendanceStatus?.nextAction === 'completed' && "All attendance already completed for today"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show completion message if all attendance is done */}
              {attendanceStatus?.nextAction === 'completed' ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="w-32 h-32 mx-auto bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-green-700">Today's Attendance Completed</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Clock-In: {attendanceStatus?.clockInTime ? (() => {
                        const utcDate = new Date(attendanceStatus.clockInTime);
                        if (isNaN(utcDate.getTime())) return 'Invalid Date';
                        return utcDate.toLocaleTimeString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
                      })() : '-'}</p>
                      {attendanceStatus?.enforceBreakClockOut && (
                        <>
                          <p>Break Time: {attendanceStatus?.breakOutTime ? (() => {
                            const utcDate = new Date(attendanceStatus.breakOutTime);
                            if (isNaN(utcDate.getTime())) return 'Invalid Date';
                            return utcDate.toLocaleTimeString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
                          })() : '-'}</p>
                          <p>Break Off: {attendanceStatus?.breakInTime ? (() => {
                            const utcDate = new Date(attendanceStatus.breakInTime);
                            if (isNaN(utcDate.getTime())) return 'Invalid Date';
                            return utcDate.toLocaleTimeString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
                          })() : '-'}</p>
                        </>
                      )}
                      <p>Clock-Out: {attendanceStatus?.clockOutTime ? (() => {
                        const utcDate = new Date(attendanceStatus.clockOutTime);
                        if (isNaN(utcDate.getTime())) return 'Invalid Date';
                        return utcDate.toLocaleTimeString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
                      })() : '-'}</p>
                    </div>
                    <p className="text-green-600 text-sm mt-3">
                      {attendanceStatus?.enforceBreakClockOut 
                        ? "You have completed clock-in, break time, break return and clock-out for today"
                        : "You have completed clock-in and clock-out for today"
                      }
                    </p>
                  </div>
                </div>
              ) : !qrToken ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className={`w-32 h-32 mx-auto border-2 border-dashed rounded-lg flex items-center justify-center ${
                      attendanceStatus?.needsClockOut 
                        ? 'bg-peoplee-100 border-peoplee-300' 
                        : 'bg-gray-100 border-gray-300'
                    }`}>
                      <QrCode className={`h-12 w-12 ${
                        attendanceStatus?.needsClockOut ? 'text-peoplee-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  
                  {attendanceStatus?.nextAction && attendanceStatus.nextAction !== 'clock-in' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-sm font-medium">Attendance Status</p>
                      <div className="text-blue-600 text-xs space-y-1">
                        {attendanceStatus?.clockInTime && (
                          <p>✓ Clock-In: {new Date(attendanceStatus.clockInTime).toLocaleTimeString('ms-MY')}</p>
                        )}
                        {attendanceStatus?.breakOutTime && (
                          <p>✓ Break Time: {new Date(attendanceStatus.breakOutTime).toLocaleTimeString('ms-MY')}</p>
                        )}
                        {attendanceStatus?.breakInTime && (
                          <p>✓ Break Off: {new Date(attendanceStatus.breakInTime).toLocaleTimeString('ms-MY')}</p>
                        )}
                        <p className="text-blue-700 font-medium">
                          Next: {
                            attendanceStatus?.nextAction === 'break-out' ? 'Break Time' :
                            attendanceStatus?.nextAction === 'break-in' ? 'Break Off' :
                            attendanceStatus?.nextAction === 'clock-out' ? 'Clock-Out' : ''
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-gray-600 mb-4">
                    {attendanceStatus?.nextAction === 'clock-in' && "Click the button below to generate QR Code for clock-in"}
                    {attendanceStatus?.nextAction === 'break-out' && "Click the button below to generate QR Code for break time"}
                    {attendanceStatus?.nextAction === 'break-in' && "Click the button below to generate QR Code for break return"}
                    {attendanceStatus?.nextAction === 'clock-out' && "Click the button below to generate QR Code for clock-out"}
                  </p>
                  <Button
                    onClick={() => generateQrMutation.mutate()}
                    disabled={generateQrMutation.isPending}
                    className={`text-white shadow-sm px-6 py-3 ${
                      attendanceStatus?.nextAction === 'clock-in'
                        ? 'bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800'
                        : attendanceStatus?.nextAction === 'break-out'
                        ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-peoplee-700 hover:from-amber-700 hover:via-amber-800 hover:to-peoplee-800'
                        : attendanceStatus?.nextAction === 'break-in'
                        ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800'
                        : attendanceStatus?.nextAction === 'clock-out'
                        ? 'bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:via-red-800 hover:to-rose-800'
                        : 'bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700'
                    }`}
                    data-testid="button-generate-qr"
                  >
                    {generateQrMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Menjana QR Code...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        {attendanceStatus?.nextAction === 'clock-in' && "Generate QR Clock-In"}
                        {attendanceStatus?.nextAction === 'break-out' && "Generate QR Break Time"}
                        {attendanceStatus?.nextAction === 'break-in' && "Generate QR Break Return"}
                        {attendanceStatus?.nextAction === 'clock-out' && "Generate QR Clock-Out"}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* QR Code Display */}
                  <div className="text-center">
                    {qrCodeDataUrl && (
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                        <img 
                          src={qrCodeDataUrl} 
                          alt={attendanceStatus?.needsClockOut ? "QR Code for Clock-Out" : "QR Code for Clock-In"} 
                          className="w-64 h-64 mx-auto"
                          data-testid="qr-code-image"
                        />
                      </div>
                    )}
                  </div>

                  {/* Timer and Status */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-gray-600">Time remaining:</span>
                      <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                        {formatTime(timeRemaining)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      QR Code will expire automatically
                    </p>
                  </div>

                  {/* Generate New QR Button */}
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => generateQrMutation.mutate()}
                      disabled={generateQrMutation.isPending}
                      variant="outline"
                      size="sm"
                      data-testid="button-regenerate-qr"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Generate New QR
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="border-2 border-blue-100 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg text-blue-800">Usage Instructions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Generate QR Code</p>
                    <p className="text-blue-600 text-sm">Click "Generate New QR Code" button above</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Scan with Phone</p>
                    <p className="text-blue-600 text-sm">Use phone camera to scan QR Code (no special app required)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Take Selfie & GPS</p>
                    <p className="text-blue-600 text-sm">On mobile page, take selfie and allow location access</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Clock-In/Out Successful</p>
                    <p className="text-blue-600 text-sm">System will validate location and automatically detect clock-in or clock-out</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm font-medium">Important Notes:</p>
                      <ul className="text-amber-700 text-xs mt-1 space-y-1">
                        <li>• QR Code valid for 2 minutes only</li>
                        <li>• Each QR Code can only be used once</li>
                        <li>• System automatically detects clock-in or clock-out</li>
                        <li>• Employee must be within 50m radius from office</li>
                        <li>• Selfie and GPS location required for validation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clock-In History Section */}
        <div>
          <Card className="border-2 border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800">Attendance History</CardTitle>
                  <CardDescription>
                    Employee clock-in and clock-out records using QR Code system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-100 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : !attendanceHistory?.attendanceRecords?.length ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">No clock-in records</p>
                  <p className="text-gray-500 text-sm">
                    Use QR Code system to start your first clock-in
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {attendanceHistory.attendanceRecords.map((record) => (
                    <div 
                      key={record.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      data-testid={`clockin-record-${record.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {new Date(record.date).toLocaleDateString('ms-MY', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {record.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {record.totalHours && (
                            <Badge variant="outline" className="text-xs">
                              {record.totalHours} hours
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Clock-In Information */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                            <Clock className="h-4 w-4" />
                            Clock-In
                          </div>
                          {record.clockInTime ? (
                            <div className="pl-6 space-y-1">
                              <p className={`text-sm ${
                                record.isLateClockIn ? 'text-red-600 font-bold' : 'text-gray-800'
                              }`}>
                                {(() => {
                                  const utcDate = new Date(record.clockInTime);
                                  if (isNaN(utcDate.getTime())) return 'Invalid Date';
                                  return utcDate.toLocaleTimeString('ms-MY', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZone: 'Asia/Kuala_Lumpur'
                                  });
                                })()}
                                {record.isLateClockIn && ' ⚠️'}
                              </p>
                              {record.isLateClockIn && record.clockInRemarks && (
                                <div className="text-xs text-red-600 bg-red-50 p-1 rounded border">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  {(() => {
                                    // Extract just the "Late X hours Y minutes" part from the full message
                                    const match = record.clockInRemarks.match(/Late \d+(?:\s+hours)?(?:\s+\d+\s+minutes)?/);
                                    return match ? match[0] : record.clockInRemarks;
                                  })()}
                                </div>
                              )}
                              {record.clockInLocationStatus && (
                                <Badge 
                                  variant={record.clockInLocationStatus === "valid" ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {record.clockInLocationStatus === "valid" ? "Valid Location" : "Invalid Location"}
                                </Badge>
                              )}
                              {record.clockInLatitude && record.clockInLongitude && (
                                <div className="text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {parseFloat(record.clockInLatitude).toFixed(6)}, {parseFloat(record.clockInLongitude).toFixed(6)}
                                </div>
                              )}
                              {record.clockInImage && (
                                <div className="text-xs text-gray-500">
                                  <Camera className="h-3 w-3 inline mr-1" />
                                  Selfie saved
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="pl-6 text-sm text-gray-400">Not clocked in yet</p>
                          )}
                        </div>

                        {/* Clock-Out Information */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-peoplee-700">
                            <Clock className="h-4 w-4" />
                            Clock-Out
                          </div>
                          {record.clockOutTime ? (
                            <div className="pl-6 space-y-1">
                              <p className={`text-sm ${
                                record.isLateBreakOut ? 'text-red-600 font-bold' : 'text-gray-800'
                              }`}>
                                {(() => {
                                  const utcDate = new Date(record.clockOutTime);
                                  if (isNaN(utcDate.getTime())) return 'Invalid Date';
                                  return utcDate.toLocaleTimeString('ms-MY', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZone: 'Asia/Kuala_Lumpur'
                                  });
                                })()}
                                {record.isLateBreakOut && ' ⚠️'}
                              </p>
                              {record.isLateBreakOut && record.breakOutRemarks && (
                                <div className="text-xs text-red-600 bg-red-50 p-1 rounded border">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  {(() => {
                                    // Extract just the "Late X hours Y minutes" part from the full message
                                    const match = record.breakOutRemarks.match(/Late \d+(?:\s+hours)?(?:\s+\d+\s+minutes)?/);
                                    return match ? match[0] : record.breakOutRemarks;
                                  })()}
                                </div>
                              )}
                              {record.clockOutLocationStatus && (
                                <Badge 
                                  variant={record.clockOutLocationStatus === "valid" ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {record.clockOutLocationStatus === "valid" ? "Valid Location" : "Invalid Location"}
                                </Badge>
                              )}
                              {record.clockOutLatitude && record.clockOutLongitude && (
                                <div className="text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {parseFloat(record.clockOutLatitude).toFixed(6)}, {parseFloat(record.clockOutLongitude).toFixed(6)}
                                </div>
                              )}
                              {record.clockOutImage && (
                                <div className="text-xs text-gray-500">
                                  <Camera className="h-3 w-3 inline mr-1" />
                                  Selfie saved
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="pl-6 text-sm text-gray-400">Not clocked out yet</p>
                          )}
                        </div>

                        {/* Break-In Information */}
                        <div className="space-y-2 col-span-full mt-4 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                            <Clock className="h-4 w-4" />
                            Break Return (Back from Break)
                          </div>
                          {(record as any).breakInTime ? (
                            <div className="pl-6 space-y-1">
                              <p className={`text-sm ${
                                (record as any).isLateBreakIn ? 'text-red-600 font-bold' : 'text-gray-800'
                              }`}>
                                {(() => {
                                  const utcDate = new Date((record as any).breakInTime);
                                  if (isNaN(utcDate.getTime())) return 'Invalid Date';
                                  return utcDate.toLocaleTimeString('ms-MY', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZone: 'Asia/Kuala_Lumpur'
                                  });
                                })()}
                                {(record as any).isLateBreakIn && ' ⚠️'}
                              </p>
                              {(record as any).isLateBreakIn && (record as any).breakInRemarks && (
                                <div className="text-xs text-red-600 bg-red-50 p-1 rounded border">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  {(() => {
                                    // Extract just the "Late X hours Y minutes" part from the full message
                                    const match = (record as any).breakInRemarks.match(/Late \d+(?:\s+hours)?(?:\s+\d+\s+minutes)?/);
                                    return match ? match[0] : (record as any).breakInRemarks;
                                  })()}
                                </div>
                              )}
                              {(record as any).breakInImage && (
                                <div className="text-xs text-gray-500">
                                  <Camera className="h-3 w-3 inline mr-1" />
                                  Selfie saved
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="pl-6 text-sm text-gray-400">Not break-in yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}