import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CustomerDetails {
  name: string;
  dob: string;
  address: string;
  idNumber: string;
}

export function AIScanModal({ open, onOpenChange, onFilled }: { open: boolean; onOpenChange: (v: boolean) => void; onFilled: (d: CustomerDetails) => void; }) {
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<CustomerDetails>({ name: "", dob: "", address: "", idNumber: "" });
  const [loading, setLoading] = useState(false);

  async function simulateExtract() {
    if (!file) {
      toast.error("Please upload a document");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const base = file.name.toLowerCase();
    const guessedName = base.includes("aadhaar") ? "Aadhaar Holder" : base.includes("pan") ? "PAN Holder" : "Customer";
    const nowYear = new Date().getFullYear();
    setDetails({
      name: guessedName,
      dob: `${nowYear - 30}-01-01`,
      address: "221B Baker Street, Mumbai",
      idNumber: base.includes("pan") ? "ABCDE1234F" : "XXXX-XXXX-XXXX",
    });
    setLoading(false);
    toast.success("AI extracted fields. Please review and correct if needed.");
  }

  function save() {
    onFilled(details);
    toast.success("Customer details added to workflow");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Scan • Autofill Customer Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button variant="secondary" onClick={simulateExtract} disabled={loading}>{loading ? "Processing..." : "Extract Fields"}</Button>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} voiceEnabled />
            </div>
            <div>
              <label className="text-sm font-medium">DOB</label>
              <Input type="date" value={details.dob} onChange={(e) => setDetails({ ...details, dob: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">ID Number</label>
              <Input value={details.idNumber} onChange={(e) => setDetails({ ...details, idNumber: e.target.value })} voiceEnabled />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Input value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} voiceEnabled />
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={save}>Add to Purchase Flow</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}