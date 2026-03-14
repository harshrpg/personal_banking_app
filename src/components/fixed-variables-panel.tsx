import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fixedVariables,
  type FixedVariableItem,
} from "@/lib/costs";

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
    case "Trainer":
      return "bg-emerald-500/20 text-emerald-500";
    case "House rent":
      return "bg-amber-500/20 text-amber-500";
    case "Electricity":
      return "bg-blue-500/20 text-blue-500";
    case "Diesel":
      return "bg-orange-500/20 text-orange-500";
    case "Groceries":
      return "bg-green-500/20 text-green-500";
    case "Social activities":
      return "bg-pink-500/20 text-pink-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function FixedVariablesPanel({
  items,
  currency = "EUR",
}: {
  items?: FixedVariableItem[];
  currency?: string;
}) {
  const resolved = items && items.length > 0 ? items : fixedVariables;
  const totalMonthly = resolved.reduce((sum, item) => sum + item.price, 0);

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Fixed variables</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total monthly:{" "}
          {new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(
            totalMonthly,
          )}
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
                  {item.frequency}
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

