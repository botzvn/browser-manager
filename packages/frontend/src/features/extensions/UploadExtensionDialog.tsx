import { useState } from "react";

import { Globe, Link, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExtensionData, ExtensionType } from "@/lib/api";
import * as api from "@/lib/api";

interface UploadExtensionDialogProps {
  onClose: () => void;
  onSuccess: (ext: ExtensionData) => void;
}

type InstallMode = "file" | "store";

export function UploadExtensionDialog({ onClose, onSuccess }: UploadExtensionDialogProps) {
  const [mode, setMode] = useState<InstallMode>("store");
  const [extensionType, setExtensionType] = useState<ExtensionType>("PERSONAL");
  const [error, setError] = useState("");

  // Custom URL state -> File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Chrome Store state
  const [storeUrl, setStoreUrl] = useState("");
  const [installing, setInstalling] = useState(false);

  const handleCustomSubmit = async () => {
    if (!selectedFile) { setError("Please select a .zip or .crx extension file"); return; }
    setUploading(true);
    setError("");
    try {
      const ext = await api.uploadCustomExtension(selectedFile, name || undefined, extensionType);
      onSuccess(ext);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleStoreSubmit = async () => {
    if (!storeUrl.trim()) { setError("Please enter a Chrome Web Store URL"); return; }

    // Basic URL validation  
    if (!storeUrl.includes("chrome.google.com") && !storeUrl.includes("chromewebstore.google.com")) {
      setError("Please enter a valid Chrome Web Store URL");
      return;
    }

    setInstalling(true);
    setError("");
    try {
      const ext = await api.installFromStore(storeUrl.trim(), extensionType);
      onSuccess(ext);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setInstalling(false);
    }
  };

  const handleFileSelect = (file?: File) => {
    if (file) {
      if (file.name.endsWith('.zip') || file.name.endsWith('.crx')) {
        setSelectedFile(file);
        if (!name) setName(file.name.replace(/\.[^/.]+$/, ""));
        setError("");
      } else {
        setError("Please select a valid .zip or .crx extension file");
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== "file") setMode("file");
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (mode !== "file") setMode("file");
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const isSubmitting = uploading || installing;
  const canSubmit = mode === "file" ? selectedFile !== null : !!storeUrl.trim();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden relative transition-all ${isDragging ? 'ring-2 ring-primary scale-[1.02]' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Install Extension</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <Button
            variant={mode === "store" ? "default" : "ghost"}
            onClick={() => { setMode("store"); setError(""); }}
            className={`flex-1 rounded-none rounded-tl-xl h-11 ${
              mode === "store"
                ? "border-b-2 border-primary bg-primary/5 dark:bg-primary/10 shadow-none text-primary"
                : "text-slate-500"
            }`}
          >
            <Globe className="w-4 h-4 mr-2" />
            Chrome Web Store
          </Button>
            <Button
            variant={mode === "file" ? "default" : "ghost"}
            onClick={() => { setMode("file"); setError(""); }}
            className={`flex-1 rounded-none rounded-tr-xl h-11 ${
              mode === "file"
                ? "border-b-2 border-primary bg-primary/5 dark:bg-primary/10 shadow-none text-primary"
                : "text-slate-500"
            }`}
          >
            <Link className="w-4 h-4 mr-2" />
            Upload File (Auto CDN)
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {mode === "store" ? (
            /* ─── Chrome Web Store Mode ─────────────────────────── */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Chrome Web Store URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => { setStoreUrl(e.target.value); setError(""); }}
                    placeholder="https://chromewebstore.google.com/detail/extension-name/abcdef..."
                    className="w-full pl-10 bg-white dark:bg-slate-700"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Paste the extension URL from Chrome Web Store. The extension will be downloaded and installed automatically.
                </p>
              </div>

              {/* Preview box — show extracted ID */}
              {storeUrl && (() => {
                try {
                  const parts = new URL(storeUrl).pathname.split("/").filter(Boolean);
                  const id = parts.find(p => /^[a-z]{32}$/.test(p));
                  if (id) {
                    return (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <Globe className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Extension ID detected</div>
                          <div className="text-xs text-emerald-500 font-mono truncate">{id}</div>
                        </div>
                      </div>
                    );
                  }
                } catch { /* ignore */ }
                return null;
              })()}
            </div>
          ) : (
            /* ─── Custom Storage Mode ──────────────────────────────── */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Extension File (.zip or .crx)
                </label>
                <div 
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Input
                    type="file"
                    accept=".zip,.crx"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    {selectedFile ? (
                      <>
                        <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                          <Link className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-white text-center break-all">{selectedFile.name}</span>
                        <span className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to re-select</span>
                      </>
                    ) : (
                      <>
                        <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                          <Link className="w-6 h-6" />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-300 text-center">
                          <span className="text-primary font-medium">Click to upload</span> or drag and drop
                        </span>
                        <span className="text-xs text-slate-400">.zip or .crx extension files</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Extension Name (Optional)
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Will auto-detect if left blank"
                  className="w-full bg-white dark:bg-slate-700"
                />
              </div>
            </div>
          )}

          {/* Extension Type — shared */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Extension Type
            </label>
            <div className="flex gap-2">
              {(["PERSONAL", "SYSTEM", "TEAM"] as ExtensionType[]).map((t) => (
                <Button
                  key={t}
                  variant={extensionType === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExtensionType(t)}
                  className="px-4"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={mode === "file" ? handleCustomSubmit : handleStoreSubmit}
            disabled={isSubmitting || !canSubmit}
            className="flex items-center gap-2 px-5 py-2 min-w-[140px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "store" ? (
              <Globe className="w-4 h-4" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            {isSubmitting
              ? mode === "store" ? "Installing..." : "Uploading to CDN..."
              : mode === "store" ? "Install from Store" : "Upload File"}
          </Button>
        </div>
      </div>
    </div>
  );
}
