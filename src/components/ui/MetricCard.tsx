'use client';
// ============================================================
// MetricCard — Widget statistik ringkasan perubahan lahan
// ============================================================

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useGeoJSONLayerStats } from '@/hooks/useGeoJSONLayerStats';

export default function MetricCard() {
  const gainLahan = useGeoJSONLayerStats('gain_lahan');
  const lossLahan = useGeoJSONLayerStats('loss_lahan');
  const gainAir = useGeoJSONLayerStats('gain_air');
  const lossAir = useGeoJSONLayerStats('loss_air');

  const netLahan = gainLahan.totalLuas - lossLahan.totalLuas;
  const netAir = gainAir.totalLuas - lossAir.totalLuas;

  const hasData =
    gainLahan.featureCount > 0 ||
    lossLahan.featureCount > 0 ||
    gainAir.featureCount > 0 ||
    lossAir.featureCount > 0;

  if (!hasData) {
    return (
      <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs theme-text-muted text-center py-2">
          Aktifkan layer untuk melihat statistik
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-[10px] font-semibold theme-text-muted uppercase tracking-widest">
            Ringkasan Perubahan
          </h3>
        </div>
        <div style={{ borderColor: 'var(--color-border)' }}>
          <MetricRow
            label="Δ Lahan Terbuka"
            value={netLahan}
            gainCount={gainLahan.featureCount}
            lossCount={lossLahan.featureCount}
            color="#f97316"
            unit="ha"
          />
          <div style={{ height: '1px', background: 'var(--color-border)', opacity: 0.5 }} />
          <MetricRow
            label="Δ Kekeruhan Air"
            value={netAir}
            gainCount={gainAir.featureCount}
            lossCount={lossAir.featureCount}
            color="#06b6d4"
            unit="ha"
          />
        </div>
      </div>

      {/* Breakdown per layer */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat
          label="Gain Lahan"
          value={gainLahan.totalLuas}
          count={gainLahan.featureCount}
          color="#f97316"
        />
        <MiniStat
          label="Loss Lahan"
          value={lossLahan.totalLuas}
          count={lossLahan.featureCount}
          color="#22c55e"
        />
        <MiniStat
          label="Gain Air"
          value={gainAir.totalLuas}
          count={gainAir.featureCount}
          color="#06b6d4"
        />
        <MiniStat
          label="Loss Air"
          value={lossAir.totalLuas}
          count={lossAir.featureCount}
          color="#a78bfa"
        />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  gainCount,
  lossCount,
  color,
  unit,
}: {
  label: string;
  value: number;
  gainCount: number;
  lossCount: number;
  color: string;
  unit: string;
}) {
  const isPositive = value > 0;
  const isZero = value === 0 && gainCount === 0 && lossCount === 0;

  return (
    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
      <div>
        <p className="text-[11px] font-medium theme-text-secondary">{label}</p>
        <p className="text-[10px] theme-text-muted">
          {gainCount > 0 || lossCount > 0
            ? `↑${gainCount.toLocaleString('id-ID')} · ↓${lossCount.toLocaleString('id-ID')} fitur`
            : 'Belum dimuat'}
        </p>
      </div>
      <div className="text-right flex items-center gap-1">
        {isZero ? (
          <Minus size={13} className="theme-text-muted" />
        ) : isPositive ? (
          <TrendingUp size={13} style={{ color }} />
        ) : (
          <TrendingDown size={13} className="text-emerald-400" />
        )}
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: isZero ? 'var(--color-text-muted)' : isPositive ? color : '#4ade80' }}
        >
          {isZero ? '—' : `${isPositive ? '+' : ''}${value.toFixed(1)}`}
        </span>
        {!isZero && (
          <span className="text-[10px] theme-text-muted">{unit}</span>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  count,
  color,
}: {
  label: string;
  value: number;
  count: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderLeftColor: color,
        borderLeftWidth: 2,
      }}
    >
      <p className="text-[9px] theme-text-muted uppercase tracking-wide truncate">{label}</p>
      {count > 0 ? (
        <>
          <p
            className="text-base font-bold tabular-nums mt-0.5 leading-none"
            style={{ color }}
          >
            {value >= 1000
              ? `${(value / 1000).toFixed(1)}k`
              : value.toFixed(1)}
          </p>
          <p className="text-[9px] theme-text-dim mt-0.5">ha · {count.toLocaleString('id-ID')} fitur</p>
        </>
      ) : (
        <p className="text-sm theme-text-dim mt-0.5 font-medium">—</p>
      )}
    </div>
  );
}
