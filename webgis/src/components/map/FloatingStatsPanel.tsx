'use client';
// ============================================================
// FloatingStatsPanel — 3 kartu statistik melayang di kanan peta
// Menampilkan ringkasan Lahan, Air, dan Model secara real-time
// ============================================================

import { useMemo } from 'react';
import { useMapStore, useMetricsData } from '@/store/mapStore';
import { getFeatureAreaHa } from '@/lib/geoUtils';
import {
  TrendingUp, Droplets, BrainCircuit,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---- Mini sparkline bar chart ----
function MiniBar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-end gap-0.5" title={`${label}: ${value.toFixed(0)} Ha`}>
      <div
        className="w-4 rounded-sm transition-all duration-700"
        style={{
          height: `${Math.max(4, (pct / 100) * 28)}px`,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
    </div>
  );
}

// ---- Stat Row ----
function StatRow({
  label, value, color, positive,
}: {
  label: string; value: string; color: string; positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] theme-text-muted leading-tight">{label}</span>
      <span
        className="text-[10px] font-bold tabular-nums font-mono-data"
        style={{ color }}
      >
        {positive !== undefined && (
          positive
            ? <ArrowUpRight size={9} className="inline mr-0.5" />
            : <ArrowDownRight size={9} className="inline mr-0.5" />
        )}
        {value}
      </span>
    </div>
  );
}

export default function FloatingStatsPanel() {
  const geoJsonCache = useMapStore((s) => s.geoJsonCache);
  const metricsData = useMetricsData();

  const lahan = useMemo(() => {
    const gain = geoJsonCache['gain_lahan'];
    const loss = geoJsonCache['loss_lahan'];
    if (!gain && !loss) return null;

    let gainHa = 0, lossHa = 0;
    if (gain?.features) {
      for (const f of gain.features) gainHa += getFeatureAreaHa(f as Parameters<typeof getFeatureAreaHa>[0]);
    }
    if (loss?.features) {
      for (const f of loss.features) lossHa += getFeatureAreaHa(f as Parameters<typeof getFeatureAreaHa>[0]);
    }
    return { gainHa, lossHa, net: gainHa - lossHa };
  }, [geoJsonCache]);

  const air = useMemo(() => {
    const gain = geoJsonCache['gain_air'];
    const loss = geoJsonCache['loss_air'];
    if (!gain && !loss) return null;

    let gainHa = 0, lossHa = 0;
    if (gain?.features) {
      for (const f of gain.features) gainHa += getFeatureAreaHa(f as Parameters<typeof getFeatureAreaHa>[0]);
    }
    if (loss?.features) {
      for (const f of loss.features) lossHa += getFeatureAreaHa(f as Parameters<typeof getFeatureAreaHa>[0]);
    }
    return { gainHa, lossHa, net: gainHa - lossHa };
  }, [geoJsonCache]);

  const layers = useMapStore((s) => s.layers);
  const isAirActive = layers.target_air_2024 || layers.target_air_2025 || layers.gain_air || layers.loss_air;

  // Pilih model yang paling relevan berdasar layer aktif
  const model = isAirActive
    ? (metricsData?.model_air_combined ?? metricsData?.model_air_2024)
    : metricsData?.model_lahan;
  const modelLabel = isAirActive ? 'Model Air Gabungan' : 'Model Lahan';
  const modelColor = isAirActive ? '#06b6d4' : '#a78bfa';
  const modelColorBg = isAirActive ? 'rgba(6,182,212,.15)' : 'rgba(167,139,250,.15)';
  if (!lahan && !air && !model) return null;

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 pointer-events-none">

      {/* ---- Kartu 1: Lahan ---- */}
      {lahan && (
        <div
          className="floating-stat-card glass-card-gradient rounded-2xl p-3 w-48 pointer-events-auto"
          style={{ animationDelay: '0s' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(249,115,22,.15)' }}
              >
                <TrendingUp size={12} style={{ color: '#f97316' }} />
              </div>
              <span className="text-[10px] font-bold theme-text-secondary">Lahan Terbuka</span>
            </div>
            <ChevronRight size={10} className="theme-text-dim" />
          </div>

          {/* Sparkline */}
          <div className="flex items-end gap-1 mb-2 h-8">
            <MiniBar value={lahan.gainHa} max={Math.max(lahan.gainHa, lahan.lossHa)} color="#f97316" label="Gain" />
            <MiniBar value={lahan.lossHa} max={Math.max(lahan.gainHa, lahan.lossHa)} color="#10b981" label="Loss" />
            <div className="flex-1" />
            <div className="text-right">
              <div
                className={cn(
                  'text-base font-black tabular-nums',
                  lahan.net > 0 ? 'text-orange-400' : 'text-emerald-400'
                )}
              >
                {lahan.net > 0 ? '+' : ''}{lahan.net.toFixed(0)}
              </div>
              <div className="text-[8px] theme-text-dim">Ha neto</div>
            </div>
          </div>

          <div className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
            <StatRow label="Gain" value={`+${lahan.gainHa.toFixed(1)} Ha`} color="#f97316" positive={true} />
            <StatRow label="Loss" value={`-${lahan.lossHa.toFixed(1)} Ha`} color="#10b981" positive={false} />
          </div>
        </div>
      )}

      {/* ---- Kartu 2: Air ---- */}
      {air && (
        <div
          className="floating-stat-card glass-card-gradient rounded-2xl p-3 w-48 pointer-events-auto"
          style={{ animationDelay: '0.08s' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(6,182,212,.15)' }}
              >
                <Droplets size={12} style={{ color: '#06b6d4' }} />
              </div>
              <span className="text-[10px] font-bold theme-text-secondary">Kekeruhan Air</span>
            </div>
            <ChevronRight size={10} className="theme-text-dim" />
          </div>

          <div className="flex items-end gap-1 mb-2 h-8">
            <MiniBar value={air.gainHa} max={Math.max(air.gainHa, air.lossHa)} color="#06b6d4" label="Gain Air" />
            <MiniBar value={air.lossHa} max={Math.max(air.gainHa, air.lossHa)} color="#a78bfa" label="Loss Air" />
            <div className="flex-1" />
            <div className="text-right">
              <div className={cn(
                'text-base font-black tabular-nums',
                air.net > 0 ? 'text-cyan-400' : 'text-violet-400'
              )}>
                {air.net > 0 ? '+' : ''}{air.net.toFixed(0)}
              </div>
              <div className="text-[8px] theme-text-dim">Ha neto</div>
            </div>
          </div>

          <div className="space-y-1 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
            <StatRow label="Perluasan Keruh" value={`+${air.gainHa.toFixed(1)} Ha`} color="#06b6d4" positive={true} />
            <StatRow label="Pemulihan Air" value={`-${air.lossHa.toFixed(1)} Ha`} color="#a78bfa" positive={false} />
          </div>
        </div>
      )}

      {/* ---- Kartu 3: Model Accuracy ---- */}
      {model && (
        <div
          className="floating-stat-card glass-card-gradient rounded-2xl p-3 w-48 pointer-events-auto"
          style={{ animationDelay: '0.16s' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: modelColorBg }}
              >
                <BrainCircuit size={12} style={{ color: modelColor }} />
              </div>
              <span className="text-[10px] font-bold theme-text-secondary">{modelLabel}</span>
            </div>
            <ChevronRight size={10} className="theme-text-dim" />
          </div>

          {/* Accuracy gauge bar */}
          <div className="mb-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] theme-text-muted">Accuracy</span>
              <span className="text-lg font-black tabular-nums" style={{ color: modelColor }}>
                {Math.round(model.accuracy * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${model.accuracy * 100}%`,
                  background: `linear-gradient(90deg, ${modelColor}88, ${modelColor})`,
                  boxShadow: `0 0 8px ${modelColor}60`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Prec', value: model.precision, color: '#a78bfa' },
              { label: 'Recall', value: model.recall, color: '#818cf8' },
              { label: 'F1', value: model.f1_score, color: '#c084fc' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-1.5 text-center" style={{ background: 'var(--color-bg-surface)' }}>
                <div className="text-[9px] theme-text-muted">{label}</div>
                <div className="text-[11px] font-bold tabular-nums" style={{ color }}>
                  {Math.round(value * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
