import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Link, UserPlus } from "lucide-react";
import { AIScanModal } from "./AIScanModal";

// API Fetchers
const fetchUnassignedPolicies = async () => {
    const res = await fetch('/api/onboarding/unassigned-policies');
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
};

const fetchCustomers = async () => {
    const res = await fetch('/api/onboarding/customers');
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
};

export function Onboarding() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);

  // Queries
  const { data: policies, isLoading: policiesLoading } = useQuery({ queryKey: ['unassignedPolicies'], queryFn: fetchUnassignedPolicies });
  const { data: customers, isLoading: customersLoading } = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

  // Mutations
  const policyUploadMutation = useMutation({
    mutationFn: (formData: FormData) => fetch('/api/onboarding/extract-policies', { method: 'POST', body: formData }).then(res => res.json()),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['unassignedPolicies'] });
      setFiles(null);
    },
    onError: (error) => toast.error("Upload Failed", { description: error.message }),
    onSettled: () => setIsUploading(false),
  });

  const assignPolicyMutation = useMutation({
    mutationFn: ({ policyId, customerId }: { policyId: string, customerId: string }) => fetch('/api/onboarding/assign-policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyId, customerId }),
    }).then(res => res.json()),
    onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['unassignedPolicies'] });
        queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (error) => toast.error("Assignment Failed", { description: error.message }),
    onSettled: () => {
        setIsAssigning(null);
        setSelectedCustomerId(null);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(e.target.files);
  };

  const handleUploadPolicies = () => {
    if (!files || files.length === 0) {
      toast.error("Please select at least one policy PDF to upload.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("policyDocuments", files[i]);
    }
    policyUploadMutation.mutate(formData);
  };
  
  const handleAssign = (policyId: string) => {
    if (!selectedCustomerId) {
        toast.error("Please select a customer to assign the policy to.");
        return;
    }
    setIsAssigning(policyId);
    assignPolicyMutation.mutate({ policyId, customerId: selectedCustomerId });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: AI Policy Extraction</CardTitle>
          <CardDescription>Upload one or more policy PDFs. Our AI will extract the details and list them below as "Unassigned Policies".</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input type="file" accept=".pdf" multiple onChange={handleFileChange} className="max-w-xs" />
          <Button onClick={handleUploadPolicies} disabled={!files || isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Extracting...' : `Upload ${files?.length || ''} Policies`}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Onboard or Select a Customer</CardTitle>
            <CardDescription>Add new customers using AI Scan or select an existing one from the list below.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={() => setIsAiScanOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Customer with AI Scan
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Assign Policies</CardTitle>
            <CardDescription>Select a customer, then assign an unassigned policy to them.</CardDescription>
          </CardHeader>
          <CardContent>
             <Select onValueChange={setSelectedCustomerId} disabled={customersLoading}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                    {customers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}
                </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unassigned Policies</CardTitle>
          <CardDescription>These policies have been extracted but are not yet linked to a customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policiesLoading && <p>Loading policies...</p>}
            {!policiesLoading && policies?.length === 0 && <p className="text-muted-foreground">No unassigned policies found. Upload some to get started!</p>}
            {policies?.map((policy: any) => (
              <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{policy.insurer} - {policy.type}</p>
                  <p className="text-sm text-muted-foreground">Policy #: {policy.policy_number} | Premium: ₹{policy.premium_amount?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleAssign(policy.id)} disabled={!selectedCustomerId || isAssigning === policy.id}>
                        <Link className="mr-2 h-4 w-4" />
                        {isAssigning === policy.id ? 'Assigning...' : 'Assign to Selected Customer'}
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <AIScanModal 
        open={isAiScanOpen} 
        onOpenChange={setIsAiScanOpen} 
        onFilled={() => queryClient.invalidateQueries({ queryKey: ['customers'] })} 
      />
    </div>
  );
}