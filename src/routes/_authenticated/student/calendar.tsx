import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchCalendarEvents } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/student/calendar")({ component: Page });

function fmtEventDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Page() {
  const year = String(new Date().getFullYear());
  const { data } = usePortalQuery({
    queryKey: ["calendar", year],
    queryFn: () => fetchCalendarEvents(year),
  });

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (data ?? []).filter((e) => e.date >= today);
  }, [data]);

  const past = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (data ?? []).filter((e) => e.date < today).reverse();
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Academic Calendar" subtitle="Holidays, exams, and important dates" />
      <div className="space-y-6">
        {upcoming.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Upcoming</h3>
            <div className="space-y-2">
              {upcoming.map((e) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  date={e.date}
                  description={e.description}
                  classLabel={e.class_label}
                />
              ))}
            </div>
          </section>
        )}
        {past.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Past events</h3>
            <div className="space-y-2">
              {past.map((e) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  date={e.date}
                  description={e.description}
                  classLabel={e.class_label}
                  muted
                />
              ))}
            </div>
          </section>
        )}
        {!data?.length && (
          <EmptyState title="No calendar events yet" hint="Your school will post holidays and exam dates here" />
        )}
      </div>
    </div>
  );
}

function EventCard({
  title,
  date,
  description,
  classLabel,
  muted,
}: {
  title: string;
  date: string;
  description: string;
  classLabel?: string;
  muted?: boolean;
}) {
  return (
    <div className={`card-elevated flex gap-3 p-4 ${muted ? "opacity-75" : ""}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <CalendarDays className="h-5 w-5" />
      </div>
      <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{title}</p>
                        {classLabel && classLabel !== "All classes" && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {classLabel}
                          </span>
                        )}
                      </div>
        <p className="text-xs text-muted-foreground">{fmtEventDate(date)}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
