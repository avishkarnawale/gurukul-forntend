import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchMyGrades } from "@/lib/portal-api";
import { PageHeader, EmptyState, StatCard } from "@/components/portal/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trophy, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/student/results")({ component: Page });

function Page() {
  const { data: myResults } = usePortalQuery({ queryKey: ["my-results"], queryFn: fetchMyGrades });

  const exams = useMemo(
    () => Array.from(new Set((myResults ?? []).map((r) => r.exam_name).filter(Boolean))),
    [myResults],
  );
  const [exam, setExam] = useState("");
  const activeExam = exam || exams[0] || "";

  const filtered = (myResults ?? []).filter((r) => r.exam_name === activeExam);
  const total = filtered.reduce((s, r) => s + r.marks, 0);
  const max = filtered.reduce((s, r) => s + r.max_marks, 0);
  const pct = max ? Math.round((total / max) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="My Results" subtitle="Exam marks and performance" />
      {exams.length > 1 && (
        <div className="card-elevated mb-4 max-w-xs p-4">
          <Label className="text-xs text-muted-foreground">Exam</Label>
          <Select value={activeExam} onValueChange={setExam}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total Score" value={`${total} / ${max}`} icon={Trophy} accent="primary" />
        <StatCard label="Percentage" value={`${pct}%`} icon={TrendingUp} accent="success" />
      </div>
      <div className="card-elevated mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3">Marks</th>
              <th className="p-3">Max</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.subjects?.name}</td>
                <td className="p-3">{r.marks}</td>
                <td className="p-3">{r.max_marks}</td>
                <td className="p-3">{r.exam_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState title="No results for this exam" />}
      </div>
    </div>
  );
}
