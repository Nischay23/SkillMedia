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
    <div className="rounded-xl border border-[#2d3748] bg-[#111827] p-6 transition-colors hover:border-[#10b981]/30">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981]/10">
          <Icon className="h-5 w-5 text-[#10b981]" />
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium rounded-full px-2 py-1",
              changeType === "positive" && "bg-emerald-500/10 text-emerald-400",
              changeType === "negative" && "bg-red-500/10 text-red-400",
              changeType === "neutral" && "bg-gray-500/10 text-gray-400"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-[#2d3748]" />
        ) : (
          <p className="text-3xl font-bold text-[#e5e7eb]">{value}</p>
        )}
        <p className="mt-1 text-sm text-[#9ca3af]">{title}</p>
      </div>
    </div>
  );
}
