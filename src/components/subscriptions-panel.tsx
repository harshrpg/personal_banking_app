import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptions, type Subscription } from "@/lib/costs";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function badgeColor(name: string) {
  switch (name) {
    case "Netflix":
      return "bg-red-500/20 text-red-500";
    case "Disney+":
      return "bg-blue-500/20 text-blue-500";
    case "Amazon Prime":
      return "bg-sky-500/20 text-sky-500";
    case "LinkedIn":
      return "bg-sky-600/20 text-sky-600";
    case "The Warehouse Gym":
      return "bg-amber-500/20 text-amber-500";
    case "ChatGPT":
      return "bg-emerald-500/20 text-emerald-500";
    case "Cursor":
      return "bg-violet-500/20 text-violet-500";
    case "Apple":
      return "bg-neutral-400/20 text-neutral-500";
    case "Google One":
      return "bg-rose-500/20 text-rose-500";
    case "Youtube":
      return "bg-red-600/20 text-red-600";
    case "Microsoft 365":
      return "bg-blue-600/20 text-blue-600";
    case "Deliveroo":
      return "bg-teal-500/20 text-teal-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function SubscriptionsPanel({
  items,
  currency = "EUR",
}: {
  items?: Subscription[];
  currency?: string;
}) {
  const resolved = items && items.length > 0 ? items : subscriptions;
  const total = resolved.reduce((sum, item) => sum + item.price, 0);

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Subscriptions</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total:{" "}
          {new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(total)}
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        {resolved.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className={`h-10 w-10 ${badgeColor(item.name)}`}>
                <AvatarFallback className="text-xs font-semibold">
                  {initialsFor(item.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.billingDate}
                  {item.occurrences ? ` · ${item.occurrences} charges` : ""}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium">
              {new Intl.NumberFormat("en-IE", {
                style: "currency",
                currency: item.currency ?? currency,
              }).format(item.price)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

