import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Send } from "lucide-react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "bn", label: "Bengali" },
];

interface Policy {
  id: string;
  name: string;
  premium: number;
  coverage: number;
  type: string;
  pros: string[];
  cons: string[];
}

export function PolicyExplainer({ selectedPolicy, candidates }: { selectedPolicy: (Policy & { customer?: string }) | null; candidates: Policy[]; }) {
  const [lang, setLang] = useState("en");
  const [expl, setExpl] = useState("");

  // --- NEW RECOMMENDATION LOGIC ---
  const recommendedPlans = useMemo(() => {
    if (!selectedPolicy) {
      // If no customer is selected, show the top 3 overall best-value plans
      return candidates
        .slice()
        .sort((a, b) => (b.coverage / b.premium) - (a.coverage / a.premium))
        .slice(0, 3);
    }

    // 1. Find other plans of the same type as the selected customer's policy
    const sameTypePlans = candidates.filter(p => p.type === selectedPolicy.type && p.id !== selectedPolicy.id);

    // 2. Find the best of the other types
    const otherTypePlans = candidates.filter(p => p.type !== selectedPolicy.type);

    // 3. Combine them, prioritizing the same type, and sort by value
    const sortedRecommendations = [...sameTypePlans, ...otherTypePlans]
        .sort((a, b) => (b.coverage / b.premium) - (a.coverage / a.premium));

    return sortedRecommendations.slice(0, 3);

  }, [selectedPolicy, candidates]);

  const best = recommendedPlans[0] ?? null; // The best plan is the first one in the sorted list

  useEffect(() => {
    const p = selectedPolicy; // The main explainer should always talk about the selected policy
    if (!p) {
        setExpl("Please select a customer or policy from the list on the right to see details and recommendations.");
        return;
    };
    const base = `Policy ${p.name} offers coverage of ₹${p.coverage.toLocaleString()} at an annual premium of ₹${p.premium.toLocaleString()}. Suitable for ${p.type}.`;
    const translations: Record<string, string> = {
      en: base,
      hi: `पॉलिसी ${p.name} ₹${p.premium.toLocaleString()} वार्षिक प्रीमियम पर ₹${p.coverage.toLocaleString()} कवर देती है। ${p.type} के लिए उपयुक्त।`,
      mr: `पॉलिसी ${p.name} वार्षिक प्रीमियम ₹${p.premium.toLocaleString()} मध्ये ₹${p.coverage.toLocaleString()} कव्हर देते. ${p.type} साठी योग्य।`,
      ta: `காப்பீடு ${p.name} ஆண்டுக் காப்புறுதி ₹${p.premium.toLocaleString()}க்கு ₹${p.coverage.toLocaleString()} வரை கவரேஜ். ${p.type}க்கு பொருத்தம்।`,
      bn: `পলিসি ${p.name} বছরে ₹${p.premium.toLocaleString()} প্রিমিয়ামে ₹${p.coverage.toLocaleString()} কভার। ${p.type} এর জন্য উপযুক্ত।`,
    };
    setExpl(translations[lang] ?? base);
  }, [lang, selectedPolicy]);

  function speak() {
    if (!expl) return;
    const utter = new SpeechSynthesisUtterance(expl);
    speechSynthesis.cancel();
    const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(lang));
    if (voice) utter.voice = voice;
    speechSynthesis.speak(utter);
  }

  async function handleNotify(policy: Policy) {
    if (!selectedPolicy?.customer) {
        toast.error("No customer selected", { description: "Please select a customer from the right to send a notification." });
        return;
    }
    toast.info(`Sending recommendation for ${policy.name} to ${selectedPolicy.customer}...`);
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
        toast.success("Recommendation Sent!");
    } catch (error) {
        toast.error("Failed to Send Notification", { description: (error as Error).message });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Policy Explainer</div>
        <div className="flex items-center gap-2">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              {LANGS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={speak}>Play Audio</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground min-h-[40px]">{expl}</p>
      <div className="rounded-lg border p-3">
        <div className="mb-2 font-medium">Recommended for this customer</div>
        <div className="grid grid-cols-3 gap-3">
          {recommendedPlans.map((p) => (
            <div key={p.id} className={cn("rounded-md border p-3 relative", best && best.id === p.id ? 'border-primary ring-1 ring-primary' : '')}>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">₹{p.premium.toLocaleString()} • ₹{p.coverage.toLocaleString()} cover</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <ul className="list-disc pl-4 space-y-1">
                  {p.pros.map((x, i) => <li key={i} className="text-emerald-700">{x}</li>)}
                </ul>
                <ul className="list-disc pl-4 space-y-1">
                  {p.cons.map((x, i) => <li key={i} className="text-red-700">{x}</li>)}
                </ul>
              </div>
              {best && best.id === p.id && (
                <Button size="sm" className="w-full mt-3 gap-2" onClick={() => handleNotify(p)}>
                    <Send className="h-3 w-3" />
                    Notify Customer
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}