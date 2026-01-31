"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTree, FileText, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Filters", href: "/admin/filters", icon: ListTree },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#2d3748] bg-[#111827]">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-[#2d3748] px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10b981]">
            <LayoutDashboard className="h-5 w-5 text-[#0b0f19]" />
          </div>
          <span className="text-lg font-semibold text-[#e5e7eb]">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : "text-[#9ca3af] hover:bg-[#1f2937] hover:text-[#e5e7eb]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#2d3748] p-4">
        <p className="text-xs text-[#9ca3af]">
          Skills App Admin v1.0
        </p>
      </div>
    </aside>
  );
}
