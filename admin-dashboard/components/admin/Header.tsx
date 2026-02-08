"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border glass px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/admin"
          className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-border" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.name}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* User Button */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-2 ring-border hover:ring-primary/50 transition-all",
              userButtonPopoverCard: "bg-card border-border shadow-theme-lg",
              userButtonPopoverActionButton: "text-foreground hover:bg-muted",
              userButtonPopoverActionButtonText: "text-foreground",
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
      </div>
    </header>
  );
}
