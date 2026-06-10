import { useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProfileData } from '../../profiles/types';
import { startProfileViewer, stopProfileViewer } from '../../profiles/api';

type RfbInstance = {
  scaleViewport: boolean;
  resizeSession: boolean;
  showDotCursor: boolean;
  disconnect: () => void;
  addEventListener: (type: string, listener: () => void) => void;
};

export function ProfileViewerDialog({ profile, onClose }: { profile: ProfileData | null; onClose: () => void }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RfbInstance | null>(null);
  const [state, setState] = useState('connecting');

  useEffect(() => {
    if (!profile || !targetRef.current) return;
    const currentProfile = profile;
    let cancelled = false;

    async function connect() {
      try {
        setState('starting x11vnc');
        const viewer = await startProfileViewer(currentProfile.id);
        if (cancelled || !targetRef.current) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // noVNC is served by the Node manager from /vendor/novnc.
        const rfbPath = '/vendor/novnc/core/rfb.js';
        const { default: RFB } = await import(/* @vite-ignore */ rfbPath);
        if (cancelled || !targetRef.current) return;

        const rfb = new RFB(targetRef.current, `${protocol}//${window.location.host}${viewer.wsPath}`, {
          wsProtocols: ['binary'],
        }) as RfbInstance;
        rfb.scaleViewport = true;
        rfb.resizeSession = false;
        rfb.showDotCursor = true;
        rfb.addEventListener('connect', () => setState('connected'));
        rfb.addEventListener('disconnect', () => setState('disconnected'));
        rfbRef.current = rfb;
      } catch (err: any) {
        setState(err.message || 'viewer failed');
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
        } catch {}
        rfbRef.current = null;
      }
      stopProfileViewer(currentProfile.id).catch(() => {});
    };
  }, [profile]);

  if (!profile) return null;

  const screenWidth = (profile as any).screen?.width || (profile.fingerprint as any)?.screen?.width || 1280;
  const screenHeight = (profile as any).screen?.height || (profile.fingerprint as any)?.screen?.height || 800;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div
        style={{
          height: `min(${screenHeight + 48}px, 90vh)`,
          width: 'auto',
          aspectRatio: `${screenWidth} / ${screenHeight + 48}`,
        }}
        className="bg-slate-950 rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-w-[95vw]"
      >
        <div className="h-12 px-4 shrink-0 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{profile.name}</div>
            <div className="text-xs text-slate-400">{state}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div ref={targetRef} className="flex-1 bg-black overflow-hidden [&>div]:w-full [&>div]:h-full [&_canvas]:w-full [&_canvas]:h-full [&_canvas]:outline-none" />
      </div>
    </div>
  );
}
