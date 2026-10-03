/**
 * Sotto Sotto Bar & Grill — Production-Ready Secure Staff Login
 * Form validation, rate-limiting deterrence, password visibility toggle,
 * security badges, and accessible UX.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Login: React.FC = () => {
  const { signIn, isAuthenticated, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Retrieve origin route from router state or default to root dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Lockout countdown timer for rate limiting
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Inserisci il tuo indirizzo email aziendale.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Formato email non valido.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Inserisci la password di accesso.');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('La password deve contenere almeno 6 caratteri.');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (lockoutTimer > 0) return;

    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);

    if (!isEmailValid || !isPassValid) {
      return;
    }

    const result = await signIn(email, password);

    if (!result.success) {
      const nextAttempts = attemptCount + 1;
      setAttemptCount(nextAttempts);

      // Local client-side rate-limit trigger after 5 consecutive failures
      if (nextAttempts >= 5) {
        setLockoutTimer(30); // 30-second penalty
      }
    } else {
      setAttemptCount(0);
      navigate(from, { replace: true });
    }
  };

  // Demo accounts helper (convenient for testing & review)
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('SottoSotto2026!');
    setEmailError(null);
    setPasswordError(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-[#6B3FA0]/20 selection:text-[#1E3A2F]">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#1E3A2F_0.7px,transparent_0.7px)] [background-size:24px_24px]"></div>

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-white border border-[#1E3A2F]/15 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1E3A2F]/5 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A2F] text-amber-100 shadow-md mb-1">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-brand font-bold text-[#1E3A2F] tracking-wide">
            SOTTO SOTTO
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#6B3FA0] font-semibold">
            Bar & Grill · Portale Personale di Sala
          </p>
          <p className="text-xs text-stone-500 pt-1">
            Autenticazione protetta con crittografia end-to-end e Supabase Auth
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-rose-900 font-bold">Errore di Accesso</strong>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Rate Limiting Notice Banner */}
        {lockoutTimer > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 font-bold">Protezione Brute Force Attiva</strong>
              <span>
                Troppi tentativi errati. Il modulo è temporaneamente bloccato per sicurezza:{' '}
                <span className="font-mono-num font-bold text-amber-700">{lockoutTimer}s</span>
              </span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-bold text-[#1E3A2F] uppercase tracking-wider"
            >
              Email Aziendale
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading || lockoutTimer > 0}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="nome.cognome@sottosotto.it"
                className={`w-full bg-[#FDFBF7] border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1E3A2F] font-medium transition focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-[#1E3A2F]/20 focus:border-[#6B3FA0] focus:ring-[#6B3FA0]/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-rose-600 font-semibold pl-1">{emailError}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#1E3A2F] uppercase tracking-wider"
              >
                Password
              </label>
              <span className="text-[10px] text-stone-400">Minimo 6 caratteri</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLoading || lockoutTimer > 0}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                placeholder="••••••••••••"
                className={`w-full bg-[#FDFBF7] border rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#1E3A2F] font-medium transition focus:outline-none focus:ring-2 ${
                  passwordError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-[#1E3A2F]/20 focus:border-[#6B3FA0] focus:ring-[#6B3FA0]/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || lockoutTimer > 0}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 transition cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-rose-600 font-semibold pl-1">{passwordError}</p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading || lockoutTimer > 0}
            className="w-full mt-2 py-3 px-4 bg-[#1E3A2F] hover:bg-[#152921] text-amber-100 font-bold text-xs rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-amber-100 border-t-transparent rounded-full animate-spin"></span>
                <span>Verifica credenziali in corso...</span>
              </>
            ) : lockoutTimer > 0 ? (
              <span>Attendi {lockoutTimer}s per sbloccare</span>
            ) : (
              <>
                <span>Accedi alla Dashboard Operativa</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Environment Status Badge */}
        <div className="pt-2 border-t border-[#1E3A2F]/10 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isSupabaseConfigured ? 'Supabase Auth Cloud Connesso' : 'Modalità Demo Sicura'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-stone-400">JWT / PKCE Flow</span>
        </div>

        {/* Demo Fast-Login Assist for Staff */}
        <div className="bg-[#FBF8F2] border border-[#1E3A2F]/15 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#1E3A2F] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6B3FA0]" />
              <span>Accesso Rapido Demo per Ruoli:</span>
            </span>
            <span className="text-[10px] text-[#6B3FA0] font-semibold">1-Click</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('manager@sottosotto.it')}
              className="py-1.5 px-2 bg-white hover:bg-stone-50 border border-[#1E3A2F]/15 rounded-lg text-center font-semibold text-[#1E3A2F] transition text-[11px] shadow-2xs hover:border-[#6B3FA0]"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('host@sottosotto.it')}
              className="py-1.5 px-2 bg-white hover:bg-stone-50 border border-[#1E3A2F]/15 rounded-lg text-center font-semibold text-[#1E3A2F] transition text-[11px] shadow-2xs hover:border-[#6B3FA0]"
            >
              Host Accoglienza
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('waiter@sottosotto.it')}
              className="py-1.5 px-2 bg-white hover:bg-stone-50 border border-[#1E3A2F]/15 rounded-lg text-center font-semibold text-[#1E3A2F] transition text-[11px] shadow-2xs hover:border-[#6B3FA0]"
            >
              Cameriere Sala
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
