import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import eClaimLogo from "@assets/eClaim_1755445964546.png";

export default function PerformanceEvaluationPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-cyan-300 rounded-full opacity-15"></div>
            <div className="absolute bottom-32 left-40 w-40 h-40 bg-blue-300 rounded-full opacity-10"></div>
            <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full opacity-25"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-4xl w-full bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardContent className="p-12 text-center">
              {/* Logo Section */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <img 
                    src={eClaimLogo} 
                    alt="eClaim - UTAMA Human Resource Management" 
                    className="w-80 h-auto object-contain drop-shadow-lg"
                  />
                  {/* Glowing effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-cyan-500/20 rounded-lg blur-xl"></div>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  Performance & Evaluation
                </h1>
                <div className="flex justify-center mb-6">
                  <Badge 
                    className="px-6 py-2 text-lg bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                  >
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  Sistem penilaian prestasi dan evaluasi pekerja yang komprehensif sedang dalam pembangunan. 
                  Modul ini akan menyediakan alat yang diperlukan untuk mengurus dan memantau prestasi kakitangan.
                </p>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">Performance Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Pantau prestasi pekerja dengan metrik yang terperinci dan laporan automatik
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">Goal Setting</h3>
                  <p className="text-sm text-gray-600">
                    Tetapkan dan jejaki matlamat prestasi untuk setiap individu dan pasukan
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                  <div className="text-3xl mb-3">📝</div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">360° Evaluation</h3>
                  <p className="text-sm text-gray-600">
                    Penilaian menyeluruh daripada penyelia, rakan sekerja, dan bawahan
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Development Timeline</h3>
                <p className="text-cyan-100">
                  Modul Performance & Evaluation dijangka siap pada Q1 2026. 
                  Kami sedang membangunkan sistem yang akan memenuhi keperluan penilaian prestasi moden.
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex justify-center gap-4 mt-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>In Development</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Design Phase</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Testing Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-20 right-10 w-16 h-16 border-2 border-cyan-300/30 rounded-full"></div>
        <div className="absolute bottom-10 left-20 w-24 h-24 border-2 border-blue-300/25 rounded-full"></div>
        <div className="absolute bottom-20 right-32 w-18 h-18 border-2 border-white/15 rounded-full"></div>
      </div>
    </DashboardLayout>
  );
}