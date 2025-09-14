import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Wand2, Sparkles } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const customerSegments = [
  "All Customers",
  "Active Health Policies",
  "Active Life Policies",
  "Renewal Due (Next 30 Days)",
  "Lapsed Policies",
  "High-Value Customers",
];

const messageTemplates = [
  { title: "Festival Greeting (Diwali)", body: "Wishing you and your family a very Happy Diwali! May the festival of lights bring joy and prosperity to your home." },
  { title: "Renewal Reminder", body: "Hi [Customer Name], a friendly reminder that your policy is due for renewal soon. Please ensure timely payment to keep your coverage active." },
  { title: "New Product Launch", body: "Exciting news! We've just launched a new [Product Type] plan with enhanced benefits. Would you be interested in learning more?" },
];

export function Engagement() {
  const [segment, setSegment] = useState(customerSegments[0]);
  const [message, setMessage] = useState(messageTemplates[0].body);
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const debouncedMessage = useDebounce(message, 500);

  const getSuggestionMutation = useMutation({
    mutationFn: (text: string) => fetch('/api/engagement/get-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    }).then(res => res.json()),
    onSuccess: (data) => {
        if (data.suggestion) {
            setMessage(data.suggestion);
            toast.success("AI suggestion applied!");
        }
    },
    onError: (err) => toast.error("Suggestion Failed", { description: (err as Error).message }),
    onSettled: () => setIsSuggesting(false),
  });

  const handleGetSuggestion = () => {
    if (!message || message.trim().length < 15) {
        toast.info("Please write a longer message to get a suggestion.");
        return;
    }
    setIsSuggesting(true);
    getSuggestionMutation.mutate(message);
  }

  const handleSend = async () => {
      if (!segment || !message) {
          toast.error("Please select a customer segment and write a message.");
          return;
      }
      setIsSending(true);
      try {
          const response = await fetch('/api/engagement/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerSegment: segment, message }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Server error");
          toast.success("Messages Sent!", { description: `Your message has been queued for ${result.sentCount} customers in the "${segment}" segment.` });
      } catch (error) {
          toast.error("Failed to Send Messages", { description: (error as Error).message });
      } finally {
          setIsSending(false);
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Customer Engagement Hub</CardTitle>
        <CardDescription>Send bulk communications and festival greetings to your customers via WhatsApp.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="text-sm font-medium">1. Select Customer Segment</label>
                 <Select value={segment} onValueChange={setSegment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {customerSegments.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="col-span-2">
                 <label className="text-sm font-medium">2. Choose a Template (Optional)</label>
                 <Select onValueChange={(v) => setMessage(v)}>
                    <SelectTrigger><SelectValue placeholder="Select a template..."/></SelectTrigger>
                    <SelectContent>
                        {messageTemplates.map(t => <SelectItem key={t.title} value={t.body}>{t.title}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        <div>
            <label className="text-sm font-medium">3. Compose Your Message</label>
            <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Type your message here..."
                rows={6}
                className="mt-1"
            />
        </div>

        <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleGetSuggestion} disabled={isSuggesting || getSuggestionMutation.isLoading}>
                <Wand2 className="mr-2 h-4 w-4"/>
                {isSuggesting ? 'Improving...' : 'Improve with AI'}
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
                <Send className="mr-2 h-4 w-4" />
                {isSending ? 'Sending...' : `Send to "${segment}"`}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}