import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSettings } from "@/db/store";
import { resetAllDataAction, updateSettingsAction } from "@/app/actions";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Tune your data access window and connection defaults.
          </p>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Access preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                Default country (ie/gb)
                <Input name="defaultCountry" defaultValue={settings.defaultCountry} />
              </label>
              <label className="space-y-2 text-sm">
                Max historical days
                <Input
                  name="maxHistoricalDays"
                  type="number"
                  defaultValue={settings.maxHistoricalDays}
                />
              </label>
              <label className="space-y-2 text-sm">
                Access valid for days
                <Input
                  name="accessValidForDays"
                  type="number"
                  defaultValue={settings.accessValidForDays}
                />
              </label>
              <label className="space-y-2 text-sm">
                Budget threshold alert (%)
                <Input
                  name="budgetAlertThreshold"
                  type="number"
                  defaultValue={settings.budgetAlertThreshold ?? 85}
                />
              </label>
              <label className="space-y-2 text-sm">
                Recurring rule sensitivity (low/medium/high)
                <Input
                  name="recurringRuleSensitivity"
                  defaultValue={settings.recurringRuleSensitivity ?? "medium"}
                />
              </label>
              <label className="space-y-2 text-sm">
                Merchant alias mode (strict/balanced/loose)
                <Input
                  name="merchantAliasMode"
                  defaultValue={settings.merchantAliasMode ?? "balanced"}
                />
              </label>
              <label className="space-y-2 text-sm">
                AI tone (strict/coach/neutral)
                <Input name="aiTone" defaultValue={settings.aiTone ?? "neutral"} />
              </label>
              <label className="space-y-2 text-sm">
                Privacy mode (standard/minimal)
                <Input name="privacyMode" defaultValue={settings.privacyMode ?? "standard"} />
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  name="notificationsEnabled"
                  defaultChecked={settings.notificationsEnabled ?? true}
                />
                Notifications enabled
              </label>
              <div className="md:col-span-2">
                <Button type="submit">Save settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
            <p>Reset all data and revoke local tokens.</p>
            <form action={resetAllDataAction}>
              <Button type="submit" variant="destructive">
                Reset everything
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

