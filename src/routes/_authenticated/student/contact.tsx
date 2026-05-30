import { createFileRoute } from "@tanstack/react-router";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { fetchTeacherContacts } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getUser } from "@/lib/api";
import { formatClassLabel } from "@/lib/portal-api";
import { MessageCircle, Phone, UserCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/contact")({
  component: Page,
});

function contactMessage(teacherName: string) {
  const u = getUser();
  const parts = [
    `Hello ${teacherName},`,
    "I am a student at Gurukul Classes.",
  ];
  if (u?.name) parts.push(`Name: ${u.name}`);
  if (u?.rollNumber) parts.push(`Roll: ${u.rollNumber}`);
  if (u?.class) parts.push(`Class: ${formatClassLabel(u.class)}`);
  parts.push("I would like to connect regarding my academics.");
  return parts.join("\n");
}

function Page() {
  const { data, isLoading } = usePortalQuery({
    queryKey: ["student-contacts"],
    queryFn: fetchTeacherContacts,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Contact teachers"
        subtitle="Call or message your teachers and the institute owner directly"
      />
      <div className="space-y-4">
        {(data ?? []).map((c) => (
          <div key={c.id} className="card-elevated flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold">{c.name}</h3>
                  {c.isOwner && <Badge>Owner</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{c.roleLabel}</p>
                {c.department && (
                  <p className="text-xs text-muted-foreground">{c.department}</p>
                )}
                {c.subjects.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Subjects: {c.subjects.join(", ")}
                  </p>
                )}
                {c.phoneDisplay && (
                  <p className="mt-1 text-sm font-medium">{c.phoneDisplay}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {c.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:+91${String(c.phone).replace(/\D/g, "").slice(-10)}`}>
                    <Phone className="mr-2 h-4 w-4" /> Call
                  </a>
                </Button>
              )}
              {c.whatsapp && (
                <Button size="sm" asChild>
                  <a
                    href={buildWhatsAppUrl(contactMessage(c.name), c.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {!c.phone && !c.whatsapp && (
                <span className="text-xs text-muted-foreground">Contact number not set</span>
              )}
            </div>
          </div>
        ))}
        {!isLoading && !data?.length && (
          <EmptyState title="No teachers listed" description="Ask admin to add staff profiles with phone numbers." />
        )}
      </div>
    </div>
  );
}
