import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield, Palette, Globe, Building2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    companyRegistrationNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'Malaysia',
    phoneNumber: '',
    email: '',
    website: '',
    logo: ''
  });

  const queryClient = useQueryClient();

  // Fetch company settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['/api/company-settings'],
  });

  // Update company settings mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      if ((existingSettings as any)?.id) {
        return apiRequest(`/api/company-settings/${(existingSettings as any).id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/company-settings', {
          method: 'POST',  
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-settings'] });
      alert('Company settings saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving company settings:', error);
      alert('Failed to save company settings. Please try again.');
    }
  });

  const handleCompanySettingsChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCompanySettings = () => {
    updateCompanyMutation.mutate(companySettings);
  };

  // Update local state when settings are loaded
  React.useEffect(() => {
    if (existingSettings) {
      const settings = existingSettings as any;
      setCompanySettings({
        companyName: settings.companyName || '',
        companyRegistrationNumber: settings.companyRegistrationNumber || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        country: settings.country || 'Malaysia',
        phoneNumber: settings.phoneNumber || '',
        email: settings.email || '',
        website: settings.website || '',
        logo: settings.logo || ''
      });
    }
  }, [existingSettings]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-cyan-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-cyan-600" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>
                  Update your profile information and personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="Enter your first name" data-testid="input-first-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" placeholder="Enter your last name" data-testid="input-last-name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Enter your phone number" data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-save-profile">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="Enter username" data-testid="input-username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input id="employee-id" placeholder="Employee ID" disabled data-testid="input-employee-id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia-kuala-lumpur">Asia/Kuala Lumpur (GMT+8)</SelectItem>
                      <SelectItem value="asia-singapore">Asia/Singapore (GMT+8)</SelectItem>
                      <SelectItem value="asia-jakarta">Asia/Jakarta (GMT+7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-save-account">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                  <CardTitle>Company Information</CardTitle>
                </div>
                <CardDescription>
                  Configure your company details for payroll documents and official correspondence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name" 
                      placeholder="Enter company name" 
                      value={companySettings.companyName}
                      onChange={(e) => handleCompanySettingsChange('companyName', e.target.value)}
                      data-testid="input-company-name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration-number">Registration Number</Label>
                    <Input 
                      id="registration-number" 
                      placeholder="e.g., 202201033996(1479693-H)" 
                      value={companySettings.companyRegistrationNumber}
                      onChange={(e) => handleCompanySettingsChange('companyRegistrationNumber', e.target.value)}
                      data-testid="input-registration-number" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    placeholder="Enter company address" 
                    value={companySettings.address}
                    onChange={(e) => handleCompanySettingsChange('address', e.target.value)}
                    data-testid="input-address" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      placeholder="Enter city" 
                      value={companySettings.city}
                      onChange={(e) => handleCompanySettingsChange('city', e.target.value)}
                      data-testid="input-city" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      placeholder="Enter state" 
                      value={companySettings.state}
                      onChange={(e) => handleCompanySettingsChange('state', e.target.value)}
                      data-testid="input-state" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={companySettings.country} 
                      onValueChange={(value) => handleCompanySettingsChange('country', value)}
                    >
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Malaysia">Malaysia</SelectItem>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                        <SelectItem value="Indonesia">Indonesia</SelectItem>
                        <SelectItem value="Thailand">Thailand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="Enter phone number" 
                      value={companySettings.phoneNumber}
                      onChange={(e) => handleCompanySettingsChange('phoneNumber', e.target.value)}
                      data-testid="input-phone-company" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email Address</Label>
                    <Input 
                      id="company-email" 
                      type="email" 
                      placeholder="Enter company email" 
                      value={companySettings.email}
                      onChange={(e) => handleCompanySettingsChange('email', e.target.value)}
                      data-testid="input-company-email" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    placeholder="Enter website URL" 
                    value={companySettings.website}
                    onChange={(e) => handleCompanySettingsChange('website', e.target.value)}
                    data-testid="input-website" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Company Logo URL</Label>
                  <Input 
                    id="logo" 
                    placeholder="Enter logo image URL" 
                    value={companySettings.logo}
                    onChange={(e) => handleCompanySettingsChange('logo', e.target.value)}
                    data-testid="input-logo" 
                  />
                </div>
                <Button 
                  className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" 
                  onClick={handleSaveCompanySettings}
                  disabled={updateCompanyMutation.isPending}
                  data-testid="button-save-company"
                >
                  {updateCompanyMutation.isPending ? 'Saving...' : 'Save Company Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-cyan-600" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>
                  Choose how you want to be notified about updates and changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <Switch data-testid="switch-email-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Leave Approval Notifications</Label>
                    <p className="text-sm text-gray-600">Get notified when leave requests are approved/rejected</p>
                  </div>
                  <Switch data-testid="switch-leave-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Payroll Notifications</Label>
                    <p className="text-sm text-gray-600">Receive payroll processing updates</p>
                  </div>
                  <Switch data-testid="switch-payroll-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Announcement Notifications</Label>
                    <p className="text-sm text-gray-600">Get notified about company announcements</p>
                  </div>
                  <Switch data-testid="switch-announcement-notifications" />
                </div>
                <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-save-notifications">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-cyan-600" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" data-testid="input-current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" data-testid="input-new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" data-testid="input-confirm-password" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Switch data-testid="switch-2fa" />
                </div>
                <div className="flex space-x-2">
                  <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-change-password">
                    Change Password
                  </Button>
                  <Button variant="outline" data-testid="button-reset-security">
                    Reset Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-cyan-600" />
                  <CardTitle>Appearance Settings</CardTitle>
                </div>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select>
                    <SelectTrigger data-testid="select-theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select>
                    <SelectTrigger data-testid="select-date-format">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-save-appearance">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}