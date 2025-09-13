export interface ReceiptData {
  policyId: string;
  customer: string;
  amount: number;
  method: string;
  txnId: string;
  timestamp: string;
}

export function downloadReceipt(data: ReceiptData) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${data.txnId}</title>
  <style>
  body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:32px;color:#0b1727}
  .card{max-width:640px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:24px}
  h1{font-size:20px;margin:0 0 16px;color:#065f46}
  .row{display:flex;justify-content:space-between;margin:8px 0}
  .muted{color:#6b7280}
  .footer{margin-top:16px;font-size:12px;color:#6b7280}
  </style></head><body>
  <div class="card">
    <h1>Turtlemint B2B • Payment Receipt</h1>
    <div class="row"><span class="muted">Transaction ID</span><strong>${data.txnId}</strong></div>
    <div class="row"><span class="muted">Policy ID</span><strong>${data.policyId}</strong></div>
    <div class="row"><span class="muted">Customer</span><strong>${data.customer}</strong></div>
    <div class="row"><span class="muted">Amount</span><strong>₹ ${data.amount.toFixed(2)}</strong></div>
    <div class="row"><span class="muted">Method</span><strong>${data.method}</strong></div>
    <div class="row"><span class="muted">Time</span><strong>${data.timestamp}</strong></div>
    <p class="footer">This is a system-generated receipt.</p>
  </div>
  <script>window.onload=()=>window.print&&window.print()</script>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${data.txnId}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
