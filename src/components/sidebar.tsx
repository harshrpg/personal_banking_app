"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Gauge,
  Goal,
  LineChart,
  MessageCircle,
  PieChart,
  ReceiptText,
  Settings2,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { WorkspaceMode } from "@/types/app";

const personalNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/subscriptions", label: "Subscriptions", icon: ReceiptText },
  { href: "/savings", label: "Savings", icon: Goal },
  { href: "/investments", label: "Investments", icon: PieChart },
  { href: "/reports", label: "Reports", icon: LineChart },
  { href: "/chat", label: "AI Assistant", icon: MessageCircle },
  { href: "/balance-sheet", label: "Balance sheet", icon: PieChart },
  { href: "/connect", label: "Connect", icon: Building2 },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const businessNavItems = [
  { href: "/business/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/business/transactions", label: "Statement", icon: ReceiptText },
  { href: "/business/connect", label: "Connect bank", icon: Building2 },
  { href: "/business/reports", label: "Reports", icon: LineChart },
];

export function Sidebar({ workspace = "personal" }: { workspace?: WorkspaceMode }) {
  const pathname = usePathname();
  const navItems = workspace === "business" ? businessNavItems : personalNavItems;
  const title = workspace === "business" ? "Business workspace" : "Personal dashboard";
  const badge = workspace === "business" ? "BX" : "OB";
  const status =
    workspace === "business"
      ? "Business mode · Commercial analytics"
      : "Single-user mode · Max 3 accounts";
  const activeItemClass =
    workspace === "business"
      ? "bg-sky-600 text-white shadow-sm"
      : "bg-primary text-primary-foreground shadow-sm";

  return (
    <aside className="hidden w-64 flex-col border-r border-border/60 bg-background/70 px-6 py-8 backdrop-blur lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground",
            workspace === "business" ? "bg-sky-600" : "bg-primary",
          )}
        >
          <span className="text-lg font-semibold">{badge}</span>
        </div>
        <div>
          <p className="text-sm font-semibold">Open Banking</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-card/60 p-2">
        <Link
          href="/dashboard"
          className={cn(
            "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors",
            workspace === "personal"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Personal
        </Link>
        <Link
          href="/business/dashboard"
          className={cn(
            "rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-colors",
            workspace === "business"
              ? "bg-sky-600 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Business
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                active
                  ? activeItemClass
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Status</p>
        <p className="mt-2">{status}</p>
      </div>
    </aside>
  );
}

