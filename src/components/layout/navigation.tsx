"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, ListTodo, BarChart3, Menu, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: ListTodo },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const today = format(new Date(), "EEE, MMM d");

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 border-b"
        style={{
          backgroundColor: "hsl(240 10% 4% / 0.95)",
          backdropFilter: "blur(12px)",
          borderColor: "hsl(var(--border))",
          paddingLeft: "1.25rem",
          paddingRight: "1rem",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="HabitFlow" width={28} height={28} />
          <span className="font-bold text-base tracking-tight">HabitFlow</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg transition-colors"
          style={{ backgroundColor: mobileOpen ? "hsl(var(--muted))" : "transparent" }}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed top-14 left-0 right-0 z-40 border-b shadow-2xl"
          style={{ backgroundColor: "hsl(240 8% 7%)", borderColor: "hsl(var(--border))" }}
        >
          <div className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: active ? "hsl(262 80% 65% / 0.15)" : "transparent",
                    color: active ? "hsl(262 80% 72%)" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col z-30 border-r"
        style={{
          backgroundColor: "hsl(240 8% 6%)",
          borderColor: "hsl(var(--border))",
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="HabitFlow" width={36} height={36} className="flex-shrink-0" />
            <div>
              <div className="font-bold text-sm tracking-tight">HabitFlow</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{today}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-3 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group"
                style={{
                  backgroundColor: active ? "hsl(262 80% 65% / 0.15)" : "transparent",
                  color: active ? "hsl(262 80% 72%)" : "hsl(var(--muted-foreground))",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "hsl(240 6% 13%)";
                    e.currentTarget.style.color = "hsl(0 0% 95%)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                  }
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {active && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "hsl(262 80% 65%)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto">
          <div className="mx-0 mb-3 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
            >
              D
            </div>
            <div>
              <div className="text-sm font-medium">Demo User</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                6 active habits
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />
    </>
  );
}
