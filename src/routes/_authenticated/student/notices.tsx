import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchNotices, markAllNotificationsRead } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Pin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/notices")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = usePortalQuery({ queryKey: ["student-notices"], queryFn: fetchNotices });

  useEffect(() => {
    markAllNotificationsRead()
      .then(() => {
        qc.invalidateQueries({ queryKey: ["notifications-unread"] });
        qc.invalidateQueries({ queryKey: ["student-notifications-list"] });
      })
      .catch(() => {});
  }, [qc]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notices" subtitle="Announcements from your class" />
      <div className="space-y-3">
        {(data ?? []).map((n) => (
          <div key={n.id} className="card-elevated p-5">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold">{n.title}</h3>
              {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{n.content}</p>
          </div>
        ))}
        {!data?.length && <EmptyState title="No notices" />}
      </div>
    </div>
  );
}
