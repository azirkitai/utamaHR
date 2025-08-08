import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FileUploaderProps {
  onUploadComplete?: (result: { successful: Array<{ name: string; uploadURL: string }> }) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  disabled?: boolean;
  placeholder?: string;
}

export function FileUploader({
  onUploadComplete,
  acceptedFileTypes = "*",
  maxFileSize = 10485760, // 10MB
  disabled = false,
  placeholder = "Pilih fail untuk dimuat naik..."
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxFileSize) {
        alert(`Saiz fail terlalu besar. Maksimum ${Math.round(maxFileSize / 1024 / 1024)}MB dibenarkan.`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Get upload URL from backend
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      if (!uploadResponse.ok) {
        throw new Error("Gagal mendapatkan URL upload");
      }
      
      const { uploadURL } = await uploadResponse.json();

      // Upload file directly to storage
      const fileUploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error("Gagal memuat naik fail");
      }

      // Create success result
      const result = {
        successful: [{
          name: selectedFile.name,
          uploadURL: uploadURL.split('?')[0], // Remove query parameters
        }],
      };

      onUploadComplete?.(result);
      setSelectedFile(null);
      
      // Reset input
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Ralat memuat naik: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Input
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="flex-1"
          data-testid="input-file-upload"
        />
        {selectedFile && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-gradient-to-r from-teal-500 to-green-400 hover:from-teal-600 hover:to-green-500"
            data-testid="button-upload"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Memuat naik...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Muat Naik
              </>
            )}
          </Button>
        )}
      </div>

      {selectedFile && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-400 rounded flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            disabled={uploading}
            data-testid="button-remove-file"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {!selectedFile && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {placeholder}
        </p>
      )}
    </div>
  );
}