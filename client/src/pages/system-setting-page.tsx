import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Building2,
  CalendarDays,
  DollarSign,
  Users,
  CreditCard,
  Bell,
  ClockIcon,
  BarChart3,
  Star,
  FileText,
  Upload,
  Plus,
  Link,
  Settings
} from "lucide-react";
import { useLocation, Link as RouterLink } from "wouter";
import { cn } from "@/lib/utils";

const settingsMenuItems = [
  {
    id: "company",
    label: "Company",
    icon: <Building2 className="w-4 h-4" />,
    href: "/system-setting/company",
  },
  {
    id: "leave",
    label: "Leave", 
    icon: <CalendarDays className="w-4 h-4" />,
    href: "/system-setting/leave",
  },
  {
    id: "claim",
    label: "Claim",
    icon: <DollarSign className="w-4 h-4" />,
    href: "/system-setting/claim",
  },
  {
    id: "department",
    label: "Department",
    icon: <Users className="w-4 h-4" />,
    href: "/system-setting/department",
  },
  {
    id: "payment",
    label: "Payment",
    icon: <CreditCard className="w-4 h-4" />,
    href: "/system-setting/payment",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-4 h-4" />,
    href: "/system-setting/notifications",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: <ClockIcon className="w-4 h-4" />,
    href: "/system-setting/attendance",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    icon: <BarChart3 className="w-4 h-4" />,
    href: "/system-setting/evaluation",
  },

  {
    id: "yearly-form",
    label: "Yearly Form",
    icon: <FileText className="w-4 h-4" />,
    href: "/system-setting/yearly-form",
  },
];

// Leave policies data
const leavePolicies = [
  { id: "annual", name: "Annual Leave", entitlement: "12 Day(s)", enabled: true },
  { id: "medical", name: "Medical Leave", entitlement: "90 Day(s)", enabled: true },
  { id: "compassionate-paternity", name: "Compassionate Leave - Paternity Leave", entitlement: "7 Day(s)", enabled: true },
  { id: "compassionate-maternity", name: "Compassionate Leave - Maternity Leave", entitlement: "98 Day(s)", enabled: true },
  { id: "compassionate-death", name: "Compassionate Leave - Death Of Family Member", entitlement: "3 Day(s)", enabled: true },
  { id: "sick-spouse", name: "Sick (Spouse, Child, Parent)", entitlement: "4 Day(s)", enabled: true },
  { id: "emergency", name: "Emergency Leave", entitlement: "5 Day(s)", enabled: true },
  { id: "unpaid", name: "Unpaid Leave", entitlement: "30 Day(s)", enabled: true },
  { id: "public-holiday", name: "Public Holiday", entitlement: "7 Day(s)", enabled: true },
  { id: "leave-in-lieu", name: "Leave in Lieu", entitlement: "14 Day(s)", enabled: true },
  { id: "exam", name: "Exam Leave", entitlement: "10 Day(s)", enabled: true },
  { id: "special-marriage", name: "Special Leave - Marriage Leave", entitlement: "3 Day(s)", enabled: true },
  { id: "special-umrah", name: "Special Leave - Umrah Leave", entitlement: "7 Day(s)", enabled: true },
  { id: "special-hajj", name: "Special Leave - Hajj Leave/ Others", entitlement: "30 Day(s)", enabled: true },
  { id: "carry-forward", name: "Carry Forward Leave", entitlement: "0 Day(s)", enabled: true },
  { id: "hospitalization", name: "Hospitalization Leave", entitlement: "60 Day(s)", enabled: true },
];

export default function SystemSettingPage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("leave");
  const [leaveApproval, setLeaveApproval] = useState({
    firstLevel: "",
    secondLevel: "",
  });
  const [timeoffApproval, setTimeoffApproval] = useState({
    firstLevel: "",
    secondLevel: "",
  });
  const [timeoffSettings, setTimeoffSettings] = useState({
    enableAttachment: true,
    applicationLimitHour: true,
    minHour: 0,
    maxHour: 4,
  });
  const [companyData, setCompanyData] = useState({
    companyName: "utama hr",
    companyShortName: "KLINIK UTAMA 24 JAM",
    companyRegNo: "KLINIK UTAMA 24 JAM",
    companyType: "",
    industry: "Automotive",
    companyEmail: "syedmuhyazir.admin@klinikutama24jam.com",
    companyPhone: "0199076434",
    companyFax: "Fax",
    streetAddress: "Lot 5138S-A, Lorong 1g Mohd Amin, Jln Wan Hassan, Kg Batu 4",
    state: "Selangor", 
    city: "Bandar Baru Bangi",
    postcode: "43650",
    country: "Malaysia",
    bankName: "",
    bankAccountNo: "Bank Account No",
    epfNo: "EPF No",
    socsoNo: "SOCSO No",
    incomeTaxNo: "Income Tax No",
    employerNo: "Employer No",
    lhdnBranch: "LHDN Branch",
    originatorId: "Originator ID",
    zakatNo: "Zakat No",
    cNumber: "C-Number"
  });

  const getCurrentSection = () => {
    if (location === "/system-setting" || location === "/system-setting/company") {
      return "company";
    }
    return location.split("/").pop() || "company";
  };

  const currentSection = getCurrentSection();

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdate = () => {
    console.log("Update company data:", companyData);
  };

  const handleSaveLeaveApproval = () => {
    console.log("Save leave approval:", leaveApproval);
  };

  const handleSaveTimeoffApproval = () => {
    console.log("Save timeoff approval:", timeoffApproval);
  };

  const handleSaveTimeoffSettings = () => {
    console.log("Save timeoff settings:", timeoffSettings);
  };

  const renderCompanyForm = () => (
    <div className="space-y-6">
      {/* Company Details Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Company Details</h3>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-6">
        {/* Company Logo */}
        <div className="flex items-center space-x-4">
          <div>
            <Label className="text-sm font-medium">Company Logo</Label>
            <div className="mt-2 w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-6">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
            <Input
              id="company-name"
              value={companyData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              data-testid="input-company-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-short-name" className="text-sm font-medium">Company Short Name</Label>
            <Input
              id="company-short-name"
              value={companyData.companyShortName}
              onChange={(e) => handleInputChange('companyShortName', e.target.value)}
              data-testid="input-company-short-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-reg-no" className="text-sm font-medium">Company Registration No</Label>
            <Input
              id="company-reg-no"
              value={companyData.companyRegNo}
              onChange={(e) => handleInputChange('companyRegNo', e.target.value)}
              data-testid="input-company-reg-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-type" className="text-sm font-medium">Company Type</Label>
            <Select value={companyData.companyType} onValueChange={(value) => handleInputChange('companyType', value)}>
              <SelectTrigger data-testid="select-company-type">
                <SelectValue placeholder="Select Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private-limited">Private Limited</SelectItem>
                <SelectItem value="public-limited">Public Limited</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
            <Select value={companyData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
              <SelectTrigger data-testid="select-industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-email" className="text-sm font-medium">Company Email</Label>
            <Input
              id="company-email"
              type="email"
              value={companyData.companyEmail}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              data-testid="input-company-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-phone" className="text-sm font-medium">Company Phone Number</Label>
            <Input
              id="company-phone"
              value={companyData.companyPhone}
              onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              data-testid="input-company-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-fax" className="text-sm font-medium">Company Fax</Label>
            <Input
              id="company-fax"
              value={companyData.companyFax}
              onChange={(e) => handleInputChange('companyFax', e.target.value)}
              placeholder="Fax"
              data-testid="input-company-fax"
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street-address" className="text-sm font-medium">Street Address</Label>
            <Textarea
              id="street-address"
              value={companyData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              rows={2}
              data-testid="textarea-street-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium">State</Label>
              <Select value={companyData.state} onValueChange={(value) => handleInputChange('state', value)}>
                <SelectTrigger data-testid="select-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selangor">Selangor</SelectItem>
                  <SelectItem value="kuala-lumpur">Kuala Lumpur</SelectItem>
                  <SelectItem value="johor">Johor</SelectItem>
                  <SelectItem value="penang">Penang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Select value={companyData.city} onValueChange={(value) => handleInputChange('city', value)}>
                <SelectTrigger data-testid="select-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bandar-baru-bangi">Bandar Baru Bangi</SelectItem>
                  <SelectItem value="kajang">Kajang</SelectItem>
                  <SelectItem value="putrajaya">Putrajaya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
              <Select value={companyData.postcode} onValueChange={(value) => handleInputChange('postcode', value)}>
                <SelectTrigger data-testid="select-postcode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="43650">43650</SelectItem>
                  <SelectItem value="43000">43000</SelectItem>
                  <SelectItem value="62000">62000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">Country</Label>
              <Select value={companyData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="malaysia">Malaysia</SelectItem>
                  <SelectItem value="singapore">Singapore</SelectItem>
                  <SelectItem value="indonesia">Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleUpdate}
            className="bg-blue-900 hover:bg-blue-800 text-white"
            data-testid="button-update-company"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Bank & Other Account Details */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Bank & Other Account Details</h3>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank-name" className="text-sm font-medium">Bank Name</Label>
            <Select value={companyData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
              <SelectTrigger data-testid="select-bank-name">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maybank">Maybank</SelectItem>
                <SelectItem value="cimb">CIMB Bank</SelectItem>
                <SelectItem value="public-bank">Public Bank</SelectItem>
                <SelectItem value="rhb">RHB Bank</SelectItem>
                <SelectItem value="hong-leong">Hong Leong Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-account-no" className="text-sm font-medium">Bank Account Number</Label>
            <Input
              id="bank-account-no"
              value={companyData.bankAccountNo}
              onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
              placeholder="Bank Account No"
              data-testid="input-bank-account-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epf-no" className="text-sm font-medium">EPF Account Number</Label>
            <Input
              id="epf-no"
              value={companyData.epfNo}
              onChange={(e) => handleInputChange('epfNo', e.target.value)}
              placeholder="EPF No"
              data-testid="input-epf-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socso-no" className="text-sm font-medium">SOCSO Account Number</Label>
            <Input
              id="socso-no"
              value={companyData.socsoNo}
              onChange={(e) => handleInputChange('socsoNo', e.target.value)}
              placeholder="SOCSO No"
              data-testid="input-socso-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-tax-no" className="text-sm font-medium">Income Tax No</Label>
            <Input
              id="income-tax-no"
              value={companyData.incomeTaxNo}
              onChange={(e) => handleInputChange('incomeTaxNo', e.target.value)}
              placeholder="Income Tax No"
              data-testid="input-income-tax-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer-no" className="text-sm font-medium">Employer No</Label>
            <Input
              id="employer-no"
              value={companyData.employerNo}
              onChange={(e) => handleInputChange('employerNo', e.target.value)}
              placeholder="Employer No"
              data-testid="input-employer-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lhdn-branch" className="text-sm font-medium">LHDN Branch</Label>
            <Input
              id="lhdn-branch"
              value={companyData.lhdnBranch}
              onChange={(e) => handleInputChange('lhdnBranch', e.target.value)}
              placeholder="LHDN Branch"
              data-testid="input-lhdn-branch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="originator-id" className="text-sm font-medium">Originator ID</Label>
            <Input
              id="originator-id"
              value={companyData.originatorId}
              onChange={(e) => handleInputChange('originatorId', e.target.value)}
              placeholder="Originator ID"
              data-testid="input-originator-id"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zakat-no" className="text-sm font-medium">Zakat Number</Label>
            <Input
              id="zakat-no"
              value={companyData.zakatNo}
              onChange={(e) => handleInputChange('zakatNo', e.target.value)}
              placeholder="Zakat No"
              data-testid="input-zakat-no"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-number" className="text-sm font-medium">C-Number</Label>
            <Input
              id="c-number"
              value={companyData.cNumber}
              onChange={(e) => handleInputChange('cNumber', e.target.value)}
              placeholder="C-Number"
              data-testid="input-c-number"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleUpdate}
            className="bg-blue-900 hover:bg-blue-800 text-white"
            data-testid="button-update-bank"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Company Subsidiary */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Company Subsidiary</h3>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex justify-end space-x-2">
          <Button 
            size="sm"
            className="bg-blue-900 hover:bg-blue-800 text-white"
            data-testid="button-add-new-subsidiary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="text-blue-900 border-blue-900"
            data-testid="button-link-existing-company"
          >
            <Link className="w-4 h-4 mr-2" />
            Link to Existing Company
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fax</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
          <span>Previous</span>
          <span>Next</span>
        </div>
      </div>
    </div>
  );

  const renderLeaveForm = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("leave")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "leave"
              ? "bg-cyan-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="tab-leave"
        >
          Leave
        </button>
        <button
          onClick={() => setActiveTab("timeoff")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "timeoff"
              ? "bg-cyan-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
          data-testid="tab-timeoff"
        >
          Timeoff
        </button>
      </div>

      {/* Leave Tab Content */}
      {activeTab === "leave" && (
        <>
          {/* Leave Approval */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Leave Approval</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={leaveApproval.firstLevel} 
                  onValueChange={(value) => setLeaveApproval(prev => ({...prev, firstLevel: value}))}
                >
                  <SelectTrigger data-testid="select-first-level-approval">
                    <SelectValue placeholder="Select first leave approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={leaveApproval.secondLevel} 
                  onValueChange={(value) => setLeaveApproval(prev => ({...prev, secondLevel: value}))}
                >
                  <SelectTrigger data-testid="select-second-level-approval">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  onClick={handleSaveLeaveApproval}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-save-leave-approval"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Leave Policy */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leave Policy</h3>
            <Button 
              variant="secondary"
              size="sm"
              className="bg-white text-cyan-600 hover:bg-gray-100"
              data-testid="button-create-leave-policy"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Leave Policy
            </Button>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="divide-y">
              {leavePolicies.map((policy) => (
                <div key={policy.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{policy.name}</h4>
                    <p className="text-sm text-gray-500">Entitlement {policy.entitlement}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-cyan-600 hover:text-cyan-700"
                      data-testid={`button-see-more-${policy.id}`}
                    >
                      See More
                    </Button>
                    <Switch 
                      checked={policy.enabled}
                      className="data-[state=checked]:bg-blue-900"
                      data-testid={`switch-${policy.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Timeoff Tab Content */}
      {activeTab === "timeoff" && (
        <>
          {/* Timeoff Approval */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Timeoff Approval</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">First Level Approval</Label>
                <Select 
                  value={timeoffApproval.firstLevel} 
                  onValueChange={(value) => setTimeoffApproval(prev => ({...prev, firstLevel: value}))}
                >
                  <SelectTrigger data-testid="select-timeoff-first-level-approval">
                    <SelectValue placeholder="Select first leave approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Second Level Approval</Label>
                <Select 
                  value={timeoffApproval.secondLevel} 
                  onValueChange={(value) => setTimeoffApproval(prev => ({...prev, secondLevel: value}))}
                >
                  <SelectTrigger data-testid="select-timeoff-second-level-approval">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button 
                  onClick={handleSaveTimeoffApproval}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-save-timeoff-approval"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Timeoff Settings */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Timeoff Setting</h3>
          </div>

          <div className="bg-white p-6 rounded-lg border space-y-6">
            {/* Enable Attachment */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Enable Attachment</h4>
                <p className="text-sm text-gray-500">Turn on and off attachment compulsory for timeoff application</p>
              </div>
              <Switch 
                checked={timeoffSettings.enableAttachment}
                onCheckedChange={(checked) => setTimeoffSettings(prev => ({...prev, enableAttachment: checked}))}
                className="data-[state=checked]:bg-blue-900"
                data-testid="switch-enable-attachment"
              />
            </div>

            {/* Application Limit Hour */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Application Limit Hour</h4>
                  <p className="text-sm text-gray-500">Set the minimum and maximum hour limit per application</p>
                </div>
                <Switch 
                  checked={timeoffSettings.applicationLimitHour}
                  onCheckedChange={(checked) => setTimeoffSettings(prev => ({...prev, applicationLimitHour: checked}))}
                  className="data-[state=checked]:bg-blue-900"
                  data-testid="switch-application-limit-hour"
                />
              </div>

              {timeoffSettings.applicationLimitHour && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Minimum Hour(s)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={timeoffSettings.minHour}
                        onChange={(e) => setTimeoffSettings(prev => ({...prev, minHour: parseInt(e.target.value) || 0}))}
                        className="flex-1"
                        data-testid="input-min-hour"
                      />
                      <span className="text-sm text-gray-500">Hour(s)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Maximum Hour(s)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={timeoffSettings.maxHour}
                        onChange={(e) => setTimeoffSettings(prev => ({...prev, maxHour: parseInt(e.target.value) || 0}))}
                        className="flex-1"
                        data-testid="input-max-hour"
                      />
                      <span className="text-sm text-gray-500">Hour(s)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveTimeoffSettings}
                className="bg-blue-900 hover:bg-blue-800 text-white"
                data-testid="button-save-timeoff-settings"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPlaceholderContent = (section: string) => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold capitalize">{section} Settings</h3>
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <p className="text-gray-500">Settings for {section} will be available here.</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex h-screen">
        {/* Left Sidebar Navigation */}
        <div className="w-80 bg-white border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-cyan-600" />
              <h1 className="text-xl font-bold text-gray-900">Manage Setting</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Home &gt; Setting</p>
          </div>

          {/* Navigation Menu */}
          <div className="p-2">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-3 rounded-t-lg">
              <h2 className="font-semibold">Setting</h2>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-b-lg">
              <nav className="py-2">
                {settingsMenuItems.map((item) => (
                  <RouterLink key={item.id} href={item.href}>
                    <button
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 text-left text-sm hover:bg-gray-100 transition-colors",
                        (currentSection === item.id || (currentSection === "company" && item.id === "company"))
                          ? "bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600"
                          : "text-gray-700"
                      )}
                      data-testid={`nav-setting-${item.id}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </RouterLink>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentSection === "company" ? renderCompanyForm() : 
             currentSection === "leave" ? renderLeaveForm() : 
             renderPlaceholderContent(currentSection)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}