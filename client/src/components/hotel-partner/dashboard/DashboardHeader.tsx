import { useAuthStore } from '@/stores/authStore';

export function DashboardHeader() {
  const user = useAuthStore(state => state.user);
  const firstName = user?.fullName?.trim().split(/\s+/).pop();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome back{firstName ? `, ${firstName}` : ''}, here's what's happening today.
        </p>
      </div>
    </div>
  );
}
