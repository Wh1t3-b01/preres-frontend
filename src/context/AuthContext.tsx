/**
 * Sotto Sotto Bar & Grill / PRERES™ — Global Session & Authentication Context
 * Manages Supabase Auth lifecycle, session persistence, role-based access control,
 * and seamless password reset recovery flows.
 */
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StaffRole } from '../types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: StaffRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRecoveryMode: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (newRole: StaffRole) => void;
  clearError: () => void;
  exitRecoveryMode: () => void;
}

const DEMO_STORAGE_KEY = 'sotto_demo_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StaffRole>('manager');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detect if user landed on the page with a password recovery token in URL hash or query
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery') ||
      window.location.pathname === '/reset-password'
    );
  });

  // Extract staff role from Supabase user metadata or app metadata
  const extractRole = (currentUser: User | null): StaffRole => {
    if (!currentUser) return 'manager';
    const metadataRole =
      (currentUser.user_metadata?.role as StaffRole) ||
      (currentUser.app_metadata?.role as StaffRole);
    if (metadataRole && ['manager', 'host', 'waiter'].includes(metadataRole)) {
      return metadataRole;
    }
    return 'manager';
  };

  // Initialize session and subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    // Check if URL currently has recovery payload
    if (
      typeof window !== 'undefined' &&
      (window.location.hash.includes('type=recovery') ||
       window.location.search.includes('type=recovery') ||
       window.location.pathname === '/reset-password')
    ) {
      setIsRecoveryMode(true);
    }

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.warn('[Supabase Auth] Session fetch error:', sessionError.message);
          }
          if (isMounted) {
            if (data.session) {
              setSession(data.session);
              setUser(data.session.user);
              setRole(extractRole(data.session.user));
            } else {
              setSession(null);
              setUser(null);
            }
          }
        } else {
          // Local demo session restoration
          const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
          if (savedDemo && isMounted) {
            try {
              const parsed = JSON.parse(savedDemo);
              setUser(parsed.user);
              setSession(parsed.session);
              setRole(parsed.role || 'manager');
            } catch (err) {
              localStorage.removeItem(DEMO_STORAGE_KEY);
            }
          }
        }
      } catch (err: any) {
        console.error('[Supabase Auth] Initialization exception:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth State changes (TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT, PASSWORD_RECOVERY)
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!isMounted) return;
          
          if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
          }

          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            setRole(extractRole(currentSession.user));
          }
          setIsLoading(false);
        }
      );

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const exitRecoveryMode = useCallback(() => {
    setIsRecoveryMode(false);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      setError(null);

      const cleanEmail = email.trim().toLowerCase();

      try {
        if (isSupabaseConfigured) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (signInError) {
            let errorMsg = signInError.message;
            if (signInError.status === 429 || signInError.message.includes('rate limit')) {
              errorMsg = 'Troppi tentativi di accesso. Attendi qualche minuto per ragioni di sicurezza.';
            } else if (
              signInError.message.toLowerCase().includes('invalid login credentials') ||
              signInError.message.toLowerCase().includes('user not found')
            ) {
              errorMsg = 'Email non presente nel database o password non corretta. Verifica le credenziali inserite.';
            } else if (signInError.message.toLowerCase().includes('email not confirmed')) {
              errorMsg = "L'indirizzo email non è stato ancora confermato. Controlla la tua casella di posta.";
            }
            setError(errorMsg);
            setIsLoading(false);
            return { success: false, error: errorMsg };
          }

          if (data.session && data.user) {
            setSession(data.session);
            setUser(data.user);
            setRole(extractRole(data.user));
            setIsLoading(false);
            return { success: true };
          }
        } else {
          // Local demo session simulation
          await new Promise((res) => setTimeout(res, 500));

          let demoRole: StaffRole = 'manager';
          if (cleanEmail.includes('host')) demoRole = 'host';
          else if (cleanEmail.includes('waiter') || cleanEmail.includes('sala')) demoRole = 'waiter';

          const demoUser: User = {
            id: 'usr_demo_' + Math.random().toString(36).substring(2, 9),
            app_metadata: { provider: 'email', role: demoRole },
            user_metadata: { name: cleanEmail.split('@')[0], role: demoRole },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: cleanEmail,
            phone: '',
            role: 'authenticated',
            updated_at: new Date().toISOString(),
          };

          const demoSession: Session = {
            access_token: 'demo_jwt_token_' + Date.now(),
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: 'demo_refresh_token_' + Date.now(),
            user: demoUser,
          };

          localStorage.setItem(
            DEMO_STORAGE_KEY,
            JSON.stringify({ user: demoUser, session: demoSession, role: demoRole })
          );

          setUser(demoUser);
          setSession(demoSession);
          setRole(demoRole);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        const fallbackMsg = err?.message || 'Si è verificato un errore imprevisto durante il login.';
        setError(fallbackMsg);
        setIsLoading(false);
        return { success: false, error: fallbackMsg };
      }

      setIsLoading(false);
      return { success: false, error: 'Accesso fallito' };
    },
    []
  );

  const resetPasswordForEmail = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      setError(null);
      const cleanEmail = email.trim().toLowerCase();

      try {
        if (isSupabaseConfigured) {
          // Point redirect directly to root origin (immune to 404 subpath issues)
          const redirectTo = `${window.location.origin}/`;
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo,
          });

          if (resetError) {
            let errorMsg = resetError.message;
            if (resetError.status === 429) {
              errorMsg = 'Troppe richieste di recupero. Attendi qualche minuto prima di riprovare.';
            } else if (
              resetError.message.toLowerCase().includes('user not found') ||
              resetError.message.toLowerCase().includes('not found') ||
              resetError.message.toLowerCase().includes('invalid email') ||
              resetError.message.toLowerCase().includes('not allowed')
            ) {
              errorMsg = 'Email non presente nel database. Questo indirizzo non è registrato né autorizzato nel sistema PRERES™.';
            }
            setError(errorMsg);
            setIsLoading(false);
            return { success: false, error: errorMsg };
          }
          setIsLoading(false);
          return { success: true };
        } else {
          await new Promise((res) => setTimeout(res, 600));
          // In demo mode validate authorized domains and staff patterns
          const isRecognized =
            cleanEmail.includes('sotto') ||
            cleanEmail.includes('admin') ||
            cleanEmail.includes('manager') ||
            cleanEmail.includes('host') ||
            cleanEmail.includes('waiter') ||
            cleanEmail.includes('staff') ||
            cleanEmail.endsWith('@sottosotto.it') ||
            cleanEmail === 'ironwhisper69@gmail.com';

          if (!isRecognized) {
            const err = 'Email non presente nel database. Questo indirizzo non è registrato né autorizzato nel sistema PRERES™.';
            setError(err);
            setIsLoading(false);
            return { success: false, error: err };
          }

          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        const msg = err?.message || 'Email non presente nel database. Questo indirizzo non è registrato né autorizzato nel sistema PRERES™.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        if (isSupabaseConfigured) {
          const { data, error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return { success: false, error: updateError.message };
          }

          if (data.user) {
            setUser(data.user);
          }
          
          setIsRecoveryMode(false);
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }

          setIsLoading(false);
          return { success: true };
        } else {
          await new Promise((res) => setTimeout(res, 500));
          setIsRecoveryMode(false);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        const msg = err?.message || 'Impossibile aggiornare la password.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
      setUser(null);
      setSession(null);
      setRole('manager');
      setIsRecoveryMode(false);
    } catch (err) {
      console.error('[Supabase Auth] Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback((newRole: StaffRole) => {
    setRole(newRole);
    if (!isSupabaseConfigured) {
      const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          parsed.role = newRole;
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      role,
      isLoading,
      isAuthenticated: Boolean(user || session),
      isRecoveryMode,
      error,
      signIn,
      signOut,
      resetPasswordForEmail,
      updatePassword,
      switchRole,
      clearError,
      exitRecoveryMode,
    }),
    [
      user,
      session,
      role,
      isLoading,
      isRecoveryMode,
      error,
      signIn,
      signOut,
      resetPasswordForEmail,
      updatePassword,
      switchRole,
      clearError,
      exitRecoveryMode,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
