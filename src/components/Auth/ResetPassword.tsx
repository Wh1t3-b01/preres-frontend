import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { updatePassword, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Clear any existing errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Le due password inserite non corrispondono.');
      return;
    }

    const res = await updatePassword(newPassword);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E121B] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-[#8B31E0]/30 selection:text-white">
      {/* Subtle Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B31E0]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-[#121622] border border-[#273248] rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B31E0] to-[#6E20C0] text-white shadow-lg border border-[#A855F7]/40 mb-1">
            <KeyRound className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h1 className="text-2xl font-brand font-bold text-white tracking-tight">
            SOTTO SOTTO
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-[#C084FC] font-bold">
            Imposta Nuova Password
          </p>
        </div>

        {/* Success Banner */}
        {isSuccess ? (
          <div className="p-5 bg-[#059669]/20 border border-[#059669]/50 rounded-2xl text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-[#34D399] mx-auto" />
            <h3 className="font-bold text-sm text-white">Password Aggiornata con Successo!</h3>
            <p className="text-xs text-[#34D399]">
              Reindirizzamento automatico alla schermata operativa...
            </p>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {(authError || passwordError) && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError || passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  Nuova Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Almeno 6 caratteri"
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  Conferma Nuova Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la nuova password"
                    className="w-full bg-[#10141F] border border-[#242C3E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B31E0]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#8B31E0] to-[#7928CA] hover:from-[#9D44F7] hover:to-[#8B31E0] text-white font-semibold text-xs rounded-xl shadow-lg shadow-[#8B31E0]/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Salvataggio in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Conferma Nuova Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="pt-3 border-t border-[#222A3C] text-center">
          <p className="text-[11px] text-slate-500">
            Sotto Sotto Bar & Grill · PRERES™ Security
          </p>
        </div>
      </div>
    </div>
  );
};
