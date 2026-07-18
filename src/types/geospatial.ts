// ============================================================
// WebGIS GeoAI Morowali — TypeScript Geospatial Type Contracts
// Semua interface wajib dipenuhi oleh data dari tim ML.
// ============================================================

/**
 * Properti wajib pada setiap feature GeoJSON dari pipeline ML.
 * Sistem akan menolak render jika properti ini tidak ada.
 */
export interface GeoJSONFeatureProperties {
  /** Label kategori dari klasifikasi ML */
  kategori?: string;
  /** Luas area dalam hektare (nama field aktual di GeoJSON output ML) */
  area_ha?: number;
  /** Alias luas_ha untuk kompatibilitas data lama */
  luas_ha?: number;
  /** Class integer dari output classifier (1=non-target, 2=target) */
  class?: number;
  /** Skor kepercayaan prediksi model (0-1) */
  confidence_score?: number;
  /** Tahun klasifikasi */
  tahun?: number;
  /** Properti tambahan yang mungkin ada */
  [key: string]: string | number | boolean | null | undefined;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: GeoJSONFeatureProperties;
  geometry: GeoJSONGeometry;
  id?: string | number;
}

export type GeoJSONGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection';

export interface GeoJSONGeometry {
  type: GeoJSONGeometryType;
  coordinates: unknown;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  /** Metadata tambahan (opsional) */
  metadata?: {
    total_features: number;
    total_luas_ha?: number;
    sumber?: string;
    tanggal_proses?: string;
  };
}

// ============================================================
// Layer identifiers — sesuai struktur folder data aktual
// ============================================================

export type LayerId =
  | 'aoi'
  | 'gain_lahan'
  | 'loss_lahan'
  | 'gain_air'
  | 'loss_air'
  | 'target_lahan_2024'
  | 'target_lahan_2025'
  | 'target_air_2024'
  | 'target_air_2025';

export interface LayerConfig {
  id: LayerId;
  label: string;
  color: string;
  outlineColor: string;
  opacity: number;
  apiPath: string;
  description: string;
}

export const LAYER_CONFIGS: Record<LayerId, LayerConfig> = {
  aoi: {
    id: 'aoi',
    label: 'Area of Interest (AOI)',
    color: '#94a3b8',
    outlineColor: '#cbd5e1',
    opacity: 0.15,
    apiPath: '/api/geojson/aoi',
    description: 'Batas wilayah kajian Kab. Morowali',
  },
  gain_lahan: {
    id: 'gain_lahan',
    label: 'Pertambahan Lahan Terbuka',
    color: '#f97316',
    outlineColor: '#fb923c',
    opacity: 0.75,
    apiPath: '/api/geojson/gain_lahan',
    description: 'Area ekspansi lahan tambang 2024→2025',
  },
  loss_lahan: {
    id: 'loss_lahan',
    label: 'Pengurangan Lahan Terbuka',
    color: '#22c55e',
    outlineColor: '#4ade80',
    opacity: 0.75,
    apiPath: '/api/geojson/loss_lahan',
    description: 'Area revegetasi/pemulihan lahan 2024→2025',
  },
  gain_air: {
    id: 'gain_air',
    label: 'Pertambahan Kekeruhan Air',
    color: '#06b6d4',
    outlineColor: '#22d3ee',
    opacity: 0.7,
    apiPath: '/api/geojson/gain_air',
    description: 'Perluasan zona keruh/sedimentasi 2024→2025',
  },
  loss_air: {
    id: 'loss_air',
    label: 'Pengurangan Kekeruhan Air',
    color: '#a78bfa',
    outlineColor: '#c4b5fd',
    opacity: 0.7,
    apiPath: '/api/geojson/loss_air',
    description: 'Pemulihan kualitas perairan 2024→2025',
  },
  // ---- Layer per-tahun: Klasifikasi aktual tiap tahun ----
  target_lahan_2024: {
    id: 'target_lahan_2024',
    label: 'Lahan Terbuka 2024',
    color: '#fb923c',
    outlineColor: '#f97316',
    opacity: 0.6,
    apiPath: '/api/geojson/target_lahan_2024',
    description: 'Klasifikasi lahan terbuka tahun 2024 (11.820 Ha)',
  },
  target_lahan_2025: {
    id: 'target_lahan_2025',
    label: 'Lahan Terbuka 2025',
    color: '#f97316',
    outlineColor: '#ea580c',
    opacity: 0.65,
    apiPath: '/api/geojson/target_lahan_2025',
    description: 'Klasifikasi lahan terbuka tahun 2025 (9.601 Ha)',
  },
  target_air_2024: {
    id: 'target_air_2024',
    label: 'Zona Keruh 2024',
    color: '#22d3ee',
    outlineColor: '#06b6d4',
    opacity: 0.6,
    apiPath: '/api/geojson/target_air_2024',
    description: 'Klasifikasi zona keruh/perairan 2024',
  },
  target_air_2025: {
    id: 'target_air_2025',
    label: 'Zona Keruh 2025',
    color: '#0ea5e9',
    outlineColor: '#38bdf8',
    opacity: 0.65,
    apiPath: '/api/geojson/target_air_2025',
    description: 'Klasifikasi zona keruh/perairan 2025',
  },
};

// ---- Layer render order (AOI di bawah, perubahan di atas) ----
export const LAYER_RENDER_ORDER: LayerId[] = [
  'aoi',
  'target_lahan_2024',
  'target_lahan_2025',
  'target_air_2024',
  'target_air_2025',
  'loss_lahan',
  'gain_lahan',
  'loss_air',
  'gain_air',
];


// Metrik Evaluasi ML
// ============================================================

export interface ConfusionMatrix {
  matrix: number[][];
  labels: string[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: ConfusionMatrix;
  best_params?: Record<string, string | number | boolean>;
  best_cv_f1?: number;
  false_positive?: number;
  false_negative?: number;
}

export interface MetricsData {
  model_lahan: ModelMetrics;
  model_air_2024: ModelMetrics;
  model_air_2025: ModelMetrics;
  // Model gabungan 2024+2025 dari modeling.ipynb baru
  model_air_combined?: ModelMetrics;
}

// ============================================================
// UI State Tabs
// ============================================================

export type ActiveTab = 'map' | 'data' | 'evaluasi' | 'insight';
