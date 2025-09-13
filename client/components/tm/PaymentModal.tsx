import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { downloadReceipt } from "./receipt";
import { toast } from "sonner";

export interface PaymentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  policyId: string;
  customer: string;
  amount: number;
}

export function PaymentModal({ open, onOpenChange, policyId, customer, amount }: PaymentModalProps) {
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [vpa, setVpa] = useState("customer@upi");
  const upiString = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(customer)}&am=${amount}&tn=${encodeURIComponent("Policy "+policyId)}`;

  useEffect(() => {
    if (open && method === "upi" && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, upiString, { width: 220 }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [open, method, upiString]);

  async function handlePay(selectedMethod: string) {
    setProcessing(true);
    try {
      // Call your backend to initiate the payment workflow
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, amount, customer, method: selectedMethod }),
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed.');
      }
      
      // The backend has now started the workflow.
      // For this demo, we'll assume an immediate success and generate a receipt.
      // In a real app, you would listen for a webhook or poll for status.
      const txnId = `TXN-${selectedMethod.toUpperCase()}-${Date.now()}`;
      downloadReceipt({ policyId, customer, amount, method: selectedMethod.toUpperCase(), txnId, timestamp: new Date().toLocaleString() });
      toast.success("Payment successful", { description: `Txn ${txnId}` });
      onOpenChange(false);
      
    } catch (e) {
      toast.error("Payment failed", { description: (e as Error).message });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make Payment • ₹{amount.toFixed(2)}</DialogTitle>
        </DialogHeader>
        <Tabs value={method} onValueChange={setMethod}>
          <TabsList className="mb-4">
            <TabsTrigger value="upi">UPI</TabsTrigger>
            <TabsTrigger value="card">Card</TabsTrigger>
            <TabsTrigger value="netbanking">Net Banking</TabsTrigger>
          </TabsList>
          <TabsContent value="upi" className="space-y-4">
            <div className="flex gap-6">
              <div className="rounded-lg border p-4">
                <canvas ref={canvasRef} className="bg-white" />
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-sm font-medium">VPA (UPI ID)</label>
                <Input value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="name@bank" />
                <p className="text-sm text-muted-foreground">Scan the QR or pay to this VPA. Auto-confirms on success.</p>
                <div className="pt-2">
                  <Button onClick={() => handlePay("upi")} disabled={processing}>
                    {processing ? "Processing..." : "Confirm Payment"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="card" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Card Number</label>
                  <Input placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div>
                  <label className="text-sm font-medium">Expiry</label>
                  <Input placeholder="MM/YY" />
                </div>
                <div>
                  <label className="text-sm font-medium">CVV</label>
                  <Input placeholder="***" type="password" />
                </div>
                <div className="col-span-2 pt-2">
                  <Button onClick={() => handlePay("card")} disabled={processing}>
                    {processing ? "Processing..." : "Pay Now"}
                  </Button>
                </div>
              </div>
          </TabsContent>
          <TabsContent value="netbanking" className="space-y-3">
             <label className="text-sm font-medium">Select Bank</label>
             <Input placeholder="e.g., HDFC, ICICI, SBI" />
             <div className="pt-2">
               <Button onClick={() => handlePay("netbanking")} disabled={processing}>
                 {processing ? "Processing..." : "Proceed to Bank"}
               </Button>
             </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}