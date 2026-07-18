// ============================================================
// API Route: /api/metrics
// Membaca & mem-parse file .txt metrik ML ke JSON terstruktur.
// File aktual: metrik_aprf_lahan.txt & metrik_aprf_air.txt
// ============================================================

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import type { MetricsData, ModelMetrics, ConfusionMatrix } from '@/types/geospatial';

const LAHAN_METRICS_PATH = path.join(
  process.cwd(),
  '..',
  'WORKSPACE_ANGGOTA_2_ML_Lahan_Terbuka',
  '03_Evaluasi & Hasil Klasifikasi',
  'metrik_aprf_lahan.txt'
);

const AIR_METRICS_PATH = path.join(
  process.cwd(),
  '..',
  'WORKSPACE_ANGGOTA_3_ML_Perairan',
  '03_Evaluasi',
  'metrik_aprf_air.txt'
);

// ---- Parser: metrik_aprf_lahan.txt ----
// Format aktual:
//   Accuracy : 0.958
//   Precision: 0.982
//   Recall   : 0.931
//   F1-Score : 0.956
//   Confusion Matrix:
//   [[59  1]
//    [ 4 54]]
//   False Positive (FP): 1
//   False Negative (FN): 4
function parseLahanMetrics(content: string): ModelMetrics {
  // Gunakan regex langsung pada full content untuk menghindari masalah
  // sub-section "Testing Results:" dan whitespace tidak konsisten

  // Pola: key diikuti spasi opsional, titik dua, spasi opsional, angka
  const extractValue = (pattern: RegExp): number => {
    const m = content.match(pattern);
    return m ? parseFloat(m[1]) : 0;
  };

  const accuracy  = extractValue(/Accuracy\s*:\s*([\d.]+)/i);
  const precision = extractValue(/Precision\s*:\s*([\d.]+)/i);
  const recall    = extractValue(/Recall\s*:\s*([\d.]+)/i);
  // Gunakan word boundary agar tidak mencocokkan "Best CV F1-Score"
  const f1_score  = extractValue(/^\s*F1[-\s]Score\s*:\s*([\d.]+)/im);

  // Parse confusion matrix format numpy: "[[59  1]\n [ 4 54]]"
  const cmMatch = content.match(/\[\[(\d+)\s+(\d+)\]\s*\[\s*(\d+)\s+(\d+)\]\]/);
  const matrix: number[][] = cmMatch
    ? [
        [parseInt(cmMatch[1]), parseInt(cmMatch[2])],
        [parseInt(cmMatch[3]), parseInt(cmMatch[4])],
      ]
    : [[0, 0], [0, 0]];

  // Parse best parameters: {'class_weight': 'balanced', ...}
  const bestParamsMatch = content.match(/Best Parameters:\s*({[^}]+})/);
  let best_params: Record<string, string | number | boolean> | undefined;
  if (bestParamsMatch) {
    try {
      best_params = JSON.parse(bestParamsMatch[1].replace(/'/g, '"'));
    } catch {
      best_params = undefined;
    }
  }

  const bestCVMatch = content.match(/Best CV F1-Score:\s*([\d.]+)/);
  const fpMatch = content.match(/False Positive\s*(?:\(FP\))?:\s*(\d+)/i);
  const fnMatch = content.match(/False Negative\s*(?:\(FN\))?:\s*(\d+)/i);

  return {
    accuracy,
    precision,
    recall,
    f1_score,
    confusion_matrix: {
      matrix,
      labels: ['Bukan Lahan Terbuka', 'Lahan Terbuka'],
    } as ConfusionMatrix,
    best_params,
    best_cv_f1: bestCVMatch ? parseFloat(bestCVMatch[1]) : undefined,
    false_positive: fpMatch ? parseInt(fpMatch[1]) : undefined,
    false_negative: fnMatch ? parseInt(fnMatch[1]) : undefined,
  };
}

// ---- Parser: metrik_aprf_air.txt (format baru: model gabungan 2024+2025) ----
// Format aktual dari modeling.ipynb:
//   ===== Metrik Objek Perairan - Model Gabungan 2024+2025 =====
//   Accuracy  : 0.7888
//   Precision : 0.7734
//   Recall    : 0.8319
//   F1-score  : 0.8016
//   Confusion Matrix: [[84, 29], [20, 99]]
//   Threshold optimal (setelah tuning): 0.4600
function parseAirMetrics(content: string): { combined: ModelMetrics } {
  const labels = ['Darat (0)', 'Air/Keruh (1)'];

  const extractValue = (pattern: RegExp): number => {
    const m = content.match(pattern);
    return m ? parseFloat(m[1]) : 0;
  };

  const accuracy  = extractValue(/^Accuracy\s*:\s*([\d.]+)/im);
  const precision = extractValue(/^Precision\s*:\s*([\d.]+)/im);
  const recall    = extractValue(/^Recall\s*:\s*([\d.]+)/im);
  const f1_score  = extractValue(/^F1-score\s*:\s*([\d.]+)/im);

  // Format: "Confusion Matrix: [[84, 29], [20, 99]]"
  const cmMatch = content.match(/\[\[(\d+),\s*(\d+)\],\s*\[(\d+),\s*(\d+)\]\]/);
  const matrix: number[][] = cmMatch
    ? [
        [parseInt(cmMatch[1]), parseInt(cmMatch[2])],
        [parseInt(cmMatch[3]), parseInt(cmMatch[4])],
      ]
    : [[0, 0], [0, 0]];

  // Parse threshold
  const thresholdMatch = content.match(/Threshold\s*(?:optimal)?[^:]*:\s*([\d.]+)/i);
  const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : undefined;

  return {
    combined: {
      accuracy,
      precision,
      recall,
      f1_score,
      confusion_matrix: { matrix, labels } as ConfusionMatrix,
      best_params: threshold !== undefined ? { threshold_optimal: threshold } : undefined,
    },
  };
}

export async function GET() {
  const errors: string[] = [];

  // ---- Baca metrik lahan ----
  let lahanMetrics: ModelMetrics | null = null;
  if (fs.existsSync(LAHAN_METRICS_PATH)) {
    try {
      const content = fs.readFileSync(LAHAN_METRICS_PATH, 'utf-8');
      lahanMetrics = parseLahanMetrics(content);
    } catch (err) {
      errors.push(`Gagal parse metrik lahan: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  } else {
    errors.push(`File metrik lahan tidak ditemukan: ${LAHAN_METRICS_PATH}`);
  }

  // ---- Baca metrik air ----
  let airMetrics: { combined: ModelMetrics } | null = null;
  if (fs.existsSync(AIR_METRICS_PATH)) {
    try {
      const content = fs.readFileSync(AIR_METRICS_PATH, 'utf-8');
      airMetrics = parseAirMetrics(content);
    } catch (err) {
      errors.push(`Gagal parse metrik air: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  } else {
    errors.push(`File metrik air tidak ditemukan: ${AIR_METRICS_PATH}`);
  }

  // ---- Fallback jika salah satu tidak ada ----
  const defaultMetrics: ModelMetrics = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1_score: 0,
    confusion_matrix: { matrix: [[0, 0], [0, 0]], labels: ['Kelas 0', 'Kelas 1'] },
  };

  const responseData: MetricsData = {
    model_lahan: lahanMetrics ?? defaultMetrics,
    model_air_2024: airMetrics?.combined ?? defaultMetrics, // backward compat key
    model_air_2025: airMetrics?.combined ?? defaultMetrics, // sama karena model gabungan
    model_air_combined: airMetrics?.combined ?? defaultMetrics,
  };

  return NextResponse.json(
    {
      data: responseData,
      warnings: errors.length > 0 ? errors : undefined,
      generated_at: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
      },
    }
  );
}
