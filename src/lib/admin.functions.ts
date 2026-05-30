import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function studentEmail(roll: string) {
  return `${roll.trim().toLowerCase()}@students.gurukul.app`;
}

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!(data ?? []).some((r) => r.role === "admin" || r.role === "staff")) {
    throw new Error("Forbidden — staff or admin role required.");
  }
}

// ---------- Create Student ----------
export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      full_name: z.string().min(2).max(120),
      roll_number: z.string().min(1).max(40),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      class_id: z.string().uuid(),
      parent_phone: z.string().max(20).optional().nullable(),
      contact_email: z.string().email().max(255).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const email = studentEmail(data.roll_number);

    // Create auth user
    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.dob,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, roll_number: data.roll_number },
    });
    if (authErr) throw new Error(authErr.message);

    const userId = created.user!.id;

    // Insert student row
    const { error: stuErr } = await supabaseAdmin.from("students").insert({
      user_id: userId,
      roll_number: data.roll_number,
      full_name: data.full_name,
      dob: data.dob,
      class_id: data.class_id,
      parent_phone: data.parent_phone ?? null,
      contact_email: data.contact_email ?? null,
    });
    if (stuErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(stuErr.message);
    }

    // Assign student role
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "student" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true, user_id: userId };
  });

// ---------- Delete Student ----------
export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ student_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: stu } = await supabaseAdmin
      .from("students")
      .select("user_id")
      .eq("id", data.student_id)
      .maybeSingle();
    if (stu?.user_id) await supabaseAdmin.auth.admin.deleteUser(stu.user_id);
    // student row cascades via auth.users delete; just ensure row gone
    await supabaseAdmin.from("students").delete().eq("id", data.student_id);
    return { ok: true };
  });

// ---------- Create Staff ----------
export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      full_name: z.string().min(2).max(120),
      email: z.string().email().max(255),
      password: z.string().min(8).max(72),
      phone: z.string().max(20).optional().nullable(),
      designation: z.string().max(60).optional().nullable(),
      role: z.enum(["staff", "admin"]).default("staff"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (authErr) throw new Error(authErr.message);
    const userId = created.user!.id;

    const { error: sErr } = await supabaseAdmin.from("staff").insert({
      user_id: userId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      designation: data.designation ?? null,
    });
    if (sErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(sErr.message);
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    return { ok: true, user_id: userId };
  });
