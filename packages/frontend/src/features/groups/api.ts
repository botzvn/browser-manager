import { request } from "@/lib/request";

// ============================================
// Group API
// ============================================

export interface GroupData {
  id: string;
  name: string;
  description: string;
  color: string;
  profile_count?: number;
  created_at: string;
}

export async function fetchGroups(): Promise<{ groups: GroupData[]; uncategorized: number }> {
  return request<{ groups: GroupData[]; uncategorized: number }>(`/groups`);
}

export async function createGroup(payload: Partial<GroupData>): Promise<GroupData> {
  return request<GroupData>(`/groups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGroup(id: string, payload: Partial<GroupData>): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/groups/${id}`, { method: "DELETE" });
}
