import { Badge } from "@/components/ui/badge";

export type PolicyStatus = "Active" | "Renewal Due" | "Lapsed";

export function StatusPill({ status }: { status: PolicyStatus }) {
  const cfg: Record<PolicyStatus, { color: string }> = {
    Active: { color: "bg-emerald-500" },
    "Renewal Due": { color: "bg-yellow-500" },
    Lapsed: { color: "bg-red-500" },
  };
  const { color } = cfg[status];
  return (
    <Badge variant="outline" className="flex items-center gap-2 pr-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {status}
    </Badge>
  );
}
