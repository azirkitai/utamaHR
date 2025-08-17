import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "wouter";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface ClockOutResult {
  success: boolean;
  message: string;
  location: {
    status: string;
    distance: number;
    message: string;
    nearestOffice: string;
  };
}

export default function MobileClockOutPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [step, setStep] = useState<"camera" | "location" | "uploading" | "success" | "error">("camera");
  const [error, setError] = useState<string>("");
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [clockOutResult, setClockOutResult] = useState<ClockOutResult | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 480 },
          height: { ideal: 640 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan anda memberikan kebenaran akses kamera.");
      setStep("error");
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setSelfieBlob(blob);
          
          // Stop camera
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setStep("location");
          getLocation();
        }
      }, "image/jpeg", 0.8);
    }
  };

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
      await submitClockOut(latitude, longitude);
    } catch (err) {
      console.error("Location error:", err);
      setError("Tidak dapat mendapatkan lokasi GPS. Pastikan anda memberikan kebenaran akses lokasi.");
      setStep("error");
    }
  };

  const submitClockOut = async (latitude: number, longitude: number) => {
    if (!selfieBlob) {
      setError("Selfie diperlukan");
      setStep("error");
      return;
    }

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

      // Submit clock-out data
      const clockOutResponse = await apiRequest("POST", "/api/mobile-clockout", {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        selfieImageUrl: uploadURL
      });

      const result: ClockOutResult = await clockOutResponse.json();
      setClockOutResult(result);
      setStep("success");

    } catch (err) {
      console.error("Clock-out error:", err);
      setError(err instanceof Error ? err.message : "Gagal melakukan clock-out");
      setStep("error");
    }
  };

  const retryProcess = () => {
    setStep("camera");
    setError("");
    setSelfieBlob(null);
    setLocationData(null);
    setClockOutResult(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <div 
            className="rounded-lg p-6 shadow-sm"
            style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Link href="/my-record">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-white/20 p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Clock-Out</h1>
            </div>
            <p className="text-gray-700">
              Ambil selfie dan sahkan lokasi untuk clock-out
            </p>
          </div>
        </div>

        <Card className="border-2 border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === "camera" && <Camera className="h-5 w-5 text-blue-600" />}
              {step === "location" && <MapPin className="h-5 w-5 text-amber-600" />}
              {step === "uploading" && <Clock className="h-5 w-5 text-blue-600" />}
              {step === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
              {step === "error" && <XCircle className="h-5 w-5 text-red-600" />}
              
              {step === "camera" && "Ambil Selfie"}
              {step === "location" && "Mendapatkan Lokasi..."}
              {step === "uploading" && "Memproses Clock-Out..."}
              {step === "success" && "Clock-Out Berjaya"}
              {step === "error" && "Ralat Clock-Out"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {step === "camera" && (
              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[3/4]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={startCamera}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <Button
                  onClick={captureSelfie}
                  className="w-full text-gray-800 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                  data-testid="button-capture-selfie"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Ambil Selfie
                </Button>
              </div>
            )}

            {step === "location" && (
              <div className="text-center space-y-4">
                <div className="animate-spin mx-auto">
                  <MapPin className="h-12 w-12 text-amber-600" />
                </div>
                <p className="text-gray-600">
                  Mendapatkan lokasi GPS anda...
                </p>
                <p className="text-sm text-gray-500">
                  Pastikan GPS diaktifkan dan kebenaran lokasi diberikan
                </p>
              </div>
            )}

            {step === "uploading" && (
              <div className="text-center space-y-4">
                <div className="animate-spin mx-auto">
                  <RefreshCw className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-gray-600">
                  Memproses clock-out...
                </p>
                <p className="text-sm text-gray-500">
                  Sila tunggu sebentar
                </p>
              </div>
            )}

            {step === "success" && clockOutResult && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-800">
                    Clock-Out Berjaya!
                  </h3>
                  <p className="text-gray-600">{clockOutResult.message}</p>
                  
                  {clockOutResult.location && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status Lokasi:</span>
                        <span className={`font-medium ${
                          clockOutResult.location.status === "valid" 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {clockOutResult.location.status === "valid" ? "Dalam Kawasan" : "Di Luar Kawasan"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-600">Jarak:</span>
                        <span className="text-gray-800 font-medium">
                          {clockOutResult.location.distance}m dari pejabat
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => navigate("/my-record")}
                    className="flex-1 text-gray-800 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                  >
                    Lihat Rekod
                  </Button>
                  <Button
                    onClick={retryProcess}
                    variant="outline"
                    className="flex-1"
                  >
                    Clock-Out Lagi
                  </Button>
                </div>
              </div>
            )}

            {step === "error" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-800">
                    Clock-Out Gagal
                  </h3>
                  <p className="text-gray-600">{error}</p>
                </div>

                <Button
                  onClick={retryProcess}
                  className="w-full text-gray-800 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Cuba Lagi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}