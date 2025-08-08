import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Edit, Trash2, Download } from "lucide-react";
import { DocumentModal } from "./DocumentModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeDocument } from "@shared/schema";
import { format } from "date-fns";

interface DocumentsTabProps {
  employeeId: string;
}

export function DocumentsTab({ employeeId }: DocumentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/employee-documents", employeeId],
    enabled: !!employeeId,
  });

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: async (data: { fileName: string; remarks: string; fileUrl: string }) => {
      const response = await apiRequest("POST", "/api/employee-documents", {
        employeeId,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Berjaya",
        description: data.message || "Dokumen berjaya disimpan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menyimpan dokumen",
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; fileName: string; remarks: string; fileUrl?: string }) => {
      const response = await apiRequest("PUT", `/api/employee-documents/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Berjaya",
        description: data.message || "Dokumen berjaya dikemaskini",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat", 
        description: error.message || "Gagal mengemaskini dokumen",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/employee-documents/${id}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Berjaya",
        description: data.message || "Dokumen berjaya dipadam",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal memadam dokumen",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setSelectedDocument(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleView = (document: EmployeeDocument) => {
    setSelectedDocument(document);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (document: EmployeeDocument) => {
    setSelectedDocument(document);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = (document: EmployeeDocument) => {
    if (confirm(`Adakah anda pasti untuk memadam dokumen "${document.fileName}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  const handleDownload = (document: EmployeeDocument) => {
    // Open file in new tab for download
    window.open(document.fileUrl, '_blank');
  };

  const handleSave = (data: { fileName: string; remarks: string; fileUrl?: string }) => {
    if (modalMode === "add") {
      if (!data.fileUrl) {
        toast({
          title: "Ralat",
          description: "Sila muat naik fail terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
      createMutation.mutate({
        fileName: data.fileName,
        remarks: data.remarks,
        fileUrl: data.fileUrl,
      });
    } else if (modalMode === "edit" && selectedDocument) {
      updateMutation.mutate({
        id: selectedDocument.id,
        ...data,
      });
    }
  };

  const isLoading_modal = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle>Dokumen</CardTitle>
            <Button
              onClick={handleAdd}
              className="bg-white text-teal-600 hover:bg-gray-100"
              data-testid="button-add-document"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p data-testid="text-no-documents">Tiada dokumen tersedia</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Dimuat naik</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document: EmployeeDocument, index: number) => (
                    <TableRow key={document.id} data-testid={`row-document-${document.id}`}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {document.fileName}
                      </TableCell>
                      <TableCell>
                        {document.remarks || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {document.uploadedAt ? format(new Date(document.uploadedAt), "dd/MM/yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(document)}
                            data-testid={`button-view-${document.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(document)}
                            data-testid={`button-edit-${document.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(document)}
                            data-testid={`button-download-${document.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(document)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${document.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        document={selectedDocument}
        mode={modalMode}
        loading={isLoading_modal}
      />
    </div>
  );
}