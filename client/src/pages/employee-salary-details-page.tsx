import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SalaryItem {
  id?: string;
  itemName: string;
  itemType: string;
  amount: string;
  isActive: boolean;
}

interface SalaryData {
  id?: string;
  employeeId: string;
  basicSalary: string;
  basicEarnings: SalaryItem[];
  additionalItems: SalaryItem[];
  deductionItems: SalaryItem[];
  companyContributions: SalaryItem[];
}

const itemTypes = [
  { value: "monthly", label: "Bulanan" },
  { value: "daily", label: "Harian" },
  { value: "hourly", label: "Setiap Jam" },
  { value: "piece_rate", label: "Kadar Sekeping" },
  { value: "percentage", label: "Peratusan" }
];

export default function EmployeeSalaryDetailsPage() {
  const { employeeId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [salaryData, setSalaryData] = useState<SalaryData>({
    employeeId: employeeId || "",
    basicSalary: "0.00",
    basicEarnings: [],
    additionalItems: [],
    deductionItems: [],
    companyContributions: []
  });

  // Get employee data for header display
  const { data: employee } = useQuery<any>({
    queryKey: [`/api/employees/${employeeId}`],
    enabled: !!employeeId
  });

  // Get salary data
  const { data: existingSalaryData, isLoading } = useQuery<SalaryData>({
    queryKey: [`/api/employees/${employeeId}/salary`],
    enabled: !!employeeId
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (existingSalaryData) {
      setSalaryData(existingSalaryData);
    }
  }, [existingSalaryData]);

  // Save salary mutation
  const saveSalaryMutation = useMutation({
    mutationFn: async (data: SalaryData) => {
      if (existingSalaryData?.id) {
        return await fetch(`/api/employees/${employeeId}/salary`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(res => res.json());
      } else {
        return await fetch(`/api/employees/${employeeId}/salary`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(res => res.json());
      }
    },
    onSuccess: () => {
      toast({ title: "Berjaya", description: "Maklumat gaji telah disimpan" });
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}/salary`] });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        title: "Ralat", 
        description: "Gagal menyimpan maklumat gaji" 
      });
    }
  });

  const addItem = (section: keyof Pick<SalaryData, 'basicEarnings' | 'additionalItems' | 'deductionItems' | 'companyContributions'>) => {
    const newItem: SalaryItem = {
      itemName: "",
      itemType: "monthly",
      amount: "0.00",
      isActive: true
    };
    
    setSalaryData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const updateItem = (
    section: keyof Pick<SalaryData, 'basicEarnings' | 'additionalItems' | 'deductionItems' | 'companyContributions'>,
    index: number,
    field: keyof SalaryItem,
    value: any
  ) => {
    setSalaryData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (
    section: keyof Pick<SalaryData, 'basicEarnings' | 'additionalItems' | 'deductionItems' | 'companyContributions'>,
    index: number
  ) => {
    setSalaryData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    saveSalaryMutation.mutate(salaryData);
  };

  const renderItemSection = (
    title: string,
    section: keyof Pick<SalaryData, 'basicEarnings' | 'additionalItems' | 'deductionItems' | 'companyContributions'>,
    items: SalaryItem[]
  ) => (
    <Card className="mb-6">
      <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm">Nama Item</Label>
                <Input
                  value={item.itemName}
                  onChange={(e) => updateItem(section, index, 'itemName', e.target.value)}
                  placeholder="Masukkan nama item"
                  data-testid={`input-${section}-name-${index}`}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm">Jenis</Label>
                <Select 
                  value={item.itemType} 
                  onValueChange={(value) => updateItem(section, index, 'itemType', value)}
                >
                  <SelectTrigger data-testid={`select-${section}-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm">Jumlah (RM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => updateItem(section, index, 'amount', e.target.value)}
                  placeholder="0.00"
                  data-testid={`input-${section}-amount-${index}`}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm">Aktif</Label>
                <div className="flex items-center">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(checked) => updateItem(section, index, 'isActive', checked)}
                    data-testid={`switch-${section}-active-${index}`}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(section, index)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  data-testid={`button-remove-${section}-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={() => addItem(section)}
            className="w-full border-dashed border-cyan-300 text-cyan-600 hover:bg-cyan-50"
            data-testid={`button-add-${section}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Item Baru
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Memuatkan...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <span>Home &gt; Payment &gt; Salary Payroll &gt; Employee Salary Details</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Maklumat Gaji - {employee?.fullName || "Loading..."}
            </h1>
            <p className="text-gray-600 mt-1">
              No. Pekerja: {employee?.employment?.employeeNo || employee?.id}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/payment/salary-payroll")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveSalaryMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
              data-testid="button-save-salary"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveSalaryMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>

        {/* Basic Salary */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
            <CardTitle className="text-lg font-semibold">Gaji Asas</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gaji Asas Bulanan (RM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.basicSalary}
                  onChange={(e) => setSalaryData(prev => ({ ...prev, basicSalary: e.target.value }))}
                  placeholder="0.00"
                  className="text-lg"
                  data-testid="input-basic-salary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Earning */}
        {renderItemSection("Basic Earning", "basicEarnings", salaryData.basicEarnings)}

        {/* Additional Items */}
        {renderItemSection("Additional Items", "additionalItems", salaryData.additionalItems)}

        {/* Deduction Items */}
        {renderItemSection("Deduction Items", "deductionItems", salaryData.deductionItems)}

        {/* Company Contribution */}
        {renderItemSection("Company Contribution", "companyContributions", salaryData.companyContributions)}

        {/* Summary */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
            <CardTitle className="text-lg font-semibold">Ringkasan Gaji</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Gaji Asas</div>
                <div className="text-lg font-bold text-gray-900">
                  RM {parseFloat(salaryData.basicSalary || "0").toFixed(2)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Jumlah Tambahan</div>
                <div className="text-lg font-bold text-green-600">
                  RM {salaryData.additionalItems
                    .filter(item => item.isActive)
                    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0)
                    .toFixed(2)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">Jumlah Potongan</div>
                <div className="text-lg font-bold text-red-600">
                  RM {salaryData.deductionItems
                    .filter(item => item.isActive)
                    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0)
                    .toFixed(2)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Gaji Bersih</div>
                <div className="text-lg font-bold text-blue-600">
                  RM {(
                    parseFloat(salaryData.basicSalary || "0") +
                    salaryData.basicEarnings.filter(item => item.isActive).reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0) +
                    salaryData.additionalItems.filter(item => item.isActive).reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0) -
                    salaryData.deductionItems.filter(item => item.isActive).reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}