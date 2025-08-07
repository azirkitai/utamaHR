import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronRight,
  Upload,
  Calendar,
  Clock,
  Timer,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function ApplyTimeoffPage() {
  const [timeoffDate, setTimeoffDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const calculateTotalHours = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = () => {
    console.log({
      timeoffDate,
      startTime,
      endTime,
      totalHours: calculateTotalHours(),
      reason,
      additionalDescription,
      uploadedFile
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Apply for Timeoff</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Home</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Timeoff</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Apply</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Summary Panel */}
            <div className="bg-gradient-to-r from-teal-400 to-blue-600 text-white p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Time off you have taken so far</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 p-4 rounded-lg text-center">
                  <div className="text-xs text-teal-100 mb-1">TOTAL APPLIED (ALL)</div>
                  <div className="text-2xl font-bold">None</div>
                  <div className="mt-2 flex justify-center">
                    <Calendar className="w-12 h-12 text-white/50" />
                  </div>
                </div>
                
                <div className="bg-white/20 p-4 rounded-lg text-center">
                  <div className="text-xs text-teal-100 mb-1">HOURS TAKEN (ALL)</div>
                  <div className="text-2xl font-bold">None</div>
                  <div className="mt-2 flex justify-center">
                    <Clock className="w-12 h-12 text-white/50" />
                  </div>
                </div>
                
                <div className="bg-white/20 p-4 rounded-lg text-center">
                  <div className="text-xs text-teal-100 mb-1">HOURS TAKEN (AUG)</div>
                  <div className="text-2xl font-bold">None</div>
                  <div className="mt-2 flex justify-center">
                    <Timer className="w-12 h-12 text-white/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Timeoff Application */}
            <Card>
              <CardHeader className="bg-slate-700 text-white rounded-t-lg">
                <CardTitle>Recent Timeoff Application</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">No</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No data available in table
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Apply Form */}
          <div className="w-80 p-6 bg-white border-l">
            <Card>
              <CardHeader className="bg-slate-600 text-white rounded-t-lg">
                <CardTitle className="text-center">Apply Timeoff</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Applicant */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Applicant</Label>
                  <Select defaultValue="SITI NADIAH SABRI">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SITI NADIAH SABRI">SITI NADIAH SABRI</SelectItem>
                      <SelectItem value="AHMAD ALI BIN HASSAN">AHMAD ALI BIN HASSAN</SelectItem>
                      <SelectItem value="FARAH DIANA BINTI MOHD">FARAH DIANA BINTI MOHD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timeoff Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Timeoff Date</Label>
                  <Input
                    type="date"
                    value={timeoffDate}
                    onChange={(e) => setTimeoffDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Start Time & End Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Total Hours */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Total Hour(s)</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border text-center">
                    <span className="text-lg font-semibold">{calculateTotalHours().toFixed(1)}</span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">What is your reason to apply Timeoff?</Label>
                  <Textarea
                    placeholder="Please specify your reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                {/* Additional Description */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Additional Description</Label>
                  <Textarea
                    placeholder="Please specify your description"
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                {/* Supporting Document */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Supporting document</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="relative">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose file
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {uploadedFile ? uploadedFile.name : "No file chosen"}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-slate-600 hover:bg-slate-700"
                  disabled={!timeoffDate || !startTime || !endTime || !reason}
                >
                  Submit Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}