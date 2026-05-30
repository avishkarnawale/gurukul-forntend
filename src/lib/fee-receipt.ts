import { API_BASE_URL, getToken } from "@/lib/api";

/** Download fee receipt as PDF from API. */
export async function downloadFeeReceipt(feeId: string, paymentId: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/fees/me/${feeId}/receipt/${paymentId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Receipt download failed");
  }
  const blob = await res.blob();
  if (!blob.type.includes("pdf") && blob.size < 100) {
    throw new Error("Invalid receipt file");
  }
  const disp = res.headers.get("Content-Disposition");
  const match = disp?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? `Gurukul-Receipt-${paymentId}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
