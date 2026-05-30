import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalQuery } from "@/hooks/use-portal-query";
import { createNotice, deleteNotice, fetchNotices } from "@/lib/portal-api";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notices")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = usePortalQuery({ queryKey: ["admin-notices"], queryFn: fetchNotices });

  const remove = async (id: string) => {
    try {
      await deleteNotice(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["student-notices"] });
      qc.invalidateQueries({ queryKey: ["student-dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      qc.invalidateQueries({ queryKey: ["student-notifications-list"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notices"
        action={
          <NewNotice
            onDone={() => {
              qc.invalidateQueries({ queryKey: ["admin-notices"] });
              qc.invalidateQueries({ queryKey: ["notifications-unread"] });
              qc.invalidateQueries({ queryKey: ["student-notifications-list"] });
              qc.invalidateQueries({ queryKey: ["student-notices"] });
              qc.invalidateQueries({ queryKey: ["student-dashboard"] });
            }}
          />
        }
      />
      <div className="space-y-3">
        {(data ?? []).map((n) => (
          <div key={n.id} className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold">{n.title}</h3>
                {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(n.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{n.content}</p>
          </div>
        ))}
        {!data?.length && <EmptyState title="No notices" />}
      </div>
    </div>
  );
}

function NewNotice({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    pinned: false,
    category: "academic" as "academic" | "general" | "event",
    targetAudience: "all" as "all" | "students" | "staff",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNotice(form);
      toast.success(
        form.category === "academic"
          ? "Notice posted — students will be notified"
          : "Notice posted",
      );
      onDone();
      setOpen(false);
      setForm({
        title: "",
        content: "",
        pinned: false,
        category: "academic",
        targetAudience: "all",
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Notice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a notice</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic (notify students)</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Audience</Label>
            <Select
              value={form.targetAudience}
              onValueChange={(v) =>
                setForm({ ...form, targetAudience: v as typeof form.targetAudience })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="students">Students only</SelectItem>
                <SelectItem value="staff">Staff only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.pinned}
              onCheckedChange={(v) => setForm({ ...form, pinned: v })}
            />
            <span className="text-sm">Pin to top</span>
          </div>
          <Button type="submit" className="w-full">
            Post
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
