import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Send, Upload, Wand2 } from "lucide-react";

const LANGS = [ { code: "en", label: "English" }, { code: "hi", label: "Hindi" }, { code: "mr", label: "Marathi" }, { code: "ta", label: "Tamil" }, { code: "bn", label: "Bengali" }, ];

interface Policy {
  id: string; name: string; premium: number; coverage: number; type: string; pros: string[]; cons: string[];
}

interface AnalyzedPolicy {
    name: string; summary: string; pros: string[]; cons: string[];
}

export function PolicyExplainer({ selectedPolicy, candidates }: { selectedPolicy: (Policy & { customer?: string; phone?: string; }) | null; candidates: Policy[]; }) {
  const [lang, setLang] = useState("en");
  const [expl, setExpl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedPolicy, setAnalyzedPolicy] = useState<AnalyzedPolicy | null>(null);

  const recommendedPlans = useMemo(() => {
    const calculateValue = (p: Policy) => (p.premium > 0 ? p.coverage / p.premium : 0);
    if (!candidates) return [];
    if (!selectedPolicy) {
      return candidates.slice().sort((a, b) => calculateValue(b) - calculateValue(a)).slice(0, 3);
    }
    const sameTypePlans = candidates.filter(p => p.type === selectedPolicy.type && p.id !== selectedPolicy.id);
    const otherTypePlans = candidates.filter(p => p.type !== selectedPolicy.type);
    const sortedRecommendations = [...sameTypePlans, ...otherTypePlans].sort((a, b) => calculateValue(b) - calculateValue(a));
    return sortedRecommendations.slice(0, 3);
  }, [selectedPolicy, candidates]);

  const best = recommendedPlans[0] ?? null;

  useEffect(() => {
    const p = selectedPolicy;
    if (!p) {
        setExpl("Please select a customer or policy from the list on the right to see details and recommendations.");
        return;
    };
    const base = `Policy ${p.name} offers coverage of ₹${p.coverage?.toLocaleString() || 'N/A'} at an annual premium of ₹${p.premium?.toLocaleString() || 'N/A'}. Suitable for ${p.type}.`;
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

        // --- ROBUST ERROR HANDLING ---
        // Read the response text first, in case it's not valid JSON.
        const responseText = await response.text();
        
        if (!response.ok) {
            // If not successful, check if the response is JSON.
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            } catch {
                // If it's not JSON, use the plain text as the error message.
                throw new Error(responseText || `Server responded with status ${response.status}`);
            }
        }
        
        // If the response was successful, parse the JSON.
        const data = JSON.parse(responseText);
        setAnalyzedPolicy(data);
        toast.success("Policy analysis complete!");
    } catch (error) {
        toast.error("Analysis Failed", { description: (error as Error).message });
    } finally {
        setIsAnalyzing(false);
    }
  };

  function speak() { /* ... unchanged ... */ }
  async function handleNotify(policy: Policy) { /* ... unchanged ... */ }

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
        <div className="grid grid-cols-3 gap-3">
            {analyzedPolicy && (
                <div className="rounded-md border-2 border-primary ring-2 ring-primary p-3 relative bg-primary/5">
                    <div className="text-sm font-medium">{analyzedPolicy.name} (Uploaded)</div>
                    <div className="mt-1 text-xs text-muted-foreground italic">{analyzedPolicy.summary}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <ul className="list-disc pl-4 space-y-1">{analyzedPolicy.pros.map((x, i) => <li key={i} className="text-emerald-700">{x}</li>)}</ul>
                        <ul className="list-disc pl-4 space-y-1">{analyzedPolicy.cons.map((x, i) => <li key={i} className="text-red-700">{x}</li>)}</ul>
                    </div>
                </div>
            )}
            
          {recommendedPlans.map((p) => (
            <div key={p.id} className={cn("rounded-md border p-3 relative", best && best.id === p.id && !analyzedPolicy ? 'border-primary ring-1 ring-primary' : '')}>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">₹{p.premium.toLocaleString()} • ₹{p.coverage.toLocaleString()} cover</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <ul className="list-disc pl-4 space-y-1">{p.pros.map((x, i) => <li key={i} className="text-emerald-700">{x}</li>)}</ul>
                <ul className="list-disc pl-4 space-y-1">{p.cons.map((x, i) => <li key={i} className="text-red-700">{x}</li>)}</ul>
              </div>
              {best && best.id === p.id && (
                <Button size="sm" className="w-full mt-3 gap-2" onClick={() => handleNotify(p)}><Send className="h-3 w-3" />Notify Customer</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}