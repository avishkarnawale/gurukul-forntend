import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchNotes } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/pyqs")({ component: Page });

function Page() {
  const { data } = usePortalQuery({ queryKey: ["student-pyqs"], queryFn: () => fetchNotes("pyq") });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Previous Year Papers" subtitle="PYQs uploaded by teachers" />
      <div className="grid gap-3 sm:grid-cols-2">
        {(data ?? []).map((n) => (
          <div key={n.id} className="card-elevated p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-display text-base font-bold">{n.title}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{n.subjects?.name ?? "General"}</p>
            {n.description && <p className="mt-2 text-sm text-muted-foreground">{n.description}</p>}
            {n.file_url && (
              <a href={n.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Download className="h-3 w-3" /> Open PDF
              </a>
            )}
          </div>
        ))}
        {!data?.length && <EmptyState title="No PYQs uploaded yet" />}
      </div>
    </div>
  );
}
