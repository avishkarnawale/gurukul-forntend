import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { fetchUnreadNotificationCount } from "@/lib/portal-api";

/** Poll unread count and toast when new academic notices arrive. */
export function useStudentNotificationPoller() {
  const { session, role, user } = useAuth();
  const qc = useQueryClient();
  const prev = useRef<number | null>(null);
  const enabled = !!session && role === "student" && !!user?.id;

  const { data: count = 0 } = useQuery({
    queryKey: ["notifications-unread", user?.id],
    queryFn: fetchUnreadNotificationCount,
    enabled,
    refetchInterval: 25_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!enabled) return;
    if (prev.current === null) {
      prev.current = count;
      return;
    }
    if (count > prev.current) {
      toast.info("New academic notice", {
        description: "Open Notices or tap the bell to read.",
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/student/notices";
          },
        },
      });
      qc.invalidateQueries({ queryKey: ["student-notifications-list"] });
      qc.invalidateQueries({ queryKey: ["student-dashboard"] });
      qc.invalidateQueries({ queryKey: ["student-notices"] });
    }
    prev.current = count;
  }, [count, enabled, qc]);

  return count;
}
