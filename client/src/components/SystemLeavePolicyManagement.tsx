import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GroupPolicyDialog } from "./GroupPolicyDialog";

interface SystemLeavePolicy {
  id: string;
  leaveType: string;
  defaultEntitlement: number | null;
  isEnabled: boolean;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const LEAVE_TYPE_OPTIONS = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Maternity Leave", 
  "Paternity Leave",
  "Compassionate Leave",
  "Medical Leave",
  "Study Leave",
  "Unpaid Leave",
  "Marriage Leave",
  "Hospitalization Leave",
  "MC (Medical Certificate)",
  "Sick (Spouse, Child, Parent)"
];

export function SystemLeavePolicyManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGroupPolicyOpen, setIsGroupPolicyOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [editingPolicy, setEditingPolicy] = useState<SystemLeavePolicy | null>(null);
  const [formData, setFormData] = useState({
    leaveType: "",
    defaultEntitlement: "",
    isEnabled: true,
    remarks: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system leave policies
  const { data: systemPolicies = [], isLoading } = useQuery<SystemLeavePolicy[]>({
    queryKey: ["/api/system-leave-policies"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/system-leave-policies", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-leave-policies"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Berjaya",
        description: "Polisi cuti sistem telah dicipta",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mencipta polisi cuti sistem",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/system-leave-policies/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-leave-policies"] });
      setIsEditDialogOpen(false);
      setEditingPolicy(null);
      resetForm();
      toast({
        title: "Berjaya",
        description: "Polisi cuti sistem telah dikemaskini",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini polisi cuti sistem",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/system-leave-policies/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-leave-policies"] });
      toast({
        title: "Berjaya",
        description: "Polisi cuti sistem telah dipadamkan",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal memadamkan polisi cuti sistem",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      leaveType: "",
      defaultEntitlement: "",
      isEnabled: true,
      remarks: "",
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leaveType) {
      toast({
        title: "Ralat",
        description: "Jenis cuti diperlukan",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      leaveType: formData.leaveType,
      defaultEntitlement: formData.defaultEntitlement ? parseInt(formData.defaultEntitlement) : null,
      isEnabled: formData.isEnabled,
      remarks: formData.remarks || null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    updateMutation.mutate({
      id: editingPolicy.id,
      data: {
        leaveType: formData.leaveType,
        defaultEntitlement: formData.defaultEntitlement ? parseInt(formData.defaultEntitlement) : null,
        isEnabled: formData.isEnabled,
        remarks: formData.remarks || null,
      },
    });
  };

  const handleEdit = (policy: SystemLeavePolicy) => {
    setEditingPolicy(policy);
    setFormData({
      leaveType: policy.leaveType,
      defaultEntitlement: policy.defaultEntitlement?.toString() || "",
      isEnabled: policy.isEnabled,
      remarks: policy.remarks || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Adakah anda pasti ingin memadamkan polisi cuti ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleGroupPolicy = (leaveType: string) => {
    setSelectedLeaveType(leaveType);
    setIsGroupPolicyOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white">
          <CardTitle>Pengurusan Polisi Cuti Sistem</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white">
          <div className="flex items-center justify-between">
            <CardTitle>Pengurusan Polisi Cuti Sistem</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-white text-[#07A3B2] hover:bg-gray-100"
                  size="sm"
                  data-testid="button-add-system-leave-policy"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Polisi Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Polisi Cuti Sistem</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="leaveType">Jenis Cuti</Label>
                    <Select value={formData.leaveType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis cuti..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAVE_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="defaultEntitlement">Kelayakan Lalai (hari)</Label>
                    <Input
                      id="defaultEntitlement"
                      type="number"
                      value={formData.defaultEntitlement}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultEntitlement: e.target.value }))}
                      placeholder="Masukkan bilangan hari..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="remarks">Catatan</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Masukkan catatan..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isEnabled"
                      checked={formData.isEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                    />
                    <Label htmlFor="isEnabled">Aktif</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {systemPolicies.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Tiada polisi cuti sistem. Tambah polisi baru untuk memulakan.
              </div>
            ) : (
              systemPolicies.map((policy) => (
                <Card key={policy.id} className="border-l-4 border-l-[#07A3B2]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{policy.leaveType}</h3>
                        <p className="text-sm text-gray-600">
                          Kelayakan Lalai: {policy.defaultEntitlement ? `${policy.defaultEntitlement} hari` : "Tidak ditetapkan"}
                        </p>
                        {policy.remarks && (
                          <p className="text-sm text-gray-500">{policy.remarks}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            policy.isEnabled 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {policy.isEnabled ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGroupPolicy(policy.leaveType)}
                          className="text-purple-600 hover:text-purple-700"
                          data-testid={`button-group-policy-${policy.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(policy)}
                          className="text-blue-600 hover:text-blue-700"
                          data-testid={`button-edit-${policy.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-${policy.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Polisi Cuti Sistem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-leaveType">Jenis Cuti</Label>
              <Select value={formData.leaveType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis cuti..." />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-defaultEntitlement">Kelayakan Lalai (hari)</Label>
              <Input
                id="edit-defaultEntitlement"
                type="number"
                value={formData.defaultEntitlement}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultEntitlement: e.target.value }))}
                placeholder="Masukkan bilangan hari..."
              />
            </div>
            <div>
              <Label htmlFor="edit-remarks">Catatan</Label>
              <Textarea
                id="edit-remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Masukkan catatan..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
              />
              <Label htmlFor="edit-isEnabled">Aktif</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Policy Dialog */}
      <GroupPolicyDialog
        open={isGroupPolicyOpen}
        onOpenChange={setIsGroupPolicyOpen}
        leaveType={selectedLeaveType}
      />
    </>
  );
}