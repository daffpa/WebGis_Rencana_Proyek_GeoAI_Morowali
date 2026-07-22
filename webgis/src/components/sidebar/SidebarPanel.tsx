'use client';
// ============================================================
// SidebarPanel — Panel navigasi floating premium
// Glassmorphism + gradient border + animated tab indicator
// ============================================================

import * as Tabs from '@radix-ui/react-tabs';
import { useMapStore, useActiveTab } from '@/store/mapStore';
import { type ActiveTab } from '@/types/geospatial';
import {
  Map, Database, BarChart2, Lightbulb,
  ChevronLeft, ChevronRight, Layers,
} from 'lucide-react';
import LayerController from './LayerController';
import MetricCard from '../ui/MetricCard';
import DataProcessTab from '../tabs/DataProcessTab';
import EvaluasiTab from '../tabs/EvaluasiTab';
import InsightTab from '../tabs/InsightTab';
import { cn } from '@/lib/utils';

const TABS: {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  shortLabel: string;
  color: string;
}[] = [
  { id: 'map',      label: 'Peta Hasil',    shortLabel: 'Peta',    icon: <Map size={14} />,       color: '#94a3b8' },
  { id: 'data',     label: 'Data & Proses', shortLabel: 'Data',    icon: <Database size={14} />,  color: '#06b6d4' },
  { id: 'evaluasi', label: 'Evaluasi Model',shortLabel: 'Eval',    icon: <BarChart2 size={14} />, color: '#a78bfa' },
  { id: 'insight',  label: 'Insight',       shortLabel: 'Insight', icon: <Lightbulb size={14} />, color: '#f97316' },
];

export default function SidebarPanel() {
  const activeTab = useActiveTab();
  const { setActiveTab, sidebarCollapsed, toggleSidebar } = useMapStore();
  const activeTabConfig = TABS.find((t) => t.id === activeTab);

  return (
    <div
      className={cn(
        'absolute left-4 top-4 bottom-4 z-40 flex flex-col transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        sidebarCollapsed ? 'w-12' : 'w-[340px]'
      )}
    >
      {/* ---- Panel utama ---- */}
      <div
        className={cn(
          'flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden',
          'glass-card-gradient',
          'transition-all duration-300'
        )}
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        {/* ---- Header dengan gradient branding ---- */}
        <div className="sidebar-header-gradient flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {!sidebarCollapsed ? (
            <div className="px-4 py-3.5 flex items-center gap-3">
              {/* Logo icon */}
              <div className="relative w-8 h-8 flex-shrink-0">
                <div className="absolute inset-0 rounded-xl bg-orange-500/15 border border-orange-500/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Layers size={14} className="text-orange-400" />
                </div>
                {/* Pulse ring */}
                <div className="absolute -inset-0.5 rounded-xl border border-orange-500/20 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-black theme-text tracking-tight leading-none">
                  GeoAI <span className="text-gradient-brand">Morowali</span>
                </h1>
                <p className="text-[9px] theme-text-muted mt-0.5 leading-none">
                  Deteksi Perubahan Spasial · Kab. Morowali
                </p>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot-live" />
              </div>
            </div>
          ) : (
            <div className="p-3 flex justify-center">
              <div className="relative">
                <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <Layers size={12} className="text-orange-400" />
                </div>
                <div className="absolute -inset-0.5 rounded-lg border border-orange-500/20 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* ---- Tab Content ---- */}
        {!sidebarCollapsed && (
          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* ---- Tab List ---- */}
            <Tabs.List className="flex px-2 pt-2.5 gap-0.5 flex-shrink-0" style={{ background: 'var(--color-bg-surface)' }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Tabs.Trigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl',
                      'text-[9px] font-bold uppercase tracking-wider',
                      'transition-all duration-200 cursor-pointer relative overflow-hidden',
                      isActive
                        ? 'theme-text'
                        : 'theme-text-dim'
                    )}
                    style={isActive ? {
                      backgroundColor: `${tab.color}15`,
                      color: tab.color,
                    } : {}}
                  >
                    {/* Active glow background */}
                    {isActive && (
                      <div
                        className="absolute inset-0 opacity-10 rounded-xl"
                        style={{
                          background: `radial-gradient(ellipse at center, ${tab.color} 0%, transparent 70%)`,
                        }}
                      />
                    )}
                    <span className="relative z-10">{tab.icon}</span>
                    <span className="relative z-10 leading-none">{tab.shortLabel}</span>

                    {/* Active bottom indicator */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                        style={{ backgroundColor: tab.color }}
                      />
                    )}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            {/* Active tab title */}
            <div className="px-4 pt-3 pb-1 flex-shrink-0 flex items-center gap-2">
              <div
                className="h-4 w-0.5 rounded-full"
                style={{ backgroundColor: activeTabConfig?.color ?? '#f97316' }}
              />
              <span className="text-[10px] font-semibold theme-text-muted uppercase tracking-widest">
                {activeTabConfig?.label}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px mx-3 flex-shrink-0" style={{ background: 'linear-gradient(90deg, transparent, var(--color-border), transparent)' }} />

            {/* ---- Tab Content (scrollable) ---- */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              <Tabs.Content value="map" className="p-3 space-y-3 animate-fade-in">
                <LayerController />
                <MetricCard />
              </Tabs.Content>

              <Tabs.Content value="data" className="p-3 animate-fade-in">
                <DataProcessTab />
              </Tabs.Content>

              <Tabs.Content value="evaluasi" className="p-3 animate-fade-in">
                <EvaluasiTab />
              </Tabs.Content>

              <Tabs.Content value="insight" className="p-3 animate-fade-in">
                <InsightTab />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        )}

        {/* Collapsed state: icon-only tabs */}
        {sidebarCollapsed && (
          <div className="flex flex-col gap-1 p-1.5 flex-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    toggleSidebar();
                  }}
                  className="w-full flex justify-center py-2 rounded-xl transition-all duration-200 cursor-pointer"
                  style={isActive ? {
                    backgroundColor: `${tab.color}15`,
                    color: tab.color,
                  } : { color: 'var(--color-text-dim)' }}
                  title={tab.label}
                >
                  {tab.icon}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Collapse toggle button ---- */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3.5 top-1/2 -translate-y-1/2',
          'w-7 h-14 rounded-full',
          'glass-card',
          'flex items-center justify-center',
          'theme-text-muted',
          'transition-all duration-200 hover:scale-110 cursor-pointer',
          'hover:text-orange-400',
          'hover:shadow-[0_0_12px_rgba(249,115,22,.2)]'
        )}
        style={{ border: '1px solid var(--color-border)' }}
        aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={13} />
        ) : (
          <ChevronLeft size={13} />
        )}
      </button>
    </div>
  );
}
