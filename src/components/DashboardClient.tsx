'use client';
// ============================================================
// DashboardClient — Root client component
// Layout: Full-screen 3D map + Floating Sidebar + Bottom HUD
//         + Floating Stats Cards + Top Status Bar
// ============================================================

import { useState, useEffect } from 'react';
import MapContainer from '@/components/map/MapContainer';
import SidebarPanel from '@/components/sidebar/SidebarPanel';
import BottomHUD from '@/components/map/BottomHUD';
import FloatingStatsPanel from '@/components/map/FloatingStatsPanel';
import TopStatusBar from '@/components/map/TopStatusBar';
import MapTitleBlock from '@/components/map/MapTitleBlock';
import MapLegend from '@/components/map/MapLegend';

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <DashboardLoader />;
  }

  return (
    <main className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* ---- Peta penuh layar (Map-First, 3D) ---- */}
      <div className="absolute inset-0">
        <MapContainer />
      </div>

      {/* ---- Panel sidebar mengambang (kiri) ---- */}
      <SidebarPanel />

      {/* ---- Top status bar (kanan atas) ---- */}
      <TopStatusBar />

      {/* ---- Map Title Block (Kiri Atas, Elemen Wajib) ---- */}
      <MapTitleBlock />

      {/* ---- Map Legend (Kiri Bawah, Elemen Wajib) ---- */}
      <MapLegend />

      {/* ---- Floating stats cards (kanan tengah) ---- */}
      <FloatingStatsPanel />

      {/* ---- Bottom HUD (tengah bawah) ---- */}
      <BottomHUD />

      {/* ---- Branding watermark kanan bawah ---- */}
      <div className="absolute bottom-2 right-14 z-30 pointer-events-none">
        <span className="text-[8px] text-slate-700 select-none font-mono-data tracking-wide">
          WebGIS GeoAI Morowali · Sentinel-2 · MapLibre GL v5
        </span>
      </div>
    </main>
  );
}

function DashboardLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative w-20 h-20">
          {/* Outer ring rotating */}
          <div
            className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-spin-slow"
            style={{ borderTopColor: 'rgba(249,115,22,0.8)' }}
          />
          {/* Middle ring counter-rotating */}
          <div
            className="absolute inset-2 rounded-full border border-cyan-500/20"
            style={{
              animation: 'spin-slow 12s linear infinite reverse',
              borderTopColor: 'rgba(6,182,212,0.5)',
            }}
          />
          {/* Center logo */}
          <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-cyan-500/10 flex items-center justify-center border border-orange-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" className="text-orange-400" />
              <path d="M2 17l10 5 10-5" className="text-cyan-400" />
              <path d="M2 12l10 5 10-5" className="text-slate-500" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-black text-white tracking-tight">
            <span className="text-gradient-brand">GeoAI</span> Morowali
          </h1>
          <p className="text-xs text-slate-500">
            Memuat sistem deteksi perubahan spasial...
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-56 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full animate-shimmer"
            style={{
              width: '60%',
              background: 'linear-gradient(90deg, transparent, #f97316, transparent)',
              backgroundSize: '200% auto',
            }}
          />
        </div>

        <p className="text-[10px] text-slate-700 font-mono-data">
          Initializing MapLibre GL · Sentinel-2 Pipeline
        </p>
      </div>
    </div>
  );
}
