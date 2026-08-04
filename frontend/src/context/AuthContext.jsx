import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

/**
 * AuthProvider — manages authentication state with real backend API.
 *
 * Exported interface (unchanged from mock version):
 *   user, login, register, logout, isAuthenticated, isAdmin, isPatient
 *
 * Added for loading/error states:
 *   isLoading, error, clearError
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sq-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('sq-token') || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Role Mapping ────────────────────────────────────────────
  // Backend uses "user" for patients; frontend ProtectedRoute
  // expects "patient". Map here so nothing else changes.
  const mapRole = (backendRole) => {
    if (backendRole === 'user') return 'patient';
    return backendRole; // 'admin' stays 'admin'
  };

  // ─── Persist helper ──────────────────────────────────────────
  const persistAuth = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('sq-user', JSON.stringify(userData));
    localStorage.setItem('sq-token', jwtToken);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sq-user');
    localStorage.removeItem('sq-token');
  }, []);

  // ─── Extract error message from API response ────────────────
  const extractError = (err) => {
    const data = err.response?.data;
    if (!data) return 'Network error. Please try again.';

    // Backend returns { msg: string | string[] }
    if (Array.isArray(data.msg)) {
      return data.msg.join('\n');
    }
    return data.msg || 'Something went wrong.';
  };

  // ─── Login ───────────────────────────────────────────────────
  const login = useCallback(async (phone, password) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        phone: phone.trim(),
        password,
      });

      const { token: jwtToken, data } = res.data;
      const mappedUser = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        role: mapRole(data.role),
      };

      persistAuth(mappedUser, jwtToken);
      return mappedUser;
    } catch (err) {
      const msg = extractError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth]);

  // ─── Register ────────────────────────────────────────────────
  // Backend register does NOT return a JWT, so we auto-login after.
  const register = useCallback(async (name, phone, email, password) => {
    setIsLoading(true);
    setError('');
    try {
      // Step 1: Register the user
      await api.post('/auth/register', {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        password,
      });

      // Step 2: Auto-login to get a JWT
      const loggedInUser = await login(phone, password);
      return loggedInUser;
    } catch (err) {
      // If login() threw, error is already set
      if (!error) {
        const msg = extractError(err);
        setError(msg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [login, error]);

  // ─── Logout ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  // ─── Clear Error ─────────────────────────────────────────────
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // ─── Derived State ───────────────────────────────────────────
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      clearError,
      login,
      register,
      logout,
      isAuthenticated,
      isAdmin,
      isPatient,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
