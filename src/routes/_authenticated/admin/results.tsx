import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createGrade, deleteGrade, fetchAllGrades, fetchClasses, fetchStudentsByClass } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/results")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = usePortalQuery({ queryKey: ["admin-results"], queryFn: fetchAllGrades });

  const remove = async (id: string) => {
    try {
      await deleteGrade(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-results"] });
      qc.invalidateQueries({ queryKey: ["my-results"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Results"
        subtitle="Record exam marks for students"
        action={<NewResult onDone={() => qc.invalidateQueries({ queryKey: ["admin-results"] })} />}
      />
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Exam</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Marks</th>
              <th className="p-3">Date</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{r.students?.full_name}</div>
                  <div className="text-xs text-muted-foreground">Roll {r.students?.roll_number}</div>
                </td>
                <td className="p-3">{r.exam_name}</td>
                <td className="p-3">{r.subjects?.name ?? "—"}</td>
                <td className="p-3 font-mono">{r.marks} / {r.max_marks}</td>
                <td className="p-3 text-xs text-muted-foreground">{r.exam_date}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <EmptyState title="No results yet" hint="Click Add Result to record marks" />}
      </div>
    </div>
  );
}

function NewResult({ onDone }: { onDone: () => void }) {
  const emptyForm = {
    class_id: "",
    student_id: "",
    exam_name: "midterm",
    subject: "",
    marks: "",
    max_marks: "50",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: classes } = usePortalQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    enabled: open,
  });

  const { data: students, isLoading: studentsLoading } = usePortalQuery({
    queryKey: ["students-by-class", form.class_id],
    queryFn: () => fetchStudentsByClass(form.class_id),
    enabled: open && !!form.class_id,
  });

  useEffect(() => {
    if (!open || form.class_id || !classes?.length) return;
    const withStudents = classes.find((c) => (c.studentCount ?? 0) > 0);
    setForm((f) => ({ ...f, class_id: withStudents?.id ?? classes[0].id }));
  }, [open, classes, form.class_id]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setForm(emptyForm);
  };

  const onClassChange = (classId: string) => {
    setForm((f) => ({ ...f, class_id: classId, student_id: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id) {
      toast.error("Please select a class first.");
      return;
    }
    if (!form.student_id) {
      toast.error("Please select a student from this class.");
      return;
    }
    const inClass = (students ?? []).some((s) => s.id === form.student_id);
    if (!inClass) {
      toast.error("Selected student is not in this class.");
      return;
    }
    try {
      await createGrade({
        student_id: form.student_id,
        class_id: form.class_id,
        exam_name: form.exam_name,
        subject: form.subject,
        marks: Number(form.marks),
        max_marks: Number(form.max_marks),
      });
      toast.success("Result saved");
      onDone();
      setForm(emptyForm);
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const selectedClass = classes?.find((c) => c.id === form.class_id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Result</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record marks</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Class</Label>
            <Select value={form.class_id} onValueChange={onClassChange}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {(classes ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.studentCount ?? 0} students)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Only students enrolled in this class can receive marks.
            </p>
          </div>
          <div>
            <Label>Student</Label>
            <Select
              value={form.student_id}
              onValueChange={(v) => setForm({ ...form, student_id: v })}
              disabled={!form.class_id || studentsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !form.class_id
                      ? "Select class first"
                      : studentsLoading
                        ? "Loading students…"
                        : (students ?? []).length
                          ? "Select student"
                          : "No students in this class"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(students ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.class_id && !studentsLoading && !(students ?? []).length && (
              <p className="mt-1 text-xs text-destructive">
                No students in {selectedClass?.name ?? "this class"}. Add students first.
              </p>
            )}
          </div>
          <div>
            <Label>Exam type</Label>
            <Select value={form.exam_name} onValueChange={(v) => setForm({ ...form, exam_name: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["midterm", "final", "internal", "practical", "assignment"].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marks</Label><Input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} required /></div>
            <div><Label>Max marks</Label><Input type="number" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} required /></div>
          </div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
