import { create } from 'zustand';

import * as api from './api';
import type { CreateProfilePayload, ProfileData } from './types';

interface AppState {
  selectedProfiles: string[];
  toggleProfileSelection: (id: string) => void;
  selectAllProfiles: (ids: string[]) => void;
  clearProfileSelection: () => void;

  profiles: ProfileData[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;

  filterConfig: {
    status?: 'running' | 'stopped' | 'all';
    os?: 'mac' | 'windows' | 'linux' | 'all';
    proxy_type?: 'http' | 'socks5' | 'none' | 'all';
    tag?: string;
  };
  setFilterConfig: (config: Partial<AppState['filterConfig']>) => void;

  loadProfiles: () => Promise<void>;
  hydratePage: (visibleIds: string[]) => Promise<void>;
  createProfile: (data: CreateProfilePayload) => Promise<ProfileData>;
  duplicateProfile: (id: string, newName?: string) => Promise<ProfileData>;
  updateProfile: (id: string, data: Partial<CreateProfilePayload>) => Promise<ProfileData>;
  bulkUpdateProfiles: (ids: string[], data: Partial<CreateProfilePayload>) => Promise<void>;
  deleteProfiles: (ids: string[]) => Promise<void>;
  startProfile: (id: string) => Promise<void>;
  stopProfile: (id: string) => Promise<void>;
  setProfileStatus: (id: string, status: 'running' | 'stopped', wsEndpoint?: string) => void;

  trashProfiles: ProfileData[];
  loadTrashProfiles: () => Promise<void>;
  restoreProfiles: (ids: string[]) => Promise<void>;
  forceDeleteProfiles: (ids: string[]) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedProfiles: [],
  toggleProfileSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedProfiles.includes(id);
      return {
        selectedProfiles: isSelected ? state.selectedProfiles.filter((pId) => pId !== id) : [...state.selectedProfiles, id],
      };
    }),
  selectAllProfiles: (ids) => set({ selectedProfiles: ids }),
  clearProfileSelection: () => set({ selectedProfiles: [] }),

  profiles: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedGroupId: null,
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),

  filterConfig: {
    status: 'all',
    os: 'all',
    proxy_type: 'all',
    tag: '',
  },
  setFilterConfig: (config) => set((state) => ({ filterConfig: { ...state.filterConfig, ...config } })),

  loadProfiles: async () => {
    // Deduplicate: if already fetching, bail out
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const { profiles } = await api.fetchProfiles(get().searchQuery || undefined, get().selectedGroupId || undefined);
      // Immediately set profiles — UI responsive lightning fast. Status hydration
      // is deferred and scoped to the visible page (see hydratePage).
      set({ profiles, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  // Only fetch runtime status for profiles currently visible on the page.
  // Call this after loadProfiles with the IDs of the current page slice.
  hydratePage: async (visibleIds: string[]) => {
    if (!visibleIds.length) return;
    // Deduplicate: don't overlap hydration runs
    if (get().isLoading) return;
    try {
      const results = await Promise.all(
        visibleIds.map((id) =>
          api
            .getProfileStatus(id)
            .then((res) => ({ id, res }))
            .catch(() => null)
        )
      );
      // Single set() call → single re-render instead of N re-renders
      set((state) => ({
        profiles: state.profiles.map((p) => {
          const found = results.find((r) => r?.id === p.id);
          if (!found?.res) return p;
          return { ...p, status: found.res.status as 'running' | 'stopped', wsEndpoint: found.res.wsEndpoint ?? p.wsEndpoint };
        }),
      }));
    } catch {}
  },

  createProfile: async (data) => {
    const profile = await api.createProfile(data);
    set((state) => ({ profiles: [profile, ...state.profiles] }));
    return profile;
  },

  duplicateProfile: async (id, newName) => {
    const existing = await api.getProfile(id);
    const { id: _id, updated_at, status, wsEndpoint, ...rest } = existing as any;
    const payload: CreateProfilePayload = {
      ...rest,
      name: newName || `${existing.name} (Copy)`,
    };
    const profile = await api.createProfile(payload);
    set((state) => ({ profiles: [profile, ...state.profiles] }));
    return profile;
  },

  updateProfile: async (id, data) => {
    const profile = await api.updateProfile(id, data);
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? profile : p)),
    }));
    return profile;
  },

  bulkUpdateProfiles: async (ids, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPromises = ids.map((id) => api.updateProfile(id, data));
      const updatedProfiles = await Promise.all(updatedPromises);

      set((state) => {
        const profileMap = new Map(updatedProfiles.map((p) => [p.id, p]));
        return {
          profiles: state.profiles.map((p) => profileMap.get(p.id) || p),
          isLoading: false,
        };
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteProfiles: async (ids) => {
    await Promise.all(ids.map((id) => api.deleteProfile(id)));
    set((state) => ({
      profiles: state.profiles.filter((p) => !ids.includes(p.id)),
      selectedProfiles: state.selectedProfiles.filter((id) => !ids.includes(id)),
    }));
  },

  startProfile: async (id) => {
    const res = await api.startProfile(id);
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? { ...p, status: 'running' as const, wsEndpoint: res.wsEndpoint || p.wsEndpoint } : p)),
    }));
  },

  stopProfile: async (id) => {
    await api.stopProfile(id);
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? { ...p, status: 'stopped' as const } : p)),
    }));
  },

  setProfileStatus: (id, status, wsEndpoint?: string) =>
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? { ...p, status, wsEndpoint: wsEndpoint !== undefined ? wsEndpoint : p.wsEndpoint } : p)),
    })),

  trashProfiles: [],
  loadTrashProfiles: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const { profiles } = await api.fetchTrashProfiles();
      set({ trashProfiles: profiles, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  restoreProfiles: async (ids) => {
    await Promise.all(ids.map((id) => api.restoreProfile(id)));
    set((state) => {
      const restored = state.trashProfiles.filter((p) => ids.includes(p.id));
      return {
        trashProfiles: state.trashProfiles.filter((p) => !ids.includes(p.id)),
        profiles: [...restored, ...state.profiles],
        selectedProfiles: state.selectedProfiles.filter((id) => !ids.includes(id)),
      };
    });
  },
  forceDeleteProfiles: async (ids) => {
    await Promise.all(ids.map((id) => api.forceDeleteProfile(id)));
    set((state) => ({
      trashProfiles: state.trashProfiles.filter((p) => !ids.includes(p.id)),
      selectedProfiles: state.selectedProfiles.filter((id) => !ids.includes(id)),
    }));
  },
}));
