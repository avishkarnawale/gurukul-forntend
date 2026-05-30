import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createStudent, deleteStudent, fetchClasses, fetchStudents } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/students/")({
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data: students } = usePortalQuery({ queryKey: ["admin-students"], queryFn: fetchStudents });
  const { data: classes } = usePortalQuery({ queryKey: ["classes"], queryFn: fetchClasses });

  const filtered = (students ?? []).filter(
    (s) =>
      !q ||
      s.full_name.toLowerCase().includes(q.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(q.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this student and all related records?")) return;
    try {
      await deleteStudent(id);
      toast.success("Student deleted");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Students"
        subtitle={`${students?.length ?? 0} students enrolled`}
        action={<AddStudentDialog classes={classes ?? []} onCreated={() => qc.invalidateQueries({ queryKey: ["admin-students"] })} />}
      />
      <div className="card-elevated mb-4 flex items-center gap-3 p-3">
        <Search className="ml-1 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or roll number" value={q} onChange={(e) => setQ(e.target.value)} className="border-none shadow-none focus-visible:ring-0" />
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Roll</th><th className="p-3">Name</th><th className="p-3">Class</th><th className="p-3">DOB</th><th className="p-3">Parent Phone</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs font-semibold">{s.roll_number}</td>
                <td className="p-3 font-medium">{s.full_name}</td>
                <td className="p-3">{s.classes ? `${s.classes.name}` : "—"}</td>
                <td className="p-3">{s.dob}</td>
                <td className="p-3">{s.parent_phone ?? "—"}</td>
                <td className="p-3 space-x-1 text-right">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin/students/$id" params={{ id: s.id }}>
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState title="No students found" />}
      </div>
    </div>
  );
}

function AddStudentDialog({ classes, onCreated }: { classes: Array<{ id: string; name: string }>; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", roll_number: "", dob: "", class_id: "", parent_phone: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createStudent({ ...form, parent_phone: form.parent_phone || null });
      toast.success("Student added");
      setForm({ full_name: "", roll_number: "", dob: "", class_id: "", parent_phone: "" });
      setOpen(false);
      onCreated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a new student</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Roll number</Label><Input value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} required /></div>
            <div><Label>Date of birth</Label><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required /></div>
          </div>
          <div>
            <Label>Class</Label>
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Parent phone</Label><Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">Student&apos;s default password will be their DOB (YYYY-MM-DD).</p>
          <Button type="submit" className="w-full" disabled={busy}>Add Student</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
