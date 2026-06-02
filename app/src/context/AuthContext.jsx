import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, getToken } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const hasToken = !!getToken('AccessToken') || !!getToken('RefreshToken');
    return (localStorage.getItem('isAuthenticated') || hasToken) ? true : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // If no token cookie at all, and not marked authenticated, skip
      const hasToken = !!getToken('AccessToken') || !!getToken('RefreshToken');
      const markedAuth = !!localStorage.getItem('isAuthenticated');
      if (!hasToken && !markedAuth) {
        setLoading(false);
        return;
      }

      try {
        let res = await authApi.me();

        // /me returned null — could be 401 (expired) or network error
        if (!res?.userId && !res?.email) {
          // Only attempt refresh if we have a refresh token
          const rToken = getToken('RefreshToken');
          if (!rToken) {
            // No refresh token — truly logged out
            setUser(null);
            localStorage.removeItem('isAuthenticated');
            setLoading(false);
            return;
          }

          // Try silent refresh
          const refreshRes = await authApi.refresh().catch(() => null);

          if (refreshRes?.data?.accessToken || refreshRes?.success) {
            // Refresh worked — call me() again
            res = await authApi.me();
          } else {
            // Refresh also failed — backend may be offline, preserve session
            setLoading(false);
            return;
          }
        }

        if (res?.userId || res?.email) {
          setUser(res || true);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          // Both me() calls failed after successful refresh — clear session
          setUser(null);
          localStorage.removeItem('isAuthenticated');
        }
      } catch (err) {
        // Network error (backend offline) — NEVER log the user out
        console.warn('Backend unreachable, preserving session.', err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('isAuthenticated');
    document.cookie = 'AccessToken=; path=/; max-age=0;';
    document.cookie = 'RefreshToken=; path=/; max-age=0;';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
