import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchMyFees, feeReceiptPayments, type StudentFee } from "@/lib/portal-api";
import { downloadFeeReceipt } from "@/lib/fee-receipt";
import { PageHeader, StatCard, EmptyState, QueryState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/fees")({ component: Page });

function Page() {
  const { data, isLoading, isError, error, refetch } = usePortalQuery({
    queryKey: ["my-fees"],
    queryFn: fetchMyFees,
  });

  const fees = data?.fees ?? [];
  const total = fees.reduce((s, f) => s + Number(f.total_amount), 0);
  const paid = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const due = total - paid;

  const receiptFees = fees.filter((f) => feeReceiptPayments(f).length > 0);

  return (
    <QueryState loading={isLoading} error={isError ? (error as Error).message : null} onRetry={() => refetch()}>
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Fees" subtitle="Your fee summary, history, and payment receipts" />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total" value={`₹${total.toLocaleString()}`} icon={Wallet} accent="primary" />
          <StatCard label="Paid" value={`₹${paid.toLocaleString()}`} icon={CheckCircle2} accent="success" />
          <StatCard label="Pending" value={`₹${due.toLocaleString()}`} icon={AlertCircle} accent="warning" />
        </div>

        {receiptFees.length > 0 && data?.student && (
          <div className="card-elevated mt-6 p-6">
            <h3 className="font-display text-base font-bold">Payment receipts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Download official PDF receipts for fees you have paid.
            </p>
            <div className="mt-4 space-y-3">
              {receiptFees.map((fee) => (
                <FeeReceiptBlock key={fee.id} fee={fee} student={data.student} />
              ))}
            </div>
          </div>
        )}

        <div className="card-elevated mt-6 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Term</th>
                <th className="p-3">Total</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="p-3 font-medium">{f.term}</td>
                  <td className="p-3">₹{Number(f.total_amount).toLocaleString()}</td>
                  <td className="p-3">₹{Number(f.paid_amount).toLocaleString()}</td>
                  <td className="p-3">{f.due_date}</td>
                  <td className="p-3">
                    <StatusPill s={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fees.length && <EmptyState title="No fee records yet" />}
        </div>
      </div>
    </QueryState>
  );
}

function FeeReceiptBlock({
  fee,
  student,
}: {
  fee: StudentFee;
  student: { name: string; rollNumber: string; class: string };
}) {
  const payments = feeReceiptPayments(fee);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{fee.term}</p>
          <p className="text-xs text-muted-foreground">
            Paid ₹{fee.paid_amount.toLocaleString()} of ₹{fee.total_amount.toLocaleString()} ·{" "}
            <span className="capitalize">{fee.status}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {payments.map((p) => (
          <ReceiptDownloadButton key={p.id} fee={fee} payment={p} student={student} />
        ))}
      </div>
    </div>
  );
}

function ReceiptDownloadButton({
  fee,
  payment,
  student,
}: {
  fee: StudentFee;
  payment: { id: string; amount: number; date: string; method: string; receipt_no: string };
  student: { name: string; rollNumber: string; class: string };
}) {
  const [busy, setBusy] = useState(false);
  const paymentId = payment.id.endsWith("-summary") ? "summary" : payment.id;

  const download = async () => {
    setBusy(true);
    try {
      await downloadFeeReceipt(fee.id, paymentId);
      toast.success("PDF receipt downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={() => download()}>
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {payment.receipt_no || "Receipt"} · ₹{payment.amount.toLocaleString()}
    </Button>
  );
}

function StatusPill({ s }: { s: string }) {
  const cls =
    s === "paid"
      ? "bg-success/15 text-success"
      : s === "partial"
        ? "bg-warning/30 text-warning-foreground"
        : "bg-destructive/15 text-destructive";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{s}</span>;
}
