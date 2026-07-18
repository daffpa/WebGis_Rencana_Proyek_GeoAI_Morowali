'use client';
// ============================================================
// InsightTab — Tab 4: Insight Kuantitatif Objektif
// Data-driven synthesis — tidak ada narasi asumtif
// ============================================================

import { useMemo } from 'react';
import { useMapStore } from '@/store/mapStore';
import { getFeatureAreaHa } from '@/lib/geoUtils';
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';

export default function InsightTab() {
  const geoJsonCache = useMapStore((s) => s.geoJsonCache);

  const stats = useMemo(() => {
    const computeStats = (layerId: string) => {
      const data = geoJsonCache[layerId as keyof typeof geoJsonCache];
      if (!data?.features?.length) return null;
      let totalLuas = 0;
      let featureCount = 0;
      for (const f of data.features) {
        featureCount++;
        // getFeatureAreaHa: pakai area_ha/luas_ha jika ada,
        // jika tidak ada (GeoJSON air) → hitung dari geometri polygon
        totalLuas += getFeatureAreaHa(f as Parameters<typeof getFeatureAreaHa>[0]);
      }
      return { totalLuas, featureCount };
    };

    const gainLahan = computeStats('gain_lahan');
    const lossLahan = computeStats('loss_lahan');
    const gainAir = computeStats('gain_air');
    const lossAir = computeStats('loss_air');

    const netLahan =
      (gainLahan?.totalLuas ?? 0) - (lossLahan?.totalLuas ?? 0);
    const netAir =
      (gainAir?.totalLuas ?? 0) - (lossAir?.totalLuas ?? 0);

    const deltaPercent =
      lossLahan?.totalLuas && lossLahan.totalLuas > 0
        ? ((netLahan / lossLahan.totalLuas) * 100)
        : null;

    return {
      gainLahan,
      lossLahan,
      gainAir,
      lossAir,
      netLahan,
      netAir,
      deltaPercent,
      hasData:
        gainLahan !== null ||
        lossLahan !== null ||
        gainAir !== null ||
        lossAir !== null,
    };
  }, [geoJsonCache]);

  if (!stats.hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <Activity size={32} className="text-slate-700" />
        <div>
          <p className="text-xs font-medium text-slate-400">Belum Ada Data</p>
          <p className="text-[10px] text-slate-600 mt-1">
            Aktifkan layer di Tab Peta untuk<br />menghitung insight secara otomatis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 px-3 py-2">
        <p className="text-[10px] text-orange-400 font-medium">
          ℹ Insight berbasis data GeoJSON aktual · Tanpa asumsi narasi
        </p>
      </div>

      {/* Laju Ekspansi Lahan */}
      <InsightCard
        title="Laju Ekspansi Lahan Tambang"
        icon={<TrendingUp size={14} />}
        iconColor={stats.netLahan > 0 ? '#f97316' : '#4ade80'}
        items={[
          {
            label: 'Total Gain Lahan Terbuka',
            value: stats.gainLahan
              ? `+${stats.gainLahan.totalLuas.toFixed(2)} Ha`
              : '—',
            color: '#f97316',
          },
          {
            label: 'Total Loss Lahan Terbuka',
            value: stats.lossLahan
              ? `-${stats.lossLahan.totalLuas.toFixed(2)} Ha`
              : '—',
            color: '#4ade80',
          },
          {
            label: 'Δ Neto (2024→2025)',
            value:
              stats.gainLahan || stats.lossLahan
                ? `${stats.netLahan > 0 ? '+' : ''}${stats.netLahan.toFixed(2)} Ha`
                : '—',
            color: stats.netLahan > 0 ? '#f97316' : '#4ade80',
            bold: true,
          },
          ...(stats.deltaPercent !== null
            ? [
                {
                  label: 'Δ Persentase',
                  value: `${stats.deltaPercent > 0 ? '+' : ''}${stats.deltaPercent.toFixed(1)}%`,
                  color: stats.deltaPercent > 0 ? '#f97316' : '#4ade80',
                },
              ]
            : []),
        ]}
      />

      {/* Perubahan Kualitas Air */}
      <InsightCard
        title="Perubahan Kekeruhan Perairan"
        icon={<TrendingDown size={14} />}
        iconColor={stats.netAir > 0 ? '#06b6d4' : '#4ade80'}
        items={[
          {
            label: 'Perluasan Zona Keruh',
            value: stats.gainAir
              ? `+${stats.gainAir.totalLuas.toFixed(2)} Ha`
              : '—',
            color: '#06b6d4',
          },
          {
            label: 'Pemulihan Kualitas Air',
            value: stats.lossAir
              ? `-${stats.lossAir.totalLuas.toFixed(2)} Ha`
              : '—',
            color: '#4ade80',
          },
          {
            label: 'Δ Neto Kekeruhan',
            value:
              stats.gainAir || stats.lossAir
                ? `${stats.netAir > 0 ? '+' : ''}${stats.netAir.toFixed(2)} Ha`
                : '—',
            color: stats.netAir > 0 ? '#06b6d4' : '#4ade80',
            bold: true,
          },
        ]}
      />

      {/* Jumlah Fitur */}
      <InsightCard
        title="Statistik Fitur Spasial"
        icon={<Activity size={14} />}
        iconColor="#94a3b8"
        items={[
          {
            label: 'Poligon Gain Lahan',
            value: stats.gainLahan
              ? `${stats.gainLahan.featureCount.toLocaleString('id-ID')} poligon`
              : '—',
            color: '#f97316',
          },
          {
            label: 'Poligon Loss Lahan',
            value: stats.lossLahan
              ? `${stats.lossLahan.featureCount.toLocaleString('id-ID')} poligon`
              : '—',
            color: '#22c55e',
          },
          {
            label: 'Poligon Gain Air',
            value: stats.gainAir
              ? `${stats.gainAir.featureCount.toLocaleString('id-ID')} poligon`
              : '—',
            color: '#06b6d4',
          },
          {
            label: 'Poligon Loss Air',
            value: stats.lossAir
              ? `${stats.lossAir.featureCount.toLocaleString('id-ID')} poligon`
              : '—',
            color: '#a78bfa',
          },
        ]}
      />

      {/* Catatan metodologis */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Semua angka dihitung langsung dari geometri GeoJSON hasil klasifikasi ML.
            Nilai <code className="text-slate-400">area_ha</code> menggunakan
            proyeksi data yang tersedia. Harap verifikasi dengan GIS desktop untuk
            analisis lanjutan.
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  icon,
  iconColor,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  items: { label: string; value: string; color: string; bold?: boolean }[];
}) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <span style={{ color: iconColor }}>{icon}</span>
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center gap-2">
            <span className="text-xs text-slate-500">{item.label}</span>
            <span
              className={`text-xs tabular-nums ${item.bold ? 'font-bold text-sm' : 'font-medium'}`}
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
