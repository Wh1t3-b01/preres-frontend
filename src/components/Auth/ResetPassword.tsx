import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { updatePassword, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-[#6B3FA0]/20 selection:text-[#1E3A2F]">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#1E3A2F_0.8px,transparent_0.8px)] [background-size:24px_24px]"></div>

      <div className="relative w-full max-w-md bg-white border border-[#1E3A2F]/15 rounded-3xl p-7 sm:p-9 shadow-xl shadow-[#1E3A2F]/5 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E3A2F] text-amber-300 shadow-sm border border-amber-400/30 mb-1">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-brand font-bold text-[#1E3A2F] tracking-wide">
            SOTTO SOTTO
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#6B3FA0] font-bold">
            Imposta Nuova Password
          </p>
        </div>

        {/* Success Banner */}
        {isSuccess ? (
          <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-sm text-emerald-900">Password Aggiornata con Successo!</h3>
            <p className="text-xs text-emerald-700">
              Verrai reindirizzato automaticamente alla dashboard di servizio...
            </p>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {(authError || passwordError) && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError || passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E3A2F] uppercase tracking-wider">
                  Nuova Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Almeno 6 caratteri"
                    className="w-full bg-[#FDFBF7] border border-[#1E3A2F]/20 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#1E3A2F] font-medium focus:outline-none focus:ring-2 focus:border-[#6B3FA0] focus:ring-[#6B3FA0]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E3A2F] uppercase tracking-wider">
                  Conferma Nuova Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la nuova password"
                    className="w-full bg-[#FDFBF7] border border-[#1E3A2F]/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1E3A2F] font-medium focus:outline-none focus:ring-2 focus:border-[#6B3FA0] focus:ring-[#6B3FA0]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 bg-[#1E3A2F] hover:bg-[#152921] text-amber-100 font-bold text-xs rounded-xl shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Salvataggio in corso...</span>
                ) : (
                  <>
                    <span>Salva e Accedi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
