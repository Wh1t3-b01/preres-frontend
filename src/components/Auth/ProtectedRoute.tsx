/**
 * Sotto Sotto Bar & Grill / PRERES™ — Protected Route Wrapper
 * Restricts access to dashboard views, enforcing authenticated sessions
 * and Role-Based Access Control (RBAC).
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StaffRole } from '../../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  // If user arrives via a password recovery link with hash token (#type=recovery), forward to reset-password
  const isRecoveryFlow =
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery') ||
    location.hash.includes('type=recovery') ||
    location.search.includes('type=recovery');

  if (isRecoveryFlow && location.pathname !== '/reset-password') {
    return <Navigate to={`/reset-password${window.location.search}${window.location.hash}`} replace />;
  }

  // 1. Show sleek loading state while session verification completes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E121B] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B31E0] to-[#6E20C0] text-white flex items-center justify-center shadow-lg border border-[#A855F7]/30">
            <span className="font-brand font-bold text-2xl">P</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-[#8B31E0]/40 animate-ping pointer-events-none"></div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-brand font-bold text-sm text-white tracking-wide">
            PRERES™ HOSPITALITY OS
          </h3>
          <p className="text-xs text-slate-400 font-medium">
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
      <div className="min-h-screen bg-[#0E121B] flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-[#121622] border border-[#273248] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/40 text-amber-300 border border-amber-500/40 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-brand font-bold text-white">
              Accesso Riservato
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Il tuo profilo attuale (<span className="capitalize text-amber-300 font-semibold">{role}</span>) non dispone delle autorizzazioni necessarie per visualizzare questa sezione.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171D2B] hover:bg-[#222A3C] text-slate-200 border border-[#273248] text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna alla Vista Principale</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
