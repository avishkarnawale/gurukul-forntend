import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Schema = z.object({
  rollNumber: z.string().trim().min(1).max(64),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

function studentEmail(roll: string) {
  return `${roll.trim().toLowerCase()}@students.gurukul.app`;
}

export const Route = createFileRoute("/api/auth/student-login")({
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
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await supabase.auth.signInWithPassword({
          email: studentEmail(parsed.rollNumber),
          password: parsed.dateOfBirth,
        });
        if (error || !data.session) {
          return Response.json({ error: "Invalid roll number or date of birth" }, { status: 401 });
        }

        return Response.json({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: { id: data.user!.id, email: data.user!.email },
          role: "student",
        });
      },
    },
  },
});
