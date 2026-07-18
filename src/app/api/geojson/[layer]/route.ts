// ============================================================
// API Route: /api/geojson/[layer]
// Menjembatani data GeoJSON dari folder workspace ke frontend.
// Dengan gzip compression untuk performa loading yang lebih cepat.
// Path: src/app/api/geojson/[layer]/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

// Mapping layer ID → path file GeoJSON aktual di workspace
// Sesuai audit struktur folder tanggal 2026-07-13
const LAYER_FILE_MAP: Record<string, string> = {
  aoi: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_1_Data_Engineer',
    'aoi_morowali.geojson'
  ),
  gain_lahan: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_2_ML_Lahan_Terbuka',
    '04_GeoJSON_WebGIS',
    'gain.geojson'
  ),
  loss_lahan: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_2_ML_Lahan_Terbuka',
    '04_GeoJSON_WebGIS',
    'loss.geojson'
  ),
  gain_air: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_3_ML_Perairan',
    '04_GeoJSON_WebGIS',
    'gain_air.geojson'
  ),
  loss_air: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_3_ML_Perairan',
    '04_GeoJSON_WebGIS',
    'loss_air.geojson'
  ),
  // ---- Layer klasifikasi per-tahun ----
  target_lahan_2024: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_2_ML_Lahan_Terbuka',
    '04_GeoJSON_WebGIS',
    'target_2024.geojson'
  ),
  target_lahan_2025: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_2_ML_Lahan_Terbuka',
    '04_GeoJSON_WebGIS',
    'target_2025.geojson'
  ),
  target_air_2024: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_3_ML_Perairan',
    '04_GeoJSON_WebGIS',
    'target_air_2024.geojson'
  ),
  target_air_2025: path.join(
    process.cwd(),
    '..',
    'WORKSPACE_ANGGOTA_3_ML_Perairan',
    '04_GeoJSON_WebGIS',
    'target_air_2025.geojson'
  ),
};

// Threshold: file di atas 500KB akan dikurangi presisi koordinatnya
const LARGE_FILE_THRESHOLD = 500 * 1024; // 500 KB

/**
 * Kurangi presisi koordinat dari 15 desimal ke 5 desimal (~1m akurasi di ekuator).
 * Untuk file kecamatan/kabupaten, 5 desimal sudah lebih dari cukup untuk visualisasi web.
 * Pengurangan dari 15→5 desimal mengurangi ukuran teks ~40-50% sebelum gzip.
 */
function reducePrecision(geojsonText: string): string {
  return geojsonText.replace(/(-?\d+\.\d{6,})/g, (match) => {
    return parseFloat(parseFloat(match).toFixed(5)).toString();
  });
}

/**
 * Simplifikasi agresif untuk file >10MB: kurangi ke 4 desimal (~10m akurasi).
 * Masih sangat layak untuk visualisasi peta web pada zoom 10-14.
 */
function reducePrecisionAggressive(geojsonText: string): string {
  return geojsonText.replace(/(-?\d+\.\d{5,})/g, (match) => {
    return parseFloat(parseFloat(match).toFixed(4)).toString();
  });
}

// ============================================================
// Hitung luas ring polygon (Shoelace / Gauss area) dalam m²
// Input: array [lon, lat] dalam derajat WGS84
// ============================================================
const EARTH_RADIUS_M = 6_371_000;
const M2_PER_HA = 10_000;

function ringAreaM2(ring: number[][]): number {
  if (ring.length < 3) return 0;
  let total = 0;
  const n = ring.length;
  for (let i = 0; i < n - 1; i++) {
    const phi1 = (ring[i][1] * Math.PI) / 180;
    const phi2 = (ring[i + 1][1] * Math.PI) / 180;
    const lambda1 = (ring[i][0] * Math.PI) / 180;
    const lambda2 = (ring[i + 1][0] * Math.PI) / 180;
    total += (lambda2 - lambda1) * (2 + Math.sin(phi1) + Math.sin(phi2));
  }
  return (Math.abs(total) * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

function featureAreaHa(geometry: { type: string; coordinates: unknown }): number {
  try {
    if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates as number[][][];
      let area = ringAreaM2(rings[0]);
      for (let i = 1; i < rings.length; i++) area -= ringAreaM2(rings[i]);
      return Math.max(0, area) / M2_PER_HA;
    }
    if (geometry.type === 'MultiPolygon') {
      let total = 0;
      for (const rings of geometry.coordinates as number[][][][]) {
        let area = ringAreaM2(rings[0]);
        for (let i = 1; i < rings.length; i++) area -= ringAreaM2(rings[i]);
        total += Math.max(0, area);
      }
      return total / M2_PER_HA;
    }
  } catch { /* geometri tidak valid */ }
  return 0;
}

/**
 * Enrich: tambahkan field area_ha ke setiap feature yang belum memilikinya.
 * Digunakan untuk GeoJSON air (hanya punya 'value') agar InsightTab
 * bisa menampilkan luas tanpa harus komputasi di browser.
 *
 * Optimasi untuk file besar: Sentinel-2 GeoJSON tiap feature adalah
 * satu pixel 10m×10m = 0.01 ha. Kita deteksi pola ini dan skip
 * perhitungan Shoelace yang mahal.
 */
function enrichAreaHa(geojsonText: string, isSentinel2Pixel = false): string {
  const geojson = JSON.parse(geojsonText);
  if (!Array.isArray(geojson.features)) return geojsonText;

  const SENTINEL2_PIXEL_HA = 0.01; // 10m × 10m = 100m² = 0.01 ha

  for (const feature of geojson.features) {
    if (feature.properties &&
        feature.properties.area_ha == null &&
        feature.properties.luas_ha == null &&
        feature.geometry) {
      if (isSentinel2Pixel) {
        // Estimasi cepat: setiap polygon adalah 1 pixel Sentinel-2
        feature.properties.area_ha = SENTINEL2_PIXEL_HA;
      } else {
        feature.properties.area_ha = featureAreaHa(feature.geometry);
      }
    }
  }
  return JSON.stringify(geojson);
}

// Layer air berasal dari pixel raster Sentinel-2 (resolusi 10m × 10m)
// Setiap feature polygon = 1 pixel = 0.01 ha
const SENTINEL2_LAYERS = new Set(['gain_air', 'loss_air']);


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layer: string }> }
) {
  const { layer } = await params;

  // Validasi: layer ID harus dikenal
  if (!LAYER_FILE_MAP[layer]) {
    return NextResponse.json(
      {
        error: 'Layer tidak dikenal.',
        valid_layers: Object.keys(LAYER_FILE_MAP),
      },
      { status: 400 }
    );
  }

  const filePath = LAYER_FILE_MAP[layer];

  // Validasi: file harus ada di disk
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      {
        error: `File GeoJSON untuk layer "${layer}" belum tersedia.`,
        path_expected: filePath,
        hint: 'Pastikan file hasil ML sudah ditempatkan di folder yang benar.',
      },
      { status: 404 }
    );
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.byteLength;
    const fileSizeMB = fileSize / (1024 * 1024);

    // Strategi bertingkat:
    // - ≤500KB : enrich area_ha + gzip lv6
    // - 500KB–10MB: reduce presisi 5 desimal + enrich + gzip lv7
    // - >10MB  : reduce presisi 4 desimal + enrich (Sentinel-2 pixel) + gzip lv9
    let dataToCompress: Buffer;
    let compressionLevel = 6;
    // Layer air (gain_air/loss_air) menggunakan estimasi pixel Sentinel-2
    // agar proses enrichment tidak memakan waktu lama pada 40-100k fitur
    const isSentinel2 = SENTINEL2_LAYERS.has(layer);

    if (fileSize <= LARGE_FILE_THRESHOLD) {
      const rawText = fileBuffer.toString('utf-8');
      const enriched = enrichAreaHa(rawText, isSentinel2);
      dataToCompress = Buffer.from(enriched, 'utf-8');
    } else if (fileSizeMB > 10) {
      const rawText = fileBuffer.toString('utf-8');
      const enriched = enrichAreaHa(rawText, isSentinel2);
      const reducedText = reducePrecisionAggressive(enriched);
      dataToCompress = Buffer.from(reducedText, 'utf-8');
      compressionLevel = 9;
    } else {
      const rawText = fileBuffer.toString('utf-8');
      const enriched = enrichAreaHa(rawText, isSentinel2);
      const reducedText = reducePrecision(enriched);
      dataToCompress = Buffer.from(reducedText, 'utf-8');
      compressionLevel = 7;
    }

    // Gzip compress
    const compressed = zlib.gzipSync(dataToCompress, { level: compressionLevel });

    // Cek apakah client mendukung gzip
    const acceptEncoding = request.headers.get('accept-encoding') ?? '';
    const supportsGzip = acceptEncoding.includes('gzip');

    if (supportsGzip) {
      return new NextResponse(new Uint8Array(compressed), {
        status: 200,
        headers: {
          'Content-Type': 'application/geo+json; charset=utf-8',
          'Content-Encoding': 'gzip',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Layer-Id': layer,
          'X-Original-Size': String(fileSize),
          'X-Compressed-Size': String(compressed.byteLength),
        },
      });
    } else {
      // Fallback untuk client yang tidak support gzip (sangat jarang)
      return new NextResponse(new Uint8Array(dataToCompress), {
        status: 200,
        headers: {
          'Content-Type': 'application/geo+json; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Layer-Id': layer,
          'X-File-Size': String(fileSize),
        },
      });
    }
  } catch (err) {
    console.error(`[GeoJSON API] Gagal membaca layer "${layer}":`, err);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat membaca file GeoJSON.',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
