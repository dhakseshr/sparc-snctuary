import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Send, Upload, Wand2 } from "lucide-react";

const LANGS = [ { code: "en", label: "English" }, { code: "hi", label: "Hindi" }, { code: "mr", label: "Marathi" }, { code: "ta", label: "Tamil" }, { code: "bn", label: "Bengali" }, ];

// This represents a recommendation or a candidate plan, not a customer's actual policy
interface PolicyPlan {
  id: string; name: string; premium: number; coverage: number; type: string; pros: string[]; cons: string[];
}

// This represents the actual policy data coming from the database
interface CustomerPolicy {
    id: string;
    customer?: string;
    phone?: string;
    type: string;
    coverage: number;
    amount: number;
}

interface AnalyzedPolicy {
    name: string; summary: string; pros: string[]; cons: string[];
}

export function PolicyExplainer({ selectedPolicy, recommendedPlans }: { selectedPolicy: CustomerPolicy | null; recommendedPlans: PolicyPlan[] }) {
  const [lang, setLang] = useState("en");
  const [expl, setExpl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedPolicy, setAnalyzedPolicy] = useState<AnalyzedPolicy | null>(null);

  const bestRecommendation = recommendedPlans[0] ?? null;

  useEffect(() => {
    const p = selectedPolicy;
    if (!p) {
        setExpl("Please select a customer or policy from the list on the right to see details and recommendations.");
        return;
    };
    const base = `Policy ${p.id} for ${p.customer} offers coverage of ₹${p.coverage?.toLocaleString() || 'N/A'} at an annual premium of ₹${p.amount?.toLocaleString() || 'N/A'}. Suitable for ${p.type}.`;
    const translations: Record<string, string> = { en: base };
    setExpl(translations[lang] ?? base);
  }, [lang, selectedPolicy]);

  const handleAnalyzePolicy = async () => {
    if (!uploadedFile) {
        toast.error("Please select a policy document to upload.");
        return;
    }
    setIsAnalyzing(true);
    setAnalyzedPolicy(null);
    toast.info("Analyzing policy with AI...", { description: "This may take a moment."});

    const formData = new FormData();
    formData.append("policyDocument", uploadedFile);

    try {
        const response = await fetch('/api/policies/analyze', {
            method: 'POST',
            body: formData,
        });
        const responseText = await response.text();
        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            } catch {
                throw new Error(responseText || `Server responded with status ${response.status}`);
            }
        }
        const data = JSON.parse(responseText);
        setAnalyzedPolicy(data);
        toast.success("Policy analysis complete!");
    } catch (error) {
        toast.error("Analysis Failed", { description: (error as Error).message });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleNotify = async (policy: PolicyPlan) => {
    if (!selectedPolicy || !selectedPolicy.customer) {
      toast.error("Please select a customer first.");
      return;
    }
    toast.info(`Notifying ${selectedPolicy.customer}...`);
    try {
      const response = await fetch('/api/notifications/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: selectedPolicy.customer,
          policyName: policy.name,
          premium: policy.premium,
          coverage: policy.coverage,
        }),
      });
      if (!response.ok) throw new Error("Server failed to send notification.");
      toast.success("Recommendation Sent!", { description: `Sent details of ${policy.name} to ${selectedPolicy.customer}.` });
    } catch (error) {
      toast.error("Failed to Send Notification", { description: (error as Error).message });
    }
  };

  function speak() { 
      toast.info("Audio playback is a planned feature and will be available soon.");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Policy Explainer</div>
        <div className="flex items-center gap-2">
          <Select value={lang} onValueChange={setLang}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Language" /></SelectTrigger><SelectContent>{LANGS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select>
          <Button variant="secondary" onClick={speak}>Play Audio</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground min-h-[40px]">{expl}</p>
      
      <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
        <div className="flex items-center gap-2 font-medium"><Wand2 className="h-4 w-4 text-primary"/><span>Analyze a New Policy</span></div>
        <div className="flex items-center gap-2">
            <Input type="file" accept=".pdf,.txt,.md" onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} className="max-w-xs text-xs"/>
            <Button onClick={handleAnalyzePolicy} disabled={isAnalyzing}>
                <Upload className="h-4 w-4 mr-2"/>
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </Button>
        </div>
        {analyzedPolicy && <p className="text-xs text-muted-foreground pt-1">Analysis complete! See the new card below.</p>}
      </div>

      <div className="rounded-lg border p-3">
        <div className="mb-2 font-medium">Recommended for this customer</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analyzedPolicy && (
                <div className="rounded-md border-2 border-primary ring-2 ring-primary p-3 relative bg-primary/5 flex flex-col justify-between">
                    <div>
                        <div className="text-sm font-medium">{analyzedPolicy.name} (Uploaded)</div>
                        <div className="mt-1 text-xs text-muted-foreground italic">{analyzedPolicy.summary}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <ul className="list-disc pl-4 space-y-1">{analyzedPolicy.pros.map((x, i) => <li key={i} className="text-emerald-700">{x}</li>)}</ul>
                            <ul className="list-disc pl-4 space-y-1">{analyzedPolicy.cons.map((x, i) => <li key={i} className="text-red-700">{x}</li>)}</ul>
                        </div>
                    </div>
                </div>
            )}
            
          {recommendedPlans.map((p) => (
            <div key={p.id} className={cn("rounded-md border p-3 relative flex flex-col justify-between", bestRecommendation && bestRecommendation.id === p.id && !analyzedPolicy ? 'border-primary ring-1 ring-primary' : '')}>
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">₹{p.premium.toLocaleString()} • ₹{p.coverage.toLocaleString()} cover</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <ul className="list-disc pl-4 space-y-1">{p.pros.map((x, i) => <li key={i} className="text-emerald-700">{x}</li>)}</ul>
                  <ul className="list-disc pl-4 space-y-1">{p.cons.map((x, i) => <li key={i} className="text-red-700">{x}</li>)}</ul>
                </div>
              </div>
              <Button size="sm" className="w-full mt-3 gap-2" onClick={() => handleNotify(p)}><Send className="h-3 w-3" />Notify Customer</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}