import { ApiHealthWidget } from "@/components/api-health-widget";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import type { WorkspaceMode } from "@/types/app";

export function AppShell({
  children,
  workspace = "personal",
}: {
  children: React.ReactNode;
  workspace?: WorkspaceMode;
}) {
  return (
    <div
      className={cn(
        "min-h-screen",
        workspace === "business"
          ? "bg-linear-to-br from-slate-950/5 via-background to-sky-100/30"
          : "bg-linear-to-br from-background via-background to-muted/30",
      )}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <Sidebar workspace={workspace} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          {children}
          <ApiHealthWidget />
        </main>
      </div>
    </div>
  );
}

