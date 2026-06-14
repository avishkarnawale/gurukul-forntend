import { API_BASE_URL, getToken } from "@/lib/api";

async function downloadFileFromApi(path: string, fallbackName: string, defaultExt: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Download failed");
  }
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition");
  const match = disp?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.includes(".") ? filename : `${filename}.${defaultExt}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadPdfFromApi(path: string, fallbackName: string) {
  await downloadFileFromApi(path, fallbackName, "pdf");
}

export async function downloadClassFeesPdf(classId: string) {
  await downloadPdfFromApi(
    `/api/fees/export/pdf?class=${encodeURIComponent(classId)}`,
    "Gurukul-Fees.pdf",
  );
}

export async function downloadClassStudentsPdf(classId: string) {
  await downloadPdfFromApi(
    `/api/users/export/students/pdf?class=${encodeURIComponent(classId)}`,
    "Gurukul-Students.pdf",
  );
}

export async function downloadMonthlyAttendancePdf(classId: string, month: string) {
  await downloadPdfFromApi(
    `/api/attendance/export/pdf?class=${encodeURIComponent(classId)}&month=${encodeURIComponent(month)}`,
    "Gurukul-Attendance.pdf",
  );
}

export async function downloadClassResultsPdf(classId: string) {
  await downloadPdfFromApi(
    `/api/results/export/pdf?class=${encodeURIComponent(classId)}`,
    "Gurukul-Results.pdf",
  );
}

export async function downloadClassResultsWord(classId: string) {
  await downloadFileFromApi(
    `/api/results/export/doc?class=${encodeURIComponent(classId)}`,
    "Gurukul-Results.doc",
    "doc",
  );
}

/** Download fee receipt as PDF (student portal). */
export async function downloadFeeReceipt(feeId: string, paymentId: string) {
  await downloadPdfFromApi(
    `/api/fees/me/${feeId}/receipt/${paymentId}`,
    `Gurukul-Receipt-${paymentId}.pdf`,
  );
}

/** Download fee receipt as PDF (admin — any student). */
export async function downloadAdminFeeReceipt(feeId: string, paymentId: string) {
  await downloadPdfFromApi(
    `/api/fees/${feeId}/receipt/${paymentId}`,
    `Gurukul-Receipt-${paymentId}.pdf`,
  );
}

/** Download a student's full progress report (admin) as PDF. */
export async function downloadStudentReport(studentId: string, rollNumber?: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/users/${studentId}/summary/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Report download failed");
  }
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition");
  const match = disp?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? `Gurukul-${rollNumber ?? studentId}-report.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
