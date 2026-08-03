import { Bot, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';

const promptTemplates = [
  {
    title: 'Guest Booking Assistant',
    description:
      'Handles room discovery, booking questions, and upsell prompts.',
    model: 'gemini-3.5-flash-lite',
  },
  {
    title: 'Marketing Content Draft',
    description:
      'Generates campaign copy, social captions, and hotel descriptions.',
    model: 'gemini-3.5-flash-lite',
  },
  {
    title: 'Review Sentiment Classifier',
    description: 'Classifies guest feedback sentiment and escalation priority.',
    model: 'gemini-3.5-flash-lite',
  },
];

export function AdminAiSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Bot}
        title="AI Settings"
        description="Configure AI prompt templates, model behavior, safety limits, and service settings."
        actions={
          <Button className="rounded-lg bg-role-admin-primary px-4 text-white hover:bg-role-admin-secondary">
            <Save className="mr-2 size-4" />
            Save AI Settings
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-blue-600" />
            <h2 className="text-lg font-bold">AI Service Controls</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">Provider</Label>
              <Input id="ai-provider" defaultValue="Google Gemini" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-temperature">Temperature</Label>
              <Input id="ai-temperature" defaultValue="0.4" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-token-limit">Max tokens</Label>
              <Input id="ai-token-limit" defaultValue="1200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-fallback">Fallback model</Label>
              <Input id="ai-fallback" defaultValue="gemini-3.5-flash-lite" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-slate-950 p-5 text-white">
          <Sparkles className="size-5 text-blue-300" />
          <h2 className="mt-3 text-lg font-bold">Safety & Escalation</h2>
          <div className="mt-4 space-y-3">
            {[
              'Human handoff for payment disputes',
              'Block unsafe travel advice',
              'Log all AI admin edits',
            ].map(item => (
              <label
                className="flex items-center gap-2 text-sm font-semibold"
                key={item}
              >
                <input
                  className="size-4 accent-blue-500"
                  defaultChecked
                  type="checkbox"
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {promptTemplates.map(template => (
          <article
            className="rounded-xl border bg-white p-5"
            key={template.title}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {template.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {template.model}
              </span>
            </div>
            <textarea
              className="mt-4 min-h-28 w-full resize-none rounded-xl border border-outline-variant/50 p-4 text-sm outline-none focus:border-role-admin-primary focus:ring-3 focus:ring-role-admin-primary/20"
              defaultValue={`System prompt for ${template.title}. Keep responses accurate, concise, and aligned with StayHub policies.`}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
