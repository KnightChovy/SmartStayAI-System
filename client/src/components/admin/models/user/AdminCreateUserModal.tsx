import { useEffect } from 'react';
import { Mail, Shield, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminCreateUserModalProps {
  currentTime: Date;
  onClose: () => void;
}

export function AdminCreateUserModal({
  currentTime,
  onClose,
}: AdminCreateUserModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close create user"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="size-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-950">
                Create New User
              </h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Created at {formatDate(currentTime)} | {formatTime(currentTime)}
            </p>
          </div>
          <button
            aria-label="Close create user"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-user-name">Full name</Label>
              <Input id="admin-user-name" placeholder="Sarah Nguyen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-role">Role</Label>
              <select
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                id="admin-user-role"
              >
                <option>Admin</option>
                <option>Manager</option>
                <option>Staff</option>
                <option>Guest</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-user-email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                id="admin-user-email"
                placeholder="user@smartstay.ai"
                type="email"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input className="mt-1 size-4 accent-blue-600" defaultChecked type="checkbox" />
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Shield className="size-4 text-blue-600" />
                Send invite and require first login verification
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                The user receives an invitation email and must verify identity
                before accessing the admin portal.
              </span>
            </span>
          </label>

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white hover:bg-blue-700"
            type="button"
          >
            Create User
          </button>
        </div>
      </section>
    </div>
  );
}
