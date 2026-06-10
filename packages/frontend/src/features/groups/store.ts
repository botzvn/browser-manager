import { create } from "zustand";

import type { GroupData } from "@/lib/api";
import { createGroup, deleteGroup,fetchGroups, updateGroup } from "@/lib/api";

interface GroupStore {
  groups: GroupData[];
  uncategorized: number;
  isLoading: boolean;
  loadGroups: () => Promise<void>;
  addGroup: (newGroup: Partial<GroupData>) => Promise<void>;
  editGroup: (id: string, group: Partial<GroupData>) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  uncategorized: 0,
  isLoading: false,

  loadGroups: async () => {
    // Deduplicate: if already fetching, bail out
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const data = await fetchGroups();
      set({ groups: data.groups, uncategorized: data.uncategorized });
    } catch (error) {
      console.error("Failed to load groups", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addGroup: async (newGroup: Partial<GroupData>) => {
    try {
      const inserted = await createGroup(newGroup);
      set((state) => ({ groups: [inserted, ...state.groups] }));
    } catch (error) {
      console.error("Failed to add group", error);
      throw error;
    }
  },

  editGroup: async (id: string, group: Partial<GroupData>) => {
    try {
      await updateGroup(id, group);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? { ...g, ...group } : g)),
      }));
    } catch (error) {
      console.error("Failed to edit group", error);
      throw error;
    }
  },

  removeGroup: async (id: string) => {
    try {
      await deleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete group", error);
      throw error;
    }
  },
}));
