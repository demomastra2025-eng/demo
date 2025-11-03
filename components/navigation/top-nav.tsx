"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/workspace", label: "Чат" },
  { href: "/floating", label: "Интерфейс" },
];

export const TopNav = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full items-center justify-between pl-4 pr-4 sm:px-4 sm:pl-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Crafty studio
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Демо AI агентов 
          </span>
        </div>
        <nav className="flex items-center gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/50 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full transition",
                    isActive ? "bg-white" : "bg-muted-foreground/60",
                  )}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
