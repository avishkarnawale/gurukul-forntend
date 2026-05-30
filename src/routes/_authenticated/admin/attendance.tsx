import { createFileRoute, Link } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClasses, fetchStudentsByClass, fetchClassAttendance, markAttendance } from "@/lib/portal-api";
import { PageHeader, EmptyState, QueryState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/attendance")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [className, setClassName] = useState<string | undefined>();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState<string | null>(null);

  const classesQ = usePortalQuery({ queryKey: ["classes"], queryFn: fetchClasses });
  useEffect(() => {
    if (!className && classesQ.data?.length) {
      const withStudents = classesQ.data.find((c) => (c.studentCount ?? 0) > 0);
      setClassName(withStudents?.id ?? classesQ.data[0].id);
    }
  }, [classesQ.data, className]);

  const studentsQ = usePortalQuery({
    enabled: !!className,
    queryKey: ["students-by-class", className],
    queryFn: () => fetchStudentsByClass(className!),
  });

  const markedQ = usePortalQuery({
    enabled: !!className,
    queryKey: ["attendance-day", className, date],
    queryFn: () => fetchClassAttendance(className!, date),
  });

  const mark = async (sid: string, status: "present" | "absent") => {
    if (!className) return;
    setSaving(sid);
    try {
      await markAttendance(className, date, sid, status);
      toast.success(status === "present" ? "Marked present" : "Marked absent");
      await markedQ.refetch();
      await studentsQ.refetch();
      await qc.invalidateQueries({ queryKey: ["attendance-day"] });
      await qc.invalidateQueries({ queryKey: ["my-attendance"] });
      await qc.invalidateQueries({ queryKey: ["student-dashboard"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const err = classesQ.isError
    ? (classesQ.error as Error).message
    : studentsQ.isError
      ? (studentsQ.error as Error).message
      : markedQ.isError
        ? (markedQ.error as Error).message
        : null;

  const selected = classesQ.data?.find((c) => c.id === className);

  return (
    <QueryState
      loading={classesQ.isLoading}
      error={err}
      onRetry={() => {
        classesQ.refetch();
        studentsQ.refetch();
        markedQ.refetch();
      }}
    >
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Mark Attendance" subtitle="Select class (grade + board) that matches each student" />
        <div className="card-elevated mb-4 flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1">
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
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Date</p>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="card-elevated overflow-hidden">
          {(studentsQ.data ?? []).map((s) => {
            const st = markedQ.data?.[s.id];
            const busy = saving === s.id;
            return (
              <div key={s.id} className="flex items-center justify-between border-b border-border p-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">Roll {s.roll_number}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={st === "present" ? "default" : "outline"}
                    disabled={busy}
                    onClick={() => mark(s.id, "present")}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={st === "absent" ? "destructive" : "outline"}
                    disabled={busy}
                    onClick={() => mark(s.id, "absent")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!studentsQ.isLoading && !studentsQ.data?.length && (
            <div className="p-6">
              <EmptyState
                title="No students in this class"
                hint={
                  selected
                    ? `No students assigned to "${selected.name}". Add or edit students under Students.`
                    : "Add students under the Students menu first."
                }
              />
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/students">Go to Students</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </QueryState>
  );
}
