import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { deleteNote, fetchClasses, fetchNotes, uploadNote } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pyqs")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = usePortalQuery({ queryKey: ["admin-pyqs"], queryFn: () => fetchNotes("pyq") });

  const remove = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-pyqs"] });
      qc.invalidateQueries({ queryKey: ["student-pyqs"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="PYQs" subtitle="Previous year question papers" action={<NewPyq onDone={() => qc.invalidateQueries({ queryKey: ["admin-pyqs"] })} />} />
      <div className="grid gap-3 sm:grid-cols-2">
        {(data ?? []).map((n) => (
          <div key={n.id} className="card-elevated p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base font-bold">{n.title}</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{n.subjects?.name}</p>
            {n.file_url && (
              <a href={n.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Download className="h-3 w-3" /> Open
              </a>
            )}
          </div>
        ))}
        {!data?.length && <EmptyState title="No PYQs yet" />}
      </div>
    </div>
  );
}

function NewPyq({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetClass: "", subject: "", fileUrl: "", year: "" });
  const { data: classes } = usePortalQuery({ queryKey: ["classes"], queryFn: fetchClasses, enabled: open });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await uploadNote({
        type: "pyq",
        title: form.title,
        description: form.description,
        subject: form.subject,
        targetClass: form.targetClass || undefined,
        fileUrl: form.fileUrl,
        year: form.year ? Number(form.year) : undefined,
      });
      toast.success("PYQ added");
      onDone();
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Upload PYQ</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload PYQ</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
          <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div>
            <Label>Class</Label>
            <Select value={form.targetClass} onValueChange={(v) => setForm({ ...form, targetClass: v })}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {(classes ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>File URL</Label><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} required /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
