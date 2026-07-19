// ============================================================
// WebGIS GeoAI Morowali — Zustand Global State Store
// Mengelola: tab aktif, visibilitas layer, feature terpilih
// ============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ActiveTab,
  LayerId,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  MetricsData,
} from '@/types/geospatial';

// ---- Sub-state interfaces ----

interface LayerVisibility {
  aoi: boolean;
  gain_lahan: boolean;
  loss_lahan: boolean;
  gain_air: boolean;
  loss_air: boolean;
  // Layer klasifikasi per-tahun
  target_lahan_2024: boolean;
  target_lahan_2025: boolean;
  target_air_2024: boolean;
  target_air_2025: boolean;
}

type GeoJSONCache = Partial<Record<LayerId, GeoJSONFeatureCollection>>;
type LoadingState = Partial<Record<LayerId, boolean>>;
type ErrorState = Partial<Record<LayerId, string | null>>;

interface HoverInfo {
  feature: GeoJSONFeature;
  x: number;
  y: number;
}

// ---- Full store interface ----

interface MapStore {
  // Tab navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Layer visibility toggles
  layers: LayerVisibility;
  toggleLayer: (layerId: LayerId) => void;
  setLayerVisibility: (layerId: LayerId, visible: boolean) => void;

  // GeoJSON data cache (keyed by layer ID)
  geoJsonCache: GeoJSONCache;
  setGeoJsonData: (layerId: LayerId, data: GeoJSONFeatureCollection) => void;

  // Loading & error states per layer
  loadingLayers: LoadingState;
  errorLayers: ErrorState;
  setLayerLoading: (layerId: LayerId, loading: boolean) => void;
  setLayerError: (layerId: LayerId, error: string | null) => void;

  // Selected feature (click popup)
  selectedFeature: GeoJSONFeature | null;
  setSelectedFeature: (feature: GeoJSONFeature | null) => void;

  // Hover tooltip info
  hoverInfo: HoverInfo | null;
  setHoverInfo: (info: HoverInfo | null) => void;

  // Metrics data (dari API /api/metrics)
  metricsData: MetricsData | null;
  metricsLoading: boolean;
  metricsError: string | null;
  setMetricsData: (data: MetricsData) => void;
  setMetricsLoading: (loading: boolean) => void;
  setMetricsError: (error: string | null) => void;

  // Sidebar collapse state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // 3D mode toggle
  is3D: boolean;
  toggle3D: () => void;

  // Active year for timeline (2024 or 2025)
  activeYear: 2024 | 2025;
  setActiveYear: (year: 2024 | 2025) => void;

  // Live cursor coordinates from map hover
  cursorCoords: { lng: number; lat: number } | null;
  setCursorCoords: (coords: { lng: number; lat: number } | null) => void;

  // Layer opacity per layer (0-1)
  layerOpacity: Record<string, number>;
  setLayerOpacity: (layerId: string, opacity: number) => void;

  // Theme (dark | light)
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

// ---- Store implementation ----

export const useMapStore = create<MapStore>()(
  devtools(
    (set) => ({
      // ---- Tab state ----
      activeTab: 'map',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ---- Layer visibility ----
      layers: {
        aoi: true,
        gain_lahan: false,
        loss_lahan: false,
        gain_air: false,
        loss_air: false,
        // Per-tahun: default 2025 aktif
        target_lahan_2024: false,
        target_lahan_2025: true,
        target_air_2024: false,
        target_air_2025: false,
      },
      toggleLayer: (layerId) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [layerId]: !state.layers[layerId as keyof typeof state.layers],
          },
        })),
      setLayerVisibility: (layerId, visible) =>
        set((state) => ({
          layers: { ...state.layers, [layerId]: visible },
        })),

      // ---- GeoJSON cache ----
      geoJsonCache: {},
      setGeoJsonData: (layerId, data) =>
        set((state) => ({
          geoJsonCache: { ...state.geoJsonCache, [layerId]: data },
        })),

      // ---- Loading/error states ----
      loadingLayers: {},
      errorLayers: {},
      setLayerLoading: (layerId, loading) =>
        set((state) => ({
          loadingLayers: { ...state.loadingLayers, [layerId]: loading },
        })),
      setLayerError: (layerId, error) =>
        set((state) => ({
          errorLayers: { ...state.errorLayers, [layerId]: error },
        })),

      // ---- Feature selection ----
      selectedFeature: null,
      setSelectedFeature: (feature) => set({ selectedFeature: feature }),

      // ---- Hover info ----
      hoverInfo: null,
      setHoverInfo: (info) => set({ hoverInfo: info }),

      // ---- Metrics ----
      metricsData: null,
      metricsLoading: false,
      metricsError: null,
      setMetricsData: (data) => set({ metricsData: data }),
      setMetricsLoading: (loading) => set({ metricsLoading: loading }),
      setMetricsError: (error) => set({ metricsError: error }),

      // ---- Sidebar ----
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ---- 3D Mode ----
      is3D: true,
      toggle3D: () => set((state) => ({ is3D: !state.is3D })),

      // ---- Active Year — mengubah layer lahan & air yang ditampilkan ----
      activeYear: 2025,
      setActiveYear: (year) =>
        set((state) => ({
          activeYear: year,
          layers: {
            ...state.layers,
            // Toggle lahan per-tahun
            target_lahan_2024: year === 2024,
            target_lahan_2025: year === 2025,
            // Toggle air per-tahun (hanya jika salah satu aktif)
            target_air_2024: year === 2024 && (state.layers.target_air_2024 || state.layers.target_air_2025),
            target_air_2025: year === 2025 && (state.layers.target_air_2024 || state.layers.target_air_2025),
          },
        })),

      // ---- Cursor Coords ----
      cursorCoords: null,
      setCursorCoords: (coords) => set({ cursorCoords: coords }),

      // ---- Layer Opacity ----
      layerOpacity: {
        aoi: 0.08,
        gain_lahan: 0.75,
        loss_lahan: 0.75,
        gain_air: 0.65,
        loss_air: 0.65,
      },
      setLayerOpacity: (layerId, opacity) =>
        set((state) => ({
          layerOpacity: { ...state.layerOpacity, [layerId]: opacity },
        })),

      // ---- Theme ----
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'GeoAI-Morowali-Store' }
  )
);

// ---- Selector hooks (memoized) ----
export const useActiveTab = () => useMapStore((s) => s.activeTab);
export const useLayers = () => useMapStore((s) => s.layers);
export const useHoverInfo = () => useMapStore((s) => s.hoverInfo);
export const useSelectedFeature = () => useMapStore((s) => s.selectedFeature);

// useMetrics dipecah jadi 3 selector TERPISAH.
// Jangan gabungkan dalam 1 object — setiap render akan membuat object baru
// yang menyebabkan Zustand trigger re-render → infinite loop!
export const useMetricsData = () => useMapStore((s) => s.metricsData);
export const useMetricsLoading = () => useMapStore((s) => s.metricsLoading);
export const useMetricsError = () => useMapStore((s) => s.metricsError);

// Hook gabungan yang aman — menggunakan shallow equality check bawaan Zustand v5
export const useMetrics = () => {
  const data = useMetricsData();
  const loading = useMetricsLoading();
  const error = useMetricsError();
  return { data, loading, error };
};
