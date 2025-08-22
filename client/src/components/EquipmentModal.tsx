import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Equipment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const equipmentFormSchema = z.object({
  equipmentName: z.string().min(1, "Equipment name is required"),
  serialNumber: z.string().optional(),
  dateReceived: z.string().optional(),
  dateReturned: z.string().optional(),
  remarks: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  equipment?: Equipment | null;
}

export function EquipmentModal({
  isOpen,
  onClose,
  employeeId,
  equipment,
}: EquipmentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      equipmentName: "",
      serialNumber: "",
      dateReceived: "",
      dateReturned: "",
      remarks: "",
    },
  });

  // Reset form when modal opens/closes or equipment changes
  useEffect(() => {
    if (isOpen && equipment) {
      form.reset({
        equipmentName: equipment.equipmentName || "",
        serialNumber: equipment.serialNumber || "",
        dateReceived: equipment.dateReceived
          ? new Date(equipment.dateReceived).toISOString().split("T")[0]
          : "",
        dateReturned: equipment.dateReturned
          ? new Date(equipment.dateReturned).toISOString().split("T")[0]
          : "",
        remarks: equipment.remarks || "",
      });
    } else if (isOpen && !equipment) {
      form.reset({
        equipmentName: "",
        serialNumber: "",
        dateReceived: "",
        dateReturned: "",
        remarks: "",
      });
    }
    setSelectedFile(null);
  }, [isOpen, equipment, form]);

  // Create/Update equipment mutation
  const saveEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      const payload = {
        ...data,
        employeeId,
        dateReceived: data.dateReceived ? new Date(data.dateReceived) : null,
        dateReturned: data.dateReturned ? new Date(data.dateReturned) : null,
      };

      if (equipment) {
        return await apiRequest(`/api/equipment/${equipment.id}`, "PUT", payload);
      } else {
        return await apiRequest("/api/equipment", "POST", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", employeeId] });
      toast({
        title: "Berjaya",
        description: equipment
          ? "Equipment successfully dikemaskini"
          : "Equipment successfully ditambah",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving equipment:", error);
      toast({
        title: "Ralat",
        description: equipment
          ? "Gagal mengemaskini equipment"
          : "Gagal menambah equipment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormValues) => {
    saveEquipmentMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const formatDateForInput = (date: string | Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {equipment ? "Edit Equipment" : "Assign Equipment Form"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Equipment Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Equipment Information
              </h3>

              {/* Type (Equipment Name) */}
              <FormField
                control={form.control}
                name="equipmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Equipment Type"
                        {...field}
                        data-testid="input-equipment-type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Details (Serial Number) */}
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Equipment Details"
                        {...field}
                        data-testid="input-equipment-details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Received */}
              <FormField
                control={form.control}
                name="dateReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Received</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Date Received"
                        {...field}
                        data-testid="input-date-received"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Returned */}
              <FormField
                control={form.control}
                name="dateReturned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Returned</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Date Returned"
                        {...field}
                        data-testid="input-date-returned"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  File Upload
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="flex-1"
                    data-testid="input-file-upload"
                  />
                  <span className="text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional remarks..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-remarks"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-equipment"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                disabled={saveEquipmentMutation.isPending}
                data-testid="button-save-equipment"
              >
                {saveEquipmentMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}