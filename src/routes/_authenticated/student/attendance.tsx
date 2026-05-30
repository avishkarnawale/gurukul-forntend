import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchMyAttendance } from "@/lib/portal-api";
import { PageHeader, StatCard, QueryState } from "@/components/portal/ui";
import { Calendar as CalIcon, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/attendance")({ component: Page });

function Page() {
  const { data, isLoading, isError, error, refetch } = usePortalQuery({
    queryKey: ["my-attendance"],
    queryFn: fetchMyAttendance,
    refetchOnMount: "always",
  });

  const total = data?.length ?? 0;
  const present = data?.filter((r) => r.status === "present").length ?? 0;
  const absent = data?.filter((r) => r.status === "absent").length ?? 0;
  const pct = total ? Math.round((present / total) * 100) : 0;

  return (
    <QueryState
      loading={isLoading}
      error={isError ? (error as Error).message : null}
      onRetry={() => refetch()}
    >
      <div className="mx-auto max-w-5xl">
        <PageHeader title="My Attendance" subtitle="All marked days since start of class" />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Percentage" value={`${pct}%`} icon={CalIcon} accent="primary" />
          <StatCard label="Present" value={present} icon={CheckCircle2} accent="success" />
          <StatCard label="Absent" value={absent} icon={XCircle} accent="warning" />
        </div>
        <div className="card-elevated mt-6 p-6">
          <h3 className="font-display text-base font-bold">Recent Days</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
            {(data ?? []).map((d) => (
              <div
                key={d.id}
                className={`rounded-lg border p-2 text-center text-xs ${d.status === "present" ? "border-success/30 bg-success/10 text-success" : d.status === "absent" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning"}`}
              >
                <p className="font-semibold">{new Date(d.date + "T12:00:00").getDate()}</p>
                <p className="opacity-70">
                  {new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}
                </p>
                <p className="mt-0.5 text-[10px] capitalize opacity-80">{d.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </QueryState>
  );
}
