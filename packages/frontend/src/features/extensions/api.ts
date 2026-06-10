import { API_BASE,request } from "@/lib/request";

// ============================================
// Extensions API
// ============================================
export type ExtensionType = "SYSTEM" | "PERSONAL" | "TEAM";
export type SourceType = "FILE" | "CHROME_STORE";

export interface ExtensionData {
  id: string;
  name: string;
  description: string;
  version: string;
  extension_type: ExtensionType;
  source_type: SourceType;
  extension_id: string | null;
  extension_path: string | null;
  store_url: string | null;
  download_url: string | null;
  icon_path: string | null;
  original_filename: string | null;
  is_active: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export async function getExtensions(type?: ExtensionType | "ALL", search?: string): Promise<ExtensionData[]> {
  const params = new URLSearchParams();
  if (type && type !== "ALL") params.set("type", type);
  if (search) params.set("search", search);
  const qs = params.toString();
  return request<ExtensionData[]>(`/extensions${qs ? `?${qs}` : ""}`);
}

export async function getExtension(id: string): Promise<ExtensionData> {
  return request<ExtensionData>(`/extensions/${id}`);
}

export async function uploadCustomExtension(file: File, name?: string, extensionType?: ExtensionType): Promise<ExtensionData> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  if (extensionType) formData.append("extensionType", extensionType);

  return request<ExtensionData>("/extensions/upload-custom", {
    method: "POST",
    body: formData as any, // omit Content-Type header so browser sets multipart boundary
    headers: {} // Need to ensure request utility allows overriding headers, or we just pass a custom options object
  });
}

export async function installFromStore(storeUrl: string, extensionType?: ExtensionType): Promise<ExtensionData> {
  return request<ExtensionData>("/extensions/install-from-store", {
    method: "POST",
    body: JSON.stringify({ storeUrl, extensionType }),
  });
}

export async function updateExtension(id: string, data: { name?: string; description?: string; extensionType?: ExtensionType }): Promise<ExtensionData> {
  return request<ExtensionData>(`/extensions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExtension(id: string): Promise<void> {
  await request<{ success: boolean }>(`/extensions/${id}`, { method: "DELETE" });
}

export async function toggleExtension(id: string): Promise<ExtensionData> {
  return request<ExtensionData>(`/extensions/${id}/toggle`, { method: "POST" });
}

export function getExtensionIconUrl(id: string): string {
  return `${API_BASE}/extensions/icon/${id}`;
}
