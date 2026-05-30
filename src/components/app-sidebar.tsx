import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Calendar, BookOpen, Wallet, Bell, GraduationCap,
  Users, ClipboardCheck, FileText, FileQuestion, Trophy, UserCog, MessageCircle,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import type { AppRole } from "@/hooks/use-auth";

const studentItems = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Attendance", url: "/student/attendance", icon: Calendar },
  { title: "Homework", url: "/student/homework", icon: BookOpen },
  { title: "Notes", url: "/student/notes", icon: FileText },
  { title: "PYQs", url: "/student/pyqs", icon: FileQuestion },
  { title: "Results", url: "/student/results", icon: Trophy },
  { title: "Fees", url: "/student/fees", icon: Wallet },
  { title: "Notices", url: "/student/notices", icon: Bell },
  { title: "Contact", url: "/student/contact", icon: MessageCircle },
];

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Teachers", url: "/admin/teachers", icon: UserCog },
  { title: "Attendance", url: "/admin/attendance", icon: ClipboardCheck },
  { title: "Homework", url: "/admin/homework", icon: BookOpen },
  { title: "Notes", url: "/admin/notes", icon: FileText },
  { title: "PYQs", url: "/admin/pyqs", icon: FileQuestion },
  { title: "Results", url: "/admin/results", icon: Trophy },
  { title: "Fees", url: "/admin/fees", icon: Wallet },
  { title: "Notices", url: "/admin/notices", icon: Bell },
];

// Teachers (staff) get operational tools only — no Teachers management, no Fees.
const staffItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Attendance", url: "/admin/attendance", icon: ClipboardCheck },
  { title: "Homework", url: "/admin/homework", icon: BookOpen },
  { title: "Notes", url: "/admin/notes", icon: FileText },
  { title: "PYQs", url: "/admin/pyqs", icon: FileQuestion },
  { title: "Results", url: "/admin/results", icon: Trophy },
  { title: "Notices", url: "/admin/notices", icon: Bell },
];

export function AppSidebar({ role }: { role: AppRole | null }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = role === "student" ? studentItems : role === "staff" ? staffItems : adminItems;
  const label = role === "student" ? "Student Portal" : role === "staff" ? "Staff Portal" : "Admin Portal";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate font-display text-sm font-bold">Gurukul Classes</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = it.url === "/student" || it.url === "/admin"
                  ? path === it.url
                  : path.startsWith(it.url);
                return (
                  <SidebarMenuItem key={it.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url} className="flex items-center gap-2">
                        <it.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{it.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
