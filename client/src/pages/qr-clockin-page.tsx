import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Clock, MapPin, Camera, Smartphone, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import QRCodeLib from "qrcode";

interface QrToken {
  token: string;
  qrCodeUrl: string;
  expiresAt: string;
  message: string;
}

interface ClockInRecord {
  id: string;
  clockInTime: string;
  locationStatus: "valid" | "invalid";
  latitude: string;
  longitude: string;
  selfieImagePath?: string;
  distance?: number;
}

export default function QRClockInPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrToken, setQrToken] = useState<QrToken | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Query for clock-in history
  const { data: clockInHistory, isLoading: historyLoading } = useQuery<{clockInRecords: ClockInRecord[]}>({
    queryKey: ["/api/clockin-history"],
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
            dark: "#07A3B2",
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

  // Countdown timer effect
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
        toast({
          title: "QR Code Tamat Tempoh",
          description: "Sila jana QR Code baharu untuk clock-in",
          variant: "destructive",
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [qrToken, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLocationStatusBadge = (status: string, distance?: number) => {
    if (status === "valid") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Dalam Kawasan</Badge>;
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Di Luar Kawasan {distance ? `(${distance}m)` : ''}
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <div 
          className="rounded-lg p-6 shadow-sm"
          style={{ background: "linear-gradient(135deg, #07A3B2 0%, #D9ECC7 100%)" }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistem QR Code Clock-In
          </h1>
          <p className="text-gray-700 text-lg">
            Sistem clock-in pekerja menggunakan QR code dengan pengesahan lokasi GPS dan selfie
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
                  <CardTitle className="text-xl text-gray-800">Jana QR Code</CardTitle>
                  <CardDescription>
                    QR code untuk clock-in pekerja (sah selama 2 minit)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!qrToken ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Klik butang di bawah untuk menjana QR Code baharu
                  </p>
                  <Button
                    onClick={() => generateQrMutation.mutate()}
                    disabled={generateQrMutation.isPending}
                    className="text-gray-800 shadow-sm px-6 py-3"
                    style={{ background: "linear-gradient(135deg, #07A3B2 0%, #D9ECC7 100%)" }}
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
                        Jana QR Code Baharu
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
                          alt="QR Code untuk Clock-In" 
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
                      <span className="text-sm text-gray-600">Masa tinggal:</span>
                      <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                        {formatTime(timeRemaining)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      QR Code akan tamat tempoh secara automatik
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
                      Jana QR Baharu
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
                <CardTitle className="text-lg text-blue-800">Arahan Penggunaan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Jana QR Code</p>
                    <p className="text-blue-600 text-sm">Klik butang "Jana QR Code Baharu" di atas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Scan dengan Telefon</p>
                    <p className="text-blue-600 text-sm">Gunakan kamera telefon untuk scan QR Code (tidak perlu aplikasi khas)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Ambil Selfie & GPS</p>
                    <p className="text-blue-600 text-sm">Di halaman mobile, ambil selfie dan benarkan akses lokasi</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Clock-In Berjaya</p>
                    <p className="text-blue-600 text-sm">Sistem akan sahkan lokasi (dalam radius 50m) dan rekod clock-in</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm font-medium">Nota Penting:</p>
                      <ul className="text-amber-700 text-xs mt-1 space-y-1">
                        <li>• QR Code sah selama 2 minit sahaja</li>
                        <li>• Setiap QR Code hanya boleh digunakan sekali</li>
                        <li>• Pekerja mesti berada dalam radius 50m dari pejabat</li>
                        <li>• Selfie dan lokasi GPS wajib untuk pengesahan</li>
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
                  <CardTitle className="text-xl text-gray-800">Sejarah Clock-In</CardTitle>
                  <CardDescription>
                    Rekod clock-in pekerja menggunakan sistem QR Code
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
              ) : !clockInHistory?.clockInRecords?.length ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">Tiada rekod clock-in</p>
                  <p className="text-gray-500 text-sm">
                    Gunakan sistem QR Code untuk memulakan clock-in pertama
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clockInHistory.clockInRecords.map((record) => (
                    <div 
                      key={record.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      data-testid={`clockin-record-${record.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-800">Clock-In Berjaya</span>
                            {getLocationStatusBadge(record.locationStatus, record.distance)}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{formatDateTime(record.clockInTime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {parseFloat(record.latitude).toFixed(6)}, {parseFloat(record.longitude).toFixed(6)}
                              </span>
                            </div>

                            {record.selfieImagePath && (
                              <div className="flex items-center gap-2">
                                <Camera className="h-3 w-3" />
                                <span>Selfie tersimpan</span>
                              </div>
                            )}
                          </div>
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
  );
}