import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchAdminDashboard } from "@/lib/portal-api";
import { PageHeader, StatCard, QueryState } from "@/components/portal/ui";
import { Users, Wallet, ClipboardCheck, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = usePortalQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  const stats = data?.stats;

  return (
    <QueryState
      loading={isLoading}
      error={isError ? (error as Error).message : null}
      onRetry={() => refetch()}
    >
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Admin Dashboard" subtitle="Quick overview of your tuition class" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={stats?.students ?? 0}
            icon={Users}
            accent="primary"
          />
          <StatCard label="Staff" value={stats?.staff ?? 0} icon={GraduationCap} accent="muted" />
          <StatCard
            label="Pending Fees"
            value={`₹${(stats?.due ?? 0).toLocaleString()}`}
            icon={Wallet}
            accent="warning"
          />
          <StatCard
            label="7-day Attendance"
            value={`${stats?.attPct ?? 0}%`}
            icon={ClipboardCheck}
            accent="success"
          />
        </div>
        <div className="card-elevated mt-6 p-6">
          <h3 className="font-display text-base font-bold">Quick Actions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the sidebar to manage Students, Attendance, Homework, Fees and Notices.
          </p>
        </div>
      </div>
    </QueryState>
  );
}
