'use client';
// ============================================================
// BottomHUD — Status bar bawah peta yang simpel
// Hanya: Koordinat kursor + toggle 3D/2D
// (Year selector dipindah ke sidebar LayerController)
// ============================================================

import { useMapStore } from '@/store/mapStore';
import { Crosshair, Box, Monitor, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomHUD() {
  const { is3D, toggle3D, cursorCoords, activeYear } = useMapStore();

  return (
    <div
      className={cn(
        'absolute bottom-5 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-2',
        'animate-slide-up'
      )}
      style={{ animationDelay: '0.3s' }}
    >
      {/* ---- Badge tahun aktif ---- */}
      <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5">
        <MapPin size={11} className="text-orange-400 flex-shrink-0" />
        <span className="text-[10px] font-bold theme-text-secondary">
          Data <span className="text-orange-400">{activeYear}</span>
        </span>
      </div>

      {/* ---- Koordinat Cursor ---- */}
      <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-2 min-w-[170px]">
        <Crosshair size={11} className="theme-text-dim flex-shrink-0" />
        {cursorCoords ? (
          <span className="text-[10px] font-mono-data theme-text-muted tabular-nums">
            {cursorCoords.lat.toFixed(4)}°&nbsp;
            {cursorCoords.lng.toFixed(4)}°
          </span>
        ) : (
          <span className="text-[10px] theme-text-dim italic">Arahkan kursor ke peta</span>
        )}
      </div>

      {/* ---- 3D/2D Toggle ---- */}
      <button
        onClick={toggle3D}
        className={cn(
          'glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5',
          'transition-all duration-200 cursor-pointer',
          is3D ? 'border-orange-500/30' : ''
        )}
        style={is3D ? { boxShadow: '0 0 14px rgba(249,115,22,.15)' } : {}}
        title={is3D ? 'Beralih ke 2D' : 'Beralih ke 3D'}
      >
        {is3D
          ? <Box size={13} className="text-orange-400" />
          : <Monitor size={13} className="theme-text-muted" />
        }
        <span className={cn('text-[10px] font-bold', is3D ? 'text-orange-400' : 'theme-text-muted')}>
          {is3D ? '3D' : '2D'}
        </span>
      </button>
    </div>
  );
}
