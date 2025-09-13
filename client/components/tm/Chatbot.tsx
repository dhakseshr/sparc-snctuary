import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Msg { role: "user" | "bot"; text: string }

const SUGGESTIONS = [
  "How to renew policy?",
  "What is my policy status?",
  "How to download receipt?",
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi! How can I help you today?" },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;

    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: t, userId: 'demo-user-123' }), // Pass a user identifier
      });

      if (!response.ok) {
        throw new Error('Chatbot service is unavailable.');
      }

      const data = await response.json();
      setMsgs((m) => [...m, { role: "bot", text: data.reply }]);

    } catch (error) {
        toast.error("Chatbot Error", { description: (error as Error).message });
        setMsgs((m) => [...m, { role: "bot", text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
        setLoading(false);
    }
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
             {loading && <div className="text-left"><span className="inline-block rounded-2xl bg-secondary px-3 py-2 text-sm">...</span></div>}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <div className="mt-2 flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question..." onKeyDown={(e) => e.key === 'Enter' && send()} disabled={loading} />
          <Button onClick={() => send()} aria-label="Send" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}