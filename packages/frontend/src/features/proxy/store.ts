import { create } from "zustand";

import type { ProxyData } from "@/lib/api";
import { checkProxies,createProxies, deleteProxy, getProxies, updateProxy } from "@/lib/api";

interface ProxyStore {
  proxies: ProxyData[];
  isLoading: boolean;
  isChecking: boolean;
  loadProxies: () => Promise<void>;
  addProxies: (newProxies: Partial<ProxyData>[]) => Promise<void>;
  editProxy: (id: string, proxy: Partial<ProxyData>) => Promise<void>;
  removeProxy: (id: string) => Promise<void>;
  checkAll: () => Promise<void>;
  checkSelected: (ids: string[]) => Promise<void>;
}

export const useProxyStore = create<ProxyStore>((set, get) => ({
  proxies: [],
  isLoading: false,
  isChecking: false,

  loadProxies: async () => {
    set({ isLoading: true });
    try {
      const data = await getProxies();
      set({ proxies: data });
    } catch (error) {
      console.error("Failed to load proxies", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addProxies: async (newProxies: Partial<ProxyData>[]) => {
    try {
      const { inserted } = await createProxies(newProxies);
      set((state) => ({ proxies: [...inserted, ...state.proxies] }));
    } catch (error) {
      console.error("Failed to add proxies", error);
      throw error;
    }
  },

  editProxy: async (id: string, proxy: Partial<ProxyData>) => {
    try {
      await updateProxy(id, proxy);
      set((state) => ({
        proxies: state.proxies.map((p) => (p.id === id ? { ...p, ...proxy } : p)),
      }));
    } catch (error) {
      console.error("Failed to edit proxy", error);
      throw error;
    }
  },

  removeProxy: async (id: string) => {
    try {
      await deleteProxy(id);
      set((state) => ({
        proxies: state.proxies.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete proxy", error);
      throw error;
    }
  },

  checkAll: async () => {
    const { proxies, checkSelected } = get();
    await checkSelected(proxies.map((p) => p.id));
  },

  checkSelected: async (ids: string[]) => {
    if (!ids.length) return;
    set({ isChecking: true });
    try {
      // Mark as checking
      set((state) => ({
        proxies: state.proxies.map(p => ids.includes(p.id) ? { ...p, latency: -1 } : p)
      }));

      const { results } = await checkProxies(ids);
      
      set((state) => {
        const resultDict = results.reduce((acc, r) => {
          acc[r.id] = r;
          return acc;
        }, {} as Record<string, any>);

        return {
          proxies: state.proxies.map((p) => {
            const res = resultDict[p.id];
            if (res) {
              return { ...p, status: res.status, latency: res.latency, country_code: res.country_code };
            }
            return p;
          }),
        };
      });
    } catch (error) {
      console.error("Failed to check proxies", error);
    } finally {
      set({ isChecking: false });
    }
  },
}));
