import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Filter, Users, WalletCards, CreditCard, ScanLine, Languages, Mic, FileText, MessageSquare, Rocket, Wand2, Zap } from "lucide-react";
import { StatusPill, PolicyStatus } from "@/components/tm/StatusPill";
import { PaymentModal } from "@/components/tm/PaymentModal";
import { Chatbot } from "@/components/tm/Chatbot";
import { AIScanModal, CustomerDetails } from "@/components/tm/AIScanModal";
import { PolicyExplainer } from "@/components/tm/PolicyExplainer";
import { CashDeposit } from "@/components/tm/CashDeposit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { format, parseISO, addDays, subDays } from 'date-fns';

interface PolicyRow {
  id: string; customer: string; type: string; insurer: string; status: PolicyStatus; dueDate: string; amount: number; phone: string;
}

const now = new Date();
const seedPolicies: PolicyRow[] = [
    { id: "PL-1001", customer: "Ravi Kumar", type: "Health", insurer: "HDFC ERGO", status: "Active", dueDate: "—", amount: 14500, phone: "+919876543210" },
    { id: "PL-1002", customer: "Anita Sharma", type: "Life", insurer: "LIC", status: "Renewal Due", dueDate: format(addDays(now, 25), 'yyyy-MM-dd'), amount: 22000, phone: "+919876543211" },
    { id: "PL-1003", customer: "Sanjay Patel", type: "Motor", insurer: "ICICI Lombard", status: "Lapsed", dueDate: format(subDays(now, 40), 'yyyy-MM-dd'), amount: 7800, phone: "+919876543212" },
    { id: "PL-1004", customer: "Pooja Verma", type: "Health", insurer: "Star Health", status: "Renewal Due", dueDate: format(addDays(now, 5), 'yyyy-MM-dd'), amount: 16800, phone: "+919876543213" },
    { id: "PL-1005", customer: "Arjun Mehta", type: "Travel", insurer: "Tata AIG", status: "Active", dueDate: "—", amount: 5200, phone: "+919876543214" },
];

const policyDetails = {
    "PL-1001": { name: "Optima Restore", premium: 14500, coverage: 500000, type: "Health", pros: ["Restore Benefit", "No Claim Bonus"], cons: ["Higher Premium"] },
    "PL-1002": { name: "Jeevan Anand", premium: 22000, coverage: 1000000, type: "Life", pros: ["Bonus Facility", "Death Benefit"], cons: ["Lower Returns"] },
    "PL-1003": { name: "Motor Insurance", premium: 7800, coverage: 300000, type: "Motor", pros: ["Wide Garage Network", "24x7 Support"], cons: ["Higher IDV Cost"] },
    "PL-1004": { name: "Family Health Optima", premium: 16800, coverage: 750000, type: "Health", pros: ["Covers 15 members", "Automatic Restore"], cons: ["Waiting Periods"] },
    "PL-1005": { name: "Travel Guard", premium: 5200, coverage: 50000, type: "Travel", pros: ["Global Coverage", "Baggage Loss"], cons: ["Exclusions apply"] },
};

export default function Index() {
  const [policies, setPolicies] = useState<PolicyRow[]>(seedPolicies);
  const [filters, setFilters] = useState({ type: "All", insurer: "All", search: "" });
  const [payment, setPayment] = useState<{ open: boolean; policy?: PolicyRow }>(() => ({ open: false }));
  const [scanOpen, setScanOpen] = useState(false);
  const [customerFromScan, setCustomerFromScan] = useState<CustomerDetails | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [engagementSegment, setEngagementSegment] = useState("all");
  const [engagementMessage, setEngagementMessage] = useState("Exciting new offers are available for you!");
  const [explainerPolicy, setExplainerPolicy] = useState<PolicyRow | null>(policies[1]);
  const [engagementSuggestion, setEngagementSuggestion] = useState("");
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const debouncedEngagementMessage = useDebounce(engagementMessage, 1000);
  const [nextAction, setNextAction] = useState<any>(null);
  
  const fetchNextAction = async () => {
    try {
        const response = await fetch('/api/next-best-action');
        if (!response.ok) return;
        const data = await response.json();
        setNextAction(data);
    } catch (error) {
        console.error("Failed to fetch next best action:", error);
    }
  };

  useEffect(() => {
    fetchNextAction();
  }, [policies]);
  
  useEffect(() => {
    const fetchSuggestion = async () => {
        if (debouncedEngagementMessage.trim().length < 15) {
            setEngagementSuggestion("");
            return;
        }
        setIsSuggestionLoading(true);
        try {
            const response = await fetch('/api/engagement/get-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: debouncedEngagementMessage }),
            });
            if (!response.ok) throw new Error("Failed to fetch suggestion.");
            const data = await response.json();
            setEngagementSuggestion(data.suggestion);
        } catch (error) {
            console.error("Suggestion fetch error:", error);
            setEngagementSuggestion("");
        } finally {
            setIsSuggestionLoading(false);
        }
    };
    fetchSuggestion();
  }, [debouncedEngagementMessage]);

  const handlePaymentSuccess = (updatedPolicy: PolicyRow) => {
    setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? { ...p, status: updatedPolicy.status, dueDate: updatedPolicy.dueDate } : p));
  };
  
  const handleSendReminder = async (policy: PolicyRow) => {
    toast.info("Sending reminder...");
    try {
      const response = await fetch('/api/notifications/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId: policy.id }),
      });
      if (!response.ok) throw new Error("Server failed to send reminder.");
      toast.success("WhatsApp Reminder Sent", { description: `Reminder for ${policy.id} sent to ${policy.customer}.` });
    } catch (error) {
      toast.error("Failed to Send Reminder", { description: (error as Error).message });
    }
  };

  const handleSendEngagement = async () => {
    toast.info("Sending engagement messages...");
    try {
        const response = await fetch('/api/engagement/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerSegment: engagementSegment, message: engagementMessage }),
        });
        if (!response.ok) throw new Error("Server failed to send messages.");
        const result = await response.json();
        toast.success("Engagement Sent!", { description: result.message });
    } catch (error) {
        toast.error("Failed to Send Engagement", { description: (error as Error).message });
    }
  };

  const filtered = useMemo(() => policies.filter(p => (filters.type === "All" || p.type === filters.type) && (filters.insurer === "All" || p.insurer === filters.insurer) && (filters.search === "" || p.customer.toLowerCase().includes(filters.search.toLowerCase()) || p.id.toLowerCase().includes(filters.search.toLowerCase()))), [policies, filters]);
  const counts = useMemo(() => ({ active: policies.filter(p => p.status === "Active").length, due: policies.filter(p => p.status === "Renewal Due").length, lapsed: policies.filter(p => p.status === "Lapsed").length }), [policies]);
  const commissions = useMemo(() => ({ total: 184250, history: [{ id: "CM-001", date: "2025-08-10", amount: 3200 },{ id: "CM-002", date: "2025-08-22", amount: 5400 },{ id: "CM-003", date: "2025-09-03", amount: 2100 }] }), []);
  const candidates = useMemo(() => [
    { id: "RX1", name: "Health Plus", premium: 18000, coverage: 500000, type: "Health", pros: ["Cashless network", "Wellness benefits"], cons: ["Room rent cap"] }, { id: "RX2", name: "Secure Life", premium: 22000, coverage: 2500000, type: "Life", pros: ["High cover"], cons: ["Medical tests required"] }, { id: "RX3", name: "Auto Shield", premium: 7000, coverage: 500000, type: "Motor", pros: ["Zero dep add-on"], cons: ["Garage network limited"] }, { id: "RX4", name: "Critical Care", premium: 12000, coverage: 1000000, type: "Health", pros: ["36 illnesses covered", "Lump sum payout"], cons: ["Survival period clause"] }, { id: "RX5", name: "Pension Plus", premium: 50000, coverage: 0, type: "Pension", pros: ["Guaranteed returns", "Tax benefits"], cons: ["Long lock-in period"] }, { id: "RX6", name: "Drive Assure", premium: 9500, coverage: 750000, type: "Motor", pros: ["Engine protection", "Roadside assistance"], cons: ["Higher premium"] }, { id: "RX7", name: "Max Term", premium: 15000, coverage: 5000000, type: "Life", pros: ["Very high cover", "Low cost"], cons: ["No maturity benefit"] }, { id: "RX8", name: "Global Trotter", premium: 4500, coverage: 100000, type: "Travel", pros: ["Multi-trip option", "Adventure sports"], cons: ["Pre-existing disease cover extra"] }, { id: "RX9", name: "Super Top-up", premium: 5000, coverage: 2000000, type: "Health", pros: ["High cover, low cost", "Covers existing plan"], cons: ["Deductible applies"] },
  ], []);

  const detailedExplainerPolicy = useMemo(() => {
    if (!explainerPolicy) return null;
    const details = policyDetails[explainerPolicy.id as keyof typeof policyDetails];
    if (!details) {
      return { ...explainerPolicy, name: explainerPolicy.customer, pros: [], cons: [], premium: explainerPolicy.amount, coverage: 0 };
    }
    return { ...details, ...explainerPolicy };
  }, [explainerPolicy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[2852px] px-6 py-6" style={{ aspectRatio: "2852/1476" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center"><svg viewBox="0 0 64 64" className="h-6 w-6 text-primary-foreground" aria-hidden><g fill="currentColor"><path d="M32 14c-9.389 0-17 6.716-17 15 0 8.284 7.611 15 17 15s17-6.716 17-15c0-8.284-7.611-15-17-15zm0 6c6.627 0 12 4.477 12 9s-5.373 9-12 9-12-4.477-12-9 5.373-9 12-9z"/><path d="M19 30c-2.8-1.2-6.5-1.2-9.5 1.5-.8.7-1.9.7-2.7-.1-.8-.8-.8-2.1.1-2.9C10.2 24 15.2 24 19 25.7V30z"/><path d="M45 30c2.8-1.2-6.5-1.2-9.5 1.5.8.7 1.9.7 2.7-.1.8-.8.8-2.1-.1-2.9-3.3-3.6-8.3-3.6-12.1-1.9V30z"/><path d="M26 42.5c-1.1 2.7-3.4 5.3-6.7 6.7-1 .4-2.1-.1-2.5-1.1-.4-1 .1-2.1 1.1-2.5 2.2-.9 3.8-2.6 4.6-4.4h3.5z"/><path d="M38 42.5c1.1 2.7 3.4 5.3-6.7 6.7 1 .4-2.1-.1-2.5-1.1-.4-1-.1-2.1-1.1-2.5-2.2-.9-3.8-2.6 4.6-4.4H38z"/></g></svg></div>
            <div className="text-xl font-semibold">Turtlemint B2B</div>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative flex items-center w-[360px]"><Input className="pr-10" placeholder="Search policies, customers..." /><Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8 text-muted-foreground"><Mic className="h-4 w-4" /></Button></div>
            <Button variant="secondary" className="gap-2" onClick={() => setScanOpen(true)}><ScanLine className="h-4 w-4" /> AI Scan</Button>
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mt-4"><TabsTrigger value="dashboard">Dashboard</TabsTrigger><TabsTrigger value="explainer">Policy Explainer</TabsTrigger><TabsTrigger value="deposit">Cash Deposit</TabsTrigger><TabsTrigger value="engagement">Engagement</TabsTrigger></TabsList>
          
          <TabsContent value="dashboard" className="mt-4">
            {nextAction && (
              <Card className="mb-6 bg-amber-50 border-amber-200">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-amber-900"><Zap className="h-5 w-5" /> Next Best Action</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-amber-800">{nextAction.title}</p>
                    <p className="text-sm text-amber-700">{nextAction.description}</p>
                  </div>
                  {nextAction.action === 'URGENT_RENEWAL' && (<Button onClick={() => { const p = policies.find(pol => pol.id === nextAction.policyId); if(p) setPayment({ open: true, policy: p }); }}>Renew Now</Button>)}
                  {nextAction.action === 'FOLLOW_UP_LAPSED' && (<Button onClick={() => handleSendReminder(policies.find(p => p.id === nextAction.policyId)!)}>Send Reminder</Button>)}
                  {nextAction.action === 'ENGAGE' && (<Button onClick={() => setTab('engagement')}>Go to Engagement</Button>)}
                </CardContent>
              </Card>
            )}
            {customerFromScan && (
              <Card className="mb-6">
                <CardHeader><CardTitle className="text-lg">Autofilled details ready</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div><div className="text-muted-foreground">Name</div><div className="font-medium">{customerFromScan.name}</div></div>
                    <div><div className="text-muted-foreground">DOB</div><div className="font-medium">{customerFromScan.dob}</div></div>
                    <div><div className="text-muted-foreground">ID</div><div className="font-medium">{customerFromScan.idNumber}</div></div>
                    <div><div className="text-muted-foreground">Address</div><div className="font-medium truncate">{customerFromScan.address}</div></div>
                  </div>
                  <div className="mt-3"><Button onClick={() => toast.info("New purchase flow initiated!")}>Use in New Purchase</Button></div>
                </CardContent>
              </Card>
            )}
            <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-4"><div><label className="text-sm font-medium">Policy Type</label><Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['All','Health','Life','Motor','Travel'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div><label className="text-sm font-medium">Insurer</label><Select value={filters.insurer} onValueChange={(v) => setFilters({ ...filters, insurer: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['All','HDFC ERGO','LIC','ICICI Lombard','Star Health','Tata AIG'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div><label className="text-sm font-medium">Customer / Policy</label><Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="e.g., Ravi, PL-1001" /></div></CardContent></Card>
            <div className="mt-6 grid grid-cols-12 gap-4"><Card className="col-span-3"><CardHeader><CardTitle className="text-base flex items-center gap-2"><WalletCards className="h-4 w-4" /> Active Policies</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-emerald-600">{counts.active}</div></CardContent></Card><Card className="col-span-3"><CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Renewal Due</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-yellow-600">{counts.due}</div></CardContent></Card><Card className="col-span-3"><CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lapsed</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{counts.lapsed}</div></CardContent></Card><Card className="col-span-3"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Commission</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">₹ {commissions.total.toLocaleString()}</div></CardContent></Card></div>
            <div className="mt-6 grid grid-cols-12 gap-6"><Card className="col-span-12"><CardHeader><CardTitle className="text-lg">Policies</CardTitle></CardHeader><CardContent><ScrollArea className="h-[480px]"><Table><TableHeader><TableRow><TableHead>Policy ID</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Insurer</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-center">Action</TableHead></TableRow></TableHeader><TableBody>{filtered.map((p) => (<TableRow key={p.id}><TableCell>{p.id}</TableCell><TableCell>{p.customer}</TableCell><TableCell>{p.type}</TableCell><TableCell>{p.insurer}</TableCell><TableCell><StatusPill status={p.status} /></TableCell><TableCell>{p.dueDate === '—' ? '—' : format(parseISO(p.dueDate), 'dd MMM, yyyy')}</TableCell><TableCell className="text-right">₹ {p.amount.toLocaleString()}</TableCell><TableCell className="text-center space-x-2">{p.status === "Renewal Due" && (<Button size="sm" variant="outline" onClick={() => handleSendReminder(p)}><MessageSquare className="h-4 w-4"/></Button>)}{p.status !== "Active" ? (<Button size="sm" onClick={() => setPayment({ open: true, policy: p })}>Make Payment</Button>): (<Button size="sm" variant="secondary">View Details</Button>)}</TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card></div>
          </TabsContent>
          
          <TabsContent value="deposit" className="mt-4"><CashDeposit policies={policies.map(p => ({ id: p.id, customer: p.customer, amount: p.amount }))} onApproved={(policyId) => setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, status: "Active", dueDate: "—" } : p))} /></TabsContent>
          
          <TabsContent value="engagement" className="mt-4"><Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Rocket className="h-4 w-4" /> Customer Retention</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-sm font-medium">Target Customer Segment</label><Select value={engagementSegment} onValueChange={setEngagementSegment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Customers</SelectItem><SelectItem value="renewal_due">Policies with Renewal Due</SelectItem><SelectItem value="lapsed">Lapsed Policies</SelectItem><SelectItem value="high_value">High-Value Customers</SelectItem></SelectContent></Select></div><div><label className="text-sm font-medium">Message to Send</label><Textarea value={engagementMessage} onChange={(e) => setEngagementMessage(e.target.value)} placeholder="Type your exciting offer or message here..." rows={4}/></div>{(isSuggestionLoading || engagementSuggestion) && (<div className="rounded-md border border-dashed p-3 text-sm"><div className="flex items-center gap-2 font-medium"><Wand2 className="h-4 w-4 text-primary" /><span>AI Suggestion</span></div>{isSuggestionLoading ? (<p className="mt-2 text-muted-foreground italic">Generating...</p>) : (engagementSuggestion && (<><p className="mt-2 text-muted-foreground">{engagementSuggestion}</p><Button variant="link" className="p-0 h-auto mt-2" onClick={() => { setEngagementMessage(engagementSuggestion); setEngagementSuggestion(""); }}>Use this suggestion</Button></>))}</div>)}<Button onClick={handleSendEngagement}>Send to Segment</Button></CardContent></Card></TabsContent>
          
          <TabsContent value="explainer" className="mt-4"><Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Languages className="h-4 w-4" /> Policy Explainer</CardTitle></CardHeader><CardContent><div className="grid grid-cols-12 gap-6"><div className="col-span-8 space-y-4"><PolicyExplainer selectedPolicy={detailedExplainerPolicy as any} candidates={candidates as any} /></div><div className="col-span-4"><div className="rounded-lg border p-4"><div className="mb-2 text-sm font-medium">Select a sample customer or policy to compare</div><div className="space-y-2 text-sm">{policies.map(p => (<button key={p.id} onClick={() => setExplainerPolicy(p)} className={cn("w-full text-left flex items-center justify-between rounded-md border p-2 transition-all hover:bg-muted", explainerPolicy?.id === p.id && "ring-2 ring-primary border-primary")}><div><div className="font-medium">{p.customer}</div><div className="text-xs text-muted-foreground">{p.type} • {p.insurer}</div></div><StatusPill status={p.status} /></button>))}</div></div></div></div></CardContent></Card></TabsContent>
        </Tabs>
      </div>
      <PaymentModal
        open={payment.open}
        onOpenChange={(v) => setPayment({ open: v, policy: v ? payment.policy : undefined })}
        policyId={payment.policy?.id ?? ""}
        customer={payment.policy?.customer ?? ""}
        amount={payment.policy?.amount ?? 0}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <AIScanModal open={scanOpen} onOpenChange={setScanOpen} onFilled={(d) => setCustomerFromScan(d)} />
      <Chatbot />
    </div>
  );
}