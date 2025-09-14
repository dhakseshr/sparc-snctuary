import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, WalletCards, CreditCard, ScanLine, Languages, AlertTriangle, Sparkles } from "lucide-react";
import { StatusPill, PolicyStatus } from "@/components/tm/StatusPill";
import { PaymentModal } from "@/components/tm/PaymentModal";
import { Chatbot } from "@/components/tm/Chatbot";
import { PolicyExplainer } from "@/components/tm/PolicyExplainer";
import { CashDeposit, DepositPolicy } from "@/components/tm/CashDeposit";
import { TurtlemintLogo } from "@/components/tm/TurtlemintLogo";
import { Onboarding } from "@/components/tm/Onboarding";
import { Engagement } from "@/components/tm/Engagement"; // Import the new component
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// Matches the shape from db.getAllPolicies
interface PolicyRow {
  id: string;
  customer: string;
  phone: string;
  type: string;
  insurer: string;
  status: PolicyStatus;
  dueDate: string; // ISO date string e.g. "2025-09-24" or "—"
  amount: number;
  coverage: number;
  lastContacted: string; // ISO datetime string
}

interface PolicyRecommendation {
  id: string;
  name: string;
  premium: number;
  coverage: number;
  type: string;
  pros: string[];
  cons: string[];
}

// API Fetchers
const fetchPolicies = async (): Promise<PolicyRow[]> => {
  const res = await fetch('/api/policies');
  if (!res.ok) throw new Error('Failed to fetch policies from the server.');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export default function Index() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ type: "All", insurer: "All", search: "" });
  const [payment, setPayment] = useState<{ open: boolean; policy?: PolicyRow }>({ open: false });
  const [tab, setTab] = useState("dashboard");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  const { data: policies = [], isLoading, error } = useQuery<PolicyRow[]>({
    queryKey: ['policies'],
    queryFn: fetchPolicies,
  });

  useEffect(() => {
    if (policies.length > 0 && !selectedPolicyId) {
      setSelectedPolicyId(policies[1]?.id ?? policies[0]?.id);
    }
  }, [policies, selectedPolicyId]);

  const updatePolicyStatusMutation = useMutation({
    mutationFn: (policyId: string) => fetch('/api/payments/confirm-cash', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId })
    }).then(res => res.json()),
    onSuccess: (data) => {
        if (data.status === 'success') {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        } else {
            throw new Error(data.message || 'Failed to update policy status');
        }
    },
    onError: (err) => toast.error("Update Failed", { description: (err as Error).message }),
  });

  const filtered = useMemo(() => {
    if (!policies) return [];
    return policies.filter((p) =>
      (filters.type === "All" || p.type === filters.type) &&
      (filters.insurer === "All" || p.insurer === filters.insurer) &&
      (filters.search === "" || p.customer?.toLowerCase().includes(filters.search.toLowerCase()) || p.id.toLowerCase().includes(filters.search.toLowerCase()))
    );
  }, [policies, filters]);

  const counts = useMemo(() => ({
    total: policies.length,
    renewalDue: policies.filter(p => p.status === "Renewal Due").length,
    lapsed: policies.filter(p => p.status === "Lapsed").length,
    // FIX: Handle cases where p.amount might be null or undefined
    totalPremium: policies.reduce((acc, p) => acc + (p.amount || 0), 0),
  }), [policies]);

  const nextBestAction = useMemo(() => {
    if (!policies || policies.length === 0) return null;
    const now = new Date();
    const urgentRenewals = policies
        .filter(p => p.status === 'Renewal Due' && p.dueDate !== '—' && differenceInDays(parseISO(p.dueDate), now) >= 0)
        .sort((a,b) => differenceInDays(parseISO(a.dueDate), now) - differenceInDays(parseISO(b.dueDate), now));

    if (urgentRenewals.length > 0) {
        const p = urgentRenewals[0];
        const days = differenceInDays(parseISO(p.dueDate), now);
        return { 
            title: `Renew Policy for ${p.customer}`, 
            description: `Policy #${p.id} is due in ${days} days!`, 
            policy: p 
        };
    }
    return null;
  }, [policies]);

  const candidates: PolicyRecommendation[] = useMemo(() => [
    { id: "RX1", name: "Health Plus", premium: 18000, coverage: 500000, type: "Health", pros: ["Cashless network", "Wellness benefits", "No claim bonus"], cons: ["Room rent cap", "Higher premium"] },
    { id: "RX2", name: "Secure Life", premium: 22000, coverage: 2500000, type: "Life", pros: ["High cover", "Tax benefits", "Rider options"], cons: ["Medical tests required", "No survival benefits"] },
    { id: "RX3", name: "Max Term", premium: 15000, coverage: 5000000, type: "Life", pros: ["Very high cover", "Low cost", "Critical illness rider"], cons: ["No maturity benefit", "Strict underwriting"] },
  ], []);
  
  const selectedPolicy = useMemo(() => {
    return policies.find(p => p.id === selectedPolicyId) ?? null;
  }, [policies, selectedPolicyId]);

  const recommendations = useMemo(() => {
    if (!selectedPolicy) return candidates;
    const matchingType = candidates.filter(c => c.type === selectedPolicy.type);
    const otherTypes = candidates.filter(c => c.type !== selectedPolicy.type);
    return [...matchingType, ...otherTypes];
  }, [selectedPolicy, candidates]);

  return (
    <div className="min-h-screen bg-secondary/30 text-foreground">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TurtlemintLogo className="h-9 w-9 text-primary" />
            <div className="text-xl font-semibold">Turtlemint B2B</div>
          </div>
          <div className="flex items-center gap-3">
            <Input className="w-[360px]" placeholder="Search customers, policy ID..." onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} voiceEnabled />
            <Button variant="secondary" className="gap-2" onClick={() => setTab("onboarding")}><ScanLine className="h-4 w-4" /> AI Scan</Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="explainer">Policy Explainer</TabsTrigger>
            <TabsTrigger value="deposit">Cash Deposit</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Policies</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{counts.total}</div></CardContent></Card>
              <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Renewal Due</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{counts.renewalDue}</div></CardContent></Card>
              <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lapsed Policies</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{counts.lapsed}</div></CardContent></Card>
              <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Premium</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{counts.totalPremium.toLocaleString()}</div></CardContent></Card>
            </div>
            
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-9">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Policy Overview</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader><TableRow><TableHead>Policy ID</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {isLoading && <TableRow><TableCell colSpan={7} className="text-center h-24">Loading policies...</TableCell></TableRow>}
                          {error && <TableRow><TableCell colSpan={7} className="text-center h-24 text-red-500">{(error as Error).message}</TableCell></TableRow>}
                          {filtered.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.id}</TableCell><TableCell>{p.customer}</TableCell><TableCell>{p.type}</TableCell>
                              <TableCell><StatusPill status={p.status} /></TableCell><TableCell>{p.dueDate === '—' ? '—' : new Date(p.dueDate).toLocaleDateString()}</TableCell>
                              {/* FIX: Handle cases where p.amount might be null */}
                              <TableCell className="text-right">₹{(p.amount || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right space-x-2">
                                {p.status !== "Active" && <Button size="sm" onClick={() => setPayment({ open: true, policy: p })}>Pay</Button>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-12 lg:col-span-3">
                <Card className="bg-emerald-50 border-emerald-200 h-full">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-emerald-600"/> Next Best Action</CardTitle></CardHeader>
                    <CardContent>
                        {nextBestAction ? (
                            <div className="space-y-2"><div className="font-semibold text-emerald-800">{nextBestAction.title}</div><p className="text-sm text-emerald-700">{nextBestAction.description}</p><Button className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setPayment({ open: true, policy: nextBestAction.policy })}>Take Action</Button></div>
                        ) : (
                            <div className="space-y-2"><div className="font-semibold text-emerald-800">Engage Your Customers</div><p className="text-sm text-emerald-700">No urgent actions found. This is a great time to send a promotional message.</p><Button className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setTab('engagement')}>Go to Engagement</Button></div>
                        )}
                    </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="mt-4"><Onboarding /></TabsContent>

          <TabsContent value="explainer" className="mt-4">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <PolicyExplainer selectedPolicy={selectedPolicy} recommendedPlans={recommendations} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Select Customer Policy</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {policies.map(p => (
                          <button key={p.id} onClick={() => setSelectedPolicyId(p.id)} className={cn("w-full text-left flex items-center justify-between rounded-lg border p-3 transition-colors", selectedPolicyId === p.id ? "bg-secondary ring-2 ring-primary" : "hover:bg-secondary/50")}>
                            <div><div className="font-medium">{p.customer}</div><div className="text-xs text-muted-foreground">{p.id} • {p.type}</div></div><StatusPill status={p.status} />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deposit" className="mt-4">
            <CashDeposit
              policies={policies.filter(p => p.status !== "Active").map(p => ({ id: p.id, customer: p.customer, amount: p.amount })) as DepositPolicy[]}
              onApproved={(policyId) => updatePolicyStatusMutation.mutate(policyId)}
            />
          </TabsContent>
          
          <TabsContent value="engagement" className="mt-4">
             <Engagement />
          </TabsContent>

        </Tabs>
      </div>

      <PaymentModal
        open={payment.open}
        onOpenChange={(v) => setPayment({ open: v, policy: v ? payment.policy : undefined })}
        onPaymentSuccess={() => queryClient.invalidateQueries({ queryKey: ['policies'] })}
        policyId={payment.policy?.id ?? ""}
        customer={payment.policy?.customer ?? ""}
        amount={payment.policy?.amount ?? 0}
      />
      <Chatbot />
    </div>
  );
}