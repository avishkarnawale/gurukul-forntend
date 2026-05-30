import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent = "primary",
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "muted";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)] text-success",
    warning:
      "bg-[color-mix(in_oklab,var(--color-warning)_22%,transparent)] text-warning-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold leading-none">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", styles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-elevated grid place-items-center p-12 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function QueryState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card-elevated mx-auto max-w-lg p-8 text-center">
        <p className="font-display text-base font-semibold">Could not load data</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
