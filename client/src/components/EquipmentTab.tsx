import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Upload } from "lucide-react";
import { Equipment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EquipmentModal } from "./EquipmentModal";

interface EquipmentTabProps {
  employeeId: string;
}

export function EquipmentTab({ employeeId }: EquipmentTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch equipment data
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", employeeId],
    enabled: !!employeeId,
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      await apiRequest(`/api/equipment/${equipmentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", employeeId] });
      toast({
        title: "Berjaya",
        description: "Equipment berjaya dipadamkan",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal memadamkan equipment",
        variant: "destructive",
      });
    },
  });

  // Filter equipment based on search
  const filteredEquipment = equipment.filter((item) =>
    item.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleDelete = (equipmentId: string) => {
    if (confirm("Adakah anda pasti ingin memadamkan equipment ini?")) {
      deleteEquipmentMutation.mutate(equipmentId);
    }
  };

  const handleAddNew = () => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
          <CardTitle>Equipment Information</CardTitle>
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
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>Equipment Information</CardTitle>
            <Button
              onClick={handleAddNew}
              className="bg-white text-teal-600 hover:bg-gray-100"
              size="sm"
              data-testid="button-add-equipment"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex justify-end mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-equipment"
              />
            </div>
          </div>

          {/* Equipment Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Received
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Returned
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        {searchTerm ? "No equipment found matching your search." : "No data available in table"}
                      </td>
                    </tr>
                  ) : (
                    filteredEquipment.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.equipmentName || "N/A"}
                            </div>
                            {item.serialNumber && (
                              <div className="text-sm text-gray-500">
                                S/N: {item.serialNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(item.dateReceived)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {item.dateReturned ? (
                            <Badge variant="secondary">
                              {formatDate(item.dateReturned)}
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              In Use
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-700"
                              data-testid={`button-edit-equipment-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-equipment-${item.id}`}
                              disabled={deleteEquipmentMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              data-testid={`button-upload-equipment-${item.id}`}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination placeholder */}
          {filteredEquipment.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div>
                Showing {filteredEquipment.length} of {equipment.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment Modal */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        employeeId={employeeId}
        equipment={editingEquipment}
      />
    </>
  );
}