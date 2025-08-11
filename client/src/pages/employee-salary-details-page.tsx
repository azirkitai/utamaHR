import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calculator, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdditionalItem {
  code: string;
  label: string;
  amount: number;
  hideOnPayslip?: boolean;
}

interface DeductionItem {
  epfEmployee: number;
  socsoEmployee: number;
  eisEmployee: number;
  advance: number;
  unpaidLeave: number;
  pcb39: number;
  pcb38: number;
  zakat: number;
  other: number;
}

interface ContributionItem {
  epfEmployer: number;
  socsoEmployer: number;
  eisEmployer: number;
  medicalCard: number;
  groupTermLife: number;
  medicalCompany: number;
  hrdf: number;
}

interface SalarySettings {
  isCalculatedInPayment: boolean;
  isSocsoEnabled: boolean;
  isEisEnabled: boolean;
  epfCalcMethod: "PERCENT" | "FIXED";
  epfEmployeeRate: number;
  epfEmployerRate: number;
  hrdfEmployerRate: number;
}

interface MasterSalaryData {
  employeeId: string;
  salaryType: "Monthly" | "Hourly";
  basicSalary: number;
  additionalItems: AdditionalItem[];
  deductions: DeductionItem;
  contributions: ContributionItem;
  settings: SalarySettings;
  remarks: string;
}

// Helper functions for calculations
const roundToCent = (value: number): number => Math.round(value * 100) / 100;

// Pembundaran ke 5 sen terdekat
const roundToNearest5Cents = (n: number): number => Math.round(n * 20) / 20;

// SOCSO calculation mengikut spesifikasi PERKESO
type SocsoInput = {
  reportedWage: number;     // gaji dilapor
  category?: 1 | 2;         // jika diberi, override logik umur
  age?: number;             // untuk auto pilih kategori jika category tak diberi
};

type SocsoResult = {
  wageBase: number;         // asas kiraan (cap pada 5950)
  employee: number;         // caruman pekerja
  employer: number;         // caruman majikan
  category: 1 | 2;          // kategori akhir yang digunakan
};

const calcSocso = (input: SocsoInput): SocsoResult => {
  const CEILING = 5950.00;

  // Tentukan kategori akhir
  let categoryFinal = input.category;
  if (!categoryFinal) {
    if (typeof input.age === 'number' && input.age >= 60) {
      categoryFinal = 2;
    } else {
      categoryFinal = 1;
    }
  }

  // Tetapkan kadar mengikut kategori
  let employerRate = 0;
  let employeeRate = 0;
  if (categoryFinal === 1) {
    employerRate = 0.0175; // 1.75%
    employeeRate = 0.005;  // 0.50%
  } else {
    employerRate = 0.0125; // 1.25%
    employeeRate = 0.0;    // 0%
  }

  // Wage base (cap)
  const wageBase = Math.min(Number(input.reportedWage || 0), CEILING);

  // Kiraan kasar
  const rawEmployer = wageBase * employerRate;
  const rawEmployee = wageBase * employeeRate;

  // Pembundaran 5 sen
  const employer = roundToNearest5Cents(rawEmployer);
  const employee = roundToNearest5Cents(rawEmployee);

  return { wageBase, employer, employee, category: categoryFinal };
};

// Legacy function for backward compatibility
const calcSocsoLegacy = (basicSalary: number): { employee: number; employer: number } => {
  const result = calcSocso({ reportedWage: basicSalary, category: 1 });
  return { employee: result.employee, employer: result.employer };
};

const calcEis = (basicSalary: number): { employee: number; employer: number } => {
  // EIS: 0.2% employee, 0.2% employer, max RM7.40 each
  const rate = 0.002;
  const employee = Math.min(roundToCent(basicSalary * rate), 7.40);
  const employer = Math.min(roundToCent(basicSalary * rate), 7.40);
  return { employee, employer };
};

export default function EmployeeSalaryDetailsPage() {
  const { employeeId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || "");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [salaryData, setSalaryData] = useState<MasterSalaryData>({
    employeeId: employeeId || "",
    salaryType: "Monthly",
    basicSalary: 0,
    additionalItems: [
      { code: "ADV", label: "Advance Salary", amount: 0 },
      { code: "SUBS", label: "Subsistence Allowance", amount: 0 },
      { code: "RESP", label: "Extra Responsibility Allowance", amount: 0 },
      { code: "BIK", label: "BIK/VOLA", amount: 0, hideOnPayslip: false }
    ],
    deductions: {
      epfEmployee: 0,
      socsoEmployee: 0,
      eisEmployee: 0,
      advance: 0,
      unpaidLeave: 0,
      pcb39: 0,
      pcb38: 0,
      zakat: 0,
      other: 0
    },
    contributions: {
      epfEmployer: 0,
      socsoEmployer: 0,
      eisEmployer: 0,
      medicalCard: 0,
      groupTermLife: 0,
      medicalCompany: 0,
      hrdf: 0
    },
    settings: {
      isCalculatedInPayment: true,
      isSocsoEnabled: true,
      isEisEnabled: true,
      epfCalcMethod: "PERCENT",
      epfEmployeeRate: 11.0,
      epfEmployerRate: 13.0,
      hrdfEmployerRate: 1.0
    },
    remarks: ""
  });

  const [computedValues, setComputedValues] = useState({
    netSalary: "Calculating...",
    grossSalary: "Calculating...",
    totalDeduction: "Calculating...",
    companyContribution: "Calculating...",
    computedSalary: "Calculating..."
  });

  // Get all employees for dropdown
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  // Get selected employee data
  const { data: selectedEmployee } = useQuery<any>({
    queryKey: [`/api/employees/${selectedEmployeeId}`],
    enabled: !!selectedEmployeeId
  });

  // Get existing salary data
  const { data: existingSalaryData, isLoading } = useQuery<MasterSalaryData>({
    queryKey: [`/api/employees/${selectedEmployeeId}/salary`],
    enabled: !!selectedEmployeeId
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (existingSalaryData) {
      setSalaryData(existingSalaryData);
      setIsDirty(false);
    }
  }, [existingSalaryData]);

  // Auto recalculate when basic data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      recompute();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [salaryData.basicSalary, salaryData.settings, salaryData.additionalItems]);

  // Recalculation function
  const recompute = () => {
    setIsCalculating(true);
    
    try {
      // Calculate EPF
      let epfEmployee = 0;
      let epfEmployer = 0;
      
      if (salaryData.settings.epfCalcMethod === "PERCENT") {
        epfEmployee = roundToCent(salaryData.basicSalary * salaryData.settings.epfEmployeeRate / 100);
        epfEmployer = roundToCent(salaryData.basicSalary * salaryData.settings.epfEmployerRate / 100);
      } else {
        epfEmployee = salaryData.deductions.epfEmployee;
        epfEmployer = salaryData.contributions.epfEmployer;
      }

      // Calculate SOCSO
      // Calculate SOCSO using new implementation with proper PERKESO rates
      const socso = salaryData.settings.isSocsoEnabled 
        ? calcSocso({ reportedWage: salaryData.basicSalary, category: 1 })
        : { employee: 0, employer: 0, wageBase: 0, category: 1 as const };
      
      // Calculate EIS
      const eis = salaryData.settings.isEisEnabled ? calcEis(salaryData.basicSalary) : { employee: 0, employer: 0 };

      // Calculate HRDF
      const hrdf = roundToCent(salaryData.basicSalary * salaryData.settings.hrdfEmployerRate / 100);

      // Update deductions and contributions
      const updatedDeductions = {
        ...salaryData.deductions,
        epfEmployee,
        socsoEmployee: socso.employee,
        eisEmployee: eis.employee,
      };

      const updatedContributions = {
        ...salaryData.contributions,
        epfEmployer,
        socsoEmployer: socso.employer,
        eisEmployer: eis.employer,
        hrdf
      };

      // Calculate totals
      const sumAdditional = salaryData.additionalItems.reduce((sum, item) => sum + item.amount, 0);
      const sumDeduction = Object.values(updatedDeductions).reduce((sum, value) => sum + value, 0);
      const sumContribution = Object.values(updatedContributions).reduce((sum, value) => sum + value, 0);

      const grossSalary = salaryData.basicSalary + sumAdditional;
      const netSalary = grossSalary - sumDeduction;

      // Update computed values
      setComputedValues({
        netSalary: `RM ${netSalary.toFixed(2)}`,
        grossSalary: `RM ${grossSalary.toFixed(2)}`,
        totalDeduction: `RM ${sumDeduction.toFixed(2)}`,
        companyContribution: `RM ${sumContribution.toFixed(2)}`,
        computedSalary: `RM ${salaryData.basicSalary.toFixed(2)}`
      });

      // Update salary data with calculated values (avoid triggering recalculation)
      setSalaryData(prev => {
        // Only update if values actually changed to prevent infinite loop
        const hasDeductionChanges = JSON.stringify(prev.deductions) !== JSON.stringify(updatedDeductions);
        const hasContributionChanges = JSON.stringify(prev.contributions) !== JSON.stringify(updatedContributions);
        
        if (hasDeductionChanges || hasContributionChanges) {
          return {
            ...prev,
            deductions: updatedDeductions,
            contributions: updatedContributions
          };
        }
        return prev;
      });

    } catch (error) {
      console.error("Error in calculation:", error);
    } finally {
      setTimeout(() => setIsCalculating(false), 500);
    }
  };

  // Save salary mutation
  const saveSalaryMutation = useMutation({
    mutationFn: async (data: MasterSalaryData) => {
      if (existingSalaryData?.employeeId) {
        return await fetch(`/api/employees/${selectedEmployeeId}/salary`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(res => res.json());
      } else {
        return await fetch(`/api/employees/${selectedEmployeeId}/salary`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(res => res.json());
      }
    },
    onSuccess: () => {
      toast({ title: "Master Salary saved.", description: "Maklumat gaji telah disimpan" });
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${selectedEmployeeId}/salary`] });
      setIsDirty(false);
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        title: "Ralat", 
        description: "Gagal menyimpan maklumat gaji" 
      });
    }
  });

  const handleEmployeeChange = (newEmployeeId: string) => {
    setSelectedEmployeeId(newEmployeeId);
    setSalaryData(prev => ({ ...prev, employeeId: newEmployeeId }));
  };

  const handleSave = () => {
    saveSalaryMutation.mutate(salaryData);
  };

  const handleManualRecalculate = () => {
    recompute();
    toast({ title: "Recalculated", description: "All values have been recalculated" });
  };

  const updateSalaryData = (updates: Partial<MasterSalaryData>) => {
    setSalaryData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const updateAdditionalItem = (index: number, field: keyof AdditionalItem, value: any) => {
    const updatedItems = [...salaryData.additionalItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    updateSalaryData({ additionalItems: updatedItems });
  };

  const updateDeduction = (field: keyof DeductionItem, value: number) => {
    updateSalaryData({ 
      deductions: { ...salaryData.deductions, [field]: value }
    });
  };

  const updateContribution = (field: keyof ContributionItem, value: number) => {
    updateSalaryData({ 
      contributions: { ...salaryData.contributions, [field]: value }
    });
  };

  const updateSettings = (field: keyof SalarySettings, value: any) => {
    updateSalaryData({ 
      settings: { ...salaryData.settings, [field]: value }
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Master Salary</h1>
          <div className="flex space-x-2">
            <Button
              variant="destructive"
              onClick={handleManualRecalculate}
              disabled={isCalculating}
              data-testid="btnRecalculate"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isCalculating ? "Calculating..." : "Recalculate"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveSalaryMutation.isPending || !isDirty}
              data-testid="btnSaveChanges"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveSalaryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Master Salary is employee's fixed monthly salary that doesn't change monthly to ease the process of generating monthly payroll salary. If there is any permanent wage changes that will affect your pay for upcoming month, you may update the changes here so you don't have to change it on a monthly basis.
          </AlertDescription>
        </Alert>

        {/* Employee Selection Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Salary for {selectedEmployee?.fullName || "Select Employee"}
              </h2>
              <div className="w-64">
                <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange} data-testid="ddlEmployee">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Net Salary</div>
              <div className="text-lg font-bold text-green-600" data-testid="txtNetSalary">
                {computedValues.netSalary}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Gross Salary</div>
              <div className="text-lg font-bold text-blue-600" data-testid="txtGrossSalary">
                {computedValues.grossSalary}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Deduction</div>
              <div className="text-lg font-bold text-red-600" data-testid="txtTotalDeduction">
                {computedValues.totalDeduction}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Company Contribution</div>
              <div className="text-lg font-bold text-purple-600" data-testid="txtCompanyContribution">
                {computedValues.companyContribution}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form - Single Card with Grid Layout */}
        <Card>
          <CardHeader>
            <CardTitle>Master Salary Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Column 1 - Basic Earning */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Earning</h3>
                
                <div>
                  <Label>Salary Type</Label>
                  <Select 
                    value={salaryData.salaryType} 
                    onValueChange={(value) => updateSalaryData({ salaryType: value as "Monthly" | "Hourly" })}
                    data-testid="salaryType"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Basic Salary (RM)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salaryData.basicSalary}
                    onChange={(e) => updateSalaryData({ basicSalary: parseFloat(e.target.value) || 0 })}
                    data-testid="basicSalary"
                  />
                </div>

                <div>
                <Label>Computed Salary (RM)</Label>
                <Input 
                  value={computedValues.computedSalary} 
                  readOnly 
                  className="bg-gray-50"
                  data-testid="computedSalary"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "Based on basic salary"}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Settings</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={salaryData.settings.isCalculatedInPayment}
                    onCheckedChange={(checked) => updateSettings('isCalculatedInPayment', checked)}
                    data-testid="isCalculatedInPayment"
                  />
                  <Label>Calculated in Payment</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={salaryData.settings.isSocsoEnabled}
                    onCheckedChange={(checked) => updateSettings('isSocsoEnabled', checked)}
                    data-testid="isSocsoEnabled"
                  />
                  <Label>SOCSO Enabled</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={salaryData.settings.isEisEnabled}
                    onCheckedChange={(checked) => updateSettings('isEisEnabled', checked)}
                    data-testid="isEisEnabled"
                  />
                  <Label>EIS Enabled</Label>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">EPF Setting</h4>
                
                <div>
                  <Label>EPF Calculation Method</Label>
                  <Select 
                    value={salaryData.settings.epfCalcMethod} 
                    onValueChange={(value) => updateSettings('epfCalcMethod', value)}
                    data-testid="epfCalcMethod"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">By Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>EPF Employee Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salaryData.settings.epfEmployeeRate}
                    onChange={(e) => updateSettings('epfEmployeeRate', parseFloat(e.target.value) || 0)}
                    data-testid="epfEmployeeRate"
                  />
                </div>

                <div>
                  <Label>EPF Employer Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salaryData.settings.epfEmployerRate}
                    onChange={(e) => updateSettings('epfEmployerRate', parseFloat(e.target.value) || 0)}
                    data-testid="epfEmployerRate"
                  />
                </div>
                </div>

                <div>
                  <h4 className="font-medium">HRDF Setting</h4>
                  <Label>HRDF Employer Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salaryData.settings.hrdfEmployerRate}
                    onChange={(e) => updateSettings('hrdfEmployerRate', parseFloat(e.target.value) || 0)}
                    data-testid="hrdfEmployerRate"
                  />
                </div>

                <div>
                  <Label>Remarks</Label>
                  <Textarea
                    value={salaryData.remarks}
                    onChange={(e) => updateSalaryData({ remarks: e.target.value })}
                    data-testid="remarks"
                  />
                </div>
              </div>

              {/* Column 2 - Additional Item */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Item</h3>
              {salaryData.additionalItems.map((item, index) => (
                <div key={item.code} className="space-y-2">
                  <Label>{item.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateAdditionalItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    data-testid={item.code === "ADV" ? "advanceSalary" : item.code === "SUBS" ? "subsistenceAllowance" : item.code === "RESP" ? "extraResponsibilityAllowance" : "bikVola"}
                  />
                  {item.code === "BIK" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={item.hideOnPayslip}
                        onCheckedChange={(checked) => updateAdditionalItem(index, 'hideOnPayslip', checked)}
                        data-testid="hideBikOnPayslip"
                      />
                      <Label className="text-sm">Item will not be displayed on payslip</Label>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="text-sm text-blue-600 underline cursor-pointer">
                View Item/Tax Exemption
              </div>
              
              <Button
                variant="outline"
                className="w-full border-green-300 text-green-600 hover:bg-green-50"
                data-testid="btnAddAdditionalItem"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Additional Item
                </Button>
              </div>

              {/* Column 3 - Deduction Item */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Deduction Item</h3>
                
                <div>
                  <Label>EPF Employee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salaryData.deductions.epfEmployee}
                    onChange={(e) => updateDeduction('epfEmployee', parseFloat(e.target.value) || 0)}
                    readOnly={salaryData.settings.epfCalcMethod === "PERCENT"}
                    className={salaryData.settings.epfCalcMethod === "PERCENT" ? "bg-gray-50" : ""}
                    data-testid="epfEmployee"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    How did we calculate this? {isCalculating ? "Calculating..." : "Based on EPF settings"}
                  </div>
                </div>

              <div>
                <Label>SOCSO Employee</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.socsoEmployee}
                  readOnly
                  className="bg-gray-50"
                  data-testid="socsoEmployee"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "Based on SOCSO rate table"}
                </div>
              </div>

              <div>
                <Label>EIS Employee</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.eisEmployee}
                  readOnly
                  className="bg-gray-50"
                  data-testid="eisEmployee"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "0.2% of basic salary"}
                </div>
              </div>

              <div>
                <Label>Advance Deduction</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.advance}
                  onChange={(e) => updateDeduction('advance', parseFloat(e.target.value) || 0)}
                  data-testid="advanceDeduction"
                />
              </div>

              <div>
                <Label>Unpaid Leave</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.unpaidLeave}
                  readOnly
                  className="bg-gray-50"
                  data-testid="unpaidLeave"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "Based on unpaid leave days"}
                </div>
              </div>

              <div>
                <Label>PCB 39 <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">Custom</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.pcb39}
                  onChange={(e) => updateDeduction('pcb39', parseFloat(e.target.value) || 0)}
                  data-testid="pcb39"
                />
              </div>

              <div>
                <Label>PCB 38</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.pcb38}
                  onChange={(e) => updateDeduction('pcb38', parseFloat(e.target.value) || 0)}
                  data-testid="pcb38"
                />
              </div>

              <div>
                <Label>Zakat</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.zakat}
                  onChange={(e) => updateDeduction('zakat', parseFloat(e.target.value) || 0)}
                  data-testid="zakat"
                />
              </div>

              <div>
                <Label>Other Deduction</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.other}
                  onChange={(e) => updateDeduction('other', parseFloat(e.target.value) || 0)}
                  data-testid="otherDeduction"
                />
              </div>
              </div>

              {/* Column 4 - Company Contribution */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Contribution</h3>
                
                <div>
                <Label>EPF Employer</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.epfEmployer}
                  onChange={(e) => updateContribution('epfEmployer', parseFloat(e.target.value) || 0)}
                  readOnly={salaryData.settings.epfCalcMethod === "PERCENT"}
                  className={salaryData.settings.epfCalcMethod === "PERCENT" ? "bg-gray-50" : ""}
                  data-testid="epfEmployer"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "Based on EPF settings"}
                </div>
              </div>

              <div>
                <Label>SOCSO Employer</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.socsoEmployer}
                  readOnly
                  className="bg-gray-50"
                  data-testid="socsoEmployer"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "Based on SOCSO rate table"}
                </div>
              </div>

              <div>
                <Label>EIS Employer</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.eisEmployer}
                  readOnly
                  className="bg-gray-50"
                  data-testid="eisEmployer"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "0.2% of basic salary"}
                </div>
              </div>

              <div>
                <Label>Medical Card</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.medicalCard}
                  onChange={(e) => updateContribution('medicalCard', parseFloat(e.target.value) || 0)}
                  data-testid="medicalCard"
                />
              </div>

              <div>
                <Label>Group Term Life</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.groupTermLife}
                  onChange={(e) => updateContribution('groupTermLife', parseFloat(e.target.value) || 0)}
                  data-testid="groupTermLife"
                />
              </div>

              <div>
                <Label>Medical Company</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.medicalCompany}
                  onChange={(e) => updateContribution('medicalCompany', parseFloat(e.target.value) || 0)}
                  data-testid="medicalCompany"
                />
              </div>

              <div>
                <Label>HRDF Contribution</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.contributions.hrdf}
                  readOnly
                  className="bg-gray-50"
                  data-testid="hrdfContribution"
                />
                <div className="text-xs text-gray-500 mt-1">
                  How did we calculate this? {isCalculating ? "Calculating..." : "Based on HRDF rate"}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                data-testid="btnAddContributionItem"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contribution Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}