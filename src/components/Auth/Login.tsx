import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  UtensilsCrossed,
  ArrowRight,
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

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
      setEmailError('Inserisci il tuo indirizzo email.');
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
      setPasswordError('Inserisci la password.');
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

      if (nextAttempts >= 5) {
        setLockoutTimer(30);
      }
    } else {
      setAttemptCount(0);
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-[#6B3FA0]/20 selection:text-[#1E3A2F]">
      {/* Background Subtle Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#1E3A2F_0.8px,transparent_0.8px)] [background-size:24px_24px]"></div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white border border-[#1E3A2F]/15 rounded-3xl p-7 sm:p-9 shadow-xl shadow-[#1E3A2F]/5 space-y-6">
        
        {/* Brand Identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A2F] text-amber-300 shadow-sm border border-amber-400/30 mb-1">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-brand font-bold text-[#1E3A2F] tracking-wide">
            SOTTO SOTTO
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#6B3FA0] font-bold">
            Bar & Grill · Portale di Servizio
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-rose-900 font-bold">Accesso non riuscito</strong>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Security Lockout Banner */}
        {lockoutTimer > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 font-bold">Accesso temporaneamente sospeso</strong>
              <span>
                Riprova tra <span className="font-mono-num font-bold text-amber-800">{lockoutTimer}s</span>
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
              Email
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
                placeholder="nome@ristorante.it"
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
            className="w-full mt-3 py-3 px-4 bg-[#1E3A2F] hover:bg-[#152921] text-amber-100 font-bold text-xs rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-amber-100 border-t-transparent rounded-full animate-spin"></span>
                <span>Accesso in corso...</span>
              </>
            ) : lockoutTimer > 0 ? (
              <span>Attendi {lockoutTimer}s</span>
            ) : (
              <>
                <span>Accedi al Servizio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Discreet Footer Note */}
        <div className="pt-3 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400">
            Sotto Sotto Bar & Grill · Sistema Gestionale Sala
          </p>
        </div>
      </div>
    </div>
  );
};
