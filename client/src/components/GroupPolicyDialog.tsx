import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GroupPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveType: string;
}

interface GroupPolicySetting {
  id: string;
  leaveType: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const ROLE_OPTIONS = [
  "Manager",
  "Staff",
  "Executive", 
  "Senior Manager",
  "Director",
  "Admin",
  "HR",
  "Finance",
  "IT",
  "Marketing",
  "Sales",
  "Operations"
];

export function GroupPolicyDialog({ open, onOpenChange, leaveType }: GroupPolicyDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group policy settings for this leave type
  const { data: groupSettings = [], isLoading } = useQuery<GroupPolicySetting[]>({
    queryKey: ['/api/group-policy-settings', leaveType],
    enabled: open && !!leaveType,
  });

  // Create group policy setting mutation
  const createMutation = useMutation({
    mutationFn: async (data: { leaveType: string; role: string }) => {
      return apiRequest('/api/group-policy-settings', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-policy-settings'] });
      setSelectedRole("");
      toast({
        title: "Berjaya",
        description: "Group policy settings have been added",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal menambah tetapan dasar kumpulan",
        variant: "destructive",
      });
    },
  });

  // Delete group policy setting mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ leaveType, role }: { leaveType: string; role: string }) => {
      return apiRequest(`/api/group-policy-settings/${encodeURIComponent(leaveType)}/${encodeURIComponent(role)}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-policy-settings'] });
      toast({
        title: "Berjaya",
        description: "Tetapan dasar kumpulan telah dipadamkan",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal memadamkan tetapan dasar kumpulan",
        variant: "destructive",
      });
    },
  });

  const handleAddRole = () => {
    if (!selectedRole) {
      toast({
        title: "Ralat",
        description: "Sila pilih peranan",
        variant: "destructive",
      });
      return;
    }

    // Check if role already exists
    const existingRole = groupSettings.find((setting) => setting.role === selectedRole);
    if (existingRole) {
      toast({
        title: "Ralat",
        description: "Peranan ini already ditambah",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ leaveType, role: selectedRole });
  };

  const handleDeleteRole = (role: string) => {
    deleteMutation.mutate({ leaveType, role });
  };

  // Get available roles (exclude already added roles)
  const availableRoles = ROLE_OPTIONS.filter(role => 
    !groupSettings.find((setting) => setting.role === role)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 bg-clip-text text-transparent">
            Tetapan Dasar Kumpulan - {leaveType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new role section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <Label htmlFor="role-select" className="text-sm font-medium">
                  Tambah Peranan Baharu
                </Label>
                <div className="flex gap-3">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pilih peranan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddRole}
                    disabled={!selectedRole || createMutation.isPending}
                    className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current roles section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Peranan Yang Dibenarkan</Label>
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Memuatkan...</div>
            ) : groupSettings.length > 0 ? (
              <div className="space-y-2">
                {groupSettings.map((setting) => (
                  <Card key={setting.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{setting.role}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(setting.role)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Tiada peranan yang dibenarkan bagi this leave type.
                  <br />
                  Tambah peranan untuk mengehadkan akses.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info section */}
          <Card className="bg-blue-50 border-slate-200">
            <CardContent className="p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Maklumat:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>If no role is set, all employees can use this leave type.</li>
                  <li>If role is set, only employees with permitted roles can use this leave type.</li>
                  <li>This setting will affect the display of leave policy in employee information.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}