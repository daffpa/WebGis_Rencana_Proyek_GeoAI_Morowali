'use client';
// ============================================================
// useGeoJSONLayer — Custom hook untuk fetch GeoJSON per layer
// Menggunakan cache dari Zustand + fetch asinkronus
// ============================================================

import { useEffect, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import type { LayerId, GeoJSONFeatureCollection } from '@/types/geospatial';
import { LAYER_CONFIGS } from '@/types/geospatial';

interface UseGeoJSONLayerResult {
  data: GeoJSONFeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export function useGeoJSONLayer(
  layerId: LayerId,
  enabled: boolean
): UseGeoJSONLayerResult {
  const {
    geoJsonCache,
    loadingLayers,
    errorLayers,
    setGeoJsonData,
    setLayerLoading,
    setLayerError,
  } = useMapStore();

  const data = geoJsonCache[layerId] ?? null;
  const loading = loadingLayers[layerId] ?? false;
  const error = errorLayers[layerId] ?? null;

  // Gunakan ref untuk mencegah double-fetch (terutama React dev mode)
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Jangan fetch jika: layer tidak aktif, sudah ada di cache, atau sedang fetch
    if (!enabled || data !== null || fetchingRef.current) return;

    const controller = new AbortController();
    fetchingRef.current = true;

    const fetchData = async () => {
      setLayerLoading(layerId, true);
      setLayerError(layerId, null);

      try {
        const url = LAYER_CONFIGS[layerId].apiPath;
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            errBody.error ?? `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const geojson: GeoJSONFeatureCollection = await response.json();

        // Validasi minimal: harus ada 'features' array
        if (!geojson.features || !Array.isArray(geojson.features)) {
          throw new Error(
            `GeoJSON tidak valid: properti "features" tidak ditemukan.`
          );
        }

        setGeoJsonData(layerId, geojson);
        setLayerError(layerId, null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const msg =
          err instanceof Error ? err.message : 'Gagal memuat data GeoJSON.';
        setLayerError(layerId, msg);
        console.error(`[useGeoJSONLayer] Layer "${layerId}" error:`, msg);
      } finally {
        setLayerLoading(layerId, false);
        fetchingRef.current = false;
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerId, enabled, data]);
  // CATATAN: hanya 3 dependency yang relevan.
  // setter Zustand stabil (tidak berubah referensi) sehingga tidak perlu di-list.
  // 'loading' sengaja tidak di-list karena menyebabkan infinite re-render.

  return { data, loading, error };
}
