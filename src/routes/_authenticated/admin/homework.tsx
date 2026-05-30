import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createHomework, deleteHomework, fetchClasses, fetchHomeworkAdmin } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/homework")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data: hw } = usePortalQuery({
    queryKey: ["admin-homework"],
    queryFn: fetchHomeworkAdmin,
  });

  const remove = async (id: string) => {
    if (!confirm("Delete this homework?")) return;
    try {
      await deleteHomework(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-homework"] });
      qc.invalidateQueries({ queryKey: ["my-homework"] });
      qc.invalidateQueries({ queryKey: ["student-dashboard"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Homework"
        subtitle="Assignments across all classes"
        action={
          <NewHomework onDone={() => qc.invalidateQueries({ queryKey: ["admin-homework"] })} />
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {(hw ?? []).map((h) => (
          <div key={h.id} className="card-elevated p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                {h.subjects?.name ?? "—"}
              </span>
              <Button size="sm" variant="ghost" onClick={() => remove(h.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <h3 className="mt-2 font-display text-base font-bold">{h.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{h.classes?.name}</span>
              <span>Due {h.due_date}</span>
            </div>
          </div>
        ))}
        {!hw?.length && <EmptyState title="No homework yet" />}
      </div>
    </div>
  );
}

function NewHomework({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    class: "",
    subject: "",
    title: "",
    description: "",
    due_date: "",
  });
  const { data: classes } = usePortalQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    enabled: open,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHomework(form);
      toast.success("Homework created — visible to students in that class");
      onDone();
      setOpen(false);
      setForm({ class: "", subject: "", title: "", description: "", due_date: "" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Homework
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Homework</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Class</Label>
            <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {(classes ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Due date</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
