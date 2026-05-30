import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  MapPin,
  Phone,
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  Calculator,
  FlaskConical,
  Languages,
  Globe,
  FileText,
  MessageCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppFloatingButton } from "@/components/WhatsAppButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { SITE_OWNER } from "@/lib/site-contact";
import { buildWhatsAppUrl, defaultInquiryMessage, submitInquiry } from "@/lib/whatsapp";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({ meta: [{ title: "Gurukul Classes — CBSE & SSC Coaching" }] }),
});

function Landing() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();
  const [inquiry, setInquiry] = useState({ name: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const subjectIcons = [Calculator, FlaskConical, GraduationCap, Languages, Globe, FileText];
  const waDefault = buildWhatsAppUrl(defaultInquiryMessage(lang));

  const sendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.name.trim() || !inquiry.message.trim()) {
      toast.error(lang === "mr" ? "नाव आणि संदेश भरा" : "Please enter name and message");
      return;
    }
    setSending(true);
    try {
      const res = await submitInquiry({
        name: inquiry.name,
        phone: inquiry.phone,
        message: inquiry.message,
        lang,
      });
      const url = (res.whatsappUrl as string) || waDefault;
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success(
        res.apiSent
          ? lang === "mr"
            ? "चौकशी WhatsApp वर पाठवली"
            : "Inquiry sent on WhatsApp"
          : lang === "mr"
            ? "WhatsApp उघडले — पाठवा बटण दाबा"
            : "WhatsApp opened — tap Send",
      );
      setInquiry({ name: "", phone: "", message: "" });
    } catch {
      const fallback = buildWhatsAppUrl(
        `${inquiry.name}: ${inquiry.message}${inquiry.phone ? ` (${inquiry.phone})` : ""}`,
      );
      window.open(fallback, "_blank", "noopener,noreferrer");
      toast.success(lang === "mr" ? "WhatsApp उघडले" : "WhatsApp opened");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">{t.brand}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#about" className="transition-colors hover:text-foreground">
              {t.nav.about}
            </a>
            <a href="#why" className="transition-colors hover:text-foreground">
              {t.nav.why}
            </a>
            <a href="#subjects" className="transition-colors hover:text-foreground">
              {t.nav.subjects}
            </a>
            <a href="#contact" className="transition-colors hover:text-foreground">
              {t.nav.contact}
            </a>
            <a href="#portals" className="transition-colors hover:text-foreground">
              {t.nav.portals}
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/login">{t.nav.signIn}</Link>
            </Button>
          </div>
        </div>
      </header>

      <WhatsAppFloatingButton />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-[320px] w-[320px] rounded-full bg-accent/30 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t.hero.badge}
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              {t.hero.title}{" "}
              <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/login">{t.hero.ctaPortal}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10">
                <a href={waDefault} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t.whatsapp.chatShort}
                </a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-display text-2xl font-bold text-foreground">500+</span>
                <br />
                {t.hero.statStudents}
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="font-display text-2xl font-bold text-foreground">2</span>
                <br />
                {t.hero.statBoards}
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="font-display text-2xl font-bold text-foreground">10+</span>
                <br />
                {t.hero.statYears}
              </div>
            </div>
          </div>

          {/* Owner contact + inquiry (replaces portal mock) */}
          <div className="card-elevated space-y-6 p-6">
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t.heroCard.ownerLabel}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold">{t.heroCard.ownerName}</p>
                  <p className="text-sm text-muted-foreground">{SITE_OWNER.phoneDisplay}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${SITE_OWNER.phoneTel}`}>{t.heroCard.callOwner}</a>
                </Button>
                <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#20bd5a]">
                  <a href={waDefault} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t.heroCard.whatsappOwner}
                  </a>
                </Button>
              </div>
            </div>

            <form onSubmit={sendInquiry} className="space-y-3">
              <p className="font-display text-base font-bold">{t.heroCard.inquiryTitle}</p>
              <div>
                <Label htmlFor="inq-name">{t.heroCard.inquiryName}</Label>
                <Input
                  id="inq-name"
                  value={inquiry.name}
                  onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="inq-phone">{t.heroCard.inquiryPhone}</Label>
                <Input
                  id="inq-phone"
                  value={inquiry.phone}
                  onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inq-msg">{t.heroCard.inquiryMessage}</Label>
                <Textarea
                  id="inq-msg"
                  rows={3}
                  value={inquiry.message}
                  onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#20bd5a]" disabled={sending}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {sending ? "…" : t.heroCard.inquirySend}
              </Button>
              <p className="text-xs text-muted-foreground">{t.heroCard.inquiryHint}</p>
            </form>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-primary">{t.about.subtitle}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">{t.about.title}</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <p className="text-lg leading-relaxed text-muted-foreground">{t.about.p1}</p>
            <p className="text-lg leading-relaxed text-muted-foreground">{t.about.p2}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <div className="card-elevated flex items-center gap-3 px-5 py-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Classes 1–10</p>
                <p className="text-sm text-muted-foreground">CBSE & SSC</p>
              </div>
            </div>
            <div className="card-elevated flex items-center gap-3 px-5 py-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Digital portal</p>
                <p className="text-sm text-muted-foreground">Students & parents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t.why.title}</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.why.items.map((item, i) => (
            <div key={i} className="stat-tile">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-base font-bold">{item.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section id="subjects" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-primary">{t.subjects.subtitle}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">{t.subjects.title}</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.subjects.list.map((sub, i) => {
              const Icon = subjectIcons[i] ?? GraduationCap;
              return (
                <div key={sub.n} className="card-elevated flex gap-4 p-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold">{sub.n}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{sub.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t.contact.title}</h2>
        <div className="card-elevated mt-10 grid gap-6 p-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex gap-3">
              <User className="h-5 w-5 shrink-0 text-primary" />
              <p className="font-medium">{t.contact.owner}</p>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-muted-foreground">{t.contact.address}</p>
            </div>
            <div className="flex gap-3">
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <a href={`tel:${SITE_OWNER.phoneTel}`} className="text-muted-foreground hover:text-foreground">
                {t.contact.phone}
              </a>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-muted-foreground">{t.contact.hours}</p>
            </div>
            <Button asChild className="mt-2 bg-[#25D366] hover:bg-[#20bd5a]">
              <a href={waDefault} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t.contact.whatsappBtn}
              </a>
            </Button>
          </div>
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[#25D366]/40 bg-[#25D366]/5 p-6 text-center">
            <MessageCircle className="h-12 w-12 text-[#25D366]" />
            <p className="mt-4 font-medium">{SITE_OWNER.phoneDisplay}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "mr" ? "प्रवेश, फी आणि वेळापत्रकासाठी WhatsApp करा" : "WhatsApp for admission, fees & timings"}
            </p>
          </div>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="border-t border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t.portals.title}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="card-elevated p-8">
              <div className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Students
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{t.portals.studentTitle}</h3>
              <p className="mt-2 text-muted-foreground">{t.portals.studentDesc}</p>
              <Button asChild className="mt-6">
                <Link to="/login">{t.portals.studentBtn}</Link>
              </Button>
            </div>
            <div className="card-elevated p-8">
              <div className="inline-flex rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                Staff
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{t.portals.staffTitle}</h3>
              <p className="mt-2 text-muted-foreground">{t.portals.staffDesc}</p>
              <Button asChild variant="outline" className="mt-6">
                <Link to="/login">{t.portals.staffBtn}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            {t.footer.replace("{year}", String(year))} · {t.contact.owner}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button asChild variant="link" size="sm">
              <Link to="/login">{t.nav.signIn}</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
