'use client';
// ============================================================
// useGeoJSONLayerStats — Menghitung statistik dari cached GeoJSON
// ============================================================
// Mendukung dua jenis GeoJSON:
//   - Lahan: memiliki field 'area_ha' eksplisit
//   - Air: hanya punya 'value' (kelas raster) → luas dihitung dari geometri

import { useMemo } from 'react';
import { useMapStore } from '@/store/mapStore';
import { getFeatureAreaHa } from '@/lib/geoUtils';
import type { LayerId } from '@/types/geospatial';

export function useGeoJSONLayerStats(layerId: LayerId) {
  const geoJsonCache = useMapStore((s) => s.geoJsonCache);
  const data = geoJsonCache[layerId];

  return useMemo(() => {
    if (!data?.features?.length) {
      return { featureCount: 0, totalLuas: 0, avgConfidence: null };
    }

    let totalLuas = 0;
    let totalConf = 0;
    let confCount = 0;

    for (const feature of data.features) {
      // getFeatureAreaHa: pakai area_ha/luas_ha jika ada, otherwise hitung dari geometri
      totalLuas += getFeatureAreaHa(feature as Parameters<typeof getFeatureAreaHa>[0]);

      const conf = feature.properties?.confidence_score;
      if (typeof conf === 'number') {
        totalConf += conf;
        confCount++;
      }
    }

    return {
      featureCount: data.features.length,
      totalLuas,
      avgConfidence: confCount > 0 ? totalConf / confCount : null,
    };
  }, [data]);
}

// ---- Hook agregat: statistik semua layer aktif ----
export function useAllLayerStats() {
  const geoJsonCache = useMapStore((s) => s.geoJsonCache);
  const layers = useMapStore((s) => s.layers);

  return useMemo(() => {
    const layerIds = Object.keys(layers) as LayerId[];
    const result: Partial<Record<LayerId, { featureCount: number; totalLuas: number }>> = {};

    for (const id of layerIds) {
      if (!layers[id]) continue;
      const data = geoJsonCache[id];
      if (!data?.features?.length) continue;

      let totalLuas = 0;
      for (const feature of data.features) {
        totalLuas += getFeatureAreaHa(feature as Parameters<typeof getFeatureAreaHa>[0]);
      }
      result[id] = { featureCount: data.features.length, totalLuas };
    }

    return result;
  }, [geoJsonCache, layers]);
}
