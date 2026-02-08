import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  loading = false,
}: StatsCardProps) {
  return (
    <div className="card-interactive rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {change && (
          <span
            className={cn(
              "badge",
              changeType === "positive" && "badge-success",
              changeType === "negative" && "badge-error",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-20 animate-pulse-subtle rounded bg-muted" />
        ) : (
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
