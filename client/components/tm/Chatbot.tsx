import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Msg { role: "user" | "bot"; text: string }

const SUGGESTIONS = [
  "How to renew policy?",
  "What documents are needed?",
  "How to download receipt?",
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi! I can help with FAQs." },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t }]);
    // Lightweight rule-based bot for demo
    const reply =
      t.toLowerCase().includes("renew") ?
        "To renew, open the policy, click 'Make Payment', choose method and complete. Receipts are generated automatically." :
      t.toLowerCase().includes("document") ?
        "Common documents: Aadhaar/PAN, last policy copy, address proof. Upload via AI Scan to autofill." :
      t.toLowerCase().includes("receipt") ?
        "After a successful payment, a digital receipt is downloadable and sent via SMS/Email/WhatsApp." :
        "I can help with renewals, payments, receipts, and documents.";
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: reply }]), 300);
  }

  if (!open)
    return (
      <button
        aria-label="Chatbot"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    );

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] overflow-hidden rounded-xl border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b bg-secondary/50 px-4 py-2">
        <div className="font-medium">Help & FAQs</div>
        <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border px-3 py-1 text-xs hover:bg-secondary">
              {s}
            </button>
          ))}
        </div>
        <ScrollArea className="h-64 rounded-md border p-2">
          <div className="space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`${m.role === "user" ? "text-right" : "text-left"}`}>
                <span className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.text}
                </span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <div className="mt-2 flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question..." onKeyDown={(e) => e.key === 'Enter' && send()} voiceEnabled />
          <Button onClick={() => send()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}