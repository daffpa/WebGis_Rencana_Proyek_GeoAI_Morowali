'use client';
// ============================================================
// FeaturePopup — Panel detail yang muncul saat klik polygon
// ============================================================

import { useMapStore, useSelectedFeature } from '@/store/mapStore';
import { LAYER_CONFIGS } from '@/types/geospatial';
import { X, MapPin, Layers, BarChart2 } from 'lucide-react';

export default function FeaturePopup() {
  const feature = useSelectedFeature();
  const { setSelectedFeature } = useMapStore();

  if (!feature) return null;

  const props = feature.properties;

  // Kategori: dari 'kategori' atau deteksi dari field 'class'
  const kategori = props?.kategori
    ?? (props?.class === 2 ? 'Area Terdeteksi' : props?.class === 1 ? 'Background' : 'Tidak Diketahui');

  // area_ha = field aktual dari GeoJSON ML output; fallback ke luas_ha
  const luasHa = (() => {
    const v = props?.area_ha ?? props?.luas_ha;
    return typeof v === 'number' ? v.toFixed(4) : '—';
  })();

  const conf = typeof props?.confidence_score === 'number'
    ? (props.confidence_score * 100).toFixed(2) + '%'
    : '—';
  const tahun = props?.tahun ?? '—';

  // Cari config layer berdasarkan kategori
  const layerConfig = Object.values(LAYER_CONFIGS).find((c) =>
    kategori.toLowerCase().includes(c.id.replace(/_/g, ' '))
  );
  const color = layerConfig?.color ?? '#94a3b8';
  const label = layerConfig?.label ?? kategori;

  return (
    <div className="absolute bottom-8 left-4 z-50 w-72 animate-in slide-in-from-bottom-4 duration-200">
      <div className="rounded-xl overflow-hidden shadow-2xl glass-card">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: `2px solid ${color}33`, background: `${color}15` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-semibold theme-text truncate">{label}</span>
          </div>
          <button
            onClick={() => setSelectedFeature(null)}
            className="theme-text-muted hover:theme-text transition-colors p-0.5 rounded"
            aria-label="Tutup popup"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5">
          <DataRow
            icon={<Layers size={12} />}
            label="Kategori"
            value={kategori}
          />
          <DataRow
            icon={<MapPin size={12} />}
            label="Luas"
            value={`${luasHa} Ha`}
            highlight
          />
          <DataRow
            icon={<BarChart2 size={12} />}
            label="Confidence Score"
            value={conf}
          />
          {tahun !== '—' && (
            <DataRow
              icon={<span className="text-[10px]">📅</span>}
              label="Tahun"
              value={String(tahun)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
          <p className="text-[10px] theme-text-muted text-center">
            Sumber: Klasifikasi ML Sentinel-2 · Kab. Morowali
          </p>
        </div>
      </div>
    </div>
  );
}

function DataRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 theme-text-muted text-xs min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <span
        className={`text-xs font-medium tabular-nums truncate ${
          highlight ? 'text-orange-400' : 'theme-text'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
