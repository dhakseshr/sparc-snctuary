import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadReceipt } from "./receipt";
import { toast } from "sonner";

export interface DepositPolicy {
  id: string;
  customer: string;
  amount: number;
}

export function CashDeposit({
  policies,
  onApproved,
}: {
  policies: DepositPolicy[];
  onApproved: (policyId: string, txnId: string) => void;
}) {
  const payable = useMemo(() => policies, [policies]);
  const [policyId, setPolicyId] = useState(payable[0]?.id ?? "");
  const selected = payable.find((p) => p.id === policyId) ?? null;
  const [requestId, setRequestId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!qrData || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrData, { width: 260 }, (err) => {
      if (err) console.error(err);
    });
  }, [qrData]);

  function generate() {
    if (!selected) return;
    const rid = `REQ-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    setRequestId(rid);
    const payload = {
      type: "CASH_DEPOSIT",
      policyId: selected.id,
      amount: selected.amount,
      requestId: rid,
      ts: Date.now(),
    };
    const encoded = `deposit://pay?d=${encodeURIComponent(JSON.stringify(payload))}`;
    setQrData(encoded);
    toast.info("QR generated. Show at kiosk to accept cash.");
  }

  function approve() {
    if (!selected || !requestId) return;
    const txnId = `KIOSK-${requestId}`;
    onApproved(selected.id, txnId);
    downloadReceipt({
      policyId: selected.id,
      customer: selected.customer,
      amount: selected.amount,
      method: "CASH-QR",
      txnId,
      timestamp: new Date().toLocaleString(),
    });
    setQrData(null);
    setRequestId(null);
    toast.success("Kiosk approved. Marked as paid.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cash Deposit via QR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Policy</label>
            <Select value={policyId} onValueChange={setPolicyId}>
              <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
              <SelectContent>
                {payable.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.id} • {p.customer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            {/* FIX: Check if 'selected' exists before accessing 'amount' */}
            <Input value={selected ? `₹ ${(selected.amount || 0).toLocaleString()}` : ""} readOnly />
          </div>
          <div className="flex items-end">
            <Button onClick={generate} disabled={!selected}>Generate QR</Button>
          </div>
        </div>

        {qrData && (
          <div className="mt-2 grid grid-cols-2 gap-6">
            <div className="rounded-lg border bg-white p-4">
              <canvas ref={canvasRef} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">Request ID</div>
              <div className="font-mono text-sm">{requestId}</div>
              <div className="text-muted-foreground">Policy ID</div>
              <div className="font-medium">{selected?.id}</div>
              <div className="text-muted-foreground">Instructions</div>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Show this QR at partner kiosk.</li>
                <li>Kiosk accepts cash and confirms.</li>
                <li>System marks the policy as paid automatically.</li>
              </ol>
              <div className="pt-2">
                <Button onClick={approve}>Simulate Kiosk Approval</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}