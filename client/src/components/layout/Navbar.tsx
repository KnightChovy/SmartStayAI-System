import { Link, useLocation } from 'react-router';
import { useLogoutMutation } from '../../hooks/auth';
import { useAuthStore } from '../../stores/auth.store';

export default function Navbar() {
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogoutMutation();

  return (
    <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 w-full border-b border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="font-be-vietnam font-bold tracking-tight text-on-surface text-2xl"
        >
          Smart Stay AI
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
            <Link
              to="/"
              className={`hover:text-primary transition-colors ${location.pathname === '/' ? 'text-secondary font-bold' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/deals"
              className={`hover:text-primary transition-colors ${location.pathname === '/deals' ? 'text-secondary font-bold' : ''}`}
            >
              Deals
            </Link>
            <Link
              to="/destinations"
              className={`hover:text-primary transition-colors ${location.pathname === '/destinations' ? 'text-secondary font-bold' : ''}`}
            >
              Destinations
            </Link>
            <Link
              to="/accommodation-types"
              className={`hover:text-primary transition-colors ${location.pathname === '/accommodation-types' ? 'text-secondary font-bold' : ''}`}
            >
              Stays
            </Link>
            <button className="hover:text-primary transition-colors flex items-center gap-1">
              USD{' '}
              <span className="material-symbols-outlined text-sm">
                expand_more
              </span>
            </button>
            <button className="hover:text-primary transition-colors flex items-center gap-1">
              EN{' '}
              <span className="material-symbols-outlined text-sm">
                language
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || 'User'}
                      className="size-8 rounded-full object-cover border border-outline-variant"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                      {(user?.name || user?.email || 'US')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-semibold text-on-surface">
                    {user?.name || user?.email || 'User'}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-semibold text-error border border-error/20 hover:bg-error/5 rounded-xl transition-all text-center cursor-pointer outline-none"
                >
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-all text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold bg-on-surface text-white rounded-xl hover:bg-primary transition-all text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
