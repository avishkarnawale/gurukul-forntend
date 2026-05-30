import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createStaff, deleteStaff, fetchStaff } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserCog, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/teachers")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = usePortalQuery({ queryKey: ["admin-staff"], queryFn: fetchStaff });
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? This will permanently delete this staff account.`)) return;
    setRemovingId(id);
    try {
      await deleteStaff(id);
      toast.success("Staff member removed");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Teachers & Staff"
        subtitle={`${data?.length ?? 0} members`}
        action={<AddTeacher onDone={() => qc.invalidateQueries({ queryKey: ["admin-staff"] })} />}
      />
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Designation</th><th className="p-3">Phone</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="flex items-center gap-2 p-3 font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-primary">
                    <UserCog className="h-4 w-4" />
                  </span>
                  {s.full_name}
                  {s.role === "admin" && <Badge variant="secondary">Owner</Badge>}
                </td>
                <td className="p-3 text-muted-foreground">{s.email}</td>
                <td className="p-3">{s.designation ?? "—"}</td>
                <td className="p-3">{s.phone ?? "—"}</td>
                <td className="p-3 text-right">
                  {s.role === "admin" ? (
                    <span className="text-xs text-muted-foreground">Protected</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={removingId === s.id}
                      onClick={() => handleRemove(s.id, s.full_name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <EmptyState title="No teachers yet" hint="Click Add Teacher to invite your first staff member." />}
      </div>
    </div>
  );
}

function AddTeacher({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", designation: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createStaff(form);
      toast.success("Staff member added");
      setForm({ full_name: "", email: "", password: "", designation: "", phone: "" });
      setOpen(false);
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add staff member</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <div><Label>Department / designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <Button type="submit" className="w-full" disabled={busy}>Add</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
