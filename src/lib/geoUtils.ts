// ============================================================
// geoUtils.ts — Utilitas perhitungan geometri GeoJSON
// ============================================================
// Menghitung luas polygon dari koordinat WGS84 (derajat)
// tanpa library eksternal.
//
// Metode: Shoelace formula (Gauss area) dalam koordinat Spherical
// dengan konversi ke meter menggunakan rata-rata latitude.
// Akurasi ±2% untuk polygon kecil (<10km²), cukup untuk keperluan
// analisis lahan tambang Morowali (polygon piksel Sentinel-2 ~10m×10m).
// ============================================================

const EARTH_RADIUS_M = 6_371_000; // meter
const M2_PER_HA = 10_000;

/**
 * Hitung luas polygon (ring) dalam meter persegi.
 * @param ring - Array koordinat [lon, lat] (WGS84 derajat)
 */
function ringAreaM2(ring: number[][]): number {
  if (ring.length < 3) return 0;

  let total = 0;
  const n = ring.length;

  for (let i = 0; i < n - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];

    // Konversi derajat → radian
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const lambda1 = (lon1 * Math.PI) / 180;
    const lambda2 = (lon2 * Math.PI) / 180;

    // Shoelace spherical
    total += (lambda2 - lambda1) * (2 + Math.sin(phi1) + Math.sin(phi2));
  }

  return Math.abs(total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

/**
 * Hitung luas polygon GeoJSON (dengan hole support) dalam hektare.
 * Mendukung tipe Polygon dan MultiPolygon.
 */
export function calcAreaHa(
  geometry: {
    type: string;
    coordinates: unknown;
  } | null | undefined
): number {
  if (!geometry) return 0;

  try {
    if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates as number[][][];
      if (!rings?.length) return 0;

      // Ring luar dikurangi ring dalam (hole)
      let area = ringAreaM2(rings[0]);
      for (let i = 1; i < rings.length; i++) {
        area -= ringAreaM2(rings[i]);
      }
      return Math.max(0, area) / M2_PER_HA;
    }

    if (geometry.type === 'MultiPolygon') {
      const polys = geometry.coordinates as number[][][][];
      let total = 0;
      for (const rings of polys) {
        let area = ringAreaM2(rings[0]);
        for (let i = 1; i < rings.length; i++) {
          area -= ringAreaM2(rings[i]);
        }
        total += Math.max(0, area);
      }
      return total / M2_PER_HA;
    }
  } catch {
    // Geometri tidak valid — kembalikan 0
  }

  return 0;
}

/**
 * Ambil luas area dari properties GeoJSON ATAU hitung dari geometri.
 * Priority:
 *   1. props.area_ha  (lahan GeoJSON — field eksplisit)
 *   2. props.luas_ha  (format lama)
 *   3. Hitung dari geometri (air GeoJSON — hanya punya 'value')
 */
export function getFeatureAreaHa(feature: {
  properties: Record<string, unknown> | null;
  geometry: { type: string; coordinates: unknown } | null;
}): number {
  const props = feature.properties;

  // Field eksplisit tersedia → pakai langsung
  if (typeof props?.area_ha === 'number' && props.area_ha > 0) {
    return props.area_ha;
  }
  if (typeof props?.luas_ha === 'number' && props.luas_ha > 0) {
    return props.luas_ha;
  }

  // Tidak ada field luas → hitung dari geometri
  return calcAreaHa(feature.geometry);
}
