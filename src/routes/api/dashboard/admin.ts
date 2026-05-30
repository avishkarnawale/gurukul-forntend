import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateBearer, unauthorized } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/dashboard/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await authenticateBearer(request);
        if (!user) return unauthorized();

        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const roleSet = new Set((roles ?? []).map((r) => r.role));
        if (!roleSet.has("admin") && !roleSet.has("staff")) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const [students, staff, fees, att] = await Promise.all([
          supabaseAdmin.from("students").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("staff").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("fees").select("total_amount,paid_amount"),
          supabaseAdmin.from("attendance").select("status").gte("date", since),
        ]);

        const due = (fees.data ?? []).reduce(
          (s, f: any) => s + (Number(f.total_amount) - Number(f.paid_amount)),
          0,
        );
        const total = att.data?.length ?? 0;
        const present = att.data?.filter((a) => a.status === "present").length ?? 0;
        const attPct = total ? Math.round((present / total) * 100) : 0;

        return Response.json({
          stats: {
            students: students.count ?? 0,
            staff: staff.count ?? 0,
            due,
            attPct,
          },
        });
      },
    },
  },
});
