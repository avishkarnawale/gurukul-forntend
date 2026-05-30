import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchStudentDashboard } from "@/lib/portal-api";
import { PageHeader, StatCard, EmptyState, QueryState } from "@/components/portal/ui";
import { Calendar, BookOpen, Wallet, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { data, isLoading, isError, error, refetch } = usePortalQuery({
    queryKey: ["student-dashboard"],
    queryFn: fetchStudentDashboard,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 15_000,
  });

  const student = data?.student;
  const stats = data?.stats;

  return (
    <QueryState
      loading={isLoading}
      error={isError ? (error as Error).message : null}
      onRetry={() => refetch()}
    >
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title={`Welcome${student?.full_name ? ", " + student.full_name.split(" ")[0] : ""}`}
          subtitle={
            student ? `${student.classes?.name ?? ""} · Roll ${student.roll_number}` : "Loading…"
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Attendance"
            value={`${stats?.attendance.pct ?? 0}%`}
            hint={`${stats?.attendance.present ?? 0} / ${stats?.attendance.total ?? 0} days`}
            icon={Calendar}
            accent="success"
          />
          <StatCard
            label="Pending Homework"
            value={stats?.homework.length ?? 0}
            hint="Upcoming deadlines"
            icon={BookOpen}
            accent="primary"
          />
          <StatCard
            label="Fees Due"
            value={`₹${(stats?.fees.due ?? 0).toLocaleString()}`}
            hint="Across all terms"
            icon={Wallet}
            accent="warning"
          />
          <StatCard
            label="Notices"
            value={stats?.notices.length ?? 0}
            hint="New announcements"
            icon={Bell}
            accent="muted"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card-elevated p-6">
            <h3 className="font-display text-base font-bold">Upcoming Homework</h3>
            <div className="mt-4 space-y-2">
              {(stats?.homework ?? []).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.subjects?.name ?? "—"}</p>
                  </div>
                  <div className="text-xs font-medium text-primary">Due {h.due_date}</div>
                </div>
              ))}
              {!stats?.homework.length && (
                <EmptyState title="No homework yet" hint="You're all caught up." />
              )}
            </div>
          </div>
          <div className="card-elevated p-6">
            <h3 className="font-display text-base font-bold">Latest Notices</h3>
            <div className="mt-4 space-y-2">
              {(stats?.notices ?? []).map((n) => (
                <div key={n.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.pinned && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                        PINNED
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.content}</p>
                </div>
              ))}
              {!stats?.notices.length && <EmptyState title="No notices" />}
            </div>
          </div>
        </div>
      </div>
    </QueryState>
  );
}
