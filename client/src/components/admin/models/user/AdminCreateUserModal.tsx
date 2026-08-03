import { useEffect, useState, type FormEvent } from 'react';
import { Lock, Mail, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/constants/roles';
import { useCreateAdminUser } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateLong, formatTime } from '@/utils/formatDate';

interface AdminCreateUserModalProps {
  currentTime: Date;
  onClose: () => void;
}

type CreateUserFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

export function AdminCreateUserModal({
  currentTime,
  onClose,
}: AdminCreateUserModalProps) {
  const createUser = useCreateAdminUser();
  const [form, setForm] = useState<CreateUserFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.PLATFORM_MANAGER,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateField = (
    field: keyof CreateUserFormState,
    value: string | UserRole
  ) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    createUser.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      },
      {
        onSuccess: () => {
          toast.success('User created');
          onClose();
        },
        onError: err => {
          toast.error(errorMessage(err, 'Could not create user.'));
        },
      }
    );
  };

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

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="size-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-950">
                Create New User
              </h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Created at {formatDateLong(currentTime)} |{' '}
              {formatTime(currentTime)}
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

        <form className="space-y-4 p-4 sm:p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-user-name">Full name</Label>
              <Input
                id="admin-user-name"
                onChange={event => updateField('name', event.target.value)}
                placeholder="Sarah Nguyen"
                required
                value={form.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-role">Role</Label>
              <select
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                id="admin-user-role"
                onChange={event =>
                  updateField('role', event.target.value as UserRole)
                }
                value={form.role}
              >
                <option value={UserRole.PLATFORM_MANAGER}>
                  Platform manager
                </option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.HOTEL_PARTNER}>Hotel partner</option>
                <option value={UserRole.STAFF}>Staff</option>
                <option value={UserRole.MARKETER}>Marketer</option>
                <option value={UserRole.CUSTOMER}>Customer</option>
                <option value={UserRole.GUEST}>Guest</option>
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
                onChange={event => updateField('email', event.target.value)}
                placeholder="user@stayhub.ai"
                required
                type="email"
                value={form.email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-user-password">Temporary password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                id="admin-user-password"
                minLength={8}
                onChange={event => updateField('password', event.target.value)}
                placeholder="At least 8 chars, letters and numbers"
                required
                type="password"
                value={form.password}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-user-confirm-password">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-invalid={
                  form.confirmPassword.length > 0 &&
                  form.password !== form.confirmPassword
                }
                className="pl-9"
                id="admin-user-confirm-password"
                minLength={8}
                onChange={event =>
                  updateField('confirmPassword', event.target.value)
                }
                placeholder="Re-enter temporary password"
                required
                type="password"
                value={form.confirmPassword}
              />
            </div>
            {form.confirmPassword.length > 0 &&
            form.password !== form.confirmPassword ? (
              <p className="text-xs font-medium text-destructive">
                Passwords do not match.
              </p>
            ) : null}
          </div>

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-role-admin-primary text-sm font-bold text-white hover:bg-role-admin-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              createUser.isPending || form.password !== form.confirmPassword
            }
            type="submit"
          >
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>
    </div>
  );
}
