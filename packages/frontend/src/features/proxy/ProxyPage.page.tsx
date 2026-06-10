import { useEffect,useState } from "react";
import { useTranslation } from "react-i18next";

import { Globe,Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { useProxyStore } from "./store";
import { cn } from "../../lib/utils";
import { useUIStore } from "../../store/useUIStore";
import { PageLayout, PageToolbar, PageContent, PageCard } from "../../components/layout/PageLayout";

export function ProxyPage() {
  const { t } = useTranslation("proxy");
  const { proxies, loadProxies, addProxies, removeProxy, checkAll, isChecking } = useProxyStore();
  const setPageTitle = useUIStore(s => s.setPageTitle);
  
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importType, setImportType] = useState("HTTP");

  useEffect(() => {
    loadProxies();
    setPageTitle(t("proxy.title", "Proxy Manager"));
    return () => setPageTitle("");
  }, [loadProxies, setPageTitle, t]);

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    // Parse IP:PORT:USER:PASS
    const lines = importText.split("\n").filter(l => l.trim().length > 0);
    const parsed = lines.map(line => {
      const parts = line.split(":");
      return {
        type: importType,
        host: parts[0]?.trim() || "",
        port: parseInt(parts[1]?.trim() || "0", 10),
        username: parts[2]?.trim() || "",
        password: parts[3]?.trim() || "",
        status: "ACTIVE" as const
      };
    }).filter(p => p.host && p.port);

    if (parsed.length > 0) {
      await addProxies(parsed);
    }
    setImportText("");
    setShowImport(false);
  };

  return (
    <PageLayout>
        {/* Toolbar */}
        <PageToolbar>
          <div className="text-sm font-medium text-slate-500">
             {t("proxy.description", { count: proxies.length, defaultValue: `Manage ${proxies.length} proxies for your profiles` })}
          </div>
          <div className="flex items-center gap-2 relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => checkAll()}
              disabled={isChecking || proxies.length === 0}
              className="flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isChecking && "animate-spin")} />
              {t("proxy.checkAll", "Check All")}
            </Button>
            
            <Button
              size="sm"
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 bg-primary"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span className="text-white">{t("proxy.import", "Quick Import")}</span>
            </Button>

            {showImport && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 z-50">
                <h3 className="text-sm font-semibold mb-2">{t("proxy.importTitle", "Bulk Import Proxies")}</h3>
                <p className="text-xs text-slate-500 mb-3">{t("proxy.importFormat", "Format: IP:PORT:USER:PASS (one per line)")}</p>
                
                <div className="flex gap-2 mb-3">
                  <Button 
                    variant={importType === "HTTP" ? "default" : "outline"}
                    onClick={() => setImportType("HTTP")}
                    className="flex-1 h-8 text-xs px-2"
                  >HTTP</Button>
                  <Button 
                    variant={importType === "SOCKS5" ? "default" : "outline"}
                    onClick={() => setImportType("SOCKS5")}
                    className="flex-1 h-8 text-xs px-2"
                  >SOCKS5</Button>
                </div>

                <textarea 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="192.168.1.1:8080:user:pass"
                  className="w-full h-32 px-3 py-2 text-xs border border-transparent rounded-lg bg-slate-50 dark:bg-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus:outline-none focus:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1.5px_var(--color-primary)] mb-3 custom-scrollbar"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowImport(false)}
                    className="shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] border-0 bg-white/60 dark:bg-slate-800/60 transition-shadow text-slate-600 dark:text-slate-300"
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button size="sm" onClick={handleImport} className="border-0 bg-primary text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)]">
                    {t("common.save", "Save")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PageToolbar>

        <PageContent>
        {proxies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-300">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{t("proxy.noProxiesTitle", "No Proxies Found")}</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">{t("proxy.noProxiesDesc", "Add your HTTP or SOCKS5 proxies to securely isolate profile footprints.")}</p>
            <Button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 shadow-sm mt-4"
            >
              <Plus className="w-4 h-4" />
              {t("proxy.import", "Quick Import")}
            </Button>
          </div>
        ) : (
          <PageCard>
             <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 first:pl-6 last:pr-6">{t("proxy.protocol", "Protocol")}</th>
                      <th className="px-5 py-3.5 first:pl-6 last:pr-6">Host:Port</th>
                      <th className="px-5 py-3.5 first:pl-6 last:pr-6">{t("proxy.auth", "Auth")}</th>
                      <th className="px-5 py-3.5 first:pl-6 last:pr-6">{t("proxy.geo", "GEO")}</th>
                      <th className="px-5 py-3.5 first:pl-6 last:pr-6">{t("proxy.status", "Status / Ping")}</th>
                      <th className="px-5 py-3.5 first:pl-6 last:pr-6 text-right">{t("common.actions", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/30">
                    {proxies.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-3.5 first:pl-6 last:pr-6 border-b border-slate-100/80 dark:border-slate-700/30">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider border", p.type.includes("SOCKS") ? "bg-amber-100 text-amber-700 border-amber-200/60" : "bg-blue-100 text-blue-700 border-blue-200/60")}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 first:pl-6 last:pr-6 border-b border-slate-100/80 dark:border-slate-700/30 font-medium font-mono text-slate-700 dark:text-slate-300">
                          {p.host}:{p.port}
                        </td>
                        <td className="px-5 py-3.5 first:pl-6 last:pr-6 border-b border-slate-100/80 dark:border-slate-700/30 text-slate-500">
                          {p.username ? <span className="text-emerald-500 text-xs flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> {t("proxy.authenticated", "Yes")}</span> : <span className="text-slate-400 text-xs">{t("proxy.none", "None")}</span>}
                        </td>
                        <td className="px-5 py-3.5 first:pl-6 last:pr-6 border-b border-slate-100/80 dark:border-slate-700/30">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {p.country_code ? p.country_code : '--'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 first:pl-6 last:pr-6 border-b border-slate-100/80 dark:border-slate-700/30">
                          <div className="flex items-center gap-2">
                            {p.latency === -1 ? (
                              <span className="flex items-center gap-1 text-xs text-sky-500 font-medium">
                                <RefreshCw className="w-3 h-3 animate-spin" /> {t("proxy.checking", "Checking...")}
                              </span>
                            ) : p.status === "DEAD" ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                                {t("proxy.dead", "DEAD")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t("proxy.live", "LIVE")}
                                {p.latency && <span className="text-slate-400 font-normal ml-1">{p.latency}ms</span>}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 first:pl-6 last:pr-6 border-b border-slate-100/80 dark:border-slate-700/30 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeProxy(p.id)}
                            title={t("proxy.delete", "Delete Proxy")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </PageCard>
        )}
        </PageContent>
    </PageLayout>
  );
}
