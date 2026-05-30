import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { saveSession, getRole } from "@/lib/api";
import { studentLogin, staffLogin } from "@/lib/portal-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Gurukul Classes" }] }),
});

function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getRole();
    if (role === "admin" || role === "staff") navigate({ to: "/admin" });
    else if (role === "student") navigate({ to: "/student" });
  }, [navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-primary via-orange-500 to-orange-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">Gurukul Classes</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Welcome back to your premium learning portal.
          </h1>
          <p className="mt-4 max-w-md text-white/85">
            Track attendance, fees, homework and results — all in one beautifully designed
            dashboard.
          </p>
        </div>
        <p className="text-sm text-white/70">© {new Date().getFullYear()} Gurukul Classes</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">Gurukul Classes</span>
          </div>
          <h2 className="font-display text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose your portal to continue.</p>

          <Tabs defaultValue="student" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="staff">Staff / Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-6">
              <StudentForm />
            </TabsContent>
            <TabsContent value="staff" className="mt-6">
              <StaffForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StudentForm() {
  const navigate = useNavigate();
  const [roll, setRoll] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const session = await studentLogin(roll, dob);
      saveSession(session);
      toast.success("Welcome back!");
      navigate({ to: "/student" });
    } catch (err: any) {
      toast.error(err.message || "Invalid roll number or date of birth.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="roll">Roll Number</Label>
        <Input
          id="roll"
          placeholder="e.g. GK001"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="dob">Date of Birth (password)</Label>
        <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
        <p className="mt-1 text-xs text-muted-foreground">
          Use YYYY-MM-DD format — your DOB is your default password.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in as Student
      </Button>
      <p className="text-center text-xs text-muted-foreground">Forgot DOB? Ask your class admin.</p>
    </form>
  );
}

function StaffForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const session = await staffLogin(email, password);
      saveSession(session);
      toast.success("Welcome back!");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in as Staff
      </Button>
    </form>
  );
}
