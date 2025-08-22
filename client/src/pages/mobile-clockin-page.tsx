import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Camera, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Smartphone } from "lucide-react";

interface QrValidation {
  valid: boolean;
  user: {
    id: string;
    username: string;
  };
  expiresAt: string;
  message: string;
  expired?: boolean;
}

interface ClockInResult {
  success: boolean;
  isClockOut?: boolean;
  clockInRecord?: {
    id: string;
    clockInTime: string;
    locationStatus: string;
    distance: number;
  };
  clockOutTime?: string;
  locationStatus?: string;
  totalHours?: number;
  user: {
    username: string;
  };
  message: string;
  distance?: number;
}

export default function MobileClockInPage() {
  const [location] = useLocation();
  const [token, setToken] = useState<string>("");
  const [validation, setValidation] = useState<QrValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"validating" | "camera" | "location" | "uploading" | "success" | "error">("validating");
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>("");
  const [locationData, setLocationData] = useState<{latitude: number; longitude: number} | null>(null);
  const [clockInResult, setClockInResult] = useState<ClockInResult | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Token QR Code not found dalam URL");
      setStep("error");
      setIsLoading(false);
    }
  }, [location]);

  // Validate QR token
  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/qr-validate/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ralat mengevalidkan QR Code");
        }

        setValidation(data);
        setStep("camera");
      } catch (err) {
        console.error("Validation error:", err);
        setError(err instanceof Error ? err.message : "Ralat mengevalidkan QR Code");
        setStep("error");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Start camera for selfie
  const startCamera = async () => {
    try {
      setIsCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          setIsCameraReady(true);
        };
        
        videoRef.current.oncanplay = () => {
          console.log("Video can play");
          setIsCameraReady(true);
        };
        
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan anda memberikan kebenaran akses kamera.");
      setStep("error");
    }
  };

  // Capture selfie
  const captureSelfie = () => {
    console.log("Capture selfie clicked");
    if (!videoRef.current || !canvasRef.current) {
      console.log("Video or canvas ref not available");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.log("Canvas context not available");
      return;
    }

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video not ready");
      setError("Kamera belum siap. Sila cuba sekali lagi.");
      return;
    }

    console.log("Capturing selfie...");
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log("Selfie captured successfully");
        setSelfieBlob(blob);
        setSelfiePreview(canvas.toDataURL());
        
        // Stop video stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
      } else {
        console.log("Failed to create blob");
        setError("Gagal mengambil gambar. Sila cuba sekali lagi.");
      }
    }, 'image/jpeg', 0.8);
  };

  // Get GPS location
  const getLocation = async () => {
    if (!navigator.geolocation) {
      setError("GPS tidak disokong oleh peranti ini");
      setStep("error");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setLocationData({ latitude, longitude });
      await submitClockIn(latitude, longitude);
    } catch (err) {
      console.error("Location error:", err);
      setError("Tidak dapat mendapatkan lokasi GPS. Pastikan anda memberikan kebenaran akses lokasi.");
      setStep("error");
    }
  };

  // Submit clock-in data
  const submitClockIn = async (latitude: number, longitude: number) => {
    if (!selfieBlob || !token) return;

    try {
      setStep("uploading");

      // Get upload URL for selfie
      const uploadResponse = await fetch("/api/selfie-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Gagal mendapatkan URL upload");
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload selfie to object storage
      const uploadSelfieResponse = await fetch(uploadURL, {
        method: "PUT",
        body: selfieBlob,
        headers: { "Content-Type": "image/jpeg" }
      });

      if (!uploadSelfieResponse.ok) {
        throw new Error("Gagal memuat naik selfie");
      }

      // Submit clock-in data
      const clockInResponse = await apiRequest("POST", "/api/mobile-clockin", {
        token,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        selfieImageUrl: uploadURL
      });

      const result: ClockInResult = await clockInResponse.json();
      setClockInResult(result);
      setStep("success");

      // Trigger refresh on main QR Clock-In/Out page
      localStorage.setItem('mobile-clockin-completed', Date.now().toString());
      
      // Show success toast
      setTimeout(() => {
        const message = result.isClockOut 
          ? `Clock-out successfully! Total ${result.totalHours || 0} jam.`
          : "Clock-in successfully!";
        console.log("Mobile operation completed:", message);
      }, 500);

    } catch (err) {
      console.error("Clock-in error:", err);
      setError(err instanceof Error ? err.message : "Gagal melakukan clock-in");
      setStep("error");
    }
  };

  // Retry selfie capture
  const retrySelfie = () => {
    setSelfieBlob(null);
    setSelfiePreview("");
    setIsCameraReady(false);
    setStep("camera");
  };

  // Format time
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 text-center">Mengevalidkan QR Code...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Ralat Clock-In</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Cuba Semula
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (step === "success" && clockInResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">
              {clockInResult.isClockOut ? "Clock-Out Berjaya!" : "Clock-In Berjaya!"}
            </CardTitle>
            <CardDescription className="text-green-600">
              {clockInResult.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Employee:</span>
                <span className="font-medium">{clockInResult.user.username}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Masa:</span>
                <span className="font-medium">
                  {clockInResult.isClockOut && clockInResult.clockOutTime 
                    ? formatDateTime(clockInResult.clockOutTime)
                    : clockInResult.clockInRecord?.clockInTime 
                      ? formatDateTime(clockInResult.clockInRecord.clockInTime)
                      : "N/A"
                  }
                </span>
              </div>
              
              {clockInResult.isClockOut && clockInResult.totalHours && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Jam:</span>
                  <span className="font-medium">{clockInResult.totalHours} jam</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status Lokasi:</span>
                <Badge className={
                  (clockInResult.locationStatus || clockInResult.clockInRecord?.locationStatus) === "valid" 
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-peoplee-100 text-peoplee-800 border-peoplee-200"
                }>
                  {(clockInResult.locationStatus || clockInResult.clockInRecord?.locationStatus) === "valid" ? "Dalam Kawasan" : "Di Luar Kawasan"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jarak:</span>
                <span className="font-medium">
                  {clockInResult.distance || clockInResult.clockInRecord?.distance || 0}m
                </span>
              </div>
            </div>

            {(clockInResult.locationStatus || clockInResult.clockInRecord?.locationStatus) !== "valid" && (
              <Alert className="border-peoplee-200 bg-peoplee-50">
                <AlertTriangle className="h-4 w-4 text-peoplee-600" />
                <AlertDescription className="text-peoplee-800">
                  Anda berada di luar kawasan pejabat yang ditetapkan (50m radius).
                  {clockInResult.isClockOut ? "Clock-out" : "Clock-in"} tetap direkod tetapi ditandakan sebagai di luar kawasan.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 mb-4">
                {clockInResult.isClockOut ? "Clock-out" : "Clock-in"} anda telah direkod dalam sistem
              </p>
              <Button 
                onClick={() => window.close()}
                className="w-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800"
              >
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Clock-In Mobile</h1>
              <p className="text-sm text-gray-600">
                {validation?.user.username ? `Selamat datang, ${validation.user.username}` : "Sistem Clock-In QR Code"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {step === "camera" && "Ambil Selfie"}
                  {step === "location" && "Dapatkan Lokasi GPS"}
                  {step === "uploading" && "Processing Clock-In"}
                </CardTitle>
                <CardDescription>
                  {step === "camera" && "Ambil gambar selfie untuk pengevalidan"}
                  {step === "location" && "Sistem akan mengevalidkan lokasi anda"}
                  {step === "uploading" && "Sedang memuat naik data..."}
                </CardDescription>
              </div>
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full ${step === "camera" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full ${step === "location" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full ${step === "uploading" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800" : "bg-gray-300"}`} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Camera Step */}
            {step === "camera" && (
              <div className="space-y-4">
                {!selfiePreview ? (
                  <div className="space-y-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={startCamera}
                        className="flex-1"
                        disabled={isCameraReady}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {isCameraReady ? "Kamera Siap" : "Buka Kamera"}
                      </Button>
                      
                      <Button 
                        onClick={captureSelfie}
                        disabled={!isCameraReady}
                        className="flex-1"
                        style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                        data-testid="button-capture-selfie"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Ambil Gambar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={selfiePreview} 
                        alt="Selfie Preview" 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={retrySelfie}
                        variant="outline"
                        className="flex-1"
                      >
                        Ambil Semula
                      </Button>
                      
                      <Button 
                        onClick={() => setStep("location")}
                        className="flex-1"
                        style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                      >
                        Teruskan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location Step */}
            {step === "location" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    Sistem perlu mengevalidkan lokasi anda untuk memastikan anda berada dalam kawasan pejabat.
                  </p>
                  <p className="text-sm text-gray-500">
                    Radius yang dibenarkan: 50 meter dari pejabat
                  </p>
                </div>
                
                <Button 
                  onClick={getLocation}
                  className="w-full"
                  style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Dapatkan Lokasi GPS
                </Button>
              </div>
            )}

            {/* Uploading Step */}
            {step === "uploading" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Sedang memproses clock-in anda...</p>
                  <p className="text-sm text-gray-500">
                    Memuat naik selfie dan mengevalidkan lokasi
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}