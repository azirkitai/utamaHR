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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calculator, Save, Info, Settings, ChevronDown, ChevronUp, X, Trash2, Eye, EyeOff, Edit, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  hrdfEmployerRate?: number;
  otherRemarks?: string;
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

// Jadual SOCSO rasmi mengikut PERKESO - Category 1
// Reference: Jadual Kadar Caruman SOCSO 2025 untuk Skim Bencana Pekerjaan + Skim Keilatan
const SOCSO_TABLE_CAT1 = [
  { min: 0.01, max: 30.00, employee: 0.20, employer: 0.70 },
  { min: 30.01, max: 50.00, employee: 0.30, employer: 1.05 },
  { min: 50.01, max: 70.00, employee: 0.40, employer: 1.40 },
  { min: 70.01, max: 100.00, employee: 0.60, employer: 2.10 },
  { min: 100.01, max: 140.00, employee: 0.85, employer: 2.95 },
  { min: 140.01, max: 200.00, employee: 1.20, employer: 4.20 },
  { min: 200.01, max: 300.00, employee: 1.85, employer: 6.45 },
  { min: 300.01, max: 400.00, employee: 2.45, employer: 8.55 },
  { min: 400.01, max: 500.00, employee: 3.05, employer: 10.65 },
  { min: 500.01, max: 600.00, employee: 3.65, employer: 12.75 },
  { min: 600.01, max: 700.00, employee: 4.25, employer: 14.85 },
  { min: 700.01, max: 800.00, employee: 4.85, employer: 16.95 },
  { min: 800.01, max: 900.00, employee: 5.45, employer: 19.05 },
  { min: 900.01, max: 1000.00, employee: 6.05, employer: 21.15 },
  { min: 1000.01, max: 1100.00, employee: 6.65, employer: 23.25 },
  { min: 1100.01, max: 1200.00, employee: 7.25, employer: 25.35 },
  { min: 1200.01, max: 1300.00, employee: 7.85, employer: 27.45 },
  { min: 1300.01, max: 1400.00, employee: 8.45, employer: 29.55 },
  { min: 1400.01, max: 1500.00, employee: 9.05, employer: 31.65 },
  { min: 1500.01, max: 1600.00, employee: 9.65, employer: 33.75 },
  { min: 1600.01, max: 1700.00, employee: 10.25, employer: 35.85 },
  { min: 1700.01, max: 1800.00, employee: 10.85, employer: 37.95 },
  { min: 1800.01, max: 1900.00, employee: 11.45, employer: 40.05 },
  { min: 1900.01, max: 2000.00, employee: 12.05, employer: 42.15 },
  { min: 2000.01, max: 2100.00, employee: 12.65, employer: 44.25 },
  { min: 2100.01, max: 2200.00, employee: 13.25, employer: 46.35 },
  { min: 2200.01, max: 2300.00, employee: 13.85, employer: 48.45 },
  { min: 2300.01, max: 2400.00, employee: 14.45, employer: 50.55 },
  { min: 2400.01, max: 2500.00, employee: 15.05, employer: 52.65 },
  { min: 2500.01, max: 2600.00, employee: 15.65, employer: 54.75 },
  { min: 2600.01, max: 2700.00, employee: 16.25, employer: 56.85 },
  { min: 2700.01, max: 2800.00, employee: 16.85, employer: 58.95 },
  { min: 2800.01, max: 2900.00, employee: 17.45, employer: 61.05 },
  { min: 2900.01, max: 3000.00, employee: 14.75, employer: 51.65 }, // Contoh user: RM 3000.00
  { min: 3000.01, max: 3100.00, employee: 15.25, employer: 53.35 },
  { min: 3100.01, max: 3200.00, employee: 15.75, employer: 55.05 },
  { min: 3200.01, max: 3300.00, employee: 16.25, employer: 56.75 },
  { min: 3300.01, max: 3400.00, employee: 16.75, employer: 58.45 },
  { min: 3400.01, max: 3500.00, employee: 17.25, employer: 60.15 },
  { min: 3500.01, max: 3600.00, employee: 17.75, employer: 61.85 },
  { min: 3600.01, max: 3700.00, employee: 18.25, employer: 63.55 },
  { min: 3700.01, max: 3800.00, employee: 18.75, employer: 65.25 },
  { min: 3800.01, max: 3900.00, employee: 19.25, employer: 66.95 },
  { min: 3900.01, max: 4000.00, employee: 19.75, employer: 68.65 },
  { min: 4000.01, max: 4100.00, employee: 20.25, employer: 70.35 },
  { min: 4100.01, max: 4200.00, employee: 20.75, employer: 72.05 },
  { min: 4200.01, max: 4300.00, employee: 21.25, employer: 73.75 },
  { min: 4300.01, max: 4400.00, employee: 21.75, employer: 75.45 },
  { min: 4400.01, max: 4500.00, employee: 22.25, employer: 77.15 },
  { min: 4500.01, max: 4600.00, employee: 22.75, employer: 78.85 },
  { min: 4600.01, max: 4700.00, employee: 23.25, employer: 80.55 },
  { min: 4700.01, max: 4800.00, employee: 23.75, employer: 82.25 },
  { min: 4800.01, max: 4900.00, employee: 24.25, employer: 83.95 },
  { min: 4900.01, max: 5000.00, employee: 24.75, employer: 85.65 },
  { min: 5000.01, max: 5950.00, employee: 25.25, employer: 87.35 }
];

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

  // Wage base (cap)
  const wageBase = Math.min(Number(input.reportedWage || 0), CEILING);

  let employee = 0;
  let employer = 0;

  if (categoryFinal === 1) {
    // Cari dalam jadual SOCSO Category 1
    const tableEntry = SOCSO_TABLE_CAT1.find(entry => 
      wageBase >= entry.min && wageBase <= entry.max
    );
    
    if (tableEntry) {
      employee = tableEntry.employee;
      employer = tableEntry.employer;
    }
  } else {
    // Category 2 - hanya majikan bayar, pekerja tidak
    // Gunakan kadar 1.25% untuk majikan
    const rawEmployer = wageBase * 0.0125;
    employer = roundToNearest5Cents(rawEmployer);
    employee = 0;
  }

  return { wageBase, employer, employee, category: categoryFinal };
};

// Legacy function for backward compatibility
const calcSocsoLegacy = (basicSalary: number): { employee: number; employer: number } => {
  const result = calcSocso({ reportedWage: basicSalary, category: 1 });
  return { employee: result.employee, employer: result.employer };
};

// Jadual EIS rasmi mengikut PERKESO - Employment Insurance System
const EIS_TABLE = [
  { min: 30.01, max: 50.00, employee: 0.10, employer: 0.10 },
  { min: 50.01, max: 70.00, employee: 0.14, employer: 0.14 },
  { min: 70.01, max: 100.00, employee: 0.20, employer: 0.20 },
  { min: 100.01, max: 140.00, employee: 0.28, employer: 0.28 },
  { min: 140.01, max: 200.00, employee: 0.40, employer: 0.40 },
  { min: 200.01, max: 300.00, employee: 0.60, employer: 0.60 },
  { min: 300.01, max: 400.00, employee: 0.80, employer: 0.80 },
  { min: 400.01, max: 500.00, employee: 1.00, employer: 1.00 },
  { min: 500.01, max: 600.00, employee: 1.20, employer: 1.20 },
  { min: 600.01, max: 700.00, employee: 1.40, employer: 1.40 },
  { min: 700.01, max: 800.00, employee: 1.60, employer: 1.60 },
  { min: 800.01, max: 900.00, employee: 1.80, employer: 1.80 },
  { min: 900.01, max: 1000.00, employee: 2.00, employer: 2.00 },
  { min: 1000.01, max: 1100.00, employee: 2.20, employer: 2.20 },
  { min: 1100.01, max: 1200.00, employee: 2.40, employer: 2.40 },
  { min: 1200.01, max: 1300.00, employee: 2.60, employer: 2.60 },
  { min: 1300.01, max: 1400.00, employee: 2.80, employer: 2.80 },
  { min: 1400.01, max: 1500.00, employee: 3.00, employer: 3.00 },
  { min: 1500.01, max: 1600.00, employee: 3.20, employer: 3.20 },
  { min: 1600.01, max: 1700.00, employee: 3.40, employer: 3.40 },
  { min: 1700.01, max: 1800.00, employee: 3.60, employer: 3.60 },
  { min: 1800.01, max: 1900.00, employee: 3.80, employer: 3.80 },
  { min: 1900.01, max: 2000.00, employee: 4.00, employer: 4.00 },
  { min: 2000.01, max: 2100.00, employee: 4.20, employer: 4.20 },
  { min: 2100.01, max: 2200.00, employee: 4.40, employer: 4.40 },
  { min: 2200.01, max: 2300.00, employee: 4.60, employer: 4.60 },
  { min: 2300.01, max: 2400.00, employee: 4.80, employer: 4.80 },
  { min: 2400.01, max: 4000.00, employee: 4.80, employer: 4.80 } // Cap at RM 4.80
];

// EIS calculation mengikut spesifikasi terkini
type EisInput = {
  reportedWage: number;
  age?: number;
  isMalaysianPR?: boolean;
  eisEligible?: boolean;
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
  const CEILING = 4000.00; // EIS maximum wage ceiling
  
  // Check eligibility first
  const age = typeof input.age === 'number' ? input.age : undefined;
  const isMalaysianPR = input.isMalaysianPR !== false; // Default true
  const eisEligible = input.eisEligible !== false; // Default true if not specified
  
  let eligible = eisEligible && isMalaysianPR;
  
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
  
  // If wage is below minimum threshold
  if (wageBase < 30.01) {
    return { wageBase, employee: 0, employer: 0, eligible: false };
  }

  // Find from EIS table
  const tableEntry = EIS_TABLE.find(entry => 
    wageBase >= entry.min && wageBase <= entry.max
  );
  
  let employee = 0;
  let employer = 0;
  
  if (tableEntry) {
    employee = tableEntry.employee;
    employer = tableEntry.employer;
  }

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
  const [showUnpaidLeaveModal, setShowUnpaidLeaveModal] = useState(false);
  const [pcb39Mode, setPCB39Mode] = useState<"custom" | "calculate">("custom");
  const [pcb39CustomAmount, setPCB39CustomAmount] = useState("0.00");
  const [showPCB39Info, setShowPCB39Info] = useState(false);
  const [showReliefSelector, setShowReliefSelector] = useState(false);
  const [selectedReliefCode, setSelectedReliefCode] = useState("");
  const [reliefAmount, setReliefAmount] = useState("0.00");
  const [pcb39ReliefItems, setPcb39ReliefItems] = useState<Array<{code: string; label: string; amount: string}>>([]);
  
  // Rebate states
  const [showRebateSelector, setShowRebateSelector] = useState(false);
  const [selectedRebateCode, setSelectedRebateCode] = useState("");
  const [rebateAmount, setRebateAmount] = useState("0.00");
  const [pcb39RebateItems, setPcb39RebateItems] = useState<Array<{code: string; label: string; amount: string}>>([]);

  // Function to add relief item
  const handleAddReliefItem = () => {
    if (selectedReliefCode && reliefAmount) {
      const selectedRelief = PCB39_RELIEFS_2025.find(relief => relief.code === selectedReliefCode);
      if (selectedRelief) {
        setPcb39ReliefItems(prev => [...prev, {
          code: selectedReliefCode,
          label: selectedRelief.label,
          amount: reliefAmount
        }]);
        // Reset form
        setSelectedReliefCode("");
        setReliefAmount("0.00");
        setShowReliefSelector(false);
      }
    }
  };

  // Function to add rebate item
  const handleAddRebateItem = () => {
    if (selectedRebateCode && rebateAmount) {
      const selectedRebate = PCB39_REBATES_2025.find(rebate => rebate.code === selectedRebateCode);
      if (selectedRebate) {
        setPcb39RebateItems(prev => [...prev, {
          code: selectedRebateCode,
          label: selectedRebate.label,
          amount: rebateAmount
        }]);
        // Reset form
        setSelectedRebateCode("");
        setRebateAmount("0.00");
        setShowRebateSelector(false);
      }
    }
  };

  // PCB39 Rebate options - only 2 options as per MySyarikat reference
  const PCB39_REBATES_2025 = [
    { code: "ZAKAT", label: "Zakat" },
    { code: "DEPARTURE_LEVY", label: "Departure levy for umrah travel / religious travel for other religions" }
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
      },
      { 
        code: "OVERTIME", 
        label: "Overtime", 
        amount: 0,
        flags: { epf: true, socso: true, eis: true, hrdf: false, pcb39: true, fixed: false }
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
  
  // BIK/VOLA info dialog state
  const [isBikInfoDialogOpen, setIsBikInfoDialogOpen] = useState(false);

  // Tax exemption state
  const [taxExemptions, setTaxExemptions] = useState({
    travellingAllowance: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    childCareAllowance: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    gift: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    phoneAllowance: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    reward: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    parkingAllowance: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    mealAllowance: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    },
    subsidies: { 
      amount: 0, 
      flags: { epf: false, socso: false, eis: false, hrdf: false, pcb39: false, fixed: false }
    }
  });

  // State to track which tax exemption settings are expanded
  const [expandedTaxExemptionSettings, setExpandedTaxExemptionSettings] = useState<Set<string>>(new Set());

  // YTD State Management
  const [ytdValues, setYtdValues] = useState({
    employee: {
      epf: 0,
      socso: 0,
      eis: 0,
      pcb: 0
    },
    employer: {
      epf: 0,
      socso: 0,
      eis: 0,
      pcb: 0
    }
  });

  const [ytdEditModes, setYtdEditModes] = useState({
    employee: {
      epf: false,
      socso: false,
      eis: false,
      pcb: false
    },
    employer: {
      epf: false,
      socso: false,
      eis: false,
      pcb: false
    }
  });

  const [ytdRemarks, setYtdRemarks] = useState({
    employee: {
      epf: '',
      socso: '',
      eis: '',
      pcb: ''
    },
    employer: {
      epf: '',
      socso: '',
      eis: '',
      pcb: ''
    }
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
        taxExemptions: (existingSalaryData.taxExemptions && Array.isArray(existingSalaryData.taxExemptions)) ? 
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

  // Fetch overtime amount for current month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const { data: overtimeData, isLoading: isLoadingOvertime, error: overtimeError } = useQuery({
    queryKey: ["/api/employees", employeeId, "overtime-amount", currentYear, currentMonth],
    queryFn: async () => {
      console.log(`Fetching overtime for employee: ${employeeId}, year: ${currentYear}, month: ${currentMonth}`);
      const response = await fetch(`/api/employees/${employeeId}/overtime-amount?year=${currentYear}&month=${currentMonth}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        console.error(`Overtime API error: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch overtime amount');
      }
      const result = await response.json();
      console.log(`Overtime API response:`, result);
      return result;
    },
    enabled: !!employeeId,
    refetchInterval: 5000, // More frequent updates for debugging
    staleTime: 0 // Always consider data stale to get fresh calculations
  });

  // Update overtime amount when data is fetched
  useEffect(() => {
    console.log(`Overtime data update:`, { overtimeData, isLoadingOvertime, overtimeError });
    if (overtimeData?.overtimeAmount !== undefined) {
      console.log(`Setting overtime amount to: ${overtimeData.overtimeAmount}`);
      
      // Ensure OVERTIME item exists before updating
      setSalaryData(prevData => {
        const hasOvertimeItem = prevData.additionalItems.some(item => item.code === "OVERTIME");
        
        if (!hasOvertimeItem) {
          console.log("OVERTIME item not found, adding it to additionalItems");
          const newAdditionalItems = [
            ...prevData.additionalItems,
            { 
              code: "OVERTIME", 
              label: "Overtime", 
              amount: overtimeData.overtimeAmount,
              flags: { epf: true, socso: true, eis: true, hrdf: false, pcb39: true, fixed: false }
            }
          ];
          return { ...prevData, additionalItems: newAdditionalItems };
        } else {
          // Update existing OVERTIME item
          const updatedItems = prevData.additionalItems.map(item => 
            item.code === "OVERTIME" ? { ...item, amount: overtimeData.overtimeAmount } : item
          );
          return { ...prevData, additionalItems: updatedItems };
        }
      });
    } else if (overtimeError) {
      console.error(`Overtime fetch error:`, overtimeError);
    }
  }, [overtimeData, overtimeError]);

  // Refresh overtime calculation when any overtime claim is approved
  const refreshOvertimeCalculation = () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/employees", employeeId, "overtime-amount"]
    });
  };

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

      // 🔥 UtamaHR Comprehensive Checkbox Logic Implementation 🔥
      //
      // ADDITIONAL ITEMS Logic:
      // ✅ EPF Checkbox ticked → Include in EPF calculation base
      // ✅ SOCSO Checkbox ticked → Include in SOCSO calculation base  
      // ✅ EIS Checkbox ticked → Include in EIS calculation base
      // ✅ HRDF Checkbox ticked → Include in HRDF calculation base
      // ✅ PCB39 Checkbox ticked → Include in PCB39 taxable income calculation
      // ✅ Fixed Checkbox ticked → Amount remains fixed monthly (automatic)
      //
      // DEDUCTION ITEMS Logic:
      // ✅ Advance RM300 with SOCSO ✅ → RM300 adds to SOCSO wage base
      // ✅ Advance RM300 with EPF ❌ → RM300 NOT added to EPF wage base  
      // ✅ PCB38 RM200 with PCB39 ✅ → PCB38 reduces taxable income (LHDN CP38 relief)
      // ✅ Zakat RM100 with PCB39 ✅ → Zakat reduces taxable income (religious relief)
      //
      // CALCULATION EXAMPLE:
      // Basic RM3000 + Bonus RM500 (PCB39 ✅) + Advance RM300 (SOCSO ✅) + PCB38 RM200 (PCB39 ✅) = 
      // EPF Base = RM3000 (Basic only, no items with EPF ✅)
      // SOCSO Base = RM3000 + RM300 = RM3300 (Basic + Advance SOCSO ✅)
      // PCB39 Taxable = RM3000 + RM500 - RM200 = RM3300 (Basic + Bonus PCB39 ✅ - PCB38 relief)
      // Gross Salary = RM3000 + RM500 + RM300 = RM3800 (ALL additional items, excluding deductions)
      
      // Only include basic salary in statutory calculations if "Calculate in Payment" is enabled
      const basicSalaryMonthly = salaryData.settings?.isCalculatedInPayment 
        ? getMonthlyEquivalent(salaryData.basicSalary) 
        : 0;
      
      // Calculate wage bases including both Additional Items and Deduction Items based on flags
      const epfWageBase = basicSalaryMonthly + 
        salaryData.additionalItems
          .filter(item => item.flags.epf)
          .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0) +
        // Include deduction items flagged for EPF (advance, unpaid leave, etc.)
        (salaryData.deductions.flags?.advance?.epf ? salaryData.deductions.advance : 0) +
        (salaryData.deductions.flags?.unpaidLeave?.epf ? salaryData.deductions.unpaidLeave : 0) +
        (salaryData.deductions.flags?.pcb38?.epf ? salaryData.deductions.pcb38 : 0) +
        (salaryData.deductions.flags?.zakat?.epf ? salaryData.deductions.zakat : 0) +
        (salaryData.deductions.flags?.other?.epf ? salaryData.deductions.other : 0) +
        // Include custom deduction items flagged for EPF
        (salaryData.deductions.customItems || [])
          .filter(item => item.flags?.epf)
          .reduce((sum, item) => sum + item.amount, 0);
      
      const socsoWageBase = basicSalaryMonthly + 
        salaryData.additionalItems
          .filter(item => item.flags.socso)
          .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0) +
        // Include deduction items flagged for SOCSO
        (salaryData.deductions.flags?.advance?.socso ? salaryData.deductions.advance : 0) +
        (salaryData.deductions.flags?.unpaidLeave?.socso ? salaryData.deductions.unpaidLeave : 0) +
        (salaryData.deductions.flags?.pcb38?.socso ? salaryData.deductions.pcb38 : 0) +
        (salaryData.deductions.flags?.zakat?.socso ? salaryData.deductions.zakat : 0) +
        (salaryData.deductions.flags?.other?.socso ? salaryData.deductions.other : 0) +
        // Include custom deduction items flagged for SOCSO
        (salaryData.deductions.customItems || [])
          .filter(item => item.flags?.socso)
          .reduce((sum, item) => sum + item.amount, 0);
      
      const eisWageBase = basicSalaryMonthly + 
        salaryData.additionalItems
          .filter(item => item.flags.eis)
          .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0) +
        // Include deduction items flagged for EIS
        (salaryData.deductions.flags?.advance?.eis ? salaryData.deductions.advance : 0) +
        (salaryData.deductions.flags?.unpaidLeave?.eis ? salaryData.deductions.unpaidLeave : 0) +
        (salaryData.deductions.flags?.pcb38?.eis ? salaryData.deductions.pcb38 : 0) +
        (salaryData.deductions.flags?.zakat?.eis ? salaryData.deductions.zakat : 0) +
        (salaryData.deductions.flags?.other?.eis ? salaryData.deductions.other : 0) +
        // Include custom deduction items flagged for EIS
        (salaryData.deductions.customItems || [])
          .filter(item => item.flags?.eis)
          .reduce((sum, item) => sum + item.amount, 0);
      
      const hrdfWageBase = basicSalaryMonthly + 
        salaryData.additionalItems
          .filter(item => item.flags.hrdf)
          .reduce((sum, item) => sum + getMonthlyEquivalent(item.amount), 0) +
        // Include deduction items flagged for HRDF
        (salaryData.deductions.flags?.advance?.hrdf ? salaryData.deductions.advance : 0) +
        (salaryData.deductions.flags?.unpaidLeave?.hrdf ? salaryData.deductions.unpaidLeave : 0) +
        (salaryData.deductions.flags?.pcb38?.hrdf ? salaryData.deductions.pcb38 : 0) +
        (salaryData.deductions.flags?.zakat?.hrdf ? salaryData.deductions.zakat : 0) +
        (salaryData.deductions.flags?.other?.hrdf ? salaryData.deductions.other : 0) +
        // Include custom deduction items flagged for HRDF
        (salaryData.deductions.customItems || [])
          .filter(item => item.flags?.hrdf)
          .reduce((sum, item) => sum + item.amount, 0);

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
      const hrdf = roundToCent(hrdfWageBase * (salaryData.settings.hrdfEmployerRate || 1.00) / 100);

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
          const newSalaryData = {
            ...prev,
            deductions: updatedDeductions,
            contributions: updatedContributions
          };
          
          // Auto-calculate YTD when salary data changes
          setTimeout(() => {
            autoCalculateYtdValues();
          }, 100);
          
          return newSalaryData;
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
      const method = existingSalaryData?.employeeId ? "PUT" : "POST";
      const response = await apiRequest(method, `/api/employees/${selectedEmployeeId}/salary`, data);
      return await response.json();
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

  // Calculate net salary - consider "Calculate in Payment" toggle
  const calculateNetSalary = () => {
    // Basic salary only counted if "Calculate in Payment" is enabled
    const basicSalaryInPayment = salaryData.settings?.isCalculatedInPayment ? salaryData.basicSalary : 0;
    const additionalItemsTotal = salaryData.additionalItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const grossSalary = basicSalaryInPayment + additionalItemsTotal;
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

  // YTD Helper Functions
  const toggleYtdEditMode = (category: 'employee' | 'employer', field: 'epf' | 'socso' | 'eis' | 'pcb') => {
    setYtdEditModes(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const updateYtdValue = (category: 'employee' | 'employer', field: 'epf' | 'socso' | 'eis' | 'pcb', value: number) => {
    setYtdValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Auto-calculate YTD values based on current month contributions
  const autoCalculateYtdValues = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const remarkText = `YTD bulan ${currentMonth} telah dimasukkan`;

    // Get current month's contribution values
    const currentMonthEmployee = {
      epf: salaryData.deductions.epfEmployee || 0,
      socso: salaryData.deductions.socsoEmployee || 0,
      eis: salaryData.deductions.eisEmployee || 0,
      pcb: salaryData.deductions.pcb39 || 0
    };

    const currentMonthEmployer = {
      epf: salaryData.contributions.epfEmployer || 0,
      socso: salaryData.contributions.socsoEmployer || 0,
      eis: salaryData.contributions.eisEmployer || 0,
      pcb: 0 // No PCB for employer
    };

    // Auto-calculate YTD: Previous YTD + Current Month
    setYtdValues(prev => ({
      employee: {
        epf: prev.employee.epf + currentMonthEmployee.epf,
        socso: prev.employee.socso + currentMonthEmployee.socso,
        eis: prev.employee.eis + currentMonthEmployee.eis,
        pcb: prev.employee.pcb + currentMonthEmployee.pcb
      },
      employer: {
        epf: prev.employer.epf + currentMonthEmployer.epf,
        socso: prev.employer.socso + currentMonthEmployer.socso,
        eis: prev.employer.eis + currentMonthEmployer.eis,
        pcb: 0 // No PCB for employer
      }
    }));

    // Auto-generate remarks for all fields that have values
    const newRemarks = {
      employee: {
        epf: currentMonthEmployee.epf > 0 ? remarkText : '',
        socso: currentMonthEmployee.socso > 0 ? remarkText : '',
        eis: currentMonthEmployee.eis > 0 ? remarkText : '',
        pcb: currentMonthEmployee.pcb > 0 ? remarkText : ''
      },
      employer: {
        epf: currentMonthEmployer.epf > 0 ? remarkText : '',
        socso: currentMonthEmployer.socso > 0 ? remarkText : '',
        eis: currentMonthEmployer.eis > 0 ? remarkText : '',
        pcb: '' // No PCB for employer
      }
    };

    setYtdRemarks(newRemarks);

    // Show toast notification
    toast({
      title: "YTD Auto-Calculated",
      description: `YTD untuk bulan ${currentMonth} telah dikira secara automatik`,
    });
  };

  const saveYtdValue = (category: 'employee' | 'employer', field: 'epf' | 'socso' | 'eis' | 'pcb') => {
    // Generate remark showing which month's YTD data was entered
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Get month number (1-12)
    const currentYear = currentDate.getFullYear();
    const remarkText = `YTD bulan ${currentMonth} telah dimasukkan`;
    
    console.log('Saving YTD value:', category, field, remarkText);
    
    setYtdRemarks(prev => {
      const newRemarks = {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: remarkText
        }
      };
      console.log('Updated YTD remarks:', newRemarks);
      return newRemarks;
    });

    // Close edit mode
    setYtdEditModes(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: false
      }
    }));

    // Show success toast
    toast({
      title: "YTD Dikemas Kini",
      description: `Nilai YTD ${field.toUpperCase()} ${category} telah disimpan untuk bulan ${currentMonth}`,
    });
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
    console.log(`updateAdditionalItemAmount called with code: ${itemCode}, amount: ${amount}`);
    console.log(`Current additionalItems:`, salaryData.additionalItems);
    
    const updatedItems = salaryData.additionalItems.map(item => {
      if (item.code === itemCode) {
        console.log(`Found matching item: ${item.code}, updating amount from ${item.amount} to ${amount}`);
        return { ...item, amount };
      }
      return item;
    });
    
    console.log(`Updated additionalItems:`, updatedItems);
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
  const [reliefCode, setReliefCode] = useState("");
  const [rebateCode, setRebateCode] = useState("");
  const reliefOptions = PCB39_RELIEFS_2025;
  const rebateOptions = PCB39_REBATES_2025;

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
  // Handle tax exemption updates using local state
  const updateTaxExemption = (exemptionKey: string, field: string, value: number) => {
    setTaxExemptions(prev => ({
      ...prev,
      [exemptionKey]: {
        ...(prev as any)[exemptionKey],
        [field]: value
      }
    }));
  };

  // Handle tax exemption flag updates using local state
  const updateTaxExemptionFlag = (exemptionKey: string, flag: string, value: boolean) => {
    setTaxExemptions(prev => ({
      ...prev,
      [exemptionKey]: {
        ...(prev as any)[exemptionKey],
        flags: {
          ...(prev as any)[exemptionKey]?.flags,
          [flag]: value
        }
      }
    }));
  };

  // Toggle tax exemption settings
  const toggleTaxExemptionSetting = (exemptionKey: string) => {
    setExpandedTaxExemptionSettings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exemptionKey)) {
        newSet.delete(exemptionKey);
      } else {
        newSet.add(exemptionKey);
      }
      return newSet;
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

                {/* HRDF Settings */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-medium text-gray-700">HRDF Setting</Label>
                  
                  {/* HRDF Employer Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm">Employer Rate</Label>
                    <div className="flex">
                      <Input
                        type="number"
                        step="0.01"
                        value={salaryData.settings.hrdfEmployerRate || 1.00}
                        onChange={(e) => updateSalaryData({ 
                          settings: { ...salaryData.settings, hrdfEmployerRate: parseFloat(e.target.value) || 1.00 }
                        })}
                        className="rounded-r-none"
                        data-testid="hrdf-employer-rate"
                      />
                      <div className="bg-gray-200 px-3 py-2 rounded-r-md border border-l-0 flex items-center">
                        <span className="text-sm font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Remarks */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-medium text-gray-700">Other Remarks</Label>
                  <Textarea
                    placeholder="Other Remarks"
                    value={salaryData.settings.otherRemarks || ""}
                    onChange={(e) => updateSalaryData({ 
                      settings: { ...salaryData.settings, otherRemarks: e.target.value }
                    })}
                    className="min-h-[100px] resize-none"
                    data-testid="other-remarks"
                  />
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
                      onClick={() => setIsBikInfoDialogOpen(true)}
                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
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

                {/* Overtime */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">Overtime</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatutoryFlags("OVERTIME")}
                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                      data-testid="overtime-settings-toggle"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {isLoadingOvertime && (
                      <span className="text-xs text-gray-500">Calculating...</span>
                    )}
                  </div>
                  <div className="flex">
                    <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                      <span className="text-sm font-medium">RM</span>
                    </div>
                    <Input
                      type="text"
                      value={(salaryData.additionalItems.find(item => item.code === "OVERTIME")?.amount || 0).toFixed(2)}
                      className="rounded-l-none bg-gray-100"
                      readOnly
                      data-testid="overtime"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Auto-calculated based on approved overtime hours × hourly rate × overtime multiplier for {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </p>
                  
                  {/* Show statutory flags when toggled */}
                  {showStatutoryFlags["OVERTIME"] && (
                    <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "OVERTIME")?.flags?.epf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("OVERTIME", "epf", !!checked)}
                          data-testid="overtime-epf"
                        />
                        <Label className="text-sm">EPF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "OVERTIME")?.flags?.socso || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("OVERTIME", "socso", !!checked)}
                          data-testid="overtime-socso"
                        />
                        <Label className="text-sm">SOCSO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "OVERTIME")?.flags?.eis || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("OVERTIME", "eis", !!checked)}
                          data-testid="overtime-eis"
                        />
                        <Label className="text-sm">EIS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "OVERTIME")?.flags?.hrdf || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("OVERTIME", "hrdf", !!checked)}
                          data-testid="overtime-hrdf"
                        />
                        <Label className="text-sm">HRDF</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "OVERTIME")?.flags?.pcb39 || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("OVERTIME", "pcb39", !!checked)}
                          data-testid="overtime-pcb39"
                        />
                        <Label className="text-sm">PCB39</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={salaryData.additionalItems.find(item => item.code === "OVERTIME")?.flags?.fixed || false}
                          onCheckedChange={(checked) => updateAdditionalItemFlag("OVERTIME", "fixed", !!checked)}
                          data-testid="overtime-fixed"
                        />
                        <Label className="text-sm">Fixed</Label>
                      </div>
                    </div>
                  )}
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
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Advance</Label>
                    <button
                      type="button"
                      onClick={() => toggleDeductionFlags('advance')}
                      className="hover:bg-gray-100 p-1 rounded"
                      data-testid="advance-settings-btn"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
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
                  {/* Flags for Advance - Only show when expanded */}
                  {expandedDeductionFlags.has('advance') && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'epf', !!checked)}
                          data-testid="advance-epf-flag"
                        />
                        <label className="text-xs">EPF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'socso', !!checked)}
                          data-testid="advance-socso-flag"
                        />
                        <label className="text-xs">SOCSO</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'eis', !!checked)}
                          data-testid="advance-eis-flag"
                        />
                        <label className="text-xs">EIS</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'hrdf', !!checked)}
                          data-testid="advance-hrdf-flag"
                        />
                        <label className="text-xs">HRDF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'pcb39', !!checked)}
                          data-testid="advance-pcb39-flag"
                        />
                        <label className="text-xs">PCB39</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.advance?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('advance', 'fixed', !!checked)}
                          data-testid="advance-fixed-flag"
                        />
                        <label className="text-xs">Fixed</label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unpaid Leave (auto calculated) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Unpaid Leave</Label>
                    <button
                      type="button"
                      onClick={() => setShowUnpaidLeaveModal(true)}
                      className="hover:bg-gray-100 p-1 rounded"
                      data-testid="unpaid-leave-settings-btn"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
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
                    How did we calculate this? Based on relief configuration and taxable income from PCB39-flagged items.
                  </p>
                </div>

                {/* PCB38 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">PCB38</Label>
                    <button
                      type="button"
                      onClick={() => toggleDeductionFlags('pcb38')}
                      className="hover:bg-gray-100 p-1 rounded"
                      data-testid="pcb38-settings-btn"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
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
                  <p className="text-xs text-gray-500">
                    Fixed deduction as per LHDN Notice CP38 for tax arrears settlement.
                  </p>
                  {/* Flags for PCB38 - Only show when expanded */}
                  {expandedDeductionFlags.has('pcb38') && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'epf', !!checked)}
                          data-testid="pcb38-epf-flag"
                        />
                        <label className="text-xs">EPF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'socso', !!checked)}
                          data-testid="pcb38-socso-flag"
                        />
                        <label className="text-xs">SOCSO</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'eis', !!checked)}
                          data-testid="pcb38-eis-flag"
                        />
                        <label className="text-xs">EIS</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'hrdf', !!checked)}
                          data-testid="pcb38-hrdf-flag"
                        />
                        <label className="text-xs">HRDF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'pcb39', !!checked)}
                          data-testid="pcb38-pcb39-flag"
                        />
                        <label className="text-xs">PCB39</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.pcb38?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('pcb38', 'fixed', !!checked)}
                          data-testid="pcb38-fixed-flag"
                        />
                        <label className="text-xs">Fixed</label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zakat */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Zakat</Label>
                    <button
                      type="button"
                      onClick={() => toggleDeductionFlags('zakat')}
                      className="hover:bg-gray-100 p-1 rounded"
                      data-testid="zakat-settings-btn"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
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
                  {/* Flags for Zakat - Only show when expanded */}
                  {expandedDeductionFlags.has('zakat') && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'epf', !!checked)}
                          data-testid="zakat-epf-flag"
                        />
                        <label className="text-xs">EPF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'socso', !!checked)}
                          data-testid="zakat-socso-flag"
                        />
                        <label className="text-xs">SOCSO</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'eis', !!checked)}
                          data-testid="zakat-eis-flag"
                        />
                        <label className="text-xs">EIS</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'hrdf', !!checked)}
                          data-testid="zakat-hrdf-flag"
                        />
                        <label className="text-xs">HRDF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'pcb39', !!checked)}
                          data-testid="zakat-pcb39-flag"
                        />
                        <label className="text-xs">PCB39</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.zakat?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('zakat', 'fixed', !!checked)}
                          data-testid="zakat-fixed-flag"
                        />
                        <label className="text-xs">Fixed</label>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Religious contribution - PCB39 checkbox reduces taxable income if ticked.
                  </p>
                </div>

                {/* Other Deduction */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Other Deduction</Label>
                    <button
                      type="button"
                      onClick={() => toggleDeductionFlags('other')}
                      className="hover:bg-gray-100 p-1 rounded"
                      data-testid="other-deduction-settings-btn"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
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
                  {/* Flags for Other Deduction - Only show when expanded */}
                  {expandedDeductionFlags.has('other') && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.epf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'epf', !!checked)}
                          data-testid="other-epf-flag"
                        />
                        <label className="text-xs">EPF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.socso || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'socso', !!checked)}
                          data-testid="other-socso-flag"
                        />
                        <label className="text-xs">SOCSO</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.eis || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'eis', !!checked)}
                          data-testid="other-eis-flag"
                        />
                        <label className="text-xs">EIS</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.hrdf || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'hrdf', !!checked)}
                          data-testid="other-hrdf-flag"
                        />
                        <label className="text-xs">HRDF</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.pcb39 || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'pcb39', !!checked)}
                          data-testid="other-pcb39-flag"
                        />
                        <label className="text-xs">PCB39</label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Checkbox
                          checked={salaryData.deductions.flags?.other?.fixed || false}
                          onCheckedChange={(checked) => updateDeductionFlag('other', 'fixed', !!checked)}
                          data-testid="other-fixed-flag"
                        />
                        <label className="text-xs">Fixed</label>
                      </div>
                    </div>
                  )}
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

            {/* YTD (Year-To-Date) Section */}
            <div className="grid grid-cols-1 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>YTD (Year-To-Date)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* YTD Employee Contribution */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">YTD EMPLOYEE CONTRIBUTION</h3>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={autoCalculateYtdValues}
                            className="bg-white text-blue-700 hover:bg-gray-100"
                            data-testid="btn-auto-calculate-ytd"
                          >
                            Auto Calculate YTD
                          </Button>
                        </div>
                      </div>
                      
                      {/* YTD EPF Employee */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD EPF</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employee.epf ? saveYtdValue('employee', 'epf') : toggleYtdEditMode('employee', 'epf')}
                            data-testid="btn-edit-ytd-epf-employee"
                          >
                            {ytdEditModes.employee.epf ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employee.epf}
                            onChange={(e) => updateYtdValue('employee', 'epf', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employee.epf}
                            data-testid="ytd-epf-employee"
                          />
                        </div>
                        {ytdRemarks.employee.epf && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employee.epf}</p>
                        )}
                      </div>

                      {/* YTD SOCSO Employee */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD SOCSO</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employee.socso ? saveYtdValue('employee', 'socso') : toggleYtdEditMode('employee', 'socso')}
                            data-testid="btn-edit-ytd-socso-employee"
                          >
                            {ytdEditModes.employee.socso ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employee.socso}
                            onChange={(e) => updateYtdValue('employee', 'socso', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employee.socso}
                            data-testid="ytd-socso-employee"
                          />
                        </div>
                        {ytdRemarks.employee.socso && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employee.socso}</p>
                        )}
                      </div>

                      {/* YTD EIS Employee */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD EIS</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employee.eis ? saveYtdValue('employee', 'eis') : toggleYtdEditMode('employee', 'eis')}
                            data-testid="btn-edit-ytd-eis-employee"
                          >
                            {ytdEditModes.employee.eis ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employee.eis}
                            onChange={(e) => updateYtdValue('employee', 'eis', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employee.eis}
                            data-testid="ytd-eis-employee"
                          />
                        </div>
                        {ytdRemarks.employee.eis && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employee.eis}</p>
                        )}
                      </div>

                      {/* YTD PCB/MTD Employee */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD PCB/MTD</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employee.pcb ? saveYtdValue('employee', 'pcb') : toggleYtdEditMode('employee', 'pcb')}
                            data-testid="btn-edit-ytd-pcb-employee"
                          >
                            {ytdEditModes.employee.pcb ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employee.pcb}
                            onChange={(e) => updateYtdValue('employee', 'pcb', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employee.pcb}
                            data-testid="ytd-pcb-employee"
                          />
                        </div>
                        {ytdRemarks.employee.pcb && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employee.pcb}</p>
                        )}
                      </div>
                    </div>

                    {/* YTD Employer Contribution */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg">
                        <h3 className="text-lg font-semibold">YTD EMPLOYER CONTRIBUTION</h3>
                      </div>
                      
                      {/* YTD EPF Employer */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD EPF</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employer.epf ? saveYtdValue('employer', 'epf') : toggleYtdEditMode('employer', 'epf')}
                            data-testid="btn-edit-ytd-epf-employer"
                          >
                            {ytdEditModes.employer.epf ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employer.epf}
                            onChange={(e) => updateYtdValue('employer', 'epf', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employer.epf}
                            data-testid="ytd-epf-employer"
                          />
                        </div>
                        {ytdRemarks.employer.epf && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employer.epf}</p>
                        )}
                      </div>

                      {/* YTD SOCSO Employer */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD SOCSO</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employer.socso ? saveYtdValue('employer', 'socso') : toggleYtdEditMode('employer', 'socso')}
                            data-testid="btn-edit-ytd-socso-employer"
                          >
                            {ytdEditModes.employer.socso ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employer.socso}
                            onChange={(e) => updateYtdValue('employer', 'socso', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employer.socso}
                            data-testid="ytd-socso-employer"
                          />
                        </div>
                        {ytdRemarks.employer.socso && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employer.socso}</p>
                        )}
                      </div>

                      {/* YTD EIS Employer */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">YTD EIS</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ytdEditModes.employer.eis ? saveYtdValue('employer', 'eis') : toggleYtdEditMode('employer', 'eis')}
                            data-testid="btn-edit-ytd-eis-employer"
                          >
                            {ytdEditModes.employer.eis ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex">
                          <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                            <span className="text-sm font-medium">RM</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ytdValues.employer.eis}
                            onChange={(e) => updateYtdValue('employer', 'eis', parseFloat(e.target.value) || 0)}
                            className="rounded-l-none"
                            disabled={!ytdEditModes.employer.eis}
                            data-testid="ytd-eis-employer"
                          />
                        </div>
                        {ytdRemarks.employer.eis && (
                          <p className="text-xs text-gray-500">{ytdRemarks.employer.eis}</p>
                        )}
                      </div>



                      
                    </div>
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

      {/* Tax Exemption Modal */}
      <Dialog open={isTaxExemptionDialogOpen} onOpenChange={setIsTaxExemptionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item/Tax Exemption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Travelling Allowance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Travelling Allowance</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('travellingAllowance')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="travelling-allowance-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.travellingAllowance?.amount || 0}
                  onChange={(e) => updateTaxExemption('travellingAllowance', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="travelling-allowance-exemption"
                />
              </div>
              {/* Flags for Travelling Allowance - Only show when expanded */}
              {expandedTaxExemptionSettings.has('travellingAllowance') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.travellingAllowance?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('travellingAllowance', 'epf', !!checked)}
                      data-testid="travelling-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.travellingAllowance?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('travellingAllowance', 'socso', !!checked)}
                      data-testid="travelling-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.travellingAllowance?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('travellingAllowance', 'eis', !!checked)}
                      data-testid="travelling-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.travellingAllowance?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('travellingAllowance', 'hrdf', !!checked)}
                      data-testid="travelling-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.travellingAllowance?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('travellingAllowance', 'pcb39', !!checked)}
                      data-testid="travelling-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.travellingAllowance?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('travellingAllowance', 'fixed', !!checked)}
                      data-testid="travelling-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Child Care Allowance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Child Care Allowance</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('childCareAllowance')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="childcare-allowance-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.childCareAllowance?.amount || 0}
                  onChange={(e) => updateTaxExemption('childCareAllowance', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="childcare-allowance-exemption"
                />
              </div>
              {/* Flags for Child Care Allowance - Only show when expanded */}
              {expandedTaxExemptionSettings.has('childCareAllowance') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.childCareAllowance?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('childCareAllowance', 'epf', !!checked)}
                      data-testid="childcare-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.childCareAllowance?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('childCareAllowance', 'socso', !!checked)}
                      data-testid="childcare-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.childCareAllowance?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('childCareAllowance', 'eis', !!checked)}
                      data-testid="childcare-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.childCareAllowance?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('childCareAllowance', 'hrdf', !!checked)}
                      data-testid="childcare-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.childCareAllowance?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('childCareAllowance', 'pcb39', !!checked)}
                      data-testid="childcare-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.childCareAllowance?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('childCareAllowance', 'fixed', !!checked)}
                      data-testid="childcare-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Gift */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Gift</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('gift')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="gift-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.gift?.amount || 0}
                  onChange={(e) => updateTaxExemption('gift', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="gift-exemption"
                />
              </div>
              {/* Flags for Gift - Only show when expanded */}
              {expandedTaxExemptionSettings.has('gift') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.gift?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('gift', 'epf', !!checked)}
                      data-testid="gift-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.gift?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('gift', 'socso', !!checked)}
                      data-testid="gift-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.gift?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('gift', 'eis', !!checked)}
                      data-testid="gift-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.gift?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('gift', 'hrdf', !!checked)}
                      data-testid="gift-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.gift?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('gift', 'pcb39', !!checked)}
                      data-testid="gift-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.gift?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('gift', 'fixed', !!checked)}
                      data-testid="gift-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Phone Allowance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Phone Allowance</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('phoneAllowance')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="phone-allowance-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.phoneAllowance?.amount || 0}
                  onChange={(e) => updateTaxExemption('phoneAllowance', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="phone-allowance-exemption"
                />
              </div>
              {/* Flags for Phone Allowance - Only show when expanded */}
              {expandedTaxExemptionSettings.has('phoneAllowance') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.phoneAllowance?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('phoneAllowance', 'epf', !!checked)}
                      data-testid="phone-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.phoneAllowance?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('phoneAllowance', 'socso', !!checked)}
                      data-testid="phone-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.phoneAllowance?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('phoneAllowance', 'eis', !!checked)}
                      data-testid="phone-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.phoneAllowance?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('phoneAllowance', 'hrdf', !!checked)}
                      data-testid="phone-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.phoneAllowance?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('phoneAllowance', 'pcb39', !!checked)}
                      data-testid="phone-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.phoneAllowance?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('phoneAllowance', 'fixed', !!checked)}
                      data-testid="phone-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Reward */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Reward</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('reward')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="reward-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.reward?.amount || 0}
                  onChange={(e) => updateTaxExemption('reward', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="reward-exemption"
                />
              </div>
              {/* Flags for Reward - Only show when expanded */}
              {expandedTaxExemptionSettings.has('reward') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.reward?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('reward', 'epf', !!checked)}
                      data-testid="reward-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.reward?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('reward', 'socso', !!checked)}
                      data-testid="reward-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.reward?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('reward', 'eis', !!checked)}
                      data-testid="reward-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.reward?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('reward', 'hrdf', !!checked)}
                      data-testid="reward-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.reward?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('reward', 'pcb39', !!checked)}
                      data-testid="reward-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.reward?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('reward', 'fixed', !!checked)}
                      data-testid="reward-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Parking Allowance (with flags) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Parking Allowance</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('parkingAllowance')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="parking-allowance-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.parkingAllowance?.amount || 0}
                  onChange={(e) => updateTaxExemption('parkingAllowance', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="parking-allowance-exemption"
                />
              </div>
              {/* Flags for Parking Allowance - Only show when expanded */}
              {expandedTaxExemptionSettings.has('parkingAllowance') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.parkingAllowance?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('parkingAllowance', 'epf', !!checked)}
                      data-testid="parking-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.parkingAllowance?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('parkingAllowance', 'socso', !!checked)}
                      data-testid="parking-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.parkingAllowance?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('parkingAllowance', 'eis', !!checked)}
                      data-testid="parking-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.parkingAllowance?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('parkingAllowance', 'hrdf', !!checked)}
                      data-testid="parking-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.parkingAllowance?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('parkingAllowance', 'pcb39', !!checked)}
                      data-testid="parking-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.parkingAllowance?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('parkingAllowance', 'fixed', !!checked)}
                      data-testid="parking-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Meal Allowance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Meal Allowance</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('mealAllowance')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="meal-allowance-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.mealAllowance?.amount || 0}
                  onChange={(e) => updateTaxExemption('mealAllowance', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="meal-allowance-exemption"
                />
              </div>
              {/* Flags for Meal Allowance - Only show when expanded */}
              {expandedTaxExemptionSettings.has('mealAllowance') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.mealAllowance?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('mealAllowance', 'epf', !!checked)}
                      data-testid="meal-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.mealAllowance?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('mealAllowance', 'socso', !!checked)}
                      data-testid="meal-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.mealAllowance?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('mealAllowance', 'eis', !!checked)}
                      data-testid="meal-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.mealAllowance?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('mealAllowance', 'hrdf', !!checked)}
                      data-testid="meal-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.mealAllowance?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('mealAllowance', 'pcb39', !!checked)}
                      data-testid="meal-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.mealAllowance?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('mealAllowance', 'fixed', !!checked)}
                      data-testid="meal-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>

            {/* Subsidies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Subsidies</Label>
                <button
                  type="button"
                  onClick={() => toggleTaxExemptionSetting('subsidies')}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="subsidies-settings-btn"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium text-gray-600">RM</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={taxExemptions.subsidies?.amount || 0}
                  onChange={(e) => updateTaxExemption('subsidies', 'amount', parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  data-testid="subsidies-exemption"
                />
              </div>
              {/* Flags for Subsidies - Only show when expanded */}
              {expandedTaxExemptionSettings.has('subsidies') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.subsidies?.flags?.epf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('subsidies', 'epf', !!checked)}
                      data-testid="subsidies-epf-flag"
                    />
                    <label className="text-xs">EPF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.subsidies?.flags?.socso || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('subsidies', 'socso', !!checked)}
                      data-testid="subsidies-socso-flag"
                    />
                    <label className="text-xs">SOCSO</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.subsidies?.flags?.eis || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('subsidies', 'eis', !!checked)}
                      data-testid="subsidies-eis-flag"
                    />
                    <label className="text-xs">EIS</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.subsidies?.flags?.hrdf || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('subsidies', 'hrdf', !!checked)}
                      data-testid="subsidies-hrdf-flag"
                    />
                    <label className="text-xs">HRDF</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.subsidies?.flags?.pcb39 || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('subsidies', 'pcb39', !!checked)}
                      data-testid="subsidies-pcb39-flag"
                    />
                    <label className="text-xs">PCB39</label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      checked={taxExemptions.subsidies?.flags?.fixed || false}
                      onCheckedChange={(checked) => updateTaxExemptionFlag('subsidies', 'fixed', !!checked)}
                      data-testid="subsidies-fixed-flag"
                    />
                    <label className="text-xs">Fixed</label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive"
              onClick={() => setIsTaxExemptionDialogOpen(false)}
              data-testid="btn-close-tax-exemption"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpaid Leave Modal */}
      <Dialog open={showUnpaidLeaveModal} onOpenChange={setShowUnpaidLeaveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Unpaid Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Amount Display */}
            <div className="space-y-2">
              <div className="flex">
                <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                  <span className="text-sm font-medium">RM</span>
                </div>
                <Input
                  type="text"
                  value={salaryData.deductions.unpaidLeave.toFixed(2)}
                  className="rounded-l-none bg-gray-100"
                  readOnly
                  data-testid="unpaid-leave-modal-amount"
                />
              </div>
            </div>

            {/* Statutory Checkboxes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={salaryData.deductions.flags?.unpaidLeave?.epf || false}
                  onCheckedChange={(checked) => updateDeductionFlag('unpaidLeave', 'epf', !!checked)}
                  data-testid="unpaid-leave-modal-epf"
                />
                <Label className="text-sm">EPF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={salaryData.deductions.flags?.unpaidLeave?.socso || false}
                  onCheckedChange={(checked) => updateDeductionFlag('unpaidLeave', 'socso', !!checked)}
                  data-testid="unpaid-leave-modal-socso"
                />
                <Label className="text-sm">SOCSO</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={salaryData.deductions.flags?.unpaidLeave?.eis || false}
                  onCheckedChange={(checked) => updateDeductionFlag('unpaidLeave', 'eis', !!checked)}
                  data-testid="unpaid-leave-modal-eis"
                />
                <Label className="text-sm">EIS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={salaryData.deductions.flags?.unpaidLeave?.hrdf || false}
                  onCheckedChange={(checked) => updateDeductionFlag('unpaidLeave', 'hrdf', !!checked)}
                  data-testid="unpaid-leave-modal-hrdf"
                />
                <Label className="text-sm">HRDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={salaryData.deductions.flags?.unpaidLeave?.pcb39 || false}
                  onCheckedChange={(checked) => updateDeductionFlag('unpaidLeave', 'pcb39', !!checked)}
                  data-testid="unpaid-leave-modal-pcb39"
                />
                <Label className="text-sm">PCB39</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={salaryData.deductions.flags?.unpaidLeave?.fixed || false}
                  onCheckedChange={(checked) => updateDeductionFlag('unpaidLeave', 'fixed', !!checked)}
                  data-testid="unpaid-leave-modal-fixed"
                />
                <Label className="text-sm">Fixed</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive"
              onClick={() => setShowUnpaidLeaveModal(false)}
              className="w-full"
              data-testid="btn-close-unpaid-leave-modal"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PCB39 Modal */}
      <Dialog open={showPCB39Modal} onOpenChange={setShowPCB39Modal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">PCB39</DialogTitle>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPCB39Info(!showPCB39Info)}
                  className="hover:bg-gray-100 p-1 rounded"
                  data-testid="pcb39-info-toggle"
                >
                  {showPCB39Info ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
                <Select value={pcb39Mode} onValueChange={(value: "custom" | "calculate") => setPCB39Mode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="calculate">Calculate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>
          
          {/* Info Section - Collapsible */}
          {showPCB39Info && (
            <div className="p-3 bg-gray-50 rounded-lg border text-sm space-y-2">
              <div>
                <strong>Custom</strong>
                <p className="text-gray-600">enable user to set custom amount.</p>
              </div>
              <div>
                <strong>Calculate</strong>
                <p className="text-gray-600">amount will be calculated by system.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {pcb39Mode === "custom" ? (
              /* Amount Input for Custom Mode */
              <div className="space-y-2">
                <div className="flex">
                  <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                    <span className="text-sm font-medium">RM</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={pcb39CustomAmount}
                    onChange={(e) => setPCB39CustomAmount(e.target.value)}
                    className="rounded-l-none"
                    placeholder="0.00"
                    data-testid="pcb39-modal-amount"
                  />
                </div>
              </div>
            ) : (
              /* Relief and Rebate Tabs for Calculate Mode */
              <Tabs defaultValue="relief" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="relief">Relief</TabsTrigger>
                  <TabsTrigger value="rebate">Rebate</TabsTrigger>
                </TabsList>
                
                <TabsContent value="relief" className="space-y-3">
                  {/* Display existing relief items */}
                  {pcb39ReliefItems.length > 0 && (
                    <div className="space-y-2">
                      {pcb39ReliefItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.code}</p>
                            <p className="text-xs text-gray-600">{item.label}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">RM {item.amount}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPcb39ReliefItems(prev => prev.filter((_, i) => i !== index))}
                              data-testid={`btn-remove-relief-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showReliefSelector ? (
                    <div className="text-center py-4">
                      {pcb39ReliefItems.length === 0 && (
                        <p className="text-gray-500 text-sm mb-3">No relief items configured</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => setShowReliefSelector(true)}
                        data-testid="btn-add-pcb39-relief"
                      >
                        Add PCB39 Relief
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Relief</Label>
                        <Select value={selectedReliefCode} onValueChange={setSelectedReliefCode}>
                          <SelectTrigger data-testid="select-relief">
                            <SelectValue placeholder="Select Relief" />
                          </SelectTrigger>
                          <SelectContent>
                            {PCB39_RELIEFS_2025.map((relief) => (
                              <SelectItem key={relief.code} value={relief.code}>
                                {relief.code} - {relief.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedReliefCode && (
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <div className="flex">
                            <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                              <span className="text-sm font-medium">RM</span>
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              value={reliefAmount}
                              onChange={(e) => setReliefAmount(e.target.value)}
                              className="rounded-l-none"
                              placeholder="0.00"
                              data-testid="input-relief-amount"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!selectedReliefCode || !reliefAmount}
                          onClick={handleAddReliefItem}
                          data-testid="btn-add-pcb39-relief-confirm"
                        >
                          Add PCB39 Relief
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowReliefSelector(false);
                            setSelectedReliefCode("");
                            setReliefAmount("0.00");
                          }}
                          data-testid="btn-cancel-relief"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="rebate" className="space-y-3">
                  {/* Display existing rebate items */}
                  {pcb39RebateItems.length > 0 && (
                    <div className="space-y-2">
                      {pcb39RebateItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.code}</p>
                            <p className="text-xs text-gray-600">{item.label}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">RM {item.amount}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPcb39RebateItems(prev => prev.filter((_, i) => i !== index))}
                              data-testid={`btn-remove-rebate-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showRebateSelector ? (
                    <div className="text-center py-4">
                      {pcb39RebateItems.length === 0 && (
                        <p className="text-gray-500 text-sm mb-3">No rebate items configured</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => setShowRebateSelector(true)}
                        data-testid="btn-add-pcb39-rebate"
                      >
                        Add PCB39 Rebate
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Rebate</Label>
                        <Select value={selectedRebateCode} onValueChange={setSelectedRebateCode}>
                          <SelectTrigger data-testid="select-rebate">
                            <SelectValue placeholder="Select Rebate" />
                          </SelectTrigger>
                          <SelectContent>
                            {PCB39_REBATES_2025.map((rebate) => (
                              <SelectItem key={rebate.code} value={rebate.code}>
                                {rebate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedRebateCode && (
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <div className="flex">
                            <div className="bg-gray-200 px-3 py-2 rounded-l-md border border-r-0 flex items-center">
                              <span className="text-sm font-medium">RM</span>
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              value={rebateAmount}
                              onChange={(e) => setRebateAmount(e.target.value)}
                              className="rounded-l-none"
                              placeholder="0.00"
                              data-testid="input-rebate-amount"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!selectedRebateCode || !rebateAmount}
                          onClick={handleAddRebateItem}
                          data-testid="btn-add-pcb39-rebate-confirm"
                        >
                          Add PCB39 Rebate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowRebateSelector(false);
                            setSelectedRebateCode("");
                            setRebateAmount("0.00");
                          }}
                          data-testid="btn-cancel-rebate"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowPCB39Modal(false)}
              data-testid="btn-cancel-pcb39"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Handle save logic here
                setShowPCB39Modal(false);
              }}
              data-testid="btn-save-pcb39"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BIK/VOLA Info Dialog */}
      <Dialog open={isBikInfoDialogOpen} onOpenChange={setIsBikInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <span>BIK/VOLA Information</span>
            </DialogTitle>
            <DialogDescription>
              Information about BIK/VOLA exclusion from gross salary and payslip calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>BIK/VOLA will be excluded from total Gross amount calculation and Payslip</strong>
              </p>
              <div className="mt-3 text-xs text-gray-600 space-y-2">
                <p>• BIK stands for "Benefit-in-Kind"</p>
                <p>• VOLA stands for "Value of Living Accommodation"</p>
                <p>• These items are included in statutory calculations if checkboxes are ticked</p>
                <p>• However, they won't appear on the employee's payslip for privacy</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsBikInfoDialogOpen(false)}
              data-testid="btn-close-bik-info"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
