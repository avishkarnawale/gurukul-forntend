import { apiFetch, unwrapData } from "@/lib/api";

type ApiList<T> = { success?: boolean; data: T };

function list<T>(body: ApiList<T> | T[]): T[] {
  if (Array.isArray(body)) return body;
  return body.data ?? [];
}

function idOf(row: { _id?: string; id?: string }) {
  return String(row._id ?? row.id);
}

function fmtDate(d: string | Date | undefined | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

/** e.g. Class 10|CBSE → Class 10 · CBSE */
export function formatClassLabel(classId: string) {
  const m = classId.match(/^Class (\d+)\|(CBSE|SSC)$/);
  if (m) return `Class ${m[1]} · ${m[2]}`;
  const legacy = classId.match(/^Class (\d+)\|(CBSE|SSC)\|(Morning|Evening)$/i);
  if (legacy) return `Class ${legacy[1]} · ${legacy[2]}`;
  return classId;
}

function studentIdFromAttendanceRow(r: Record<string, unknown>): string {
  const st = r.student;
  if (!st) return "";
  if (typeof st === "string") return st;
  if (typeof st === "object") {
    const o = st as Record<string, unknown>;
    return String(o._id ?? o.id ?? "");
  }
  return "";
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function studentLogin(rollNumber: string, dateOfBirth: string) {
  const body = await apiFetch<{
    access_token?: string;
    token?: string;
    role?: string;
    user?: { id?: string; _id?: string; email?: string; name?: string };
  }>("/api/auth/student-login", {
    method: "POST",
    body: JSON.stringify({ rollNumber, dateOfBirth }),
  });
  const u = body.user as Record<string, unknown> | undefined;
  return {
    access_token: body.access_token ?? body.token!,
    role: "student" as const,
    user: {
      id: String(u?.id ?? u?._id),
      email: u?.email as string | undefined,
      name: u?.name as string | undefined,
      rollNumber: u?.rollNumber as string | undefined,
      class: u?.class as string | undefined,
    },
  };
}

export async function staffLogin(email: string, password: string) {
  const body = await apiFetch<{
    access_token?: string;
    token?: string;
    role?: string;
    user?: { id?: string; _id?: string; email?: string; name?: string };
  }>("/api/auth/staff-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const role = (body.role === "admin" ? "admin" : "staff") as "admin" | "staff";
  return {
    access_token: body.access_token ?? body.token!,
    role,
    user: { id: String(body.user?.id ?? body.user?._id), email: body.user?.email, name: body.user?.name },
  };
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchStudentDashboard() {
  return apiFetch<{
    student: { full_name: string; roll_number: string; classes?: { name: string } };
    stats: {
      attendance: { pct: number; present: number; total: number };
      homework: Array<{ id: string; title: string; due_date: string; subjects?: { name: string } }>;
      fees: { due: number; items: unknown[] };
      notices: Array<{ id: string; title: string; content: string; pinned?: boolean }>;
    };
  }>("/api/dashboard/student");
}

export async function fetchAdminDashboard() {
  return apiFetch<{ stats: { students: number; staff: number; due: number; attPct: number } }>(
    "/api/dashboard/admin",
  );
}

// ── Classes ──────────────────────────────────────────────────────────────────

export async function fetchClasses() {
  const body = await apiFetch<ApiList<Array<{ id: string; name: string; board?: string; batch?: string; studentCount?: number }>>>(
    "/api/meta/classes",
  );
  return list(body);
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function fetchStudents() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/users?role=student");
  return list(body).map((u) => ({
    id: idOf(u),
    full_name: String(u.name ?? ""),
    roll_number: String(u.rollNumber ?? ""),
    dob: String(u.dateOfBirth ?? ""),
    parent_phone: u.parentPhone ? String(u.parentPhone) : null,
    classes: u.class ? { name: formatClassLabel(String(u.class)) } : null,
  }));
}

export type StudentSummary = {
  student: {
    id: string;
    name: string;
    rollNumber: string;
    class: string;
    board?: string;
    parentName?: string;
    parentPhone?: string;
    address?: string;
  };
  attendance: {
    summary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      percentage: number;
    };
    recent: Array<{ id: string; date: string; status: string; class?: string }>;
  };
  tests: Array<{
    id: string;
    subject: string;
    examType: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number | null;
    createdAt: string;
  }>;
  fees: {
    totalPending: number;
    items: Array<{
      id: string;
      term: string;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      status: string;
      dueDate: string;
    }>;
  };
};

export async function fetchStudentSummary(id: string): Promise<StudentSummary> {
  const body = await apiFetch<{ data: Record<string, unknown> }>(`/api/users/${id}/summary`);
  const d = body.data as Record<string, unknown>;
  const s = d.student as Record<string, unknown>;
  const att = (d.attendance as Record<string, unknown>) ?? {};
  const attSummary = (att.summary as Record<string, unknown>) ?? {};
  const attRecent = (att.recent as Record<string, unknown>[]) ?? [];
  const fees = (d.fees as Record<string, unknown>) ?? {};
  const feeItems = (fees.items as Record<string, unknown>[]) ?? [];
  const testsRaw = (d.tests as Record<string, unknown>[]) ?? [];

  return {
    student: {
      id: idOf(s),
      name: String(s.name ?? ""),
      rollNumber: String(s.rollNumber ?? ""),
      class: String(s.class ?? ""),
      board: s.board ? String(s.board) : undefined,
      parentName: s.parentName ? String(s.parentName) : undefined,
      parentPhone: s.parentPhone ? String(s.parentPhone) : undefined,
      address: s.address ? String(s.address) : undefined,
    },
    attendance: {
      summary: {
        totalDays: Number(attSummary.totalDays ?? 0),
        presentDays: Number(attSummary.presentDays ?? 0),
        absentDays: Number(attSummary.absentDays ?? 0),
        percentage: Number(attSummary.percentage ?? 0),
      },
      recent: attRecent.map((r) => ({
        id: idOf(r),
        date: String(r.date ?? ""),
        status: String(r.status ?? ""),
        class: r.class ? String(r.class) : undefined,
      })),
    },
    tests: testsRaw.map((t) => ({
      id: idOf(t),
      subject: String(t.subject ?? ""),
      examType: String(t.examType ?? ""),
      marksObtained: Number(t.marksObtained ?? 0),
      totalMarks: Number(t.totalMarks ?? 0),
      percentage:
        t.totalMarks && Number(t.totalMarks) > 0
          ? Math.round((Number(t.marksObtained ?? 0) / Number(t.totalMarks)) * 100)
          : null,
      createdAt: new Date(String(t.createdAt ?? new Date().toISOString())).toISOString(),
    })),
    fees: {
      totalPending: Number(fees.totalPending ?? 0),
      items: feeItems.map((f) => ({
        id: idOf(f),
        term: String(f.term ?? ""),
        totalAmount: Number(f.totalAmount ?? 0),
        paidAmount: Number(f.paidAmount ?? 0),
        pendingAmount: Number(f.pendingAmount ?? 0),
        status: String(f.status ?? ""),
        dueDate: fmtDate(f.dueDate as string),
      })),
    },
  };
}

export async function fetchStaff() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/users?role=staff");
  const admins = await apiFetch<ApiList<Record<string, unknown>>>("/api/users?role=admin").catch(() => ({ data: [] }));
  return [...list(body), ...list(admins)].map((u) => ({
    id: idOf(u),
    full_name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    designation: String(u.department ?? u.role ?? ""),
    phone: u.phone ? String(u.phone) : null,
    role: String(u.role ?? "staff"),
  }));
}

export async function deleteStaff(staffId: string) {
  await apiFetch(`/api/users/${staffId}`, { method: "DELETE" });
}

export async function createStudent(input: {
  full_name: string;
  roll_number: string;
  dob: string;
  class_id: string;
  parent_phone?: string | null;
}) {
  await apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify({
      role: "student",
      name: input.full_name,
      rollNumber: input.roll_number.toUpperCase(),
      dateOfBirth: input.dob,
      class: input.class_id,
      parentPhone: input.parent_phone || undefined,
    }),
  });
}

export async function createStaff(input: {
  full_name: string;
  email: string;
  password: string;
  designation?: string;
  phone?: string;
}) {
  await apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify({
      role: "staff",
      name: input.full_name,
      email: input.email,
      password: input.password,
      department: input.designation || "Teacher",
      phone: input.phone,
      employeeId: `EMP${Date.now().toString().slice(-6)}`,
    }),
  });
}

export async function deleteStudent(studentId: string) {
  await apiFetch(`/api/users/${studentId}`, { method: "DELETE" });
}

// ── Attendance ───────────────────────────────────────────────────────────────

export async function fetchMyAttendance() {
  const body = await apiFetch<{
    data?: Array<{ _id?: string; date: string; status: string }>;
    summary?: { total: number; present: number; absent: number; percentage: number };
  }>("/api/attendance/me");
  const rows = list(body);
  return rows.map((r) => ({
    id: r._id ? String(r._id) : fmtDate(r.date),
    date: fmtDate(r.date),
    status: r.status,
  }));
}

export async function fetchStudentsByClass(className: string) {
  const body = await apiFetch<ApiList<Record<string, unknown>>>(
    `/api/users?role=student&class=${encodeURIComponent(className)}`,
  );
  return list(body).map((u) => ({
    id: idOf(u),
    roll_number: String(u.rollNumber ?? ""),
    full_name: String(u.name ?? ""),
  }));
}

export async function fetchClassAttendance(className: string, date: string) {
  const body = await apiFetch<ApiList<Array<{ student: { _id: string }; status: string }>>>(
    `/api/attendance/class?class=${encodeURIComponent(className)}&date=${date}`,
  );
  const map: Record<string, string> = {};
  for (const r of list(body)) {
    const sid = studentIdFromAttendanceRow(r as Record<string, unknown>);
    if (sid && sid !== "undefined") map[sid] = r.status;
  }
  return map;
}

export async function markAttendance(className: string, date: string, studentId: string, status: "present" | "absent") {
  await apiFetch("/api/attendance", {
    method: "POST",
    body: JSON.stringify({
      class: className,
      date,
      records: [{ studentId, status }],
    }),
  });
}

// ── Homework ─────────────────────────────────────────────────────────────────

function mapHomework(h: Record<string, unknown>) {
  return {
    id: idOf(h),
    title: String(h.title ?? ""),
    description: String(h.description ?? ""),
    due_date: fmtDate(h.dueDate as string),
    subjects: { name: String(h.subject ?? "General") },
    classes: h.class ? { name: formatClassLabel(String(h.class)) } : null,
  };
}

export async function fetchHomeworkAdmin() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/homework");
  return list(body).map(mapHomework);
}

export async function fetchHomeworkStudent() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/homework");
  return list(body).map(mapHomework);
}

export async function createHomework(input: {
  class: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
}) {
  await apiFetch("/api/homework", {
    method: "POST",
    body: JSON.stringify({
      class: input.class,
      subject: input.subject,
      title: input.title,
      description: input.description,
      dueDate: input.due_date,
    }),
  });
}

export async function deleteHomework(id: string) {
  await apiFetch(`/api/homework/${id}`, { method: "DELETE" });
}

// ── Fees ─────────────────────────────────────────────────────────────────────

export type FeePayment = {
  id: string;
  amount: number;
  date: string;
  method: string;
  receipt_no: string;
};

export type StudentFee = {
  id: string;
  term: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  description?: string;
  payments: FeePayment[];
  students: { full_name: string; roll_number: string } | null;
};

function mapFee(f: Record<string, unknown>): StudentFee {
  const student = f.student as Record<string, unknown> | undefined;
  const feeId = idOf(f);
  const paymentsRaw = (f.payments as Array<Record<string, unknown>> | undefined) ?? [];
  const payments: FeePayment[] = paymentsRaw
    .filter((p) => Number(p.amount) > 0)
    .map((p, i) => ({
      id: String(p._id ?? `${feeId}-p${i}`),
      amount: Number(p.amount ?? 0),
      date: fmtDate(p.date as string),
      method: String(p.method ?? "cash"),
      receipt_no: String(p.receiptNo ?? ""),
    }));

  return {
    id: feeId,
    term: String(f.term ?? ""),
    description: f.description ? String(f.description) : undefined,
    total_amount: Number(f.totalAmount ?? 0),
    paid_amount: Number(f.paidAmount ?? 0),
    due_date: fmtDate(f.dueDate as string),
    status: String(f.status ?? "pending"),
    payments,
    students: student
      ? { full_name: String(student.name ?? ""), roll_number: String(student.rollNumber ?? "") }
      : null,
  };
}

export type MyFeesResponse = {
  student: { name: string; rollNumber: string; class: string };
  fees: StudentFee[];
};

export async function fetchMyFees(): Promise<MyFeesResponse> {
  const body = await apiFetch<
    ApiList<Record<string, unknown>> & {
      student?: { name: string; rollNumber: string; class: string };
    }
  >("/api/fees/me");
  return {
    student: {
      name: String(body.student?.name ?? ""),
      rollNumber: String(body.student?.rollNumber ?? ""),
      class: String(body.student?.class ?? ""),
    },
    fees: list(body).map(mapFee),
  };
}

/** Payments available for receipt download. */
export function feeReceiptPayments(fee: StudentFee): FeePayment[] {
  if (fee.payments.length) return fee.payments;
  if (fee.paid_amount > 0) {
    return [
      {
        id: `${fee.id}-summary`,
        amount: fee.paid_amount,
        date: fee.due_date || new Date().toISOString().slice(0, 10),
        method: "cash",
        receipt_no: `RCP-${fee.id.slice(-6).toUpperCase()}`,
      },
    ];
  }
  return [];
}

export async function fetchAllFees() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/fees");
  return list(body).map(mapFee);
}

export async function updateFeePaid(id: string, paid_amount: number) {
  await apiFetch(`/api/fees/${id}`, {
    method: "PUT",
    body: JSON.stringify({ paid_amount }),
  });
}

export async function assignMissingFees(input?: {
  term?: string;
  total_amount?: number;
  due_date?: string;
}) {
  return apiFetch<{ count: number; message: string }>("/api/fees/assign-missing", {
    method: "POST",
    body: JSON.stringify({
      term: input?.term,
      totalAmount: input?.total_amount,
      dueDate: input?.due_date,
    }),
  });
}

// ── Notices ──────────────────────────────────────────────────────────────────

function mapNotice(n: Record<string, unknown>) {
  return {
    id: idOf(n),
    title: String(n.title ?? ""),
    content: String(n.content ?? ""),
    pinned: Boolean(n.isPinned),
    created_at: n.createdAt,
  };
}

export async function fetchNotices() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/notices");
  return list(body).map(mapNotice);
}

export type NoticeCategory = "academic" | "general" | "event";

export async function createNotice(input: {
  title: string;
  content: string;
  pinned: boolean;
  category?: NoticeCategory;
  targetAudience?: "all" | "students" | "staff";
  targetClass?: string;
}) {
  await apiFetch("/api/notices", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      content: input.content,
      isPinned: input.pinned,
      category: input.category ?? "academic",
      targetAudience: input.targetAudience ?? "all",
      targetClass: input.targetClass || undefined,
    }),
  });
}

export async function deleteNotice(id: string) {
  await apiFetch(`/api/notices/${id}`, { method: "DELETE" });
}

// ── Contacts (student) ───────────────────────────────────────────────────────

export type TeacherContact = {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  department: string;
  subjects: string[];
  phone: string | null;
  phoneDisplay: string | null;
  whatsapp: string | null;
  isOwner: boolean;
};

export async function fetchTeacherContacts() {
  const body = await apiFetch<ApiList<TeacherContact>>("/api/contacts/teachers");
  return list(body);
}

// ── Notifications (student) ────────────────────────────────────────────────────

export type PortalNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
  refId?: string;
};

function mapNotification(n: Record<string, unknown>): PortalNotification {
  return {
    id: idOf(n),
    type: String(n.type ?? "notice"),
    title: String(n.title ?? ""),
    body: String(n.body ?? ""),
    link: String(n.link ?? "/student/notices"),
    read: Boolean(n.read),
    createdAt: n.createdAt ? new Date(n.createdAt as string).toISOString() : new Date().toISOString(),
    refId: n.refId ? String(n.refId) : undefined,
  };
}

export async function fetchMyNotifications() {
  const body = await apiFetch<{
    data: Record<string, unknown>[];
    unread: number;
  }>("/api/notifications/me");
  const rows = Array.isArray(body.data) ? body.data : [];
  return {
    unread: Number(body.unread ?? 0),
    items: rows.map(mapNotification),
  };
}

export async function fetchUnreadNotificationCount() {
  const body = await apiFetch<{ count: number }>("/api/notifications/me/unread-count");
  return Number(body.count ?? 0);
}

export async function markNotificationRead(id: string) {
  await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead() {
  await apiFetch("/api/notifications/me/read-all", { method: "PUT" });
}

// ── Results / Grades ─────────────────────────────────────────────────────────

function mapGrade(g: Record<string, unknown>) {
  return {
    id: idOf(g),
    exam_name: String(g.examType ?? ""),
    marks: Number(g.marksObtained ?? 0),
    max_marks: Number(g.totalMarks ?? 0),
    exam_date: fmtDate(g.createdAt as string),
    subjects: { name: String(g.subject ?? "") },
    students: g.student
      ? {
          full_name: String((g.student as Record<string, unknown>).name ?? ""),
          roll_number: String((g.student as Record<string, unknown>).rollNumber ?? ""),
          class_id: String((g.student as Record<string, unknown>).class ?? ""),
        }
      : null,
  };
}

export async function fetchMyGrades() {
  const body = await apiFetch<{ data?: Record<string, unknown>[] } & ApiList<Record<string, unknown>>>(
    "/api/results/me",
  );
  const rows = Array.isArray(body) ? body : (body.data ?? []);
  return rows.map(mapGrade);
}

export async function fetchAllGrades() {
  const body = await apiFetch<ApiList<Record<string, unknown>>>("/api/results/class");
  return list(body).map(mapGrade);
}

const EXAM_TYPES = ["internal", "midterm", "final", "practical", "assignment"] as const;

function normalizeExamType(name: string) {
  const key = name.trim().toLowerCase();
  return (EXAM_TYPES as readonly string[]).includes(key) ? key : "midterm";
}

export async function createGrade(input: {
  student_id: string;
  subject: string;
  exam_name: string;
  marks: number;
  max_marks: number;
}) {
  await apiFetch("/api/results", {
    method: "POST",
    body: JSON.stringify({
      student: input.student_id,
      subject: input.subject,
      examType: normalizeExamType(input.exam_name),
      marksObtained: input.marks,
      totalMarks: input.max_marks,
    }),
  });
}

export async function deleteGrade(id: string) {
  await apiFetch(`/api/results/${id}`, { method: "DELETE" });
}

// ── Notes & PYQs ─────────────────────────────────────────────────────────────

function mapNote(n: Record<string, unknown>) {
  return {
    id: idOf(n),
    title: String(n.title ?? ""),
    description: String(n.description ?? ""),
    file_url: String(n.fileUrl ?? ""),
    subjects: { name: String(n.subject ?? "") },
    classes: n.targetClass ? { name: formatClassLabel(String(n.targetClass)), board: "" } : null,
    created_at: n.createdAt,
  };
}

export async function fetchNotes(type: "note" | "pyq") {
  const body = await apiFetch<ApiList<Record<string, unknown>>>(`/api/notes?type=${type}`);
  return list(body).map(mapNote);
}

export async function uploadNote(input: {
  type: "note" | "pyq";
  title: string;
  description?: string;
  subject: string;
  targetClass?: string;
  fileUrl: string;
  year?: number;
}) {
  await apiFetch("/api/notes", {
    method: "POST",
    body: JSON.stringify({
      type: input.type,
      title: input.title,
      description: input.description || "",
      subject: input.subject,
      targetClass: input.targetClass || undefined,
      fileUrl: input.fileUrl,
      year: input.year,
    }),
  });
}

export async function deleteNote(id: string) {
  await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
}

export { unwrapData };
