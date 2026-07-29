import {
  Bell,
  Bot,
  KeyRound,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';

interface SettingToggleProps {
  description: string;
  enabled?: boolean;
  label: string;
}

function SettingToggle({
  description,
  enabled = false,
  label,
}: SettingToggleProps) {
  const inputId = `setting-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3"
      htmlFor={inputId}
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        className="peer sr-only"
        defaultChecked={enabled}
        id={inputId}
        type="checkbox"
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-blue-600 peer-checked:after:translate-x-5" />
    </label>
  );
}

interface SettingsCardProps {
  children: React.ReactNode;
  icon: React.ElementType;
  title: string;
}

function SettingsCard({ children, icon: Icon, title }: SettingsCardProps) {
  return (
    <section className="rounded-[28px] border border-outline-variant/40 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="size-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button className="rounded-full" size="lg" type="button">
            <Save className="size-4" />
            Save changes
          </Button>
        }
        description="Manage system defaults, AI behavior, access controls, and admin notifications."
        title="Settings"
      />

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SettingsCard icon={SlidersHorizontal} title="Platform defaults">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hotel-name">Hotel group name</Label>
              <Input id="hotel-name" defaultValue="StayHub Collection" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support email</Label>
              <Input
                id="support-email"
                defaultValue="support@stayhub.ai"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default currency</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                defaultValue="VND"
                id="currency"
              >
                <option value="VND">VND (VNĐ)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="Asia/Ho_Chi_Minh" />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard icon={Bot} title="AI automation">
          <div className="space-y-3">
            <SettingToggle
              description="Allow the concierge bot to answer guest booking questions automatically."
              enabled
              label="Guest chatbot"
            />
            <SettingToggle
              description="Draft promotional copy and captions inside the marketing workspace."
              enabled
              label="Content drafting"
            />
            <SettingToggle
              description="Surface urgent occupancy, payment, and review anomalies to managers."
              enabled
              label="Smart alerts"
            />
          </div>
        </SettingsCard>

        <SettingsCard icon={ShieldCheck} title="Security controls">
          <div className="space-y-3">
            <SettingToggle
              description="Require an additional verification step for admin and manager accounts."
              enabled
              label="Two-factor authentication"
            />
            <SettingToggle
              description="Force users to sign in again after extended inactivity."
              enabled
              label="Session timeout"
            />
            <SettingToggle
              description="Restrict API access to approved backend origins."
              label="IP allowlist"
            />
          </div>
        </SettingsCard>

        <SettingsCard icon={Bell} title="Notifications">
          <div className="space-y-3">
            <SettingToggle
              description="Send an email when a property or host requires manual review."
              enabled
              label="Review queue email"
            />
            <SettingToggle
              description="Notify admins when payment disputes or failed payouts are detected."
              enabled
              label="Payment risk alerts"
            />
            <SettingToggle
              description="Send daily summaries for platform health and usage changes."
              label="Daily digest"
            />
          </div>
        </SettingsCard>
      </div>

      <section className="rounded-[28px] border border-outline-variant/40 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">API access keys</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/65">
                Rotate integration keys for internal services, AI providers,
                and notification workers.
              </p>
            </div>
          </div>
          <Button
            className="rounded-full border-white/20 bg-white text-slate-950 hover:bg-white/90"
            type="button"
          >
            Manage keys
          </Button>
        </div>
      </section>
    </div>
  );
}
