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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calculator, Save, Info, Settings, ChevronDown, ChevronUp, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PCB39_RELIEFS_2025 } from "@shared/pcb39-reliefs-2025";

interface AdditionalItem {
  code: string;
  label: string;
  amount: number;
  hideOnPayslip?: boolean;
  flags: {
    epf: boolean;
    socso: boolean;
    eis: boolean;
    hrdf: boolean;
    pcb39: boolean;
    fixed: boolean;
  };
}

interface CustomDeductionItem {
  id: string;
  label: string;
  amount: number;
  flags?: {
    epf: boolean;
    socso: boolean;
    eis: boolean;
    hrdf: boolean;
    pcb39: boolean;
    fixed: boolean;
  };
}

interface TaxExemptionItem {
  code: string;
  label: string;
  amount: number;
  flags: {
    epf: boolean;
    socso: boolean;
    eis: boolean;
    hrdf: boolean;
    pcb39: boolean;
    fixed: boolean;
  };
}

interface PCB39Relief {
  code: string;
  label: string;
  amount: number;
  cap?: number | null;
}

interface PCB39Rebate {
  code: string;
  label: string;
  amount: number;
}

interface PCB39Settings {
  mode: "custom" | "calculate";
  amount: number;
  reliefs: PCB39Relief[];
  rebates: PCB39Rebate[];
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
  customItems: CustomDeductionItem[];
  pcb39Settings?: PCB39Settings;
  flags?: {
    advance: {
      epf: boolean;
      socso: boolean;
      eis: boolean;
      hrdf: boolean;
      pcb39: boolean;
      fixed: boolean;
    };
    unpaidLeave: {
      epf: boolean;
      socso: boolean;
      eis: boolean;
      hrdf: boolean;
      pcb39: boolean;
      fixed: boolean;
    };
    pcb38: {
      epf: boolean;
      socso: boolean;
      eis: boolean;
      hrdf: boolean;
      pcb39: boolean;
      fixed: boolean;
    };
    zakat: {
      epf: boolean;
      socso: boolean;
      eis: boolean;
      hrdf: boolean;
      pcb39: boolean;
      fixed: boolean;
    };
    other: {
      epf: boolean;
      socso: boolean;
      eis: boolean;
      hrdf: boolean;
      pcb39: boolean;
      fixed: boolean;
    };
  };
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
  epfCalcMethod: "PERCENT" | "CUSTOM";
  epfEmployeeRate: number;
  epfEmployerRate: number;
  hrdfEmployerRate: number;
}

interface MasterSalaryData {
  employeeId: string;
  salaryType: "Monthly" | "Hourly" | "Daily";
  basicSalary: number;
  additionalItems: AdditionalItem[];
  deductions: DeductionItem;
  contributions: ContributionItem;
  settings: SalarySettings;
  taxExemptions: TaxExemptionItem[];
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

// EIS calculation mengikut spesifikasi terkini
type EisInput = {
  reportedWage: number;
  age?: number;
  hasEisHistoryBefore57?: boolean;
  enabled?: boolean;
  exempt?: boolean;
};

type EisResult = {
  wageBase: number;
  employee: number;
  employer: number;
  eligible: boolean;
};

const calcEis = (input: EisInput): EisResult => {
  const CEILING = 5000.00;
  const EMP_RATE = 0.002; // 0.2%
  const ER_RATE = 0.002; // 0.2%

  const enabled = input.enabled !== false;
  const exempt = !!input.exempt;
  const age = typeof input.age === 'number' ? input.age : undefined;

  // Eligibility logic
  let eligible = enabled && !exempt;

  if (eligible) {
    // EIS tamat pada 60 tahun
    if (age !== undefined && age >= 60) eligible = false;

    // Jika umur >=57 & tiada sejarah caruman sebelum 57 → dikecualikan
    if (age !== undefined && age >= 57 && !input.hasEisHistoryBefore57) {
      eligible = false;
    }
  }

  if (!eligible) {
    return { wageBase: 0, employee: 0, employer: 0, eligible: false };
  }

  const wageBase = Math.min(Number(input.reportedWage || 0), CEILING);
  const rawEmp = wageBase * EMP_RATE;
  const rawEr = wageBase * ER_RATE;

  const employee = roundToNearest5Cents(rawEmp);
  const employer = roundToNearest5Cents(rawEr);

  return { wageBase, employee, employer, eligible: true };
};

// Debug function untuk mengetahui mengapa EIS jadi 0.00
const whyEisZero = ({ reportedWage, age, nationality = 'MY', isEisEnabled = true, exempt = false, hasEisHistoryBefore57 = true }: {
  reportedWage: number;
  age?: number;
  nationality?: string;
  isEisEnabled?: boolean;
  exempt?: boolean;
  hasEisHistoryBefore57?: boolean;
}): string[] => {
  const reasons = [];
  if (!isEisEnabled) reasons.push('EIS toggle OFF');
  if (exempt) reasons.push('Profile marked as exempt');
  if (nationality !== 'MY' && nationality !== 'PR') reasons.push('Non-citizen/non-PR excluded');
  if (typeof age === 'number' && age >= 60) reasons.push('Age ≥ 60 (EIS ends)');
  if (typeof age === 'number' && age >= 57 && !hasEisHistoryBefore57) reasons.push('Age ≥57 with no prior EIS history');
  if (reasons.length === 0 && Math.min(reportedWage, 5000) > 0) reasons.push('Should NOT be zero if eligible');
  return reasons;
};

// Legacy function for backward compatibility
const calcEisLegacy = (basicSalary: number): { employee: number; employer: number } => {
  const result = calcEis({ reportedWage: basicSalary, enabled: true });
  return { employee: result.employee, employer: result.employer };
};

export default function EmployeeSalaryDetailsPage() {
  const { employeeId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || "");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showStatutoryFlags, setShowStatutoryFlags] = useState<Record<string, boolean>>({});
  const [showPCB39Modal, setShowPCB39Modal] = useState(false);
  const [pcb39Mode, setPCB39Mode] = useState<"custom" | "calculate">("custom");
  const [reliefCode, setReliefCode] = useState("");
  const [reliefAmount, setReliefAmount] = useState("");
  const [rebateCode, setRebateCode] = useState("");
  const [rebateAmount, setRebateAmount] = useState("");
  const [pcb39Tab, setPCB39Tab] = useState("relief");

  
  // PCB39 Relief options from official 2025 config
  const reliefOptions = PCB39_RELIEFS_2025;

  // PCB39 Rebate options
  const rebateOptions = [
    { code: "ZAKAT", label: "Zakat" },
    { code: "LOW_INCOME", label: "Low Income Rebate" },
    { code: "DISABILITY", label: "Disability Rebate" },
    { code: "SENIOR", label: "Senior Citizen Rebate" }
  ];
  
  const [salaryData, setSalaryData] = useState<MasterSalaryData>({
    employeeId: employeeId || "",
    salaryType: "Monthly",
    basicSalary: 0,
    additionalItems: [
      { 
        code: "ADV", 
        label: "Advance Salary", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
      },
      { 
        code: "SUBS", 
        label: "Subsistence Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
      },
      { 
        code: "RESP", 
        label: "Extra Responsibility Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
      },
      { 
        code: "BIK", 
        label: "BIK/VOLA", 
        amount: 0, 
        hideOnPayslip: true,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
      }
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
      other: 0,
      customItems: [],
      pcb39Settings: {
        mode: "custom",
        amount: 0,
        reliefs: [],
        rebates: []
      },
      flags: {
        advance: { epf: true, socso: true, eis: true, hrdf: false, pcb39: false, fixed: false },
        unpaidLeave: { epf: true, socso: true, eis: true, hrdf: false, pcb39: false, fixed: false },
        pcb38: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false },
        zakat: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false },
        other: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
      }
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
    taxExemptions: [
      { 
        code: "TRAVEL", 
        label: "Travelling Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "CHILDCARE", 
        label: "Child Care Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "GIFT", 
        label: "Gift", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "PHONE", 
        label: "Phone Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "REWARD", 
        label: "Reward", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "PARKING", 
        label: "Parking Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "MEAL", 
        label: "Meal Allowance", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      },
      { 
        code: "SUBSIDIES", 
        label: "Subsidies", 
        amount: 0,
        flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      }
    ],
    remarks: ""
  });

  const [computedValues, setComputedValues] = useState({
    netSalary: "Calculating...",
    grossSalary: "Calculating...",
    totalDeduction: "Calculating...",
    companyContribution: "Calculating...",
    computedSalary: "Calculating..."
  });

  // Dialog state for adding custom deduction items
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);
  const [newDeductionLabel, setNewDeductionLabel] = useState("");
  const [newDeductionAmount, setNewDeductionAmount] = useState(0);

  // Dialog state for tax exemption modal
  const [isTaxExemptionDialogOpen, setIsTaxExemptionDialogOpen] = useState(false);
  const [expandedTaxFlags, setExpandedTaxFlags] = useState<Set<string>>(new Set());
  const [expandedDeductionFlags, setExpandedDeductionFlags] = useState<Set<string>>(new Set());

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
      // Ensure taxExemptions field exists with default values and flags
      const ensureFlags = (item: any) => ({
        ...item,
        flags: item.flags || { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
      });
      
      const ensureDeductionFlags = (deductions: any) => ({
        ...deductions,
        flags: deductions.flags || {
          advance: { epf: true, socso: true, eis: true, hrdf: false, pcb39: false, fixed: false },
          unpaidLeave: { epf: true, socso: true, eis: true, hrdf: false, pcb39: false, fixed: false },
          pcb38: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false },
          zakat: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false },
          other: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
        },
        customItems: (deductions.customItems || []).map((item: any) => ({
          ...item,
          flags: item.flags || { 
            epf: false, 
            socso: false, 
            eis: false, 
            hrdf: false, 
            pcb39: false, 
            fixed: false 
          }
        }))
      });
      
      const updatedData = {
        ...existingSalaryData,
        deductions: ensureDeductionFlags(existingSalaryData.deductions),
        taxExemptions: existingSalaryData.taxExemptions ? 
          existingSalaryData.taxExemptions.map(ensureFlags) : [
          { 
            code: "TRAVEL", 
            label: "Travelling Allowance", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "CHILDCARE", 
            label: "Child Care Allowance", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "GIFT", 
            label: "Gift", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "PHONE", 
            label: "Phone Allowance", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "REWARD", 
            label: "Reward", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "PARKING", 
            label: "Parking Allowance", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "MEAL", 
            label: "Meal Allowance", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          },
          { 
            code: "SUBSIDIES", 
            label: "Subsidies", 
            amount: 0,
            flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false }
          }
        ]
      };
      setSalaryData(updatedData);
      setIsDirty(false);
    }
  }, [existingSalaryData]);

  // Auto recalculate when basic data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      recompute();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [salaryData.basicSalary, salaryData.settings, salaryData.additionalItems, salaryData.deductions, salaryData.contributions]);

  // Recalculation function
  const recompute = () => {
    setIsCalculating(true);
    
    try {
      // Convert daily salary to monthly for statutory calculations
      const getMonthlyEquivalent = (amount: number) => {
        if (salaryData.salaryType === "Daily") {
          return amount * 26; // 26 working days per month
        } else if (salaryData.salaryType === "Hourly") {
          return amount * 8 * 26; // 8 hours * 26 days
        }
        return amount; // Monthly - no conversion needed
      };

      // Calculate wage bases based on additional items flags (convert to monthly for statutory)
      const basicSalaryMonthly = getMonthlyEquivalent(salaryData.basicSalary);
      
      const epfWageBase = basicSalaryMonthly + salaryData.additionalItems
        .filter(item => item.flags.epf)
        .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0);
      
      const socsoWageBase = basicSalaryMonthly + salaryData.additionalItems
        .filter(item => item.flags.socso)
        .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0);
      
      const eisWageBase = basicSalaryMonthly + salaryData.additionalItems
        .filter(item => item.flags.eis)
        .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0);
      
      const hrdfWageBase = basicSalaryMonthly + salaryData.additionalItems
        .filter(item => item.flags.hrdf)
        .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0);

      // Calculate EPF
      let epfEmployee = 0;
      let epfEmployer = 0;
      
      if (salaryData.settings.epfCalcMethod === "PERCENT") {
        epfEmployee = roundToCent(epfWageBase * salaryData.settings.epfEmployeeRate / 100);
        epfEmployer = roundToCent(epfWageBase * salaryData.settings.epfEmployerRate / 100);
      } else {
        // CUSTOM method - use manually entered values
        epfEmployee = salaryData.deductions.epfEmployee;
        epfEmployer = salaryData.contributions.epfEmployer;
      }

      // Calculate SOCSO using new implementation with proper PERKESO rates
      const socso = salaryData.settings.isSocsoEnabled 
        ? calcSocso({ reportedWage: socsoWageBase, category: 1 })
        : { employee: 0, employer: 0, wageBase: 0, category: 1 as const };
      
      // Calculate EIS using new implementation with proper eligibility checks
      const eis = salaryData.settings.isEisEnabled 
        ? calcEis({ reportedWage: eisWageBase, enabled: true })
        : { employee: 0, employer: 0, wageBase: 0, eligible: false };

      // Calculate HRDF
      const hrdf = roundToCent(hrdfWageBase * salaryData.settings.hrdfEmployerRate / 100);

      // Calculate PCB39 based on mode
      let pcb39Amount = salaryData.deductions.pcb39; // Default to current value
      
      if (pcb39Mode === "calculate" && salaryData.deductions.pcb39Settings?.reliefs) {
        // Calculate mode: Sum relief amounts
        pcb39Amount = salaryData.deductions.pcb39Settings.reliefs.reduce((sum, relief) => sum + relief.amount, 0);
      }
      // For custom mode, we keep the manually entered value (pcb39Amount remains unchanged)

      // Update deductions and contributions
      const updatedDeductions = {
        ...salaryData.deductions,
        epfEmployee,
        socsoEmployee: socso.employee,
        eisEmployee: eis.employee,
        pcb39: pcb39Amount,
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
      
      // Calculate total deductions including ALL deduction items
      const customDeductionsSum = (salaryData.deductions.customItems || []).reduce((sum, item) => sum + item.amount, 0);
      const sumDeduction = 
        updatedDeductions.epfEmployee +
        updatedDeductions.socsoEmployee +
        updatedDeductions.eisEmployee +
        salaryData.deductions.advance +
        salaryData.deductions.unpaidLeave +
        salaryData.deductions.pcb39 +
        salaryData.deductions.pcb38 +
        salaryData.deductions.zakat +
        salaryData.deductions.other +
        customDeductionsSum;
      
      const sumContribution = Object.values(updatedContributions).reduce((sum, value) => sum + value, 0);

      const grossSalary = salaryData.basicSalary + sumAdditional;
      const netSalary = grossSalary - sumDeduction;

      // Update computed values
      setComputedValues({
        netSalary: `RM ${netSalary.toFixed(2)}`,
        grossSalary: `RM ${grossSalary.toFixed(2)}`,
        totalDeduction: `RM ${sumDeduction.toFixed(2)}`,
        companyContribution: `RM ${sumContribution.toFixed(2)}`,
        computedSalary: salaryData.salaryType === "Monthly" 
          ? `RM ${salaryData.basicSalary.toFixed(2)}`
          : `RM ${basicSalaryMonthly.toFixed(2)} (Monthly equivalent)`
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

  // Calculate net salary
  const calculateNetSalary = () => {
    const grossSalary = salaryData.basicSalary + (salaryData.additionalItems?.reduce((sum, item) => sum + item.amount, 0) || 0);
    const totalDeductions = Object.values(salaryData.deductions).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
    return grossSalary - totalDeductions;
  };

  // Handle calculate payroll
  const handleCalculatePayroll = () => {
    recompute();
    toast({ title: "Payroll Calculated", description: "Payroll has been calculated successfully" });
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

  const updateAdditionalItemFlag = (index: number, flag: keyof AdditionalItem['flags'], value: boolean) => {
    const updatedItems = [...salaryData.additionalItems];
    updatedItems[index] = { 
      ...updatedItems[index], 
      flags: { ...updatedItems[index].flags, [flag]: value }
    };
    updateSalaryData({ additionalItems: updatedItems });
  };

  const toggleStatutoryFlags = (itemCode: string) => {
    setShowStatutoryFlags(prev => ({
      ...prev,
      [itemCode]: !prev[itemCode]
    }));
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

  // Custom deduction management functions
  const addCustomDeduction = () => {
    if (!newDeductionLabel.trim()) return;
    
    const newItem: CustomDeductionItem = {
      id: Date.now().toString(),
      label: newDeductionLabel.trim(),
      amount: newDeductionAmount,
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    };
    
    updateSalaryData({
      deductions: {
        ...salaryData.deductions,
        customItems: [...(salaryData.deductions.customItems || []), newItem]
      }
    });
    
    // Reset dialog state
    setNewDeductionLabel("");
    setNewDeductionAmount(0);
    setIsDeductionDialogOpen(false);
  };

  const removeCustomDeduction = (id: string) => {
    updateSalaryData({
      deductions: {
        ...salaryData.deductions,
        customItems: (salaryData.deductions.customItems || []).filter(item => item.id !== id)
      }
    });
  };

  const updateCustomDeduction = (id: string, field: 'label' | 'amount', value: string | number) => {
    updateSalaryData({
      deductions: {
        ...salaryData.deductions,
        customItems: (salaryData.deductions.customItems || []).map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    });
  };

  const updateCustomDeductionFlag = (id: string, flag: string, value: boolean) => {
    updateSalaryData({
      deductions: {
        ...salaryData.deductions,
        customItems: (salaryData.deductions.customItems || []).map(item =>
          item.id === id ? { 
            ...item, 
            flags: { 
              ...(item.flags || { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }), 
              [flag]: value 
            } 
          } : item
        )
      }
    });
  };

  // PCB39 helper functions
  const addPCB39Relief = () => {
    const selectedRelief = reliefOptions.find(r => r.code === reliefCode);
    if (!selectedRelief || !reliefAmount) return;

    const amount = parseFloat(reliefAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Validate cap if exists
    if (selectedRelief.cap !== null && selectedRelief.cap !== undefined) {
      // Check total amount for this relief type including existing entries
      const existingReliefs = salaryData.deductions.pcb39Settings?.reliefs || [];
      const existingAmount = existingReliefs
        .filter(r => r.code === reliefCode)
        .reduce((sum, r) => sum + r.amount, 0);
      
      const totalAmount = existingAmount + amount;
      
      if (totalAmount > selectedRelief.cap) {
        toast({
          variant: "destructive",
          title: "Exceeds Annual Cap",
          description: `Exceeds annual cap for ${selectedRelief.label}: RM${selectedRelief.cap.toFixed(2)}`
        });
        return;
      }
    }

    setSalaryData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        pcb39Settings: {
          ...prev.deductions.pcb39Settings!,
          reliefs: [
            ...(prev.deductions.pcb39Settings?.reliefs || []),
            { code: reliefCode, label: selectedRelief.label, amount, cap: selectedRelief.cap }
          ]
        }
      }
    }));

    setReliefCode("");
    setReliefAmount("");
    setIsDirty(true);
    
    toast({
      title: "Relief Added",
      description: `${selectedRelief.label} - RM${amount.toFixed(2)} added successfully`
    });
  };

  const removePCB39Relief = (index: number) => {
    setSalaryData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        pcb39Settings: {
          ...prev.deductions.pcb39Settings!,
          reliefs: prev.deductions.pcb39Settings!.reliefs.filter((_, i) => i !== index)
        }
      }
    }));
    setIsDirty(true);
    
    toast({
      title: "Relief Removed",
      description: "Relief item has been removed successfully"
    });
  };

  const addPCB39Rebate = () => {
    const selectedRebate = rebateOptions.find(r => r.code === rebateCode);
    if (!selectedRebate || !rebateAmount) return;

    const amount = parseFloat(rebateAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSalaryData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        pcb39Settings: {
          ...prev.deductions.pcb39Settings!,
          rebates: [
            ...prev.deductions.pcb39Settings!.rebates.filter(r => r.code !== rebateCode),
            { code: rebateCode, label: selectedRebate.label, amount }
          ]
        }
      }
    }));

    setRebateCode("");
    setRebateAmount("");
    setIsDirty(true);
  };



  const removePCB39Rebate = (code: string) => {
    setSalaryData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        pcb39Settings: {
          ...prev.deductions.pcb39Settings!,
          rebates: prev.deductions.pcb39Settings!.rebates.filter(r => r.code !== code)
        }
      }
    }));
    setIsDirty(true);
  };

  const updatePCB39Mode = (mode: "custom" | "calculate") => {
    setPCB39Mode(mode);
    setSalaryData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        pcb39Settings: {
          ...prev.deductions.pcb39Settings!,
          mode
        }
      }
    }));
    setIsDirty(true);
  };

  const calculatePCB39Amount = () => {
    if (!salaryData.deductions.pcb39Settings || salaryData.deductions.pcb39Settings.mode !== "calculate") {
      return salaryData.deductions.pcb39;
    }

    // Basic taxable income calculation
    let taxableIncome = salaryData.basicSalary;
    
    // Add taxable additional items
    salaryData.additionalItems.forEach(item => {
      if (item.flags?.pcb39) {
        taxableIncome += item.amount;
      }
    });

    // Subtract reliefs
    const totalReliefs = salaryData.deductions.pcb39Settings.reliefs.reduce((sum, relief) => sum + relief.amount, 0);
    taxableIncome -= totalReliefs;

    // Subtract deductions marked as PCB39
    if (salaryData.deductions.flags?.advance?.pcb39) taxableIncome -= salaryData.deductions.advance;
    if (salaryData.deductions.flags?.unpaidLeave?.pcb39) taxableIncome -= salaryData.deductions.unpaidLeave;
    if (salaryData.deductions.flags?.pcb38?.pcb39) taxableIncome -= salaryData.deductions.pcb38;
    if (salaryData.deductions.flags?.zakat?.pcb39) taxableIncome -= salaryData.deductions.zakat;
    if (salaryData.deductions.flags?.other?.pcb39) taxableIncome -= salaryData.deductions.other;

    // Subtract custom deduction items marked as PCB39
    (salaryData.deductions.customItems || []).forEach(item => {
      if (item.flags?.pcb39) {
        taxableIncome -= item.amount;
      }
    });

    // Simple PCB calculation (monthly) - this would use LHDN tax table in real implementation
    let monthlyTax = 0;
    const annualTaxableIncome = Math.max(0, taxableIncome * 12);
    
    // Simplified progressive tax calculation
    if (annualTaxableIncome > 5000) {
      if (annualTaxableIncome <= 20000) {
        monthlyTax = 0; // First RM20,000 is 0%
      } else if (annualTaxableIncome <= 35000) {
        monthlyTax = ((annualTaxableIncome - 20000) * 0.01) / 12; // 1% on next RM15,000
      } else if (annualTaxableIncome <= 50000) {
        monthlyTax = (150 + (annualTaxableIncome - 35000) * 0.03) / 12; // 3% on next RM15,000
      } else if (annualTaxableIncome <= 70000) {
        monthlyTax = (600 + (annualTaxableIncome - 50000) * 0.08) / 12; // 8% on next RM20,000
      } else if (annualTaxableIncome <= 100000) {
        monthlyTax = (2200 + (annualTaxableIncome - 70000) * 0.14) / 12; // 14% on next RM30,000
      } else {
        monthlyTax = (6400 + (annualTaxableIncome - 100000) * 0.21) / 12; // 21% above RM100,000
      }
    }

    // Subtract rebates
    const totalRebates = salaryData.deductions.pcb39Settings.rebates.reduce((sum, rebate) => sum + rebate.amount, 0);
    monthlyTax = Math.max(0, monthlyTax - totalRebates);

    return roundToCent(monthlyTax);
  };

  // Tax exemption management functions
  const updateTaxExemption = (code: string, amount: number) => {
    updateSalaryData({
      taxExemptions: (salaryData.taxExemptions || []).map(item =>
        item.code === code ? { ...item, amount } : item
      )
    });
  };

  const updateTaxExemptionFlag = (code: string, flag: keyof TaxExemptionItem['flags'], value: boolean) => {
    updateSalaryData({
      taxExemptions: (salaryData.taxExemptions || []).map(item =>
        item.code === code ? { 
          ...item, 
          flags: { ...item.flags, [flag]: value }
        } : item
      )
    });
  };

  const toggleTaxFlags = (code: string) => {
    const newSet = new Set(expandedTaxFlags);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setExpandedTaxFlags(newSet);
  };

  const toggleDeductionFlags = (field: string) => {
    const newSet = new Set(expandedDeductionFlags);
    if (newSet.has(field)) {
      newSet.delete(field);
    } else {
      newSet.add(field);
    }
    setExpandedDeductionFlags(newSet);
  };

  const updateDeductionFlag = (field: string, flag: string, value: boolean) => {
    const currentFlags = salaryData.deductions.flags || {
      advance: { epf: true, socso: true, eis: true, hrdf: false, pcb39: false, fixed: false },
      unpaidLeave: { epf: true, socso: true, eis: true, hrdf: false, pcb39: false, fixed: false },
      pcb38: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false },
      zakat: { epf: false, socso: false, eis: false, hrdf: false, pcb39: true, fixed: false },
      other: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    };
    
    updateSalaryData({
      deductions: {
        ...salaryData.deductions,
        flags: {
          ...currentFlags,
          [field]: {
            ...currentFlags[field as keyof typeof currentFlags],
            [flag]: value
          }
        }
      }
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
        {selectedEmployeeId && (
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
                    onValueChange={(value) => updateSalaryData({ salaryType: value as "Monthly" | "Hourly" | "Daily" })}
                    data-testid="salaryType"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Hourly">Hourly</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    {salaryData.salaryType === "Monthly" ? "Basic Salary (RM/Month)" : 
                     salaryData.salaryType === "Daily" ? "Basic Salary (RM/Day)" : 
                     "Basic Salary (RM/Hour)"}
                  </Label>
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
                  How did we calculate this? {isCalculating ? "Calculating..." : 
                    salaryData.salaryType === "Daily" ? "Daily rate × 26 working days" :
                    salaryData.salaryType === "Hourly" ? "Hourly rate × 8 hours × 26 days" :
                    "Based on monthly basic salary"}
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
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional EPF Rate Inputs */}
                {salaryData.settings.epfCalcMethod === "PERCENT" ? (
                  <>
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
                  </>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                        ⓘ
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Auto calculation for EPF has been turned off.</p>
                        <p>Please make sure to check your EPF amount inserted.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                        ⓘ
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">For PCB39 Calculation, EPF amount will be</p>
                        <p>considered as normal remuneration.</p>
                      </div>
                    </div>
                  </div>
                )}
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
                <div key={item.code} className="space-y-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label className="font-medium">{item.label}</Label>
                      {item.code === "BIK" && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Special</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatutoryFlags(item.code)}
                      className={`h-6 w-6 p-0 hover:bg-gray-100 ${
                        Object.values(item.flags).some(flag => flag) ? 'bg-blue-50 hover:bg-blue-100' : ''
                      }`}
                      data-testid={`settings-${item.code}`}
                    >
                      {showStatutoryFlags[item.code] ? (
                        <ChevronUp className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Settings className={`h-3 w-3 ${
                          Object.values(item.flags).some(flag => flag) ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">RM</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount}
                      onChange={(e) => updateAdditionalItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="flex-1"
                      data-testid={item.code === "ADV" ? "advanceSalary" : item.code === "SUBS" ? "subsistenceAllowance" : item.code === "RESP" ? "extraResponsibilityAllowance" : "bikVola"}
                    />
                  </div>

                  {/* Conditional Statutory Flags */}
                  {showStatutoryFlags[item.code] && (
                    <>
                      {/* Statutory Flags */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags.epf}
                            onCheckedChange={(checked) => updateAdditionalItemFlag(index, 'epf', !!checked)}
                            data-testid={`${item.code}-epf`}
                          />
                          <Label className="text-xs">EPF</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags.socso}
                            onCheckedChange={(checked) => updateAdditionalItemFlag(index, 'socso', !!checked)}
                            data-testid={`${item.code}-socso`}
                          />
                          <Label className="text-xs">SOCSO</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags.eis}
                            onCheckedChange={(checked) => updateAdditionalItemFlag(index, 'eis', !!checked)}
                            data-testid={`${item.code}-eis`}
                          />
                          <Label className="text-xs">EIS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags.hrdf}
                            onCheckedChange={(checked) => updateAdditionalItemFlag(index, 'hrdf', !!checked)}
                            data-testid={`${item.code}-hrdf`}
                          />
                          <Label className="text-xs">HRDF</Label>
                        </div>
                      </div>

                      {/* PCB39 and Fixed flags */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags.pcb39}
                            onCheckedChange={(checked) => updateAdditionalItemFlag(index, 'pcb39', !!checked)}
                            data-testid={`${item.code}-pcb39`}
                          />
                          <Label className="text-xs">PCB39</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags.fixed}
                            onCheckedChange={(checked) => updateAdditionalItemFlag(index, 'fixed', !!checked)}
                            data-testid={`${item.code}-fixed`}
                          />
                          <Label className="text-xs text-blue-600">Fixed</Label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Special notes */}
                  {item.code === "BIK" && (
                    <div className="text-xs text-gray-500 italic">
                      💡 Item will not be displayed on payslip
                    </div>
                  )}
                </div>
              ))}
              
              <div 
                className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                onClick={() => setIsTaxExemptionDialogOpen(true)}
                data-testid="viewTaxExemption"
              >
                💡 View Item/Tax Exemption
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
                  {(() => {
                    if (isCalculating) return "Calculating...";
                    if (!salaryData.settings.isEisEnabled) return "EIS disabled in settings";
                    if (salaryData.deductions.eisEmployee === 0) {
                      const debugReasons = whyEisZero({
                        reportedWage: salaryData.basicSalary,
                        isEisEnabled: salaryData.settings.isEisEnabled,
                        exempt: false
                      });
                      return debugReasons.length > 0 ? `Why 0.00? ${debugReasons.join(', ')}` : "0.2% of basic salary (RM5,000 ceiling)";
                    }
                    return "0.2% of basic salary (RM5,000 ceiling)";
                  })()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Advance Deduction</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeductionFlags('advance')}
                    className="text-xs text-gray-500 hover:bg-gray-100 h-6 px-2"
                    data-testid="toggleAdvanceFlags"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {expandedDeductionFlags.has('advance') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.advance}
                  onChange={(e) => updateDeduction('advance', parseFloat(e.target.value) || 0)}
                  data-testid="advanceDeduction"
                />
                {expandedDeductionFlags.has('advance') && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-2">Statutory & Tax Settings</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'epf', !!checked)}
                          data-testid="checkbox-advance-epf"
                        />
                        <Label className="text-xs">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'socso', !!checked)}
                          data-testid="checkbox-advance-socso"
                        />
                        <Label className="text-xs">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'eis', !!checked)}
                          data-testid="checkbox-advance-eis"
                        />
                        <Label className="text-xs">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'hrdf', !!checked)}
                          data-testid="checkbox-advance-hrdf"
                        />
                        <Label className="text-xs">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'pcb39', !!checked)}
                          data-testid="checkbox-advance-pcb39"
                        />
                        <Label className="text-xs font-medium text-blue-600">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'fixed', !!checked)}
                          data-testid="checkbox-advance-fixed"
                        />
                        <Label className="text-xs font-medium text-green-600">Fixed</Label>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500">
                      💡 EPF/SOCSO/EIS: Kurangkan wage base | PCB39: Kurangkan taxable income | Fixed: Auto-kekalkan
                    </div>
                  </div>
                )}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>PCB 39 
                    <span className={`text-xs px-1 rounded ml-2 ${
                      salaryData.deductions.pcb39Settings?.mode === "calculate" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-orange-100 text-orange-600"
                    }`}>
                      {salaryData.deductions.pcb39Settings?.mode === "calculate" ? "Auto Calculate" : "Custom"}
                    </span>
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPCB39Modal(true)}
                    className="text-xs text-gray-500 hover:bg-gray-100 h-6 px-2"
                    data-testid="openPCB39Modal"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.pcb39}
                  onChange={(e) => updateDeduction('pcb39', parseFloat(e.target.value) || 0)}
                  readOnly={salaryData.deductions.pcb39Settings?.mode === "calculate"}
                  className={salaryData.deductions.pcb39Settings?.mode === "calculate" ? "bg-gray-50" : ""}
                  data-testid="pcb39"
                />
                {salaryData.deductions.pcb39Settings?.mode === "calculate" && (
                  <div className="text-xs text-gray-500">
                    Auto-calculated based on taxable income, reliefs & rebates
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>PCB 38</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeductionFlags('pcb38')}
                    className="text-xs text-gray-500 hover:bg-gray-100 h-6 px-2"
                    data-testid="togglePcb38Flags"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {expandedDeductionFlags.has('pcb38') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.pcb38}
                  onChange={(e) => updateDeduction('pcb38', parseFloat(e.target.value) || 0)}
                  data-testid="pcb38"
                />
                {expandedDeductionFlags.has('pcb38') && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-2">Statutory & Tax Settings</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'epf', !!checked)}
                          data-testid="checkbox-pcb38-epf"
                        />
                        <Label className="text-xs">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'socso', !!checked)}
                          data-testid="checkbox-pcb38-socso"
                        />
                        <Label className="text-xs">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'eis', !!checked)}
                          data-testid="checkbox-pcb38-eis"
                        />
                        <Label className="text-xs">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'hrdf', !!checked)}
                          data-testid="checkbox-pcb38-hrdf"
                        />
                        <Label className="text-xs">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'pcb39', !!checked)}
                          data-testid="checkbox-pcb38-pcb39"
                        />
                        <Label className="text-xs font-medium text-blue-600">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'fixed', !!checked)}
                          data-testid="checkbox-pcb38-fixed"
                        />
                        <Label className="text-xs font-medium text-green-600">Fixed</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Zakat</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeductionFlags('zakat')}
                    className="text-xs text-gray-500 hover:bg-gray-100 h-6 px-2"
                    data-testid="toggleZakatFlags"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {expandedDeductionFlags.has('zakat') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.zakat}
                  onChange={(e) => updateDeduction('zakat', parseFloat(e.target.value) || 0)}
                  data-testid="zakat"
                />
                {expandedDeductionFlags.has('zakat') && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-2">Statutory & Tax Settings</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'epf', !!checked)}
                          data-testid="checkbox-zakat-epf"
                        />
                        <Label className="text-xs">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'socso', !!checked)}
                          data-testid="checkbox-zakat-socso"
                        />
                        <Label className="text-xs">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'eis', !!checked)}
                          data-testid="checkbox-zakat-eis"
                        />
                        <Label className="text-xs">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'hrdf', !!checked)}
                          data-testid="checkbox-zakat-hrdf"
                        />
                        <Label className="text-xs">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'pcb39', !!checked)}
                          data-testid="checkbox-zakat-pcb39"
                        />
                        <Label className="text-xs font-medium text-blue-600">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'fixed', !!checked)}
                          data-testid="checkbox-zakat-fixed"
                        />
                        <Label className="text-xs font-medium text-green-600">Fixed</Label>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500">
                      💡 Zakat: Biasanya PCB39=ON untuk tolak cukai pendapatan
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Other Deduction</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeductionFlags('other')}
                    className="text-xs text-gray-500 hover:bg-gray-100 h-6 px-2"
                    data-testid="toggleOtherFlags"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {expandedDeductionFlags.has('other') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryData.deductions.other}
                  onChange={(e) => updateDeduction('other', parseFloat(e.target.value) || 0)}
                  data-testid="otherDeduction"
                />
                {expandedDeductionFlags.has('other') && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-2">Statutory & Tax Settings</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'epf', !!checked)}
                          data-testid="checkbox-other-epf"
                        />
                        <Label className="text-xs">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'socso', !!checked)}
                          data-testid="checkbox-other-socso"
                        />
                        <Label className="text-xs">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'eis', !!checked)}
                          data-testid="checkbox-other-eis"
                        />
                        <Label className="text-xs">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'hrdf', !!checked)}
                          data-testid="checkbox-other-hrdf"
                        />
                        <Label className="text-xs">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'pcb39', !!checked)}
                          data-testid="checkbox-other-pcb39"
                        />
                        <Label className="text-xs font-medium text-blue-600">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'fixed', !!checked)}
                          data-testid="checkbox-other-fixed"
                        />
                        <Label className="text-xs font-medium text-green-600">Fixed</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Deduction Items */}
              {(salaryData.deductions.customItems || []).map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{item.label}</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDeductionFlags(`custom-${item.id}`)}
                        className="text-xs text-gray-500 hover:bg-gray-100 h-6 px-2"
                        data-testid={`toggleCustomFlags-${item.id}`}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        {expandedDeductionFlags.has(`custom-${item.id}`) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomDeduction(item.id)}
                        className="text-red-600 hover:text-red-700 h-6 px-2"
                        data-testid={`removeCustomDeduction-${item.id}`}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateCustomDeduction(item.id, 'amount', parseFloat(e.target.value) || 0)}
                    data-testid={`customDeduction-${item.id}`}
                  />
                  {expandedDeductionFlags.has(`custom-${item.id}`) && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-xs font-medium text-gray-700 mb-2">Statutory & Tax Settings</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags?.epf || false}
                            onCheckedChange={(checked) => updateCustomDeductionFlag(item.id, 'epf', !!checked)}
                            data-testid={`checkbox-custom-${item.id}-epf`}
                          />
                          <Label className="text-xs">EPF</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags?.socso || false}
                            onCheckedChange={(checked) => updateCustomDeductionFlag(item.id, 'socso', !!checked)}
                            data-testid={`checkbox-custom-${item.id}-socso`}
                          />
                          <Label className="text-xs">SOCSO</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags?.eis || false}
                            onCheckedChange={(checked) => updateCustomDeductionFlag(item.id, 'eis', !!checked)}
                            data-testid={`checkbox-custom-${item.id}-eis`}
                          />
                          <Label className="text-xs">EIS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags?.hrdf || false}
                            onCheckedChange={(checked) => updateCustomDeductionFlag(item.id, 'hrdf', !!checked)}
                            data-testid={`checkbox-custom-${item.id}-hrdf`}
                          />
                          <Label className="text-xs">HRDF</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags?.pcb39 || false}
                            onCheckedChange={(checked) => updateCustomDeductionFlag(item.id, 'pcb39', !!checked)}
                            data-testid={`checkbox-custom-${item.id}-pcb39`}
                          />
                          <Label className="text-xs font-medium text-blue-600">PCB39</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.flags?.fixed || false}
                            onCheckedChange={(checked) => updateCustomDeductionFlag(item.id, 'fixed', !!checked)}
                            data-testid={`checkbox-custom-${item.id}-fixed`}
                          />
                          <Label className="text-xs font-medium text-green-600">Fixed</Label>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-500">
                        💡 Customize bagaimana {item.label} mempengaruhi kiraan EPF/SOCSO/EIS/HRDF/PCB39
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Additional Item Button */}
              <Dialog open={isDeductionDialogOpen} onOpenChange={setIsDeductionDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                    data-testid="btnAddDeductionItem"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deduction Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Tambah Item Deduction</DialogTitle>
                    <DialogDescription>
                      Masukkan maklumat untuk deduction item baru yang akan ditambahkan.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="deductionLabel">Jenis Deduction</Label>
                      <Input
                        id="deductionLabel"
                        value={newDeductionLabel}
                        onChange={(e) => setNewDeductionLabel(e.target.value)}
                        placeholder="Contoh: Pinjaman Koperasi, Denda, etc."
                        data-testid="inputDeductionLabel"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deductionAmount">Jumlah (RM)</Label>
                      <Input
                        id="deductionAmount"
                        type="number"
                        step="0.01"
                        value={newDeductionAmount}
                        onChange={(e) => setNewDeductionAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        data-testid="inputDeductionAmount"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDeductionDialogOpen(false)}
                      data-testid="btnCancelDeduction"
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={addCustomDeduction}
                      disabled={!newDeductionLabel.trim()}
                      data-testid="btnAddDeduction"
                    >
                      Tambah
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Tax Exemption Modal */}
              <Dialog open={isTaxExemptionDialogOpen} onOpenChange={setIsTaxExemptionDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Item/Tax Exemption</DialogTitle>
                    <DialogDescription>
                      Masukkan jumlah pengecualian cukai LHDN untuk mengurangkan taxable income dalam pengiraan PCB.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {(salaryData.taxExemptions || []).map((item) => (
                      <div key={item.code} className="space-y-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={item.code} className="text-right">
                            {item.label}
                          </Label>
                          <Input
                            id={item.code}
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateTaxExemption(item.code, parseFloat(e.target.value) || 0)}
                            className="col-span-2"
                            placeholder="0.00"
                            data-testid={`taxExemption-${item.code}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaxFlags(item.code)}
                            className="text-xs text-gray-500 hover:bg-gray-100"
                            data-testid={`toggleTaxFlags-${item.code}`}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            {expandedTaxFlags.has(item.code) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        </div>
                        
                        {expandedTaxFlags.has(item.code) && (
                          <div className="ml-8 p-3 bg-gray-50 rounded-lg border">
                            <div className="text-xs font-medium text-gray-700 mb-2">Statutory & Tax Settings</div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.code}-epf`}
                                  checked={item.flags?.epf || false}
                                  onCheckedChange={(checked) => updateTaxExemptionFlag(item.code, 'epf', !!checked)}
                                  data-testid={`checkbox-${item.code}-epf`}
                                />
                                <Label htmlFor={`${item.code}-epf`} className="text-xs">EPF</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.code}-socso`}
                                  checked={item.flags?.socso || false}
                                  onCheckedChange={(checked) => updateTaxExemptionFlag(item.code, 'socso', !!checked)}
                                  data-testid={`checkbox-${item.code}-socso`}
                                />
                                <Label htmlFor={`${item.code}-socso`} className="text-xs">SOCSO</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.code}-eis`}
                                  checked={item.flags?.eis || false}
                                  onCheckedChange={(checked) => updateTaxExemptionFlag(item.code, 'eis', !!checked)}
                                  data-testid={`checkbox-${item.code}-eis`}
                                />
                                <Label htmlFor={`${item.code}-eis`} className="text-xs">EIS</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.code}-hrdf`}
                                  checked={item.flags?.hrdf || false}
                                  onCheckedChange={(checked) => updateTaxExemptionFlag(item.code, 'hrdf', !!checked)}
                                  data-testid={`checkbox-${item.code}-hrdf`}
                                />
                                <Label htmlFor={`${item.code}-hrdf`} className="text-xs">HRDF</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.code}-pcb39`}
                                  checked={item.flags?.pcb39 || false}
                                  onCheckedChange={(checked) => updateTaxExemptionFlag(item.code, 'pcb39', !!checked)}
                                  data-testid={`checkbox-${item.code}-pcb39`}
                                />
                                <Label htmlFor={`${item.code}-pcb39`} className="text-xs font-medium text-blue-600">PCB39</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.code}-fixed`}
                                  checked={item.flags?.fixed || false}
                                  onCheckedChange={(checked) => updateTaxExemptionFlag(item.code, 'fixed', !!checked)}
                                  data-testid={`checkbox-${item.code}-fixed`}
                                />
                                <Label htmlFor={`${item.code}-fixed`} className="text-xs font-medium text-green-600">Fixed</Label>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] text-gray-500">
                              💡 PCB39: Include dalam taxable income | Fixed: Auto-kekalkan setiap bulan
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="destructive"
                      onClick={() => setIsTaxExemptionDialogOpen(false)}
                      data-testid="btnCloseTaxExemption"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* PCB39 Modal */}
              <Dialog open={showPCB39Modal} onOpenChange={setShowPCB39Modal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle>PCB39</DialogTitle>
                        <DialogDescription>
                          Configure PCB39 tax relief and rebate settings for employee
                        </DialogDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-gray-600">Mode:</Label>
                        <Select value={pcb39Mode} onValueChange={setPCB39Mode}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calculate">Calculate</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Tab Navigation */}
                    <div className="flex border-b">
                      <button
                        onClick={() => setPCB39Tab("relief")}
                        className={`px-4 py-2 font-medium text-sm ${
                          pcb39Tab === "relief" 
                            ? "border-b-2 border-blue-500 text-blue-600" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        data-testid="tab-relief"
                      >
                        Relief
                      </button>
                      <button
                        onClick={() => setPCB39Tab("rebate")}
                        className={`px-4 py-2 font-medium text-sm ${
                          pcb39Tab === "rebate" 
                            ? "border-b-2 border-blue-500 text-blue-600" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        data-testid="tab-rebate"
                      >
                        Rebate
                      </button>
                    </div>

                    {/* Relief Tab */}
                    {pcb39Tab === "relief" && (
                      <div className="space-y-4">
                        {/* Mode Info Display */}
                        {pcb39Mode === "custom" && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-orange-700">
                              <Info className="h-4 w-4" />
                              <span className="text-sm font-medium">Custom Mode Active</span>
                            </div>
                            <p className="text-xs text-orange-600 mt-1">
                              Relief selection is disabled. Enter PCB39 amount manually below.
                            </p>
                            <div className="mt-3 grid grid-cols-4 gap-3 items-end">
                              <div className="col-span-2">
                                <Label className="text-sm text-orange-700">Custom PCB39 Amount</Label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={salaryData.deductions.pcb39}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setSalaryData(prev => ({
                                      ...prev,
                                      deductions: {
                                        ...prev.deductions,
                                        pcb39: value
                                      }
                                    }));
                                    setIsDirty(true);
                                  }}
                                  className="w-full bg-white"
                                />
                              </div>
                              <div className="col-span-2 text-xs text-orange-600">
                                Manual entry mode - direct PCB39 deduction amount
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {pcb39Mode === "calculate" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Calculator className="h-4 w-4" />
                              <span className="text-sm font-medium">Calculate Mode Active</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              Select relief options to automatically calculate PCB39 amount.
                            </p>
                          </div>
                        )}

                        <div className={`grid grid-cols-12 gap-3 items-end ${pcb39Mode === "custom" ? "opacity-50 pointer-events-none" : ""}`}>
                          <div className="col-span-6">
                            <Label className="text-sm">Select Relief</Label>
                            <Select 
                              value={reliefCode} 
                              onValueChange={setReliefCode}
                              disabled={pcb39Mode === "custom"}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Relief" />
                              </SelectTrigger>
                              <SelectContent>
                                {reliefOptions.map(option => (
                                  <SelectItem key={option.code} value={option.code}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{option.label}</span>
                                      {option.cap && (
                                        <span className="text-xs text-gray-500 ml-2">
                                          Cap: RM{option.cap}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-3">
                            <Label className="text-sm">MYR</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={reliefAmount}
                              onChange={(e) => setReliefAmount(e.target.value)}
                              className="w-full"
                              disabled={pcb39Mode === "custom"}
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <Button 
                              onClick={() => {
                                setReliefCode("");
                                setReliefAmount("");
                              }}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white px-2"
                              data-testid="btn-clear-relief"
                              disabled={pcb39Mode === "custom"}
                            >
                              <span className="text-lg">×</span>
                            </Button>
                          </div>
                          
                          <div className="col-span-2">
                            <Button 
                              onClick={addPCB39Relief}
                              disabled={!reliefCode || !reliefAmount || pcb39Mode === "custom"}
                              size="sm"
                              className="bg-gray-600 hover:bg-gray-700 text-white w-full disabled:opacity-50"
                              data-testid="btn-add-pcb39-relief"
                            >
                              + Add Relief
                            </Button>
                          </div>
                        </div>

                        {/* Relief Items List */}
                        {salaryData.deductions.pcb39Settings?.reliefs && salaryData.deductions.pcb39Settings.reliefs.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700">Added Relief Items:</div>
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                            {salaryData.deductions.pcb39Settings.reliefs.map((relief, index) => (
                              <div key={`${relief.code}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">{relief.label}</div>
                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {relief.code}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="text-xs text-green-600">PCB39 Relief</div>
                                    {relief.cap && (
                                      <div className="text-xs text-gray-500">
                                        Cap: RM{relief.cap.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div className="text-sm font-semibold">RM {relief.amount.toFixed(2)}</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePCB39Relief(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                    data-testid={`remove-relief-${relief.code}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            </div>
                            {/* Total Relief Summary */}
                            <div className="border-t pt-2 flex justify-between items-center bg-blue-50 p-2 rounded">
                              <div className="text-sm font-medium text-blue-700">Total Relief Amount:</div>
                              <div className="text-sm font-bold text-blue-700">
                                RM {salaryData.deductions.pcb39Settings.reliefs.reduce((sum, relief) => sum + relief.amount, 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rebate Tab */}
                    {pcb39Tab === "rebate" && (
                      <div className="space-y-4">
                        {/* Mode Info Display */}
                        {pcb39Mode === "custom" && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-orange-700">
                              <Info className="h-4 w-4" />
                              <span className="text-sm font-medium">Custom Mode Active</span>
                            </div>
                            <p className="text-xs text-orange-600 mt-1">
                              Rebate selection is disabled. PCB39 amount will be entered manually.
                            </p>
                          </div>
                        )}
                        
                        {pcb39Mode === "calculate" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Calculator className="h-4 w-4" />
                              <span className="text-sm font-medium">Calculate Mode Active</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              Select rebate options to automatically calculate PCB39 amount.
                            </p>
                          </div>
                        )}

                        <div className={`grid grid-cols-12 gap-3 items-end ${pcb39Mode === "custom" ? "opacity-50 pointer-events-none" : ""}`}>
                          <div className="col-span-6">
                            <Label className="text-sm">Select Relief</Label>
                            <Select 
                              value={rebateCode} 
                              onValueChange={setRebateCode}
                              disabled={pcb39Mode === "custom"}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Relief" />
                              </SelectTrigger>
                              <SelectContent>
                                {rebateOptions.map(option => (
                                  <SelectItem key={option.code} value={option.code}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-3">
                            <Label className="text-sm">MYR</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={rebateAmount}
                              onChange={(e) => setRebateAmount(e.target.value)}
                              className="w-full"
                              disabled={pcb39Mode === "custom"}
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <Button 
                              onClick={() => {
                                setRebateCode("");
                                setRebateAmount("");
                              }}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white px-2"
                              data-testid="btn-clear-rebate"
                              disabled={pcb39Mode === "custom"}
                            >
                              <span className="text-lg">×</span>
                            </Button>
                          </div>
                          
                          <div className="col-span-2">
                            <Button 
                              onClick={addPCB39Rebate}
                              disabled={!rebateCode || !rebateAmount || pcb39Mode === "custom"}
                              size="sm"
                              className="bg-gray-600 hover:bg-gray-700 text-white w-full disabled:opacity-50"
                              data-testid="btn-add-pcb39-rebate"
                            >
                              + Add Rebate
                            </Button>
                          </div>
                        </div>

                        {/* Rebate Items List */}
                        {salaryData.deductions.pcb39Settings?.rebates && salaryData.deductions.pcb39Settings.rebates.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                            {salaryData.deductions.pcb39Settings.rebates.map((rebate, index) => (
                              <div key={`${rebate.code}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{rebate.label}</div>
                                  <div className="flex gap-4 mt-1">
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" checked disabled /> EPF
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" checked disabled /> SOCSO
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" checked disabled /> EIS
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" disabled /> HRDF
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" checked disabled /> PCB39
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input type="checkbox" disabled /> Fixed
                                    </label>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm">RM {rebate.amount.toFixed(2)}</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePCB39Rebate(rebate.code)}
                                    className="text-red-600 hover:text-red-700 p-1 h-auto"
                                    data-testid={`remove-rebate-${rebate.code}`}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="mt-6">
                    <Button 
                      onClick={() => setShowPCB39Modal(false)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      data-testid="btn-close-pcb39"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>

              {/* Column 4 - Company Contribution */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Contribution</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">EPF Contribution</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Employee (11%)</span>
                        <span>RM {(salaryData.basicSalary * 0.11).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer (12%)</span>
                        <span>RM {(salaryData.basicSalary * 0.12).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">SOCSO Contribution</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Employee (0.5%)</span>
                        <span>RM {Math.min(salaryData.basicSalary * 0.005, 19.75).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer (1.75%)</span>
                        <span>RM {Math.min(salaryData.basicSalary * 0.0175, 69.05).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Gross Salary</h4>
                  <div className="text-2xl font-bold text-green-600">
                    RM {(salaryData.basicSalary + (salaryData.additionalItems?.reduce((sum, item) => sum + item.amount, 0) || 0)).toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Total Deductions</h4>
                  <div className="text-2xl font-bold text-red-600">
                    RM {Object.values(salaryData.deductions).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0).toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Net Salary</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    RM {calculateNetSalary().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="btn-save-salary"
              >
                Save
              </Button>
              <Button 
                onClick={handleCalculatePayroll}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="btn-calculate-payroll"
              >
                Calculate Payroll
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </DashboardLayout>
  );
}