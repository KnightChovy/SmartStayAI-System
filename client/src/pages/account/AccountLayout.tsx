import { Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import AccountSidebar from '@/components/account/AccountSidebar';

/**
 * Khung khu tài khoản customer. Nằm trong Layout guest (Navbar + Footer),
 * thêm sidebar điều hướng bên trái + header chào mừng.
 */
export default function AccountLayout() {
  const user = useAuthStore(state => state.user);
  const initials = (user?.fullName || user?.email || 'US').slice(0, 2).toUpperCase();

  return (
    <div className="w-full py-10">
      <div className="mx-auto max-w-7xl px-margin-mobile md:px-8">
        {/* Header chào mừng */}
        <div className="mb-8 flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.fullName || 'User'}
              className="size-14 rounded-full border border-outline-variant object-cover"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary-container text-lg font-bold text-on-secondary-container">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm text-on-surface-variant">Welcome back,</p>
            <h1 className="font-be-vietnam text-2xl font-bold text-on-surface">
              {user?.fullName || 'Guest'}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="md:w-60 md:shrink-0">
            <div className="md:sticky md:top-24">
              <AccountSidebar />
            </div>
          </aside>
          <section className="min-w-0 flex-1">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
