import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient.js';
import { validatePortalAccess } from './portalGuard.js';

const AuthContext = createContext(null);

async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to load user profile.');
  }

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hydrateProfile = useCallback(async (authSession) => {
    if (!authSession?.user) {
      setUser(null);
      return null;
    }

    const profile = await fetchUserProfile(authSession.user.id);
    
    const portalError = validatePortalAccess(profile.role);
    if (portalError) {
      await supabase.auth.signOut();
      throw new Error(portalError);
    }

    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!mounted) return;

        setSession(data.session ?? null);
        if (data.session) {
          await hydrateProfile(data.session);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to restore session.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        try {
          await hydrateProfile(nextSession);
        } catch (err) {
          setError(err.message || 'Failed to load user profile.');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const signUpUser = useCallback(async (email, password, name, role) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (signUpError) throw signUpError;

      return data;
    } catch (err) {
      const message = err.message || 'Sign-up failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginUser = useCallback(async (email, password) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const profile = await fetchUserProfile(data.user.id);
      const portalError = validatePortalAccess(profile.role);

      if (portalError) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setError(portalError);
        throw new Error(portalError);
      }

      setSession(data.session);
      setUser(profile);
      return { session: data.session, user: profile };
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError('');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data, error: tokenError } = await supabase.auth.getSession();
    if (tokenError) throw tokenError;
    return data.session?.access_token ?? null;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      error,
      isAuthenticated: Boolean(session && user),
      signUpUser,
      loginUser,
      logout,
      getAccessToken,
      // Convenience aliases for existing admin Login page
      login: async (email, password) => {
        try {
          await loginUser(email, password);
          return true;
        } catch {
          return false;
        }
      },
    }),
    [session, user, loading, error, signUpUser, loginUser, logout, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
