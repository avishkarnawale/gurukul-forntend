import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/portal-api";
import { useStudentNotificationPoller } from "@/hooks/use-student-notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function StudentNotificationBell() {
  const qc = useQueryClient();
  const unread = useStudentNotificationPoller();

  const { data } = usePortalQuery({
    queryKey: ["student-notifications-list"],
    queryFn: fetchMyNotifications,
  });

  const items = data?.items ?? [];
  const unreadFromList = data?.unread ?? unread;

  const markOne = async (id: string) => {
    try {
      await markNotificationRead(id);
      qc.invalidateQueries({ queryKey: ["student-notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    } catch {
      toast.error("Could not update notification");
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      qc.invalidateQueries({ queryKey: ["student-notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    } catch {
      toast.error("Could not clear notifications");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadFromList > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadFromList > 9 ? "9+" : unreadFromList}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadFromList > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={markAll}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {!items.length && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={`border-b px-3 py-2.5 last:border-0 ${n.read ? "opacity-70" : "bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                {!n.read && <Badge variant="secondary" className="shrink-0 text-[10px]">New</Badge>}
              </div>
              {n.body && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              )}
              <div className="mt-2 flex gap-2">
                <Link
                  to={n.link}
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => !n.read && markOne(n.id)}
                >
                  Open notices
                </Link>
                {!n.read && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => markOne(n.id)}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
