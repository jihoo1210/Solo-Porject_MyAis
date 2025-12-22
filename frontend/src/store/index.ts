import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AITool, Execution } from '../types';
import { authApi } from '../api';

// Auth Store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  clearAuth: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken: refreshToken || get().refreshToken, isAuthenticated: true });
      },
      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ accessToken, refreshToken: refreshToken || get().refreshToken });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      refreshUser: async () => {
        try {
          const user = await authApi.me();
          set({ user });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// AI Tools Store
interface AIToolsState {
  tools: AITool[];
  favorites: string[];
  isLoading: boolean;
  setTools: (tools: AITool[]) => void;
  addTool: (tool: AITool) => void;
  updateTool: (id: string, updates: Partial<AITool>) => void;
  removeTool: (id: string) => void;
  toggleFavorite: (toolId: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAIToolsStore = create<AIToolsState>((set) => ({
  tools: [],
  favorites: [],
  isLoading: false,
  setTools: (tools) => set({ tools }),
  addTool: (tool) => set((state) => ({ tools: [...state.tools, tool] })),
  updateTool: (id, updates) =>
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === id ? { ...tool, ...updates } : tool
      ),
    })),
  removeTool: (id) =>
    set((state) => ({
      tools: state.tools.filter((tool) => tool.id !== id),
    })),
  toggleFavorite: (toolId) =>
    set((state) => ({
      favorites: state.favorites.includes(toolId)
        ? state.favorites.filter((id) => id !== toolId)
        : [...state.favorites, toolId],
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Execution History Store
interface HistoryState {
  executions: Execution[];
  isLoading: boolean;
  setExecutions: (executions: Execution[]) => void;
  addExecution: (execution: Execution) => void;
  removeExecution: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  executions: [],
  isLoading: false,
  setExecutions: (executions) => set({ executions }),
  addExecution: (execution) =>
    set((state) => ({ executions: [execution, ...state.executions] })),
  removeExecution: (id) =>
    set((state) => ({
      executions: state.executions.filter((exec) => exec.id !== id),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      executions: state.executions.map((exec) =>
        exec.id === id ? { ...exec, isFavorite: !exec.isFavorite } : exec
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// UI Store - Dark mode only
interface UIState {
  sidebarOpen: boolean;
  theme: 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
