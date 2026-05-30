import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateBearer, unauthorized } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/dashboard/student")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await authenticateBearer(request);
        if (!user) return unauthorized();

        const { data: student } = await supabaseAdmin
          .from("students")
          .select("*, classes(name,division)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!student) {
          return Response.json({ error: "Student profile not found" }, { status: 404 });
        }

        const [att, hw, fees, notices] = await Promise.all([
          supabaseAdmin.from("attendance").select("status").eq("student_id", student.id),
          supabaseAdmin
            .from("homework")
            .select("id,title,due_date,subjects(name)")
            .eq("class_id", student.class_id as string)
            .order("due_date")
            .limit(5),
          supabaseAdmin
            .from("fees")
            .select("total_amount,paid_amount,status,due_date,term")
            .eq("student_id", student.id),
          supabaseAdmin
            .from("notices")
            .select("id,title,content,created_at,pinned")
            .order("pinned", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const total = att.data?.length ?? 0;
        const present = att.data?.filter((a) => a.status === "present").length ?? 0;
        const pct = total ? Math.round((present / total) * 100) : 0;
        const due = (fees.data ?? []).reduce(
          (s, f: any) => s + (Number(f.total_amount) - Number(f.paid_amount)),
          0,
        );

        return Response.json({
          student,
          stats: {
            attendance: { pct, present, total },
            homework: hw.data ?? [],
            fees: { due, items: fees.data ?? [] },
            notices: notices.data ?? [],
          },
        });
      },
    },
  },
});
