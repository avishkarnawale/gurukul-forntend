import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { clearSession } from "@/lib/api";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { StudentNotificationBell } from "@/components/StudentNotificationBell";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session, loading, roles } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const role = primaryRole(roles);
  const isStudent = role === "student";

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (loading || !session) return;
    // Redirect students away from /admin and vice versa
    if (path.startsWith("/admin") && role === "student") navigate({ to: "/student" });
    if (path.startsWith("/student") && (role === "admin" || role === "staff")) navigate({ to: "/admin" });
    // Teachers (staff) cannot access Fees or Teacher-management pages.
    if (role === "staff" && (path.startsWith("/admin/fees") || path.startsWith("/admin/teachers"))) {
      navigate({ to: "/admin" });
    }
  }, [path, role, loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar role={primaryRole(roles)} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-display text-sm font-semibold">Gurukul Classes</span>
            </div>
            <div className="flex items-center gap-1">
              {isStudent && <StudentNotificationBell />}
              <Button
                variant="ghost" size="sm"
                onClick={() => { clearSession(); navigate({ to: "/login" }); }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
