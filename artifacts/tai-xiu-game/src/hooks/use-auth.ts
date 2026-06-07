import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem("tai_xiu_token"),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("tai_xiu_token", token);
    } else {
      localStorage.removeItem("tai_xiu_token");
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("tai_xiu_token");
    set({ token: null });
  },
}));
