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

interface CustomContributionItem {
  id: string;
  name: string;
  amount: number;
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
  customItems: CustomContributionItem[];
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
      hrdf: 0,
      customItems: []
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

  // Dialog state for adding additional items
  const [showAddAdditionalItemDialog, setShowAddAdditionalItemDialog] = useState(false);
  const [newAdditionalItemLabel, setNewAdditionalItemLabel] = useState("");
  const [newAdditionalItemAmount, setNewAdditionalItemAmount] = useState(0);

  // Dialog state for adding contribution items
  const [showAddContributionItemDialog, setShowAddContributionItemDialog] = useState(false);
  const [newContributionItemName, setNewContributionItemName] = useState("");

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

      // MySyarikat Additional Item Logic:
      // Only items with specific checkboxes ticked are included in statutory calculations
      // Example: Basic RM2000 + Subsistence RM200 (EPF ticked) + Extra Resp RM150 (EPF+SOCSO+EIS ticked) + Advance RM300 (no checkbox)
      // EPF Base = RM2000 + RM200 + RM150 = RM2350 (only EPF-ticked items)
      // SOCSO Base = RM2000 + RM150 = RM2150 (only SOCSO-ticked items)
      // EIS Base = RM2000 + RM150 = RM2150 (only EIS-ticked items)
      // Gross Salary = RM2000 + RM200 + RM150 + RM300 = RM2650 (ALL items regardless of checkboxes)
      
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
      
      if (pcb39Mode === "calculate" && salaryData.deductions.pcb39Settings) {
        // Calculate mode: Sum relief and rebate amounts
        const reliefTotal = salaryData.deductions.pcb39Settings.reliefs?.reduce((sum, relief) => sum + relief.amount, 0) || 0;
        const rebateTotal = salaryData.deductions.pcb39Settings.rebates?.reduce((sum, rebate) => sum + rebate.amount, 0) || 0;
        pcb39Amount = reliefTotal + rebateTotal;
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

      // MySyarikat Logic: Gross Salary = Basic Salary + ALL Additional Items
      // This is the KEY requirement - ALL additional items count toward gross salary
      const sumAdditional = salaryData.additionalItems.reduce((sum, item) => sum + item.amount, 0);
      const grossSalary = salaryData.basicSalary + sumAdditional;
      
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
      
      // Calculate total contributions including custom items
      const customContributionsSum = (salaryData.contributions.customItems || []).reduce((sum, item) => sum + item.amount, 0);
      const sumContribution = 
        updatedContributions.epfEmployer +
        updatedContributions.socsoEmployer +
        updatedContributions.eisEmployer +
        updatedContributions.medicalCard +
        updatedContributions.groupTermLife +
        updatedContributions.medicalCompany +
        updatedContributions.hrdf +
        customContributionsSum;

      // Calculate net salary
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

  // New helper functions for standardized layout
  const updateAdditionalItemAmount = (itemCode: string, amount: number) => {
    const updatedItems = salaryData.additionalItems.map(item => 
      item.code === itemCode ? { ...item, amount } : item
    );
    updateSalaryData({ additionalItems: updatedItems });
  };

  const updateAdditionalItemFlag = (itemCode: string, property: string, value: boolean) => {
    const updatedItems = salaryData.additionalItems.map(item => {
      if (item.code === itemCode) {
        if (property === 'hideOnPayslip') {
          return { ...item, hideOnPayslip: value };
        } else if (item.flags && property in item.flags) {
          return { 
            ...item, 
            flags: { ...item.flags, [property]: value }
          };
        }
      }
      return item;
    });
    updateSalaryData({ additionalItems: updatedItems });
  };

  // Function to add custom additional item
  const addCustomAdditionalItem = () => {
    if (!newAdditionalItemLabel.trim()) return;
    
    const newItem: AdditionalItem = {
      code: `CUSTOM_${Date.now()}`,
      label: newAdditionalItemLabel.trim(),
      amount: newAdditionalItemAmount,
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    };
    
    updateSalaryData({
      additionalItems: [...salaryData.additionalItems, newItem]
    });
    
    // Reset dialog state
    setNewAdditionalItemLabel("");
    setNewAdditionalItemAmount(0);
    setShowAddAdditionalItemDialog(false);
  };

  const removeCustomAdditionalItem = (code: string) => {
    // Only allow removal of custom items (those starting with CUSTOM_)
    if (code.startsWith('CUSTOM_')) {
      updateSalaryData({
        additionalItems: salaryData.additionalItems.filter(item => item.code !== code)
      });
    }
  };

  // Function to add custom contribution item
  const addCustomContributionItem = () => {
    if (!newContributionItemName.trim()) return;
    
    const newItem = {
      id: `CUSTOM_${Date.now()}`,
      name: newContributionItemName.trim(),
      amount: 0
    };
    
    const currentCustomItems = salaryData.contributions.customItems || [];
    updateSalaryData({
      contributions: {
        ...salaryData.contributions,
        customItems: [...currentCustomItems, newItem]
      }
    });
    
    // Reset dialog state
    setNewContributionItemName("");
    setShowAddContributionItemDialog(false);
  };

  const updateCustomContributionItem = (index: number, amount: number) => {
    const currentCustomItems = salaryData.contributions.customItems || [];
    const updatedItems = currentCustomItems.map((item, i) => 
      i === index ? { ...item, amount } : item
    );
    
    updateSalaryData({
      contributions: {
        ...salaryData.contributions,
        customItems: updatedItems
      }
    });
  };

  const removeCustomContributionItem = (index: number) => {
    const currentCustomItems = salaryData.contributions.customItems || [];
    const updatedItems = currentCustomItems.filter((_, i) => i !== index);
    
    updateSalaryData({
      contributions: {
        ...salaryData.contributions,
        customItems: updatedItems
      }
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

        {/* Additional Item Logic Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Additional Item Logic:</strong> Click the blue gear icon (⚙️) next to each Additional Item to access statutory checkboxes. 
            When EPF, SOCSO, EIS, HRDF, or PCB39 is checked, that item will be included in the respective statutory calculation base. 
            <strong>All Additional Items are included in Gross Salary regardless of checkbox status.</strong>
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
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Basic Earning</h3>
                </div>
                
                {/* Salary Type */}
                <div className="space-y-2">
                  <Label className="font-medium">Salary Type</Label>
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

                {/* Basic Salary */}
                <div className="space-y-2">
                  <Label className="font-medium">
                    {salaryData.salaryType === "Monthly" ? "Basic Salary (RM/Month)" : 
                     salaryData.salaryType === "Daily" ? "Basic Salary (RM/Day)" : 
                     "Basic Salary (RM/Hour)"}
                  </Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.basicSalary}
                      onChange={(e) => updateSalaryData({ basicSalary: parseFloat(e.target.value) || 0 })}
                      className="rounded-l-none"
                      data-testid="basicSalary"
                    />
                  </div>
                </div>

                {/* Computed Salary */}
                <div className="space-y-2">
                  <Label className="font-medium">Computed Salary (RM)</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={computedValues.computedSalary.replace('RM ', '')}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="computedSalary"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on salary type and basic salary amount.
                  </p>
                </div>

                {/* Settings Section */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-medium text-gray-700">Settings</Label>
                  
                  {/* Calculated in Payment */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Calculated in Payment</Label>
                    <Switch
                      checked={salaryData.settings.isCalculatedInPayment}
                      onCheckedChange={(checked) => updateSalaryData({ 
                        settings: { ...salaryData.settings, isCalculatedInPayment: checked }
                      })}
                      data-testid="switch-calculated-payment"
                    />
                  </div>

                  {/* SOCSO Enabled */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">SOCSO Enabled</Label>
                    <Switch
                      checked={salaryData.settings.isSocsoEnabled}
                      onCheckedChange={(checked) => updateSalaryData({ 
                        settings: { ...salaryData.settings, isSocsoEnabled: checked }
                      })}
                      data-testid="switch-socso-enabled"
                    />
                  </div>

                  {/* EIS Enabled */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">EIS Enabled</Label>
                    <Switch
                      checked={salaryData.settings.isEisEnabled}
                      onCheckedChange={(checked) => updateSalaryData({ 
                        settings: { ...salaryData.settings, isEisEnabled: checked }
                      })}
                      data-testid="switch-eis-enabled"
                    />
                  </div>
                </div>

                {/* EPF Settings */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-medium text-gray-700">EPF Setting</Label>
                  
                  {/* EPF Calculation Method */}
                  <div className="space-y-2">
                    <Label className="text-sm">EPF Calculation Method</Label>
                    <Select 
                      value={salaryData.settings.epfCalcMethod} 
                      onValueChange={(value) => updateSalaryData({ 
                        settings: { ...salaryData.settings, epfCalcMethod: value as "PERCENT" | "CUSTOM" }
                      })}
                      data-testid="epf-calc-method"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">By Percentage</SelectItem>
                        <SelectItem value="CUSTOM">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* EPF Employee Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm">EPF Employee Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={salaryData.settings.epfEmployeeRate}
                      onChange={(e) => updateSalaryData({ 
                        settings: { ...salaryData.settings, epfEmployeeRate: parseFloat(e.target.value) || 0 }
                      })}
                      data-testid="epf-employee-rate"
                    />
                  </div>

                  {/* EPF Employer Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm">EPF Employer Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={salaryData.settings.epfEmployerRate}
                      onChange={(e) => updateSalaryData({ 
                        settings: { ...salaryData.settings, epfEmployerRate: parseFloat(e.target.value) || 0 }
                      })}
                      data-testid="epf-employer-rate"
                    />
                  </div>
                </div>
              </div>



              {/* Column 2 - Additional Item */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Additional Item</h3>
                </div>
                
                {/* Advance Salary */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">Advance Salary</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatutoryFlags("ADV")}
                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                      data-testid="advance-salary-settings-toggle"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.additionalItems.find(item => item.code === "ADV")?.amount || 0}
                      onChange={(e) => updateAdditionalItemAmount("ADV", parseFloat(e.target.value) || 0)}
                      className="rounded-l-none"
                      data-testid="advance-salary"
                    />
                  </div>
                  
                  {/* Show statutory flags when toggled */}
                  {showStatutoryFlags["ADV"] && (
                    <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "ADV")?.flags?.epf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("ADV", "epf", !!checked)}
                          data-testid="advance-salary-epf"
                        />
                        <Label className="text-sm">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "ADV")?.flags?.socso || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("ADV", "socso", !!checked)}
                          data-testid="advance-salary-socso"
                        />
                        <Label className="text-sm">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "ADV")?.flags?.eis || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("ADV", "eis", !!checked)}
                          data-testid="advance-salary-eis"
                        />
                        <Label className="text-sm">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "ADV")?.flags?.hrdf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("ADV", "hrdf", !!checked)}
                          data-testid="advance-salary-hrdf"
                        />
                        <Label className="text-sm">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "ADV")?.flags?.pcb39 || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("ADV", "pcb39", !!checked)}
                          data-testid="advance-salary-pcb39"
                        />
                        <Label className="text-sm">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "ADV")?.flags?.fixed || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("ADV", "fixed", !!checked)}
                          data-testid="advance-salary-fixed"
                        />
                        <Label className="text-sm">Fixed</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subsistence Allowance */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">Subsistence Allowance</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatutoryFlags("SUBS")}
                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                      data-testid="subsistence-allowance-settings-toggle"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.additionalItems.find(item => item.code === "SUBS")?.amount || 0}
                      onChange={(e) => updateAdditionalItemAmount("SUBS", parseFloat(e.target.value) || 0)}
                      className="rounded-l-none"
                      data-testid="subsistence-allowance"
                    />
                  </div>
                  
                  {/* Show statutory flags when toggled */}
                  {showStatutoryFlags["SUBS"] && (
                    <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "SUBS")?.flags?.epf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("SUBS", "epf", !!checked)}
                          data-testid="subsistence-allowance-epf"
                        />
                        <Label className="text-sm">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "SUBS")?.flags?.socso || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("SUBS", "socso", !!checked)}
                          data-testid="subsistence-allowance-socso"
                        />
                        <Label className="text-sm">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "SUBS")?.flags?.eis || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("SUBS", "eis", !!checked)}
                          data-testid="subsistence-allowance-eis"
                        />
                        <Label className="text-sm">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "SUBS")?.flags?.hrdf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("SUBS", "hrdf", !!checked)}
                          data-testid="subsistence-allowance-hrdf"
                        />
                        <Label className="text-sm">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "SUBS")?.flags?.pcb39 || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("SUBS", "pcb39", !!checked)}
                          data-testid="subsistence-allowance-pcb39"
                        />
                        <Label className="text-sm">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "SUBS")?.flags?.fixed || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("SUBS", "fixed", !!checked)}
                          data-testid="subsistence-allowance-fixed"
                        />
                        <Label className="text-sm">Fixed</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Responsibility Allowance */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">Extra Responsibility Allowance</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatutoryFlags("RESP")}
                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                      data-testid="extra-responsibility-settings-toggle"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.additionalItems.find(item => item.code === "RESP")?.amount || 0}
                      onChange={(e) => updateAdditionalItemAmount("RESP", parseFloat(e.target.value) || 0)}
                      className="rounded-l-none"
                      data-testid="extra-responsibility"
                    />
                  </div>
                  
                  {/* Show statutory flags when toggled */}
                  {showStatutoryFlags["RESP"] && (
                    <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "RESP")?.flags?.epf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("RESP", "epf", !!checked)}
                          data-testid="extra-responsibility-epf"
                        />
                        <Label className="text-sm">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "RESP")?.flags?.socso || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("RESP", "socso", !!checked)}
                          data-testid="extra-responsibility-socso"
                        />
                        <Label className="text-sm">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "RESP")?.flags?.eis || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("RESP", "eis", !!checked)}
                          data-testid="extra-responsibility-eis"
                        />
                        <Label className="text-sm">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "RESP")?.flags?.hrdf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("RESP", "hrdf", !!checked)}
                          data-testid="extra-responsibility-hrdf"
                        />
                        <Label className="text-sm">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "RESP")?.flags?.pcb39 || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("RESP", "pcb39", !!checked)}
                          data-testid="extra-responsibility-pcb39"
                        />
                        <Label className="text-sm">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "RESP")?.flags?.fixed || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("RESP", "fixed", !!checked)}
                          data-testid="extra-responsibility-fixed"
                        />
                        <Label className="text-sm">Fixed</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* BIK/VOLA */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">BIK/VOLA</Label>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Special</span>
                    <Checkbox
                      checked={salaryData.additionalItems.find(item => item.code === "BIK")?.hideOnPayslip || false}
                      onCheckedChange={(checked) => updateAdditionalItemFlag("BIK", "hideOnPayslip", !!checked)}
                      data-testid="bik-special-checkbox"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      data-testid="bik-info-button"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.additionalItems.find(item => item.code === "BIK")?.amount || 0}
                      onChange={(e) => updateAdditionalItemAmount("BIK", parseFloat(e.target.value) || 0)}
                      className="rounded-l-none"
                      data-testid="bik-vola"
                    />
                  </div>
                </div>

                {/* Custom Additional Items */}
                {salaryData.additionalItems.filter(item => item.code.startsWith('CUSTOM_')).map((item) => (
                  <div key={item.code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{item.label}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomAdditionalItem(item.code)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        data-testid={`remove-custom-additional-${item.code}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex">
                      <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                        <span className="text-sm font-medium">RM</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateAdditionalItemAmount(item.code, parseFloat(e.target.value) || 0)}
                        className="rounded-l-none"
                        data-testid={`custom-additional-${item.code}`}
                      />
                    </div>
                  </div>
                ))}

                {/* Add Additional Item Button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddAdditionalItemDialog(true)}
                    className="w-full mb-3"
                    data-testid="btn-add-additional-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Additional Item
                  </Button>
                  
                  {/* View Item/Tax Exemption Button */}
                  <Button
                    variant="outline"
                    onClick={() => setIsTaxExemptionDialogOpen(true)}
                    className="w-full"
                    data-testid="btn-view-tax-exemption"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    View Item/Tax Exemption
                  </Button>
                </div>
              </div>

              {/* Column 3 - Deduction Item */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Deduction Item</h3>
                </div>
                
                {/* EPF Employee (auto calculated) */}
                <div className="space-y-2">
                  <Label className="font-medium">EPF Employee</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.deductions.epfEmployee.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="epf-employee-deduction"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on EPF rate × basic salary.
                  </p>
                </div>

                {/* SOCSO Employee (auto calculated) */}
                <div className="space-y-2">
                  <Label className="font-medium">SOCSO Employee</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.deductions.socsoEmployee.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="socso-employee-deduction"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on SOCSO official table.
                  </p>
                </div>

                {/* EIS Employee (auto calculated) */}
                <div className="space-y-2">
                  <Label className="font-medium">EIS Employee</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.deductions.eisEmployee.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="eis-employee-deduction"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? 0.2% × basic salary (capped RM5,000).
                  </p>
                </div>

                {/* Advance Deduction */}
                <div className="space-y-2">
                  <Label className="font-medium">Advance Deduction</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.deductions.advance}
                      onChange={(e) => updateSalaryData({ 
                        deductions: { ...salaryData.deductions, advance: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="advance-deduction"
                    />
                  </div>
                </div>

                {/* Unpaid Leave (auto calculated) */}
                <div className="space-y-2">
                  <Label className="font-medium">Unpaid Leave</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.deductions.unpaidLeave.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="unpaid-leave-deduction"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? (Basic salary ÷ working days) × leave days.
                  </p>
                </div>

                {/* PCB39 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">PCB39</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPCB39Modal(true)}
                      className="h-6 w-6 p-0"
                      data-testid="pcb39-config-button"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.deductions.pcb39.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="pcb39-deduction"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on relief configuration and taxable income.
                  </p>
                </div>

                {/* PCB38 */}
                <div className="space-y-2">
                  <Label className="font-medium">PCB38</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.deductions.pcb38}
                      onChange={(e) => updateSalaryData({ 
                        deductions: { ...salaryData.deductions, pcb38: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="pcb38-deduction"
                    />
                  </div>
                </div>

                {/* Zakat */}
                <div className="space-y-2">
                  <Label className="font-medium">Zakat</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.deductions.zakat}
                      onChange={(e) => updateSalaryData({ 
                        deductions: { ...salaryData.deductions, zakat: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="zakat-deduction"
                    />
                  </div>
                </div>

                {/* Other Deduction */}
                <div className="space-y-2">
                  <Label className="font-medium">Other Deduction</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.deductions.other}
                      onChange={(e) => updateSalaryData({ 
                        deductions: { ...salaryData.deductions, other: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="other-deduction"
                    />
                  </div>
                </div>

                {/* Custom Deduction Items */}
                {(salaryData.deductions.customItems || []).map((item, index) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{item.label}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomDeduction(item.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        data-testid={`remove-custom-deduction-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex">
                      <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                        <span className="text-sm font-medium">RM</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateCustomDeduction(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="rounded-l-none"
                        data-testid={`custom-deduction-${item.id}`}
                      />
                    </div>
                  </div>
                ))}

                {/* Add Deduction Item Button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeductionDialogOpen(true)}
                    className="w-full"
                    data-testid="btn-add-deduction-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deduction Item
                  </Button>
                </div>
              </div>

              {/* Column 4 - Company Contribution */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Company Contribution</h3>
                </div>
                
                {/* EPF Employer */}
                <div className="space-y-2">
                  <Label className="font-medium">EPF Employer</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.contributions.epfEmployer.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="epf-employer-contribution"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on EPF employer rate × basic salary.
                  </p>
                </div>

                {/* SOCSO Employer */}
                <div className="space-y-2">
                  <Label className="font-medium">SOCSO Employer</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.contributions.socsoEmployer.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="socso-employer-contribution"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on SOCSO official table.
                  </p>
                </div>

                {/* EIS Employer */}
                <div className="space-y-2">
                  <Label className="font-medium">EIS Employer</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.contributions.eisEmployer.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="eis-employer-contribution"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? 0.2% × basic salary (capped RM5,000).
                  </p>
                </div>

                {/* HRDF Employer */}
                <div className="space-y-2">
                  <Label className="font-medium">HRDF Employer</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={salaryData.contributions.hrdf.toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="hrdf-employer-contribution"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    How did we calculate this? Based on HRDF rate × basic salary.
                  </p>
                </div>

                {/* Medical Card */}
                <div className="space-y-2">
                  <Label className="font-medium">Medical Card</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.contributions.medicalCard}
                      onChange={(e) => updateSalaryData({ 
                        contributions: { ...salaryData.contributions, medicalCard: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="medical-card-contribution"
                    />
                  </div>
                </div>

                {/* Group Term Life */}
                <div className="space-y-2">
                  <Label className="font-medium">Group Term Life</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.contributions.groupTermLife}
                      onChange={(e) => updateSalaryData({ 
                        contributions: { ...salaryData.contributions, groupTermLife: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="group-term-life-contribution"
                    />
                  </div>
                </div>

                {/* Medical Company */}
                <div className="space-y-2">
                  <Label className="font-medium">Medical Company</Label>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryData.contributions.medicalCompany}
                      onChange={(e) => updateSalaryData({ 
                        contributions: { ...salaryData.contributions, medicalCompany: parseFloat(e.target.value) || 0 }
                      })}
                      className="rounded-l-none"
                      data-testid="medical-company-contribution"
                    />
                  </div>
                </div>

                {/* Custom Contribution Items */}
                {(salaryData.contributions.customItems || []).map((item, index) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{item.name}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomContributionItem(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        data-testid={`remove-custom-contribution-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex">
                      <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                        <span className="text-sm font-medium">RM</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateCustomContributionItem(index, parseFloat(e.target.value) || 0)}
                        className="rounded-l-none"
                        data-testid={`custom-contribution-${item.id}`}
                      />
                    </div>
                  </div>
                ))}

                {/* Add Contribution Item Button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddContributionItemDialog(true)}
                    className="w-full"
                    data-testid="btn-add-contribution-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contribution Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Payroll Calculation Section */}
            <div className="grid grid-cols-1 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Final Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <Label className="text-sm text-gray-600">Gross Salary</Label>
                      <div className="text-lg font-bold text-blue-600">{computedValues.grossSalary}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Total Deduction</Label>
                      <div className="text-lg font-bold text-red-600">{computedValues.totalDeduction}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Net Salary</Label>
                      <div className="text-lg font-bold text-green-600">{computedValues.netSalary}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Company Contribution</Label>
                      <div className="text-lg font-bold text-purple-600">{computedValues.companyContribution}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleManualRecalculate}
                      disabled={isCalculating}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                      data-testid="btn-calculate-payroll"
                    >
                      Calculate Payroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>

      {/* Add Additional Item Dialog */}
      <Dialog open={showAddAdditionalItemDialog} onOpenChange={setShowAddAdditionalItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Additional Item</DialogTitle>
            <DialogDescription>
              Add a new additional item to the salary configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="additional-item-label">Item Label</Label>
              <Input
                id="additional-item-label"
                value={newAdditionalItemLabel}
                onChange={(e) => setNewAdditionalItemLabel(e.target.value)}
                placeholder="Enter item name (e.g., Transport Allowance)"
                data-testid="input-additional-item-label"
              />
            </div>
            <div>
              <Label htmlFor="additional-item-amount">Amount (RM)</Label>
              <Input
                id="additional-item-amount"
                type="number"
                step="0.01"
                value={newAdditionalItemAmount}
                onChange={(e) => setNewAdditionalItemAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                data-testid="input-additional-item-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddAdditionalItemDialog(false)}
              data-testid="btn-cancel-additional-item"
            >
              Cancel
            </Button>
            <Button
              onClick={addCustomAdditionalItem}
              disabled={!newAdditionalItemLabel.trim()}
              data-testid="btn-save-additional-item"
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deduction Item Dialog */}
      <Dialog open={isDeductionDialogOpen} onOpenChange={setIsDeductionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deduction Item</DialogTitle>
            <DialogDescription>
              Add a new deduction item to the salary configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deduction-item-label">Item Label</Label>
              <Input
                id="deduction-item-label"
                value={newDeductionLabel}
                onChange={(e) => setNewDeductionLabel(e.target.value)}
                placeholder="Enter deduction name (e.g., Insurance Premium)"
                data-testid="input-deduction-item-label"
              />
            </div>
            <div>
              <Label htmlFor="deduction-item-amount">Amount (RM)</Label>
              <Input
                id="deduction-item-amount"
                type="number"
                step="0.01"
                value={newDeductionAmount}
                onChange={(e) => setNewDeductionAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                data-testid="input-deduction-item-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeductionDialogOpen(false)}
              data-testid="btn-cancel-deduction-item"
            >
              Cancel
            </Button>
            <Button
              onClick={addCustomDeduction}
              disabled={!newDeductionLabel.trim()}
              data-testid="btn-save-deduction-item"
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contribution Item Dialog */}
      <Dialog open={showAddContributionItemDialog} onOpenChange={setShowAddContributionItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution Item</DialogTitle>
            <DialogDescription>
              Add a new company contribution item to the salary configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contribution-item-name">Item Name</Label>
              <Input
                id="contribution-item-name"
                value={newContributionItemName}
                onChange={(e) => setNewContributionItemName(e.target.value)}
                placeholder="Enter contribution name (e.g., Training Fund)"
                data-testid="input-contribution-item-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddContributionItemDialog(false)}
              data-testid="btn-cancel-contribution-item"
            >
              Cancel
            </Button>
            <Button
              onClick={addCustomContributionItem}
              disabled={!newContributionItemName.trim()}
              data-testid="btn-save-contribution-item"
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
