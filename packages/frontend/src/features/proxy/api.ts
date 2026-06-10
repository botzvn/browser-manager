import { request } from "@/lib/request";

// ============================================
// Proxy API
// ============================================

export interface ProxyData {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  status: "ACTIVE" | "DEAD";
  country_code?: string;
  latency?: number;
  created_at: string;
}

export async function getProxies(): Promise<ProxyData[]> {
  return request<ProxyData[]>(`/proxy`);
}

export async function createProxies(proxies: Partial<ProxyData>[]): Promise<{ success: boolean; inserted: ProxyData[] }> {
  return request<{ success: boolean; inserted: ProxyData[] }>(`/proxy`, {
    method: "POST",
    body: JSON.stringify({ proxies }),
  });
}

export async function updateProxy(id: string, proxy: Partial<ProxyData>): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/proxy/${id}`, {
    method: "PUT",
    body: JSON.stringify(proxy),
  });
}

export async function deleteProxy(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/proxy/${id}`, { method: "DELETE" });
}

export async function checkProxies(proxyIds: string[]): Promise<{ success: boolean; results: any[] }> {
  return request<{ success: boolean; results: any[] }>(`/proxy/check`, {
    method: "POST",
    body: JSON.stringify({ proxies: proxyIds }),
  });
}
