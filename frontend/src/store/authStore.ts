import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: { id: number; username: string; isAdmin: boolean } | null;
  cuentas: { id: number; nombre: string }[];
  tenantId: number | null;
  tenantName: string | null;
  setAuth: (token: string, user: any, cuentas: any[]) => void;
  setTenant: (tenantId: number, tenantName: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      cuentas: [],
      tenantId: null,
      tenantName: null,
      setAuth: (token, user, cuentas) => set({ token, user, cuentas }),
      setTenant: (tenantId, tenantName, token) => set({ tenantId, tenantName, token }),
      logout: () =>
        set({
          token: null,
          user: null,
          cuentas: [],
          tenantId: null,
          tenantName: null,
        }),
    }),
    { name: 'wallet-auth' },
  ),
);
