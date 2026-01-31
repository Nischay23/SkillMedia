"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

// Generate breadcrumb items from pathname
function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#2d3748] bg-[#0b0f19]/95 px-6 backdrop-blur supports-backdrop-filter:bg-[#0b0f19]/60">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/admin"
          className="flex items-center text-[#9ca3af] transition-colors hover:text-[#e5e7eb]"
        >
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-[#2d3748]" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-[#e5e7eb]">{crumb.name}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[#9ca3af] transition-colors hover:text-[#e5e7eb]"
              >
                {crumb.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Button */}
      <div className="flex items-center gap-4">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
              userButtonPopoverCard: "bg-[#111827] border-[#2d3748]",
              userButtonPopoverActionButton: "text-[#e5e7eb] hover:bg-[#1f2937]",
              userButtonPopoverActionButtonText: "text-[#e5e7eb]",
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
      </div>
    </header>
  );
}
