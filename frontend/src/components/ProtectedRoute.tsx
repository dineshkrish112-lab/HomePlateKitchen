import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { PageLoader } from './ui';

const loginFor: Record<Role, string> = { ADMIN: '/admin/login', KITCHEN_OWNER: '/kitchen/login', CUSTOMER: '/login' };

/** Role based route guard. */
export default function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!user || user.role !== role) {
    return <Navigate to={`${loginFor[role]}?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return <>{children}</>;
}
