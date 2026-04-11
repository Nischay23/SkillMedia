"use client";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  FileText,
  Flag,
  HelpCircle,
  Languages,
  LayoutDashboard,
  ListTree,
  Map,
  Settings,
  Trophy,
  Users,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "AI Config",
    href: "/admin/ai-config",
    icon: Bot,
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    name: "Languages",
    href: "/admin/languages",
    icon: Languages,
  },
  {
    name: "Filters",
    href: "/admin/filters",
    icon: ListTree,
  },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  {
    name: "Articles",
    href: "/admin/articles",
    icon: BookOpen,
  },
  { name: "Groups", href: "/admin/groups", icon: Users2 },
  { name: "Roadmaps", href: "/admin/roadmaps", icon: Map },
  {
    name: "Quizzes",
    href: "/admin/quizzes",
    icon: HelpCircle,
  },
  {
    name: "Challenges",
    href: "/admin/challenges",
    icon: Trophy,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: Flag,
    hasBadge: true,
  },
  { name: "Users", href: "/admin/users", icon: Users },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const reportCounts = useQuery(
    api.reports.getReportCounts,
  );
  const pendingReports = reportCounts?.pending ?? 0;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm group-hover:shadow-glow transition-shadow">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">
            Admin CMS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary-muted text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {item.hasBadge && pendingReports > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {pendingReports > 99
                    ? "99+"
                    : pendingReports}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Skills App Admin v1.0
        </p>
      </div>
    </aside>
  );
}
