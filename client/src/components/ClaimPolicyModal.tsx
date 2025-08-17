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
import { ClaimPolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const claimPolicyFormSchema = z.object({
  claimType: z.string().min(1, "Claim type is required"),
  annualLimit: z.number().min(0, "Annual limit must be positive").optional(),
  balance: z.number().min(0, "Balance must be positive").optional(),
  remarks: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

type ClaimPolicyFormValues = z.infer<typeof claimPolicyFormSchema>;

interface ClaimPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  claimPolicy?: ClaimPolicy | null;
}

const claimTypeOptions = [
  "Flight Tix",
  "Parking",
  "Meal",
  "Hotel",
  "Mileage (KM)",
  "Medical",
  "Others/Misc",
  "Transportation",
  "Allowance",
  "Training",
  "Entertainment",
  "Communication"
];

export function ClaimPolicyModal({
  isOpen,
  onClose,
  employeeId,
  claimPolicy,
}: ClaimPolicyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClaimPolicyFormValues>({
    resolver: zodResolver(claimPolicyFormSchema),
    defaultValues: {
      claimType: "",
      annualLimit: 0,
      balance: 0,
      remarks: "",
      isEnabled: true,
    },
  });

  // Reset form when modal opens/closes or claim policy changes
  useEffect(() => {
    if (isOpen && claimPolicy) {
      form.reset({
        claimType: claimPolicy.claimType || "",
        annualLimit: claimPolicy.annualLimit ? Number(claimPolicy.annualLimit) : 0,
        balance: claimPolicy.balance ? Number(claimPolicy.balance) : 0,
        remarks: claimPolicy.remarks || "",
        isEnabled: claimPolicy.isEnabled || false,
      });
    } else if (isOpen && !claimPolicy) {
      form.reset({
        claimType: "",
        annualLimit: 0,
        balance: 0,
        remarks: "",
        isEnabled: true,
      });
    }
  }, [isOpen, claimPolicy, form]);

  // Create/Update claim policy mutation
  const saveClaimPolicyMutation = useMutation({
    mutationFn: async (data: ClaimPolicyFormValues) => {
      const payload = {
        ...data,
        employeeId,
      };

      if (claimPolicy) {
        return await apiRequest(`/api/claim-policies/${claimPolicy.id}`, "PUT", payload);
      } else {
        return await apiRequest("/api/claim-policies", "POST", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claim-policies", employeeId] });
      toast({
        title: "Berjaya",
        description: claimPolicy
          ? "Polisi claim berjaya dikemaskini"
          : "Polisi claim berjaya ditambah",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error saving claim policy:", error);
      toast({
        title: "Ralat",
        description: claimPolicy
          ? "Gagal mengemaskini polisi claim"
          : "Gagal menambah polisi claim",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClaimPolicyFormValues) => {
    saveClaimPolicyMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {claimPolicy ? "Edit Claim Policy" : "Add Claim Policy"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Claim Policy Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Claim Policy Information
              </h3>

              {/* Claim Type */}
              <FormField
                control={form.control}
                name="claimType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-claim-type">
                          <SelectValue placeholder="Select claim type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {claimTypeOptions.map((type) => (
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

              {/* Annual Limit */}
              <FormField
                control={form.control}
                name="annualLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Limit (RM)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter annual limit"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-annual-limit"
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
                    <FormLabel>Balance (RM)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter current balance"
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

              {/* Enabled Toggle */}
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable this policy
                      </FormLabel>
                      <div className="text-sm text-gray-500">
                        Enable or disable this claim policy for the employee
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enabled"
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
                data-testid="button-cancel-claim-policy"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700"
                disabled={saveClaimPolicyMutation.isPending}
                data-testid="button-save-claim-policy"
              >
                {saveClaimPolicyMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}