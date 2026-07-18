'use client';
// ============================================================
// HoverTooltip — Tooltip yang muncul saat hover di atas polygon
// ============================================================

import { useHoverInfo } from '@/store/mapStore';
import { LAYER_CONFIGS, type LayerId } from '@/types/geospatial';

export default function HoverTooltip() {
  const hoverInfo = useHoverInfo();
  if (!hoverInfo) return null;

  const { feature, x, y } = hoverInfo;
  const props = feature.properties;

  // area_ha = field aktual dari ML output; fallback ke luas_ha
  const luasHa = (() => {
    const v = props?.area_ha ?? props?.luas_ha;
    return typeof v === 'number' ? v.toFixed(2) : '—';
  })();

  // Kategori: dari field 'kategori' atau deteksi via 'class' (2=target area)
  const kategori = props?.kategori
    ?? (props?.class === 2 ? 'Area Terdeteksi' : props?.class === 1 ? 'Background' : 'Fitur Spasial');

  const conf = typeof props?.confidence_score === 'number'
    ? `${(props.confidence_score * 100).toFixed(1)}%`
    : null;

  // Warna default (orange untuk gain, cyan untuk air, abu untuk AOI)
  const layerColor = '#f97316';

  return (
    <div
      className="absolute z-50 pointer-events-none select-none"
      style={{ left: x + 14, top: y - 10 }}
    >
      <div
        className="
          rounded-lg px-3 py-2 shadow-xl
          bg-slate-900/95 backdrop-blur-md
          border border-slate-700
          text-xs text-slate-200
          min-w-[160px] max-w-[240px]
          animate-in fade-in zoom-in-95 duration-100
        "
      >
        {/* Color indicator */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: layerColor }}
          />
          <span className="font-semibold text-white truncate">{kategori}</span>
        </div>

        <div className="space-y-0.5 text-slate-400">
          <div className="flex justify-between gap-4">
            <span>Luas</span>
            <span className="text-slate-200 font-medium tabular-nums">{luasHa} ha</span>
          </div>
          {conf && (
            <div className="flex justify-between gap-4">
              <span>Confidence</span>
              <span className="text-emerald-400 font-medium tabular-nums">{conf}</span>
            </div>
          )}
        </div>

        <div className="mt-1.5 text-slate-500 text-[10px]">
          Klik untuk detail lengkap
        </div>
      </div>
    </div>
  );
}
