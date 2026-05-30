import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Idempotent demo bootstrap. Creates admin@gurukul.app + sample classes,
// students, staff, attendance, homework, fees, notices.
export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async () => {
        try {
          // 1. Ensure admin user
          const adminEmail = "admin@gurukul.app";
          let adminId: string | null = null;

          const { data: list } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 200,
          });
          const existing = list?.users.find((u) => u.email === adminEmail);
          if (existing) {
            adminId = existing.id;
          } else {
            const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
              email: adminEmail,
              password: "admin12345",
              email_confirm: true,
              user_metadata: { full_name: "Demo Admin" },
            });
            if (error) throw error;
            adminId = created.user!.id;
            await supabaseAdmin.from("staff").insert({
              user_id: adminId,
              full_name: "Demo Admin",
              email: adminEmail,
              designation: "Principal",
            });
          }
          // Always ensure admin role
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: adminId!, role: "admin" }, { onConflict: "user_id,role" });

          // 2. Demo classes
          const classes = [
            { name: "Class 9", division: "A" },
            { name: "Class 10", division: "A" },
            { name: "Class 11", division: "Science" },
          ];
          const classIds: Record<string, string> = {};
          for (const c of classes) {
            const { data: existing } = await supabaseAdmin
              .from("classes")
              .select("id")
              .eq("name", c.name)
              .eq("division", c.division)
              .maybeSingle();
            if (existing) {
              classIds[`${c.name} ${c.division}`] = existing.id;
            } else {
              const { data: ins } = await supabaseAdmin
                .from("classes")
                .insert(c)
                .select("id")
                .single();
              classIds[`${c.name} ${c.division}`] = ins!.id;
            }
          }

          // 3. Subjects per class
          const subjectsByClass: Record<string, string[]> = {
            "Class 9 A": ["Mathematics", "Science", "English", "Social Studies"],
            "Class 10 A": ["Mathematics", "Science", "English", "Social Studies"],
            "Class 11 Science": ["Physics", "Chemistry", "Mathematics", "English"],
          };
          for (const [ck, subs] of Object.entries(subjectsByClass)) {
            const cid = classIds[ck];
            for (const name of subs) {
              const { data: ex } = await supabaseAdmin
                .from("subjects")
                .select("id")
                .eq("class_id", cid)
                .eq("name", name)
                .maybeSingle();
              if (!ex) await supabaseAdmin.from("subjects").insert({ name, class_id: cid });
            }
          }

          // 4. Demo staff (besides admin)
          const teachers = [
            { email: "priya.iyer@gurukul.app", name: "Priya Iyer", desig: "Mathematics Teacher" },
            { email: "rohit.menon@gurukul.app", name: "Rohit Menon", desig: "Science Teacher" },
          ];
          for (const t of teachers) {
            const exists = list?.users.find((u) => u.email === t.email);
            let uid = exists?.id;
            if (!uid) {
              const { data: c } = await supabaseAdmin.auth.admin.createUser({
                email: t.email,
                password: "teacher123",
                email_confirm: true,
                user_metadata: { full_name: t.name },
              });
              uid = c?.user?.id;
              if (uid) {
                await supabaseAdmin.from("staff").insert({
                  user_id: uid,
                  full_name: t.name,
                  email: t.email,
                  designation: t.desig,
                });
              }
            }
            if (uid) {
              await supabaseAdmin
                .from("user_roles")
                .upsert({ user_id: uid, role: "staff" }, { onConflict: "user_id,role" });
            }
          }

          // 5. Demo students
          const class10 = classIds["Class 10 A"];
          const demoStudents = [
            { roll: "GK001", name: "Aarav Sharma", dob: "2009-04-12", phone: "9876500001" },
            { roll: "GK002", name: "Diya Patel", dob: "2009-06-25", phone: "9876500002" },
            { roll: "GK003", name: "Kabir Singh", dob: "2009-02-18", phone: "9876500003" },
            { roll: "GK004", name: "Meera Iyer", dob: "2009-09-03", phone: "9876500004" },
            { roll: "GK005", name: "Arjun Reddy", dob: "2009-11-21", phone: "9876500005" },
            { roll: "GK006", name: "Sara Khan", dob: "2009-01-08", phone: "9876500006" },
          ];
          const studentIds: { id: string; roll: string }[] = [];
          for (const s of demoStudents) {
            const email = `${s.roll.toLowerCase()}@students.gurukul.app`;
            let uid = list?.users.find((u) => u.email === email)?.id;
            if (!uid) {
              const { data: c } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: s.dob,
                email_confirm: true,
                user_metadata: { full_name: s.name, roll_number: s.roll },
              });
              uid = c?.user?.id;
            }
            if (!uid) continue;

            const { data: ex } = await supabaseAdmin
              .from("students")
              .select("id")
              .eq("roll_number", s.roll)
              .maybeSingle();
            let sid = ex?.id;
            if (!sid) {
              const { data: ins } = await supabaseAdmin
                .from("students")
                .insert({
                  user_id: uid,
                  roll_number: s.roll,
                  full_name: s.name,
                  dob: s.dob,
                  class_id: class10,
                  parent_phone: s.phone,
                })
                .select("id")
                .single();
              sid = ins?.id;
            }
            await supabaseAdmin
              .from("user_roles")
              .upsert({ user_id: uid, role: "student" }, { onConflict: "user_id,role" });
            if (sid) studentIds.push({ id: sid, roll: s.roll });
          }

          // 6. Attendance for last 14 days
          const today = new Date();
          for (const s of studentIds) {
            for (let i = 0; i < 14; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const dow = d.getDay();
              if (dow === 0) continue; // Sunday off
              const dateStr = d.toISOString().slice(0, 10);
              // 90% present
              const present = Math.random() > 0.1;
              await supabaseAdmin
                .from("attendance")
                .upsert(
                  {
                    student_id: s.id,
                    date: dateStr,
                    status: present ? "present" : "absent",
                    marked_by: adminId,
                  },
                  { onConflict: "student_id,date" },
                );
            }
          }

          // 7. Homework
          const { data: subs10 } = await supabaseAdmin
            .from("subjects")
            .select("id,name")
            .eq("class_id", class10);
          const hwSeed = [
            { title: "Algebra Worksheet — Quadratics", subject: "Mathematics", days: 2 },
            { title: "Read Chapter 4: Carbon", subject: "Science", days: 4 },
            { title: "Essay: My Hero (300 words)", subject: "English", days: 1 },
          ];
          for (const h of hwSeed) {
            const subj = subs10?.find((x) => x.name === h.subject);
            if (!subj) continue;
            const { data: ex } = await supabaseAdmin
              .from("homework")
              .select("id")
              .eq("class_id", class10)
              .eq("title", h.title)
              .maybeSingle();
            if (!ex) {
              const due = new Date(today);
              due.setDate(today.getDate() + h.days);
              await supabaseAdmin.from("homework").insert({
                class_id: class10,
                subject_id: subj.id,
                title: h.title,
                description: "Complete the assignment and submit on or before the due date.",
                due_date: due.toISOString().slice(0, 10),
                created_by: adminId,
              });
            }
          }

          // 8. Fees
          const dueDate = new Date(today);
          dueDate.setDate(today.getDate() + 14);
          for (const s of studentIds) {
            const { data: ex } = await supabaseAdmin
              .from("fees")
              .select("id")
              .eq("student_id", s.id)
              .eq("term", "Q1 2026")
              .maybeSingle();
            if (!ex) {
              const paid = Math.random() > 0.5 ? 7500 : Math.random() > 0.5 ? 3000 : 0;
              await supabaseAdmin.from("fees").insert({
                student_id: s.id,
                term: "Q1 2026",
                total_amount: 7500,
                paid_amount: paid,
                due_date: dueDate.toISOString().slice(0, 10),
              });
            }
          }

          // 9. Notices
          const notices = [
            {
              title: "Welcome to the new term!",
              content: "Classes resume on Monday. Stay punctual.",
            },
            {
              title: "Mid-term exam timetable",
              content: "Check the timetable section for your exam schedule.",
              pinned: true,
            },
            {
              title: "Parent-Teacher Meeting",
              content: "Saturday 10:00 AM in main hall.",
              target: class10,
            },
          ];
          for (const n of notices) {
            const { data: ex } = await supabaseAdmin
              .from("notices")
              .select("id")
              .eq("title", n.title)
              .maybeSingle();
            if (!ex) {
              await supabaseAdmin.from("notices").insert({
                title: n.title,
                content: n.content,
                pinned: (n as any).pinned ?? false,
                target_class_id: (n as any).target ?? null,
                created_by: adminId,
              });
            }
          }

          return Response.json({
            ok: true,
            admin: { email: adminEmail, password: "admin12345" },
            students: demoStudents.map((s) => ({ roll: s.roll, dob: s.dob })),
            staff: teachers.map((t) => ({ email: t.email, password: "teacher123" })),
          });
        } catch (e: any) {
          console.error("bootstrap error", e);
          return new Response(JSON.stringify({ ok: false, error: e.message ?? String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
