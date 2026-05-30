import { SITE_OWNER } from "@/lib/site-contact";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function buildWhatsAppUrl(text: string, phone = SITE_OWNER.whatsapp) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function defaultInquiryMessage(lang: "en" | "mr") {
  if (lang === "mr") {
    return `नमस्कार ${SITE_OWNER.name} सर, मला गुरुकुल क्लासेसबद्दल माहिती हवी आहे.`;
  }
  return `Hello ${SITE_OWNER.name}, I would like to know more about Gurukul Classes.`;
}

export async function submitInquiry(input: {
  name: string;
  phone?: string;
  message: string;
  lang?: "en" | "mr";
}) {
  return fetch(`${API_BASE}/api/public/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(async (res) => {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(body.message || body.error || "Failed to send"));
    return body as { success: boolean; whatsappUrl?: string; apiSent?: boolean };
  });
}
