import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InputWithVoice } from "@/components/ui/InputWithVoice";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface CustomerDetails {
  name: string; dob: string; address: string; idNumber: string;
}

export function AIScanModal({ open, onOpenChange, onFilled }: { open: boolean; onOpenChange: (v: boolean) => void; onFilled: (d: CustomerDetails) => void; }) {
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<CustomerDetails>({ name: "", dob: "", address: "", idNumber: "" });
  const [loading, setLoading] = useState(false);

  async function extractDetailsWithAI() {
    if (!file) {
      toast.error("Please upload a document first.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("document", file);
    try {
      const response = await fetch("/api/ai-scan", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "The AI processing service failed.");
      }
      const extractedData = await response.json();
      setDetails({
        name: extractedData.fullName || "",
        dob: extractedData.dateOfBirth || "",
        address: extractedData.address || "",
        idNumber: extractedData.policyNumber || "",
      });
      toast.success("AI extracted fields successfully. Please review.");
    } catch (error: any) {
      toast.error("Extraction Failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!details.name || !details.dob) {
        toast.error("Please ensure Name and Date of Birth are filled.");
        return;
    }
    onFilled(details);
    toast.success("Customer details added to workflow");
    onOpenChange(false);
  }

  async function generateDoc() {
    if (!details.name) {
        toast.error("Cannot generate document", { description: "Please fill in the customer details first." });
        return;
    }
    try {
        const response = await fetch('/api/generate-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(details)
        });
        if (!response.ok) throw new Error("Server failed to generate document.");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Onboarding-${details.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Document Generated!");
    } catch (error) {
        toast.error("Failed to Generate PDF", { description: (error as Error).message });
    }
  }

  const handleVoiceInput = (fieldName: keyof CustomerDetails) => {
    toast.info(`Voice input for ${fieldName} is coming soon!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>AI Scan • Autofill Customer Details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*,application/pdf" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button variant="secondary" onClick={extractDetailsWithAI} disabled={loading}>{loading ? "Processing..." : "Extract Fields"}</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="col-span-2"><label className="text-sm font-medium">Full Name</label><InputWithVoice value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} onVoiceClick={() => handleVoiceInput('name')} /></div>
            <div><label className="text-sm font-medium">DOB</label><InputWithVoice type="date" value={details.dob} onChange={(e) => setDetails({ ...details, dob: e.target.value })} onVoiceClick={() => handleVoiceInput('dob')}/></div>
            <div><label className="text-sm font-medium">ID Number</label><InputWithVoice value={details.idNumber} onChange={(e) => setDetails({ ...details, idNumber: e.target.value })} onVoiceClick={() => handleVoiceInput('idNumber')}/></div>
            <div className="col-span-2"><label className="text-sm font-medium">Address</label><InputWithVoice value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} onVoiceClick={() => handleVoiceInput('address')}/></div>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <Button onClick={save}>Add to Purchase Flow</Button>
            <Button variant="secondary" onClick={generateDoc}>Generate Onboarding PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}