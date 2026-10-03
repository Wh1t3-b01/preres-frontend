/**
 * Sotto Sotto Bar & Grill — Protected Route Wrapper
 * Restricts access to dashboard views, enforcing authenticated sessions
 * and optional Role-Based Access Control (RBAC).
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StaffRole } from '../../types';
import { ShieldAlert, ArrowLeft, UtensilsCrossed } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, role, user } = useAuth();
  const location = useLocation();

  // 1. Show elegant loading state while session verification completes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A2F] text-amber-100 flex items-center justify-center shadow-lg">
            <UtensilsCrossed className="w-7 h-7 animate-pulse" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-[#6B3FA0]/30 animate-ping pointer-events-none"></div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-brand font-bold text-sm text-[#1E3A2F] tracking-wide">
            SOTTO SOTTO BAR & GRILL
          </h3>
          <p className="text-xs text-stone-500 font-medium">
            Verifica sessione di sicurezza in corso...
          </p>
        </div>
      </div>
    );
  }

  // 2. Redirect unauthenticated visitors to /login preserving the return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Optional Role-Based Access Control (RBAC) validation
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#1E3A2F]/15 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-brand font-bold text-[#1E3A2F]">
              Accesso Riservato
            </h2>
            <p className="text-xs text-stone-600">
              La sezione richiesta richiede privilegi di livello{' '}
              <strong className="text-[#6B3FA0] uppercase font-bold">{allowedRoles.join(' / ')}</strong>.
              Il tuo account attuale è autenticato come <span className="font-bold uppercase text-[#1E3A2F]">"{role}"</span> ({user?.email}).
            </p>
          </div>
          <div className="pt-2">
            <Navigate to="/" replace />
          </div>
        </div>
      </div>
    );
  }

  // 4. Session valid & authorized -> render protected children
  return <>{children}</>;
};
