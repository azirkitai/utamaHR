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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeavePolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const leavePolicyFormSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  entitlement: z.number().min(0, "Entitlement must be positive").optional(),
  balance: z.number().min(0, "Balance must be positive").optional(),
  remarks: z.string().optional(),
  included: z.boolean().default(true),
});

type LeavePolicyFormValues = z.infer<typeof leavePolicyFormSchema>;

interface LeavePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  leavePolicy?: LeavePolicy | null;
}

const leaveTypeOptions = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Compassionate Leave",
  "Medical Leave",
  "Study Leave",
  "Unpaid Leave",
  "Other"
];

export function LeavePolicyModal({
  isOpen,
  onClose,
  employeeId,
  leavePolicy,
}: LeavePolicyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeavePolicyFormValues>({
    resolver: zodResolver(leavePolicyFormSchema),
    defaultValues: {
      leaveType: "",
      entitlement: 0,
      balance: 0,
      remarks: "",
      included: true,
    },
  });

  // Reset form when modal opens/closes or leave policy changes
  useEffect(() => {
    if (isOpen && leavePolicy) {
      form.reset({
        leaveType: leavePolicy.leaveType || "",
        entitlement: leavePolicy.entitlement || 0,
        balance: leavePolicy.balance || 0,
        remarks: leavePolicy.remarks || "",
        included: leavePolicy.included || false,
      });
    } else if (isOpen && !leavePolicy) {
      form.reset({
        leaveType: "",
        entitlement: 0,
        balance: 0,
        remarks: "",
        included: true,
      });
    }
  }, [isOpen, leavePolicy, form]);

  // Create/Update leave policy mutation
  const saveLeavePolicyMutation = useMutation({
    mutationFn: async (data: LeavePolicyFormValues) => {
      const payload = {
        ...data,
        employeeId,
      };

      if (leavePolicy) {
        return await apiRequest(`/api/leave-policies/${leavePolicy.id}`, "PUT", payload);
      } else {
        return await apiRequest("/api/leave-policies", "POST", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies", employeeId] });
      toast({
        title: "Berjaya",
        description: leavePolicy
          ? "Polisi cuti berjaya dikemaskini"
          : "Polisi cuti berjaya ditambah",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving leave policy:", error);
      toast({
        title: "Ralat",
        description: leavePolicy
          ? "Gagal mengemaskini polisi cuti"
          : "Gagal menambah polisi cuti",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeavePolicyFormValues) => {
    saveLeavePolicyMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {leavePolicy ? "Edit Leave Policy" : "Add Leave Policy"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Leave Policy Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Leave Policy Information
              </h3>

              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-leave-type">
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entitlement */}
              <FormField
                control={form.control}
                name="entitlement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entitlement (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter entitlement days"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-entitlement"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Balance */}
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter balance days"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-balance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {/* Included Toggle */}
              <FormField
                control={form.control}
                name="included"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Include this policy
                      </FormLabel>
                      <div className="text-sm text-gray-500">
                        Enable or disable this leave policy for the employee
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-included"
                      />
                    </FormControl>
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
                data-testid="button-cancel-leave-policy"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={saveLeavePolicyMutation.isPending}
                data-testid="button-save-leave-policy"
              >
                {saveLeavePolicyMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}