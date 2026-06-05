import { Navigate } from 'react-router';

export function AdminRedirectPage() {
  return <Navigate to="/admin/dashboard" replace />;
}
