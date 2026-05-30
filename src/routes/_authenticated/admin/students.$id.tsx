import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchStudentSummary, formatClassLabel } from "@/lib/portal-api";
import { downloadStudentReport } from "@/lib/fee-receipt";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/students/$id")({
  component: Page,
});

function Page() {
  const params = Route.useParams();
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading, error } = usePortalQuery({
    queryKey: ["admin-student-summary", params.id],
    queryFn: () => fetchStudentSummary(params.id),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadStudentReport(params.id, data?.student.rollNumber);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <EmptyState
        title="Could not load student"
        description={error instanceof Error ? error.message : "Something went wrong"}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Student details" />
        <p className="mt-4 text-sm text-muted-foreground">Loading student summary…</p>
      </div>
    );
  }

  const { student, attendance, tests, fees } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title={student.name}
        subtitle={`${student.rollNumber} · ${formatClassLabel(student.class)}`}
        action={
          <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold">Profile</h3>
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt>Roll</dt>
              <dd className="font-mono font-semibold text-foreground">{student.rollNumber}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Class</dt>
              <dd>{formatClassLabel(student.class)}</dd>
            </div>
            {student.board && (
              <div className="flex justify-between gap-2">
                <dt>Board</dt>
                <dd>{student.board}</dd>
              </div>
            )}
            {student.parentName && (
              <div className="flex justify-between gap-2">
                <dt>Parent</dt>
                <dd>{student.parentName}</dd>
              </div>
            )}
            {student.parentPhone && (
              <div className="flex justify-between gap-2">
                <dt>Parent phone</dt>
                <dd>{student.parentPhone}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold">Attendance</h3>
          <p className="mt-2 text-2xl font-bold">
            {attendance.summary.percentage}
            <span className="text-sm font-normal text-muted-foreground"> % present</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {attendance.summary.presentDays} present / {attendance.summary.totalDays} days
          </p>
          {attendance.recent.length > 0 && (
            <div className="mt-3 space-y-1 text-xs">
              <p className="font-medium text-muted-foreground">Last 5 days</p>
              {attendance.recent.slice(0, 5).map((r) => (
                <div key={r.id} className="flex justify-between">
                  <span>{r.date}</span>
                  <span
                    className={r.status === "present" ? "text-emerald-600" : "text-destructive"}
                  >
                    {r.status === "present" ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold">Pending fees</h3>
          <p className="mt-2 text-2xl font-bold">₹{fees.totalPending.toLocaleString("en-IN")}</p>
          {fees.items.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {fees.items.slice(0, 3).map((f) => (
                <li key={f.id}>
                  <span className="font-medium text-foreground">{f.term}</span> — Pending ₹
                  {f.pendingAmount.toLocaleString("en-IN")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No fee records.</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-display text-sm font-semibold">Last 3 test results</h3>
        {!tests.length && (
          <EmptyState
            title="No results yet"
            description="Once marks are added for this student, they will appear here."
          />
        )}
        {tests.length > 0 && (
          <table className="mt-3 w-full text-xs">
            <thead className="border-b text-left text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="pb-1 pr-2">Subject</th>
                <th className="pb-1 pr-2">Exam</th>
                <th className="pb-1 pr-2">Marks</th>
                <th className="pb-1">%</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-1 pr-2">{t.subject}</td>
                  <td className="py-1 pr-2">{t.examType}</td>
                  <td className="py-1 pr-2">
                    {t.marksObtained}/{t.totalMarks}
                  </td>
                  <td className="py-1">{t.percentage ?? "-"}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Button variant="ghost" size="sm" asChild>
        <Link to="/admin/students">Back to students</Link>
      </Button>
    </div>
  );
}
