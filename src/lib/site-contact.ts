const WA = import.meta.env.VITE_WHATSAPP_NUMBER || "919307181827";

/** Institute owner & WhatsApp (India: +91). */
export const SITE_OWNER = {
  name: "Pruthviraj Navale",
  phone: "9307181827",
  phoneDisplay: "+91 93071 81827",
  phoneTel: "+919307181827",
  whatsapp: WA.replace(/\D/g, ""),
};
