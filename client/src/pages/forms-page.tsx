import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Eye,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the Form type based on database structure
interface Form {
  id: string;
  formName: string;
  fileName: string;
  fileUrl: string; // Changed from filePath to fileUrl to match database
  createdAt: string;
  updatedAt: string;
}

export default function FormsPage() {
  const { toast } = useToast();

  // Fetch forms data from API
  const { data: forms, isLoading, refetch } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  const handleDownload = (form: Form) => {
    try {
      // Direct static file serving approach (like Payment Voucher)
      // Use fileUrl directly from database
      const downloadUrl = form.fileUrl;
      
      console.log("Direct download:", {
        formId: form.id,
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        downloadUrl: downloadUrl
      });
      
      // Create direct download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = form.fileName;
      a.target = '_blank'; // Open in new tab if download fails
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Form download started.",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download form. Please try again.",
        variant: "destructive",
      });
    }
  };

  

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">List of Forms</h1>
                <p className="text-white/80 text-lg">Manage and access all company forms</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading forms...</p>
                </div>
              ) : !forms || forms.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
                  <p className="text-gray-600">Upload your first form to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-20">
                          No
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Form Name
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-32">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {forms.map((form, index) => (
                        <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 rounded-lg">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  {form.formName}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {form.fileName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Created: {new Date(form.createdAt).toLocaleDateString('ms-MY')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(form)}
                                className="h-8 px-3"
                                data-testid={`button-download-${form.id}`}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        {forms && forms.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-6 py-3 rounded-lg">
            <span>
              Showing {forms.length} form{forms.length !== 1 ? 's' : ''}
            </span>
            <span>
              Total: {forms.length} items
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}