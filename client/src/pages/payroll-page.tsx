import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CalendarDays, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const payrollDocumentSchema = z.object({
  year: z.number().min(2020).max(2050),
  month: z.number().min(1).max(12),
  payrollDate: z.string(),
  status: z.enum(['draft', 'processing', 'completed', 'published']),
  description: z.string().optional(),
});

type PayrollDocument = {
  id: string;
  year: number;
  month: number;
  payrollDate: string;
  status: 'draft' | 'processing' | 'completed' | 'published';
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

type PayrollItem = {
  id: string;
  documentId: string;
  employeeId: string;
  employee?: {
    fullName: string;
    staffId: string;
    nric: string;
  };
  employeeSnapshot: string;
  salary: string;
  overtime: string;
  claims: string;
  unpaidLeave: string;
  lateness: string;
  deductions: string;
  contributions: string;
  netPay: string;
  audit: string;
  createdAt: string;
  updatedAt: string;
};

const monthNames = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  published: 'bg-purple-100 text-purple-800'
};

const statusLabels = {
  draft: 'Draf',
  processing: 'Memproses',
  completed: 'Selesai',
  published: 'Diterbitkan'
};

export default function PayrollPage() {
  const [selectedDocument, setSelectedDocument] = useState<PayrollDocument | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof payrollDocumentSchema>>({
    resolver: zodResolver(payrollDocumentSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      payrollDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      description: '',
    },
  });

  // Fetch payroll documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PayrollDocument[]>({
    queryKey: ['/api/payroll/documents'],
  });

  // Fetch payroll items for selected document
  const { data: items = [], isLoading: itemsLoading } = useQuery<PayrollItem[]>({
    queryKey: ['/api/payroll/documents', selectedDocument?.id, 'items'],
    enabled: !!selectedDocument,
  });

  // Create payroll document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof payrollDocumentSchema>) => {
      const response = await fetch('/api/payroll/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mencipta dokumen payroll');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/documents'] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Berjaya",
        description: "Dokumen payroll berjaya dicipta",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mencipta dokumen payroll",
        variant: "destructive",
      });
    },
  });

  // Generate payroll items mutation
  const generateItemsMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/payroll/documents/${documentId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menjana slip gaji');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payroll/documents', selectedDocument?.id, 'items'] });
      toast({
        title: "Berjaya",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menjana slip gaji",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof payrollDocumentSchema>) => {
    createDocumentMutation.mutate(data);
  };

  const handleGeneratePayroll = (documentId: string) => {
    generateItemsMutation.mutate(documentId);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || '0');
    return `RM ${num.toFixed(2)}`;
  };

  const parseJsonField = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] bg-clip-text text-transparent">
            Pengurusan Payroll
          </h1>
          <p className="text-gray-600 mt-2">
            Urus dokumen payroll dan jana slip gaji pekerja
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#07A3B2] to-[#0891b2] hover:from-[#0891b2] hover:to-[#07A3B2] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Dokumen Baharu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] bg-clip-text text-transparent">
                Cipta Dokumen Payroll Baharu
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bulan</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih bulan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {monthNames.map((name, index) => (
                              <SelectItem key={index + 1} value={(index + 1).toString()}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="payrollDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh Gaji</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draf</SelectItem>
                          <SelectItem value="processing">Memproses</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="published">Diterbitkan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keterangan (Pilihan)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan keterangan" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-[#07A3B2] to-[#0891b2] hover:from-[#0891b2] hover:to-[#07A3B2]"
                    disabled={createDocumentMutation.isPending}
                  >
                    {createDocumentMutation.isPending ? "Mencipta..." : "Cipta"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Dokumen Payroll
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {documentsLoading ? (
                <div className="p-4">Memuatkan...</div>
              ) : documents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Tiada dokumen payroll
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDocument?.id === doc.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDocument(doc)}
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {monthNames[doc.month - 1]} {doc.year}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(doc.payrollDate).toLocaleDateString('ms-MY')}
                          </p>
                        </div>
                        <Badge className={statusColors[doc.status]}>
                          {statusLabels[doc.status]}
                        </Badge>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Details and Items */}
        <div className="lg:col-span-2">
          {selectedDocument ? (
            <div className="space-y-4">
              {/* Document Header */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarDays className="w-5 h-5 mr-2" />
                      {monthNames[selectedDocument.month - 1]} {selectedDocument.year}
                    </div>
                    <Badge className="bg-white/20 text-white">
                      {statusLabels[selectedDocument.status]}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Tarikh Gaji</p>
                      <p className="font-medium">
                        {new Date(selectedDocument.payrollDate).toLocaleDateString('ms-MY')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bilangan Slip</p>
                      <p className="font-medium">{items.length} slip gaji</p>
                    </div>
                  </div>
                  
                  {selectedDocument.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Keterangan</p>
                      <p className="font-medium">{selectedDocument.description}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleGeneratePayroll(selectedDocument.id)}
                      disabled={generateItemsMutation.isPending}
                      className="bg-gradient-to-r from-[#07A3B2] to-[#0891b2] hover:from-[#0891b2] hover:to-[#07A3B2]"
                      data-testid="button-generate-payroll"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {generateItemsMutation.isPending ? "Menjana..." : "Jana Slip Gaji"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Items */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white">
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Slip Gaji Pekerja
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {itemsLoading ? (
                    <div className="p-4">Memuatkan slip gaji...</div>
                  ) : items.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Tiada slip gaji. Klik "Jana Slip Gaji" untuk menjana slip gaji pekerja.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Pekerja
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Gaji Asas
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Overtime
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Potongan
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Gaji Bersih
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tindakan
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {items.map((item) => {
                            const salary = parseJsonField(item.salary);
                            const overtime = parseJsonField(item.overtime);
                            const deductions = parseJsonField(item.deductions);
                            
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium">
                                      {item.employee?.fullName || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {item.employee?.staffId || 'N/A'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {formatCurrency(salary.basic || '0')}
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p>{formatCurrency(overtime.amount || '0')}</p>
                                    <p className="text-xs text-gray-500">
                                      {overtime.hours || 0} jam
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm">
                                    <p>EPF: {formatCurrency(deductions.epfEmployee || '0')}</p>
                                    <p>SOCSO: {formatCurrency(deductions.socsoEmployee || '0')}</p>
                                    <p>EIS: {formatCurrency(deductions.eisEmployee || '0')}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-green-600">
                                  {formatCurrency(item.netPay)}
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    data-testid={`button-view-payslip-${item.id}`}
                                  >
                                    <Settings className="w-4 h-4 mr-1" />
                                    Lihat
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Pilih Dokumen Payroll
                </h3>
                <p className="text-gray-600">
                  Pilih dokumen payroll dari senarai di sebelah kiri untuk melihat maklumat terperinci dan slip gaji pekerja.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}