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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const adjustmentFormSchema = z.object({
  adjustedEntitlement: z.number().min(0, "Entitlement must be positive"),
  adjustmentReason: z.string().min(1, "Reason is required"),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface IndividualLeaveAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  leavePolicy: {
    id: string;
    leaveType: string;
    entitlement: number;
    balance: number;
  } | null;
}

export function IndividualLeaveAdjustmentModal({
  isOpen,
  onClose,
  employeeId,
  leavePolicy,
}: IndividualLeaveAdjustmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      adjustedEntitlement: 0,
      adjustmentReason: "",
    },
  });

  // Reset form when modal opens/closes or leave policy changes
  useEffect(() => {
    if (isOpen && leavePolicy) {
      form.reset({
        adjustedEntitlement: leavePolicy.entitlement || 0,
        adjustmentReason: "",
      });
    } else if (isOpen) {
      form.reset({
        adjustedEntitlement: 0,
        adjustmentReason: "",
      });
    }
  }, [isOpen, leavePolicy, form]);

  // Create individual leave entitlement adjustment
  const createAdjustmentMutation = useMutation({
    mutationFn: async (data: AdjustmentFormValues) => {
      if (!leavePolicy) return;
      
      const payload = {
        employeeId,
        leaveType: leavePolicy.leaveType,
        originalEntitlement: leavePolicy.entitlement,
        adjustedEntitlement: data.adjustedEntitlement,
        adjustmentReason: data.adjustmentReason,
        effectiveDate: new Date(),
        status: 'active'
      };

      return await apiRequest("/api/leave-adjustments", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies", employeeId] });
      toast({
        title: "Berjaya",
        description: "Pelarasan cuti individu successfully disimpan",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error creating leave adjustment:", error);
      toast({
        title: "Ralat",
        description: "Gagal menyimpan pelarasan cuti individu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdjustmentFormValues) => {
    createAdjustmentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Pelarasan Leave Individu - {leavePolicy?.leaveType || "N/A"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Information Display */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900">
                Maklumat Semasa
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Jenis Leave:</span>
                  <div className="font-medium">{leavePolicy?.leaveType || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">Kelayakan Sistem:</span>
                  <div className="font-medium">{leavePolicy?.entitlement || 0} hari</div>
                </div>
              </div>
            </div>

            {/* Adjustment Form Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Pelarasan Leave Individu
              </h3>

              {/* Adjusted Entitlement */}
              <FormField
                control={form.control}
                name="adjustedEntitlement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kelayakan Baharu (hari)
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-adjusted-entitlement"
                        placeholder="Masukkan bilangan hari kelayakan baharu"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adjustment Reason */}
              <FormField
                control={form.control}
                name="adjustmentReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sebab Pelarasan
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-adjustment-reason"
                        placeholder="Contoh: Employee menyertai syarikat pada pertengahan tahun, tidak layak mendapat cuti tahunan penuh"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createAdjustmentMutation.isPending}
                data-testid="button-cancel"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createAdjustmentMutation.isPending}
                data-testid="button-save-adjustment"
              >
                {createAdjustmentMutation.isPending ? "Menyimpan..." : "Simpan Pelarasan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}