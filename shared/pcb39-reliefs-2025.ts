export const PCB39_RELIEFS_2025 = [
  { code: "LP1",  label: "Medical treatment, special needs or carer expenses for parents", cap: 8000 },
  { code: "LP2",  label: "Basic supporting equipment", cap: 6000 },
  { code: "LP3A", label: "Higher education fees (Self) – A: Tertiary/Masters/Doctorate", cap: 7000 },
  { code: "LP3B", label: "Higher education fees (Self) – B: Skills/Professional (upskilling)", cap: 2000 },
  { code: "LP4A", label: "Medical expenses – A: Serious diseases (Self/Spouse/Child/Parent)", cap: 10000 },
  { code: "LP4B", label: "Medical expenses – B: Complete medical examination", cap: 1000 },
  { code: "LP4C", label: "Medical expenses – C: Vaccination medical expenses", cap: 1000 },
  { code: "LP5",  label: "Net deposit in Skim Simpanan Pendidikan Nasional (SSPN)", cap: 8000 },
  { code: "LP6",  label: "Payment of alimony to former wife", cap: null },               // ikut bukti sebenar
  { code: "LP7A", label: "Life insurance – A: Pensionable public servants", cap: 7000 }, // kombinasi life+EPF khas
  { code: "LP7B", label: "Life insurance – B: Others (life/takaful)", cap: 3000 },
  { code: "LP8",  label: "Private Retirement Scheme (PRS) & deferred annuity", cap: 3000 },
  { code: "LP9",  label: "Education & medical insurance (Self/Spouse/Child)", cap: 3000 },
  { code: "LP10", label: "Employee SOCSO/EPF (mandatory statutory, from payroll)", cap: 0 }, // auto dari payroll; paparan sahaja jika perlu
  { code: "LP11A",label: "Lifestyle – A: Books/sports/PC/smartphone/internet etc.", cap: 2500 },
  { code: "LP11B",label: "Lifestyle – B: Additional lifestyle (sports equipment/fees)", cap: 500 },
  { code: "LP11C",label: "Lifestyle – C: Purchase of electronic devices (additional)", cap: 2500 },
  { code: "LP12", label: "Breastfeeding equipment (child ≤ 2 years)", cap: 1000 },
  { code: "LP13", label: "Child care fees (taska/tabika)", cap: 3000 },
  { code: "LP14", label: "Domestic tourism expenditure", cap: 1000 },
  { code: "LP15", label: "Electric vehicle (EV) charging facilities expenditure", cap: 2500 },
  { code: "LP16", label: "Interest on housing loan (first home) – if applicable", cap: null }
];

export type PCBRelief = { 
  code: string; 
  label: string; 
  amount: number; 
  cap?: number | null; 
};