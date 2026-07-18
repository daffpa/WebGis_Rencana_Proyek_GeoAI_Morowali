'use client';
// ============================================================
// LayerController — Panel Insight Berbasis Data
// Menampilkan kartu analitik dengan mini-chart, trend,
// dan toggle peta terintegrasi dalam satu tampilan
// ============================================================

import { useState } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { useMapStore, useLayers } from '@/store/mapStore';
import { LAYER_CONFIGS, type LayerId } from '@/types/geospatial';
import {
  TrendingDown, TrendingUp, ChevronDown, ChevronUp,
  Eye, Map, BarChart3, Droplets, TreePine,
  ArrowLeftRight, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// DATA (diperbarui dari notebook ML anggota 2 & 3)
// ============================================================
const DATA = {
  lahan: {
    2024: { ha: 11820, count: 926, pctAOI: 10.53 },
    2025: { ha: 9602,  count: 694, pctAOI: 8.55  },
    gain_ha: 1262,
    loss_ha: 5337,
    label: 'Lahan Terbuka',
    color: '#f97316',
    colorDim: 'rgba(249,115,22,.12)',
    colorBorder: 'rgba(249,115,22,.25)',
    icon: TreePine,
    desc: 'Lahan tidak bervegetasi akibat aktivitas pertambangan dan pembukaan lahan di Kabupaten Morowali.',
  },
  air: {
    2024: { ha: 9006,  count: 138386, pctAOI: 8.02 },
    2025: { ha: 8149,  count: 164985, pctAOI: 7.26 },
    gain_ha: 465.5,
    loss_ha: 9.0,
    label: 'Kekeruhan Air',
    color: '#22d3ee',
    colorDim: 'rgba(34,211,238,.12)',
    colorBorder: 'rgba(34,211,238,.25)',
    icon: Droplets,
    desc: 'Zona air keruh dari limpasan tambang terdeteksi pada citra Sentinel-2 menggunakan band kekeruhan.',
  },
} as const;

// ============================================================
// Mini bar chart — perbandingan 2 nilai
// ============================================================
function MiniBarChart({
  val2024,
  val2025,
  max,
  color,
}: {
  val2024: number;
  val2025: number;
  max: number;
  color: string;
}) {
  const pct24 = (val2024 / max) * 100;
  const pct25 = (val2025 / max) * 100;
  return (
    <div className="flex items-end gap-1.5 h-10">
      {/* 2024 */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        <div className="w-full rounded-t-sm transition-all duration-700 relative"
          style={{ height: `${(pct24 / 100) * 36}px`, backgroundColor: `${color}60` }}
        >
          <div className="absolute inset-0 rounded-t-sm"
            style={{ background: `linear-gradient(to top, ${color}20, ${color}80)` }} />
        </div>
        <span className="text-[7px] text-slate-600">2024</span>
      </div>
      {/* 2025 */}
      <div className="flex flex-col items-center gap-0.5 flex-1">
        <div className="w-full rounded-t-sm transition-all duration-700 relative"
          style={{ height: `${(pct25 / 100) * 36}px`, backgroundColor: `${color}` }}
        >
          <div className="absolute inset-0 rounded-t-sm"
            style={{ background: `linear-gradient(to top, ${color}60, ${color})` }} />
        </div>
        <span className="text-[7px] text-slate-600">2025</span>
      </div>
    </div>
  );
}

// ============================================================
// Insight Card — satu kartu per kategori
// ============================================================
function InsightCard({
  dataKey,
  activeYear,
  isVisible,
  onToggleVisibility,
  onYearChange,
}: {
  dataKey: 'lahan' | 'air';
  activeYear: 2024 | 2025;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onYearChange: (y: 2024 | 2025) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const d = DATA[dataKey];
  const Icon = d.icon;

  const curr = d[activeYear];
  const prev = d[activeYear === 2025 ? 2024 : 2025];
  const deltaHa = curr.ha - prev.ha;
  const deltaPct = ((deltaHa / prev.ha) * 100);
  const isIncrease = deltaHa > 0;
  const maxHa = Math.max(d[2024].ha, d[2025].ha);

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        isVisible ? '' : 'opacity-60'
      )}
      style={isVisible ? {
        background: d.colorDim,
        borderColor: d.colorBorder,
        boxShadow: `0 0 20px ${d.color}0d`,
      } : {
        background: 'rgba(15,23,42,0.5)',
        borderColor: 'rgba(51,65,85,0.4)',
      }}
    >
      {/* ---- Header ---- */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          {/* Icon + Label */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={isVisible
                ? { backgroundColor: `${d.color}20`, boxShadow: `0 0 12px ${d.color}25` }
                : { backgroundColor: '#1e293b' }
              }
            >
              <Icon size={15} style={{ color: isVisible ? d.color : '#475569' }} />
            </div>
            <div>
              <p className={cn('text-xs font-bold', isVisible ? 'text-slate-200' : 'text-slate-500')}>
                {d.label}
              </p>
              <p className="text-[8px] text-slate-600 mt-0.5">Kabupaten Morowali</p>
            </div>
          </div>

          {/* Toggle tampilkan di peta */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Map size={9} className={isVisible ? 'text-slate-500' : 'text-slate-700'} />
            <Switch.Root
              checked={isVisible}
              onCheckedChange={onToggleVisibility}
              className={cn(
                'relative w-8 h-4 rounded-full transition-all duration-300 cursor-pointer',
                'focus-visible:outline-none flex-shrink-0',
                isVisible ? '' : 'bg-slate-800'
              )}
              style={isVisible ? {
                backgroundColor: d.color,
                boxShadow: `0 0 8px ${d.color}60`,
              } : {}}
              aria-label={`Tampilkan ${d.label} di peta`}
            >
              <Switch.Thumb
                className={cn(
                  'block w-3 h-3 rounded-full shadow-md transition-transform duration-300',
                  'translate-x-0.5 data-[state=checked]:translate-x-4',
                  isVisible ? 'bg-white' : 'bg-slate-600'
                )}
              />
            </Switch.Root>
          </div>
        </div>

        {/* ---- Main metrics ---- */}
        <div className="mt-3 flex items-end gap-3">
          {/* Mini bar chart */}
          <div className="w-14 flex-shrink-0">
            <MiniBarChart
              val2024={d[2024].ha}
              val2025={d[2025].ha}
              max={maxHa}
              color={d.color}
            />
          </div>

          {/* Stat besar */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-black tabular-nums leading-none"
                style={{ color: isVisible ? d.color : '#475569' }}
              >
                {curr.ha.toLocaleString('id-ID')}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">Ha</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {isIncrease
                ? <TrendingUp size={9} className="text-red-400" />
                : <TrendingDown size={9} className="text-emerald-400" />
              }
              <span className={cn('text-[9px] font-bold tabular-nums', isIncrease ? 'text-red-400' : 'text-emerald-400')}>
                {isIncrease ? '+' : ''}{deltaHa.toLocaleString('id-ID')} Ha ({deltaPct.toFixed(1)}%)
              </span>
              <span className="text-[8px] text-slate-700">vs {activeYear === 2025 ? '2024' : '2025'}</span>
            </div>
          </div>
        </div>

        {/* ---- Year toggle pills ---- */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[8px] text-slate-600 font-medium mr-0.5">Tahun:</span>
          {([2024, 2025] as const).map((yr) => (
            <button
              key={yr}
              onClick={() => onYearChange(yr)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[9px] font-bold transition-all duration-200 cursor-pointer',
                activeYear === yr
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-400 bg-slate-800/60'
              )}
              style={activeYear === yr ? { backgroundColor: d.color } : {}}
            >
              {yr}
            </button>
          ))}

          {/* Expand button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-0.5 text-[8px] text-slate-600 hover:text-slate-400 cursor-pointer transition-colors"
          >
            <BarChart3 size={9} />
            <span>{expanded ? 'Tutup' : 'Detail'}</span>
            {expanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
          </button>
        </div>
      </div>

      {/* ---- Expanded detail ---- */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5 mt-0">
          {/* Progress bars perbandingan */}
          <div className="mt-2.5 space-y-2">
            <p className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest mb-2">
              Perbandingan Luas
            </p>

            {([2024, 2025] as const).map((yr) => {
              const s = d[yr];
              const pct = (s.ha / maxHa) * 100;
              const isActive = activeYear === yr;
              return (
                <div key={yr}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9px] text-slate-500 font-medium">{yr}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 tabular-nums font-bold">
                        {s.ha.toLocaleString('id-ID')} Ha
                      </span>
                      <span className="text-[8px] text-slate-700">({s.pctAOI}% AOI)</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: d.color,
                        opacity: isActive ? 1 : 0.4,
                      }}
                    />
                  </div>
                  <p className="text-[8px] text-slate-700 mt-0.5">
                    {s.count.toLocaleString('id-ID')} poligon terdeteksi
                  </p>
                </div>
              );
            })}
          </div>

          {/* Gain / Loss */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-900/60 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp size={9} className="text-red-400" />
                <span className="text-[8px] text-slate-500">Bertambah</span>
              </div>
              <p className="text-[11px] font-bold text-red-400 tabular-nums">
                +{d.gain_ha.toLocaleString('id-ID')} Ha
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingDown size={9} className="text-emerald-400" />
                <span className="text-[8px] text-slate-500">Berkurang</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-400 tabular-nums">
                −{d.loss_ha.toLocaleString('id-ID')} Ha
              </p>
            </div>
          </div>

          {/* Interpretasi singkat */}
          <div className="mt-2.5 rounded-lg bg-slate-900/60 px-2.5 py-2 flex items-start gap-2">
            <Info size={9} className="text-slate-600 flex-shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-500 leading-relaxed">{d.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Kartu Perubahan 2024→2025
// ============================================================
function ChangeCard({
  layers,
  onToggle,
}: {
  layers: ReturnType<typeof useLayers>;
  onToggle: (id: LayerId) => void;
}) {
  const isAnyActive = layers.gain_lahan || layers.loss_lahan || layers.gain_air || layers.loss_air;

  const items = [
    {
      id: 'gain_lahan', label: 'Lahan Bertambah',
      ha: 1262, count: 377,
      color: LAYER_CONFIGS.gain_lahan.color, icon: '↑',
    },
    {
      id: 'loss_lahan', label: 'Lahan Berkurang',
      ha: 5337, count: 1083,
      color: LAYER_CONFIGS.loss_lahan.color, icon: '↓',
    },
    {
      id: 'gain_air', label: 'Keruh Bertambah',
      ha: 465, count: 46548,
      color: LAYER_CONFIGS.gain_air.color, icon: '↑',
    },
    {
      id: 'loss_air', label: 'Keruh Berkurang',
      ha: 9, count: 96073,
      color: LAYER_CONFIGS.loss_air.color, icon: '↓',
    },
  ] as const;

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        isAnyActive ? 'border-violet-500/25 bg-violet-500/8' : 'border-slate-800/60 bg-slate-900/50'
      )}
    >
      {/* Header */}
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={isAnyActive
            ? { backgroundColor: 'rgba(167,139,250,.2)', boxShadow: '0 0 10px rgba(167,139,250,.2)' }
            : { backgroundColor: '#1e293b' }
          }
        >
          <ArrowLeftRight size={14} style={{ color: isAnyActive ? '#a78bfa' : '#475569' }} />
        </div>
        <div className="flex-1">
          <p className={cn('text-xs font-bold', isAnyActive ? 'text-slate-200' : 'text-slate-500')}>
            Deteksi Perubahan
          </p>
          <p className="text-[8px] text-slate-600 mt-0.5">Analisis 2024 → 2025</p>
        </div>
        {/* Net change badge */}
        <div className="text-right flex-shrink-0">
          <p className="text-[9px] font-bold text-emerald-400">−4.075 Ha</p>
          <p className="text-[7px] text-slate-700">net lahan</p>
        </div>
      </div>

      {/* Grid items */}
      <div className="px-2 pb-2.5 grid grid-cols-2 gap-1.5">
        {items.map(({ id, label, ha, count, color, icon }) => {
          const active = layers[id as keyof typeof layers] as boolean;
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={cn(
                'rounded-xl p-2.5 text-left cursor-pointer transition-all duration-200 border',
                active ? 'border-transparent' : 'border-transparent bg-slate-900/60 hover:bg-slate-800/60'
              )}
              style={active ? {
                backgroundColor: `${color}12`,
                borderColor: `${color}30`,
              } : {}}
            >
              {/* Dot + label */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: active ? color : '#334155' }}
                />
                <span className={cn('text-[9px] font-medium leading-tight', active ? 'text-slate-300' : 'text-slate-600')}>
                  {label}
                </span>
              </div>

              {/* Number */}
              <p
                className="text-sm font-black tabular-nums leading-none"
                style={{ color: active ? color : '#334155' }}
              >
                {icon}{ha >= 1000 ? `${(ha / 1000).toFixed(1)}k` : ha} <span className="text-[8px] font-normal">Ha</span>
              </p>
              <p className="text-[8px] mt-0.5" style={{ color: active ? `${color}70` : '#1e293b' }}>
                {count.toLocaleString('id-ID')} area
              </p>

              {/* Pill aktif */}
              <div className="mt-1.5">
                <span
                  className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                  style={active
                    ? { color, backgroundColor: `${color}20` }
                    : { color: '#334155', backgroundColor: '#0f172a' }
                  }
                >
                  {active ? '● DI PETA' : '○ NONAKTIF'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Main Export
// ============================================================
export default function LayerController() {
  const layers = useLayers();
  const { toggleLayer, setLayerVisibility, activeYear, setActiveYear } = useMapStore();

  const isLahanVisible = layers.target_lahan_2024 || layers.target_lahan_2025;
  const isAirVisible = layers.target_air_2024 || layers.target_air_2025;

  const handleLahanToggle = () => {
    const next = !isLahanVisible;
    setLayerVisibility('target_lahan_2024', next && activeYear === 2024);
    setLayerVisibility('target_lahan_2025', next && activeYear === 2025);
  };

  const handleAirToggle = () => {
    const next = !isAirVisible;
    setLayerVisibility('target_air_2024', next && activeYear === 2024);
    setLayerVisibility('target_air_2025', next && activeYear === 2025);
  };

  // Saat tahun berubah dari dalam kartu, sinkronkan store + layer
  const handleYearChange = (yr: 2024 | 2025) => {
    setActiveYear(yr);
    // Jika layer sedang aktif, switch ke tahun baru
    if (isLahanVisible) {
      setLayerVisibility('target_lahan_2024', yr === 2024);
      setLayerVisibility('target_lahan_2025', yr === 2025);
    }
    if (isAirVisible) {
      setLayerVisibility('target_air_2024', yr === 2024);
      setLayerVisibility('target_air_2025', yr === 2025);
    }
  };

  return (
    <div className="space-y-2.5">

      {/* Batas Wilayah — always on, minimal */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/40">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400">Batas Wilayah Kajian</p>
          <p className="text-[8px] text-slate-700">Kab. Morowali · 112.152 Ha · Selalu aktif</p>
        </div>
        <Eye size={10} className="text-emerald-600 flex-shrink-0" />
      </div>

      {/* Insight Cards */}
      <InsightCard
        dataKey="lahan"
        activeYear={activeYear}
        isVisible={isLahanVisible}
        onToggleVisibility={handleLahanToggle}
        onYearChange={handleYearChange}
      />

      <InsightCard
        dataKey="air"
        activeYear={activeYear}
        isVisible={isAirVisible}
        onToggleVisibility={handleAirToggle}
        onYearChange={handleYearChange}
      />

      {/* Change card */}
      <ChangeCard layers={layers} onToggle={toggleLayer} />

    </div>
  );
}
