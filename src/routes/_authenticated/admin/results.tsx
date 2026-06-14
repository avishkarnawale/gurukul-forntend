import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import {
  createBulkGrades,
  deleteGrade,
  EXAM_TYPE_LABELS,
  EXAM_TYPES,
  fetchClasses,
  fetchGradesByClass,
  fetchStudentsByClass,
} from "@/lib/portal-api";
import { PageHeader, EmptyState, QueryState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { downloadClassResultsPdf, downloadClassResultsWord, downloadStudentReport } from "@/lib/fee-receipt";

export const Route = createFileRoute("/_authenticated/admin/results")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [exportClassId, setExportClassId] = useState("");
  const [downloading, setDownloading] = useState<"pdf" | "doc" | "reports" | string | null>(null);
  const { data, isLoading, isError, error, refetch } = usePortalQuery({
    queryKey: ["admin-results", exportClassId],
    queryFn: () => fetchGradesByClass(exportClassId),
    enabled: !!exportClassId,
  });

  const classesQ = usePortalQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (exportClassId || !classesQ.data?.length) return;
    const withStudents = classesQ.data.find((c) => (c.studentCount ?? 0) > 0);
    setExportClassId(withStudents?.id ?? classesQ.data[0].id);
  }, [classesQ.data, exportClassId]);

  const filteredResults = data ?? [];

  const downloadStudentReceipt = async (studentId: string, rollNumber?: string) => {
    setDownloading(studentId);
    try {
      await downloadStudentReport(studentId, rollNumber);
      toast.success("Student report downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllReports = async () => {
    if (!exportClassId) {
      toast.error("Select a class first");
      return;
    }
    setDownloading("reports");
    try {
      const students = await fetchStudentsByClass(exportClassId);
      if (!students.length) {
        toast.error("No students in this class");
        return;
      }
      for (const s of students) {
        await downloadStudentReport(s.id, s.roll_number);
        await new Promise((r) => setTimeout(r, 400));
      }
      toast.success(`Downloaded ${students.length} student report${students.length === 1 ? "" : "s"}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const downloadExport = async (format: "pdf" | "doc") => {
    if (!exportClassId) {
      toast.error("Select a class first");
      return;
    }
    setDownloading(format);
    try {
      if (format === "pdf") await downloadClassResultsPdf(exportClassId);
      else await downloadClassResultsWord(exportClassId);
      toast.success(format === "pdf" ? "PDF downloaded" : "Word file downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

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
    <QueryState loading={isLoading} error={isError ? (error as Error).message : null} onRetry={refetch}>
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Results" subtitle="Add marks class-wise — select test details, then enter marks for each student" />
        <AddClassResults onDone={() => qc.invalidateQueries({ queryKey: ["admin-results"] })} />
        <div className="card-elevated mt-6 overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
            <div className="min-w-[200px] flex-1">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Class</p>
              <Select value={exportClassId} onValueChange={setExportClassId}>
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!exportClassId || downloading !== null}
                onClick={() => downloadExport("pdf")}
              >
                {downloading === "pdf" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Class PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!exportClassId || downloading !== null}
                onClick={() => downloadExport("doc")}
              >
                {downloading === "doc" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Class Word
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!exportClassId || downloading !== null}
                onClick={downloadAllReports}
              >
                {downloading === "reports" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                All student reports
              </Button>
            </div>
          </div>
          <div className="border-b border-border px-4 py-2">
            <p className="text-sm font-medium">
              Saved results
              {exportClassId && (
                <span className="ml-2 font-normal text-muted-foreground">
                  ({filteredResults.length} for selected class)
                </span>
              )}
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Exam</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{r.students?.full_name}</div>
                    <div className="text-xs text-muted-foreground">Roll {r.students?.roll_number}</div>
                  </td>
                  <td className="p-3 capitalize">{r.exam_name.replace(/_/g, " ")}</td>
                  <td className="p-3">{r.subjects?.name ?? "—"}</td>
                  <td className="p-3 font-mono">
                    {r.marks} / {r.max_marks}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{r.exam_date}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {r.students?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Download student report"
                          disabled={downloading !== null}
                          onClick={() =>
                            downloadStudentReceipt(r.students!.id, r.students!.roll_number)
                          }
                        >
                          {downloading === r.students.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredResults.length && (
            <EmptyState
              title="No results for this class"
              hint={exportClassId ? "Add marks using the form above or select another class." : "Use the form above to add marks for a class"}
            />
          )}
        </div>
      </div>
    </QueryState>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <p className="mb-1 text-xs font-medium text-muted-foreground">
      <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
        {n}
      </span>
      {title}
    </p>
  );
}

function AddClassResults({ onDone }: { onDone: () => void }) {
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState<(typeof EXAM_TYPES)[number]>("midterm");
  const [maxMarks, setMaxMarks] = useState("50");
  const [marksByStudent, setMarksByStudent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const classesQ = usePortalQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (classId || !classesQ.data?.length) return;
    const withStudents = classesQ.data.find((c) => (c.studentCount ?? 0) > 0);
    setClassId(withStudents?.id ?? classesQ.data[0].id);
  }, [classesQ.data, classId]);

  const studentsQ = usePortalQuery({
    enabled: !!classId,
    queryKey: ["students-by-class", classId],
    queryFn: () => fetchStudentsByClass(classId),
  });

  const onClassChange = (id: string) => {
    setClassId(id);
    setMarksByStudent({});
  };

  const setupReady = !!classId && subject.trim().length > 0 && !!examType && Number(maxMarks) > 0;
  const selectedClass = classesQ.data?.find((c) => c.id === classId);
  const max = Number(maxMarks);

  const setMark = (studentId: string, value: string) => {
    setMarksByStudent((prev) => ({ ...prev, [studentId]: value }));
  };

  const filledCount = (studentsQ.data ?? []).filter((s) => marksByStudent[s.id]?.trim()).length;

  const saveAll = async () => {
    if (!setupReady) {
      toast.error("Complete steps 1–4 first (class, subject, test type, max marks).");
      return;
    }
    const students = studentsQ.data ?? [];
    const entries: Array<{ student_id: string; marks: number }> = [];
    for (const s of students) {
      const raw = marksByStudent[s.id]?.trim();
      if (!raw) continue;
      const marks = Number(raw);
      if (!Number.isFinite(marks) || marks < 0) {
        toast.error(`Invalid marks for ${s.full_name}`);
        return;
      }
      if (marks > max) {
        toast.error(`Marks for ${s.full_name} cannot exceed ${max}`);
        return;
      }
      entries.push({ student_id: s.id, marks });
    }
    if (!entries.length) {
      toast.error("Enter marks for at least one student.");
      return;
    }

    setSaving(true);
    try {
      await createBulkGrades({
        class_id: classId,
        subject: subject.trim(),
        exam_name: examType,
        max_marks: max,
        entries,
      });
      toast.success(`Saved marks for ${entries.length} student${entries.length === 1 ? "" : "s"}`);
      setMarksByStudent({});
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-elevated overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <p className="text-sm font-medium">Add results</p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <StepLabel n={1} title="Select class" />
          <Select value={classId} onValueChange={onClassChange}>
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
          <StepLabel n={2} title="Subject name" />
          <Input
            placeholder="e.g. Mathematics"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <StepLabel n={3} title="Test type" />
          <Select value={examType} onValueChange={(v) => setExamType(v as (typeof EXAM_TYPES)[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((e) => (
                <SelectItem key={e} value={e}>
                  {EXAM_TYPE_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <StepLabel n={4} title="Max marks" />
          <Input
            type="number"
            min={1}
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
          />
        </div>
      </div>

      {classId && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <p className="text-sm text-muted-foreground">
              {studentsQ.isLoading
                ? "Loading students…"
                : `${studentsQ.data?.length ?? 0} students in ${selectedClass?.name ?? "class"}`}
              {setupReady && filledCount > 0 && ` · ${filledCount} with marks entered`}
            </p>
            <Button size="sm" disabled={!setupReady || saving || filledCount === 0} onClick={saveAll}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save marks
            </Button>
          </div>

          {studentsQ.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!studentsQ.isLoading && !(studentsQ.data ?? []).length && (
            <EmptyState
              title="No students in this class"
              hint="Add students under the Students menu first."
            />
          )}

          {(studentsQ.data ?? []).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">Roll {s.roll_number}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Label htmlFor={`marks-${s.id}`} className="sr-only">
                  Marks for {s.full_name}
                </Label>
                <Input
                  id={`marks-${s.id}`}
                  type="number"
                  min={0}
                  max={max > 0 ? max : undefined}
                  placeholder={setupReady ? `out of ${max}` : "Set max marks first"}
                  disabled={!setupReady}
                  value={marksByStudent[s.id] ?? ""}
                  onChange={(e) => setMark(s.id, e.target.value)}
                  className="w-28 text-right font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
