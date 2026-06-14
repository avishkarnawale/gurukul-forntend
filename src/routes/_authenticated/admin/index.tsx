import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchAdminDashboard } from "@/lib/portal-api";
import { PageHeader, StatCard, QueryState } from "@/components/portal/ui";
import { Users, Wallet, ClipboardCheck, GraduationCap } from "lucide-react";
import { useAuth, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { roles } = useAuth();
  const isAdmin = primaryRole(roles) === "admin";
  const { data, isLoading, isError, error, refetch } = usePortalQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    staleTime: 2 * 60_000,
  });

  const stats = data?.stats;

  return (
    <QueryState loading={isLoading} error={isError ? (error as Error).message : null} onRetry={() => refetch()}>
      <div className="mx-auto max-w-7xl">
        <PageHeader title={isAdmin ? "Admin Dashboard" : "Staff Dashboard"} subtitle="Quick overview of your tuition class" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Students" value={stats?.students ?? 0} icon={Users} accent="primary" />
          <StatCard label="Staff" value={stats?.staff ?? 0} icon={GraduationCap} accent="muted" />
          {isAdmin && <StatCard label="Pending Fees" value={`₹${(stats?.due ?? 0).toLocaleString()}`} icon={Wallet} accent="warning" />}
          <StatCard label="7-day Attendance" value={`${stats?.attPct ?? 0}%`} icon={ClipboardCheck} accent="success" />
        </div>
        <div className="card-elevated mt-6 p-6">
          <h3 className="font-display text-base font-bold">Quick Actions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Use the sidebar to manage Students, Teachers, Attendance, Homework, Fees and Notices."
              : "Use the sidebar to manage Attendance, Homework, Notes, Results and Notices."}
          </p>
        </div>
      </div>
    </QueryState>
  );
}
