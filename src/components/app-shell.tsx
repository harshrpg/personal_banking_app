import { ApiHealthWidget } from "@/components/api-health-widget";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <Sidebar />
        <main className="flex-1 px-6 py-8 lg:px-10">
          {children}
          <ApiHealthWidget />
        </main>
      </div>
    </div>
  );
}

