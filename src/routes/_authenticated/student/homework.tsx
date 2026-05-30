import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchHomeworkStudent } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";

export const Route = createFileRoute("/_authenticated/student/homework")({ component: Page });

function Page() {
  const { data } = usePortalQuery({ queryKey: ["my-homework"], queryFn: fetchHomeworkStudent });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Homework" subtitle="All assignments for your class" />
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((h) => (
          <div key={h.id} className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                {h.subjects?.name ?? "General"}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Due {h.due_date}</span>
            </div>
            <h3 className="mt-3 font-display text-base font-bold">{h.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>
          </div>
        ))}
        {!data?.length && <EmptyState title="No homework assigned" />}
      </div>
    </div>
  );
}
