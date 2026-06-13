import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createStudent, deleteStudent, fetchClasses, fetchStudents } from "@/lib/portal-api";
import { downloadClassStudentsPdf } from "@/lib/fee-receipt";
import { PageHeader, EmptyState, QueryState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Search, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/students/")({
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const [className, setClassName] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);
  const qc = useQueryClient();
  const { roles } = useAuth();
  const isAdmin = primaryRole(roles) === "admin";

  const classesQ = usePortalQuery({ queryKey: ["classes"], queryFn: fetchClasses });

  useEffect(() => {
    if (!className && classesQ.data?.length) {
      const withStudents = classesQ.data.find((c) => (c.studentCount ?? 0) > 0);
      setClassName(withStudents?.id ?? classesQ.data[0].id);
    }
  }, [classesQ.data, className]);

  const studentsQ = usePortalQuery({
    enabled: !!className,
    queryKey: ["admin-students", className],
    queryFn: () => fetchStudents(className!),
  });

  const students = studentsQ.data;
  const selectedClass = classesQ.data?.find((c) => c.id === className);

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

  const downloadPdf = async () => {
    if (!className) {
      toast.error("Select a class first");
      return;
    }
    setDownloading(true);
    try {
      await downloadClassStudentsPdf(className);
      toast.success("Student list PDF downloaded (DOB not included)");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const err = classesQ.isError
    ? (classesQ.error as Error).message
    : studentsQ.isError
      ? (studentsQ.error as Error).message
      : null;

  return (
    <QueryState
      loading={classesQ.isLoading}
      error={err}
      onRetry={() => {
        classesQ.refetch();
        studentsQ.refetch();
      }}
    >
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Students"
          subtitle={
            selectedClass
              ? `${filtered.length} students in ${selectedClass.name}`
              : "Select a class to view students"
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" disabled={!className || downloading} onClick={downloadPdf}>
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
              </Button>
              {isAdmin ? (
                <AddStudentDialog
                  classes={classesQ.data ?? []}
                  onCreated={() => qc.invalidateQueries({ queryKey: ["admin-students"] })}
                />
              ) : undefined}
            </div>
          }
        />

        <div className="card-elevated mb-4 flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-[200px] flex-1">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Class</p>
            <Select value={className} onValueChange={setClassName}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {(classesQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.studentCount ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          {studentsQ.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading students…</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Roll</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Parent Phone</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs font-semibold">{s.roll_number}</td>
                      <td className="p-3 font-medium">{s.full_name}</td>
                      <td className="p-3">{s.classes ? `${s.classes.name}` : "—"}</td>
                      <td className="p-3">{s.parent_phone ?? "—"}</td>
                      <td className="p-3 space-x-1 text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/admin/students/$id" params={{ id: s.id }}>
                            View
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <EmptyState
                  title="No students in this class"
                  hint={selectedClass ? `No students enrolled in ${selectedClass.name}.` : "Select a class above."}
                />
              )}
            </>
          )}
        </div>
      </div>
    </QueryState>
  );
}

function AddStudentDialog({ classes, onCreated }: { classes: Array<{ id: string; name: string }>; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", roll_number: "", dob: "", class_id: "", parent_phone: "", fee_amount: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createStudent({
        full_name: form.full_name,
        roll_number: form.roll_number,
        dob: form.dob,
        class_id: form.class_id,
        parent_phone: form.parent_phone || null,
        fee_amount: form.fee_amount ? Number(form.fee_amount) : null,
      });
      toast.success("Student added");
      setForm({ full_name: "", roll_number: "", dob: "", class_id: "", parent_phone: "", fee_amount: "" });
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
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Parent phone</Label><Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} /></div>
            <div><Label>Fee amount (₹)</Label><Input type="number" min="0" placeholder="e.g. 8000" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: e.target.value })} /></div>
          </div>
          <p className="text-xs text-muted-foreground">DOB is used as the student login password and is not shown in exported PDFs.</p>
          <Button type="submit" className="w-full" disabled={busy}>Add Student</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
