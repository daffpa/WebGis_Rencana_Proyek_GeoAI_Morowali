'use client';
// ============================================================
// EvaluasiTab — Tab 3: Evaluasi Model ML
// Gauge charts + Confusion Matrix Heatmap (ECharts)
// ============================================================

import { useEffect, useRef } from 'react';
import { useMetrics, useMapStore } from '@/store/mapStore';
import type { ModelMetrics } from '@/types/geospatial';
import MetricsGauge from '../charts/MetricsGauge';
import ConfusionMatrixChart from '../charts/ConfusionMatrixChart';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export default function EvaluasiTab() {
  const { data, loading, error } = useMetrics();
  const { setMetricsData, setMetricsLoading, setMetricsError } = useMapStore();

  // Gunakan ref untuk mencegah double-fetch dan infinite loop
  const fetchingRef = useRef(false);

  // Fetch metrics dari API jika belum ada
  useEffect(() => {
    if (data !== null || fetchingRef.current) return;

    fetchingRef.current = true;

    const fetchMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError(null);
      try {
        const res = await fetch('/api/metrics');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Gagal memuat metrik');
        setMetricsData(json.data);
        if (json.warnings?.length > 0) {
          console.warn('[Metrics API] Warnings:', json.warnings);
        }
      } catch (err) {
        setMetricsError(
          err instanceof Error ? err.message : 'Terjadi kesalahan.'
        );
      } finally {
        setMetricsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchMetrics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  // CATATAN: 'loading' sengaja tidak di-list — menyebabkan infinite loop:
  // setMetricsLoading(true) → loading berubah → effect re-run → loop.

  if (loading) {
    return <EvaluasiSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-4 text-center">
        <p className="text-xs text-red-400 font-medium">⚠ Gagal Memuat Metrik</p>
        <p className="text-[10px] text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      <Tabs.Root defaultValue="lahan">
        <Tabs.List className="flex gap-1 p-1 rounded-lg bg-slate-900/60 border border-slate-800">
          {[
            { value: 'lahan', label: '🌿 Lahan Terbuka' },
            { value: 'air',   label: '💧 Kekeruhan Air' },
          ].map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                'flex-1 py-1.5 text-[10px] font-medium rounded-md transition-colors cursor-pointer',
                'text-slate-500 hover:text-slate-300',
                'data-[state=active]:bg-slate-800 data-[state=active]:text-orange-400'
              )}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="lahan" className="mt-3">
          <ModelMetricsView metrics={data.model_lahan} />
        </Tabs.Content>

        <Tabs.Content value="air" className="mt-3">
          {/* Banner: model gabungan */}
          <div className="mb-2 flex items-start gap-2 rounded-lg bg-cyan-950/30 border border-cyan-900/40 px-3 py-2">
            <span className="text-cyan-400 text-[11px] mt-0.5">ℹ</span>
            <div>
              <p className="text-[10px] font-semibold text-cyan-300">Model Gabungan 2024+2025</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
                Dilatih dari ground truth kedua tahun. Threshold optimal:{" "}
                <span className="text-cyan-400 font-bold">
                  {data.model_air_combined?.best_params?.threshold_optimal
                    ? `${data.model_air_combined.best_params.threshold_optimal}`
                    : '0.46'}
                </span>
              </p>
            </div>
          </div>
          <ModelMetricsView metrics={data.model_air_combined ?? data.model_air_2024} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function ModelMetricsView({ metrics }: { metrics: ModelMetrics }) {
  return (
    <div className="space-y-3">
      {/* Gauge charts */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.9))' }}>
        <div className="px-3 py-2 border-b border-slate-800/40">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Metrik Performa
          </p>
        </div>
        <div className="grid grid-cols-2 gap-0 p-2">
          <MetricsGauge label="Accuracy"  value={metrics.accuracy}  color="#f97316" glowColor="#ff6b00" />
          <MetricsGauge label="Precision" value={metrics.precision} color="#06b6d4" glowColor="#22d3ee" />
          <MetricsGauge label="Recall"    value={metrics.recall}    color="#a78bfa" glowColor="#c084fc" />
          <MetricsGauge label="F1-Score"  value={metrics.f1_score}  color="#4ade80" glowColor="#34d399" />
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Confusion Matrix
        </p>
        <ConfusionMatrixChart
          matrix={metrics.confusion_matrix.matrix}
          labels={metrics.confusion_matrix.labels}
        />
      </div>

      {/* Detail metrik */}
      {(metrics.false_positive !== undefined || metrics.best_cv_f1 !== undefined || metrics.best_params) && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Detail
          </p>
          {metrics.false_positive !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">False Positive</span>
              <span className="text-red-400 tabular-nums font-medium">{metrics.false_positive}</span>
            </div>
          )}
          {metrics.false_negative !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">False Negative</span>
              <span className="text-yellow-400 tabular-nums font-medium">{metrics.false_negative}</span>
            </div>
          )}
          {metrics.best_cv_f1 !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Best CV F1-Score</span>
              <span className="text-emerald-400 tabular-nums font-medium">
                {(metrics.best_cv_f1 * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {metrics.best_params?.threshold_optimal !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Threshold Optimal</span>
              <span className="text-cyan-400 tabular-nums font-medium">
                {metrics.best_params.threshold_optimal}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvaluasiSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 rounded-lg bg-slate-800" />
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
        <div className="h-3 w-24 bg-slate-800 rounded mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="h-48 rounded-xl bg-slate-900/60 border border-slate-800" />
    </div>
  );
}
