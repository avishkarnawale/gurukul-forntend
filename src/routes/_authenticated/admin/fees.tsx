import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { assignMissingFees, fetchAllFees, updateFeePaid, updateFeeTotal } from "@/lib/portal-api";
import { PageHeader, EmptyState, StatCard } from "@/components/portal/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, AlertCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/fees")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data, refetch } = usePortalQuery({ queryKey: ["admin-fees"], queryFn: fetchAllFees });
  const [assigning, setAssigning] = useState(false);
  const [assignAmount, setAssignAmount] = useState("");

  const total = (data ?? []).reduce((s, f) => s + Number(f.total_amount), 0);
  const paid = (data ?? []).reduce((s, f) => s + Number(f.paid_amount), 0);

  const updatePaid = async (id: string, val: number) => {
    try {
      await updateFeePaid(id, val);
      toast.success("Updated — student can download PDF receipt after payment");
      qc.invalidateQueries({ queryKey: ["admin-fees"] });
      qc.invalidateQueries({ queryKey: ["my-fees"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const updateTotal = async (id: string, val: number) => {
    try {
      await updateFeeTotal(id, val);
      toast.success("Fee amount updated");
      qc.invalidateQueries({ queryKey: ["admin-fees"] });
      qc.invalidateQueries({ queryKey: ["my-fees"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const assignMissing = async () => {
    const amount = Number(assignAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a fee amount first");
      return;
    }
    setAssigning(true);
    try {
      const res = await assignMissingFees({ total_amount: amount });
      toast.success(res.message || `Created ${res.count} fee records`);
      setAssignAmount("");
      await refetch();
      qc.invalidateQueries({ queryKey: ["my-fees"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Fees"
        subtitle="Set each student's fee by their standard. Edit a total inline, or batch-assign an amount to students without a fee."
        action={
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Amount ₹"
              value={assignAmount}
              onChange={(e) => setAssignAmount(e.target.value)}
              className="h-9 w-28"
            />
            <Button variant="outline" disabled={assigning} onClick={assignMissing}>
              <UserPlus className="mr-2 h-4 w-4" />
              {assigning ? "Working…" : "Assign to students without fees"}
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total" value={`₹${total.toLocaleString()}`} icon={Wallet} accent="primary" />
        <StatCard label="Collected" value={`₹${paid.toLocaleString()}`} icon={CheckCircle2} accent="success" />
        <StatCard label="Pending" value={`₹${(total - paid).toLocaleString()}`} icon={AlertCircle} accent="warning" />
      </div>
      <div className="card-elevated mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Term</th>
              <th className="p-3">Total</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{f.students?.full_name}</div>
                  <div className="text-xs text-muted-foreground">{f.students?.roll_number}</div>
                </td>
                <td className="p-3">{f.term}</td>
                <td className="p-3">
                  <PaidEditor id={f.id} value={Number(f.total_amount)} onSave={updateTotal} prefix="₹" />
                </td>
                <td className="p-3">
                  <PaidEditor id={f.id} value={Number(f.paid_amount)} onSave={updatePaid} prefix="₹" />
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${f.status === "paid" ? "bg-success/15 text-success" : f.status === "partial" ? "bg-warning/30 text-warning-foreground" : "bg-destructive/15 text-destructive"}`}
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && (
          <EmptyState
            title="No fee records"
            hint='Enter an amount and click "Assign to students without fees", or set a fee amount when adding a student.'
          />
        )}
      </div>
    </div>
  );
}

function PaidEditor({ id, value, onSave, prefix }: { id: string; value: number; onSave: (id: string, v: number) => void; prefix?: string }) {
  const [v, setV] = useState(value.toString());
  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <Input type="number" min="0" value={v} onChange={(e) => setV(e.target.value)} className="h-8 w-24" />
      <Button size="sm" variant="outline" onClick={() => onSave(id, Number(v))}>
        Save
      </Button>
    </div>
  );
}
