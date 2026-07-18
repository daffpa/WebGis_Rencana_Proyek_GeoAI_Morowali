'use client';
// ============================================================
// TopStatusBar — Status bar minimal di pojok kanan atas peta
// Menampilkan: System status, CRS, dan timestamp
// ============================================================

import { useMapStore } from '@/store/mapStore';
import { Satellite, Radio } from 'lucide-react';

export default function TopStatusBar() {
  const is3D = useMapStore((s) => s.is3D);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  });

  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-2 pointer-events-none">
      {/* System active badge */}
      <div className="glass-card rounded-xl px-3 py-1.5 flex items-center gap-2">
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 radar-ring opacity-60" />
        </div>
        <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-widest">System Active</span>
      </div>

      {/* CRS info */}
      <div className="glass-card rounded-xl px-3 py-1.5 flex items-center gap-1.5">
        <Satellite size={10} className="text-slate-600" />
        <span className="text-[9px] text-slate-500 font-mono-data">WGS84 · EPSG:4326</span>
        <span className="text-[9px] text-slate-700">·</span>
        <span className="text-[9px] text-slate-500 font-mono-data">{is3D ? '3D' : '2D'}</span>
      </div>

      {/* Time (WITA) */}
      <div className="glass-card rounded-xl px-3 py-1.5 flex items-center gap-1.5">
        <Radio size={10} className="text-slate-600" />
        <span className="text-[9px] font-mono-data text-slate-500 tabular-nums">{timeStr} WITA</span>
      </div>
    </div>
  );
}
