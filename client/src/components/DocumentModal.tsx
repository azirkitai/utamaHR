import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUploader } from "./FileUploader";
import { EmployeeDocument } from "@shared/schema";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    fileName: string;
    remarks: string;
    fileUrl?: string;
  }) => void;
  document?: EmployeeDocument | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
}

export function DocumentModal({
  isOpen,
  onClose,
  onSave,
  document,
  mode,
  loading = false
}: DocumentModalProps) {
  const [fileName, setFileName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [hasNewFile, setHasNewFile] = useState(false);

  useEffect(() => {
    if (document && mode !== "add") {
      setFileName(document.fileName || "");
      setRemarks(document.remarks || "");
      setFileUrl(document.fileUrl || "");
      setHasNewFile(false);
    } else {
      setFileName("");
      setRemarks("");
      setFileUrl("");
      setHasNewFile(false);
    }
  }, [document, mode, isOpen]);

  const handleFileUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setFileUrl(uploadedFile.uploadURL);
      setHasNewFile(true);
      
      // If no fileName is set, use the uploaded file name
      if (!fileName) {
        setFileName(uploadedFile.name);
      }
    }
  };

  const handleSave = () => {
    if (!fileName.trim()) {
      alert("Nama fail diperlukan");
      return;
    }

    if (mode === "add" && !fileUrl) {
      alert("Sila muat naik fail terlebih dahulu");
      return;
    }

    const saveData: any = {
      fileName: fileName.trim(),
      remarks: remarks.trim(),
    };

    // Only include fileUrl if it's a new file or in add mode
    if (mode === "add" || hasNewFile) {
      saveData.fileUrl = fileUrl;
    }

    onSave(saveData);
  };

  const getModalTitle = () => {
    switch (mode) {
      case "add": return "Tambah Dokumen";
      case "edit": return "Kemaskini Dokumen";
      case "view": return "Lihat Dokumen";
      default: return "Dokumen";
    }
  };

  const isReadOnly = mode === "view";
  const showFileUploader = mode === "add" || mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-cyan-400 to-blue-700 bg-clip-text text-transparent">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">Nama Fail</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Masukkan nama fail"
              readOnly={isReadOnly}
              data-testid="input-file-name"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Catatan</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Masukkan catatan dokumen"
              readOnly={isReadOnly}
              rows={3}
              data-testid="textarea-remarks"
            />
          </div>

          {/* File Upload (only for add/edit mode) */}
          {showFileUploader && (
            <div className="space-y-2">
              <Label>Muat Naik Fail</Label>
              <FileUploader
                onUploadComplete={handleFileUploadComplete}
                acceptedFileTypes="*"
                maxFileSize={10485760} // 10MB
                disabled={loading}
                placeholder="Pilih fail untuk dimuat naik..."
              />
              {mode === "edit" && document?.fileUrl && !hasNewFile && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fail sedia ada: {document.fileName}
                  <br />
                  <span className="text-xs">Muat naik fail baru untuk menggantikan</span>
                </p>
              )}
            </div>
          )}

          {/* View current file (view mode only) */}
          {mode === "view" && document?.fileUrl && (
            <div className="space-y-2">
              <Label>Fail</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline"
                  data-testid="link-view-file"
                >
                  {document.fileName}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            data-testid="button-cancel"
          >
            {mode === "view" ? "Tutup" : "Batal"}
          </Button>
          
          {mode !== "view" && (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-400 to-blue-700 hover:from-cyan-500 hover:to-blue-800"
              data-testid="button-save"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}