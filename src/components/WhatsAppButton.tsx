import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, defaultInquiryMessage } from "@/lib/whatsapp";
import { useLanguage } from "@/i18n/LanguageContext";

/** Floating WhatsApp chat — opens chat with class owner. */
export function WhatsAppFloatingButton() {
  const { lang, t } = useLanguage();
  const url = buildWhatsAppUrl(defaultInquiryMessage(lang));

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
      aria-label={t.whatsapp.chat}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">{t.whatsapp.chatShort}</span>
    </a>
  );
}
