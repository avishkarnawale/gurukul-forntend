import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(255),
});

export const Route = createFileRoute("/api/auth/staff-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Schema.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { data, error } = await supabase.auth.signInWithPassword(parsed);
        if (error || !data.session) {
          return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Confirm staff/admin role
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user!.id);

        const roleSet = new Set((roles ?? []).map((r) => r.role));
        if (!roleSet.has("admin") && !roleSet.has("staff")) {
          return Response.json(
            { error: "This account is not authorized for staff access" },
            { status: 403 }
          );
        }

        return Response.json({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: { id: data.user!.id, email: data.user!.email },
          role: roleSet.has("admin") ? "admin" : "staff",
        });
      },
    },
  },
});
