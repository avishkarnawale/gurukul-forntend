import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createCalendarEvent, deleteCalendarEvent, fetchCalendarEvents } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/calendar")({ component: Page });

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
  const qc = useQueryClient();
  const year = String(new Date().getFullYear());
  const { data } = usePortalQuery({
    queryKey: ["calendar", year],
    queryFn: () => fetchCalendarEvents(year),
  });

  const remove = async (id: string) => {
    try {
      await deleteCalendarEvent(id);
      toast.success("Event removed");
      qc.invalidateQueries({ queryKey: ["calendar"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof data>();
    for (const e of data ?? []) {
      const key = e.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Academic Calendar"
        subtitle="Add holidays, exams, and important dates for students"
        action={
          <NewEvent
            onDone={() => qc.invalidateQueries({ queryKey: ["calendar"] })}
          />
        }
      />
      <div className="space-y-6">
        {grouped.map(([monthKey, events]) => (
          <div key={monthKey}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h3>
            <div className="space-y-2">
              {events!.map((e) => (
                <div key={e.id} className="card-elevated flex items-start justify-between gap-3 p-4">
                  <div className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtEventDate(e.date)}</p>
                      {e.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!data?.length && (
          <EmptyState title="No calendar events" hint="Add holidays, exam dates, or other important days" />
        )}
      </div>
    </div>
  );
}

function NewEvent({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().slice(0, 10), description: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCalendarEvent(form);
      toast.success("Event added");
      onDone();
      setOpen(false);
      setForm({ title: "", date: new Date().toISOString().slice(0, 10), description: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add calendar event</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Event name</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Diwali holiday, Unit test"
              required
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Details (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Extra notes for students"
            />
          </div>
          <Button type="submit" className="w-full">
            Save event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
