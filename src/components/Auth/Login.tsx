import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Login: React.FC = () => {
  const { signIn, resetPasswordForEmail, isAuthenticated, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [recoverySent, setRecoverySent] = useState(false);

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

    if (mode === 'forgot_password') {
      const isEmailValid = validateEmail(email);
      if (!isEmailValid) return;

      const res = await resetPasswordForEmail(email);
      if (res.success) {
        setRecoverySent(true);
      }
      return;
    }

    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);

    if (!isEmailValid || !isPassValid) {
      return;
    }

    const result = await signIn(email, password);
    if (!result.success && result.error?.includes('troppi tentativi')) {
      setLockoutTimer(30);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E121B] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-[#8B31E0]/30 selection:text-white">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B31E0]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-[#121622] border border-[#273248] rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B31E0] to-[#6E20C0] text-white shadow-lg border border-[#A855F7]/40 mb-1">
            <span className="font-brand font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-brand font-bold text-white tracking-tight">
            SOTTO SOTTO
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#C084FC] font-bold bg-[#8B31E0]/20 px-2 py-0.5 rounded-full border border-[#8B31E0]/30">
              PRERES™ Hospitality OS
            </span>
          </div>
        </div>

        {/* Recovery Sent Success State */}
        {recoverySent ? (
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#059669]/20 border border-[#059669]/40 text-[#34D399] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-bold text-base text-white">Email di Recupero Inviata</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Abbiamo inviato un link sicuro per reimpostare la password a <strong className="text-white">{email}</strong>. Controlla anche la cartella spam.
            </p>
            <button
              onClick={() => {
                setRecoverySent(false);
                setMode('login');
              }}
              className="w-full mt-2 py-2.5 px-4 bg-[#171D2B] hover:bg-[#222A3C] text-slate-200 border border-[#273248] font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Torna alla Schermata di Accesso
            </button>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {authError && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  Indirizzo Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    tabIndex={1}
                    autoComplete="email"
                    disabled={isLoading || lockoutTimer > 0}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="staff@sottosotto.it"
                    className={`w-full bg-[#10141F] border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition focus:outline-none ${
                      emailError
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-[#242C3E] focus:border-[#8B31E0]'
                    } disabled:opacity-50`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-rose-400 font-semibold pl-1">{emailError}</p>
                )}
              </div>

              {/* Password Field (Login Mode Only) */}
              {mode === 'login' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      id="password"
                      tabIndex={2}
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
                      className={`w-full bg-[#10141F] border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 transition focus:outline-none ${
                        passwordError
                          ? 'border-rose-500 focus:border-rose-400'
                          : 'border-[#242C3E] focus:border-[#8B31E0]'
                      } disabled:opacity-50`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || lockoutTimer > 0}
                      aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {passwordError && (
                    <p className="text-[11px] text-rose-400 font-semibold pl-1">{passwordError}</p>
                  )}

                  {/* Subito SOTTO il campo Password: Link Password Dimenticata */}
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      tabIndex={3}
                      onClick={() => {
                        setMode('forgot_password');
                        clearError();
                      }}
                      className="text-[11px] text-[#C084FC] hover:text-[#E9D5FF] font-semibold cursor-pointer transition hover:underline"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading || lockoutTimer > 0}
                className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#8B31E0] to-[#7928CA] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white font-semibold text-xs rounded-xl shadow-lg shadow-[#8B31E0]/25 transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Elaborazione in corso...</span>
                  </>
                ) : lockoutTimer > 0 ? (
                  <span>Attendi {lockoutTimer}s</span>
                ) : mode === 'forgot_password' ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Invia Link di Recupero</span>
                  </>
                ) : (
                  <>
                    <span>Accedi a PRERES™</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Back to Login Link */}
              {mode === 'forgot_password' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      clearError();
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Torna al Login</span>
                  </button>
                </div>
              )}
            </form>
          </>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-[#222A3C] text-center">
          <p className="text-[11px] text-slate-500">
            Sotto Sotto Bar & Grill · PRERES™ Operations
          </p>
        </div>
      </div>
    </div>
  );
};
