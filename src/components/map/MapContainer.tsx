'use client';
// ============================================================
// MapContainer — Peta 3D Premium WebGIS GeoAI Morowali
// Stack: react-map-gl (MapLibre GL JS v5)
// Fitur: 3D sky layer, glow outlines, pitch/bearing, 2D↔3D toggle
// ============================================================

import React, { useCallback, useRef, useEffect } from 'react';
import Map, {
  Source,
  Layer,
  NavigationControl,
  ScaleControl,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useMapStore, useLayers, useHoverInfo } from '@/store/mapStore';
import { LAYER_CONFIGS, LAYER_RENDER_ORDER, type LayerId } from '@/types/geospatial';
import { useGeoJSONLayer } from '@/hooks/useGeoJSONLayer';
import HoverTooltip from './HoverTooltip';
import FeaturePopup from './FeaturePopup';

// ---- Koordinat awal: Kabupaten Morowali ----
const INITIAL_VIEW_3D = {
  longitude: 121.85,
  latitude: -2.82,
  zoom: 9.5,
  pitch: 48,
  bearing: -12,
};

const INITIAL_VIEW_2D = {
  longitude: 121.85,
  latitude: -2.82,
  zoom: 9.5,
  pitch: 0,
  bearing: 0,
};

// ---- Basemap: CartoDB Dark Matter (Open, No Key) ----
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const layers = useLayers();
  const hoverInfo = useHoverInfo();
  const {
    setSelectedFeature, setHoverInfo, setCursorCoords,
    is3D, layerOpacity,
  } = useMapStore();

  // ---- Load setiap layer GeoJSON ----
  const aoiData              = useGeoJSONLayer('aoi',               layers.aoi);
  const gainLahanData        = useGeoJSONLayer('gain_lahan',        layers.gain_lahan);
  const lossLahanData        = useGeoJSONLayer('loss_lahan',        layers.loss_lahan);
  const gainAirData          = useGeoJSONLayer('gain_air',          layers.gain_air);
  const lossAirData          = useGeoJSONLayer('loss_air',          layers.loss_air);
  // Layer per-tahun
  const targetLahan2024Data  = useGeoJSONLayer('target_lahan_2024', layers.target_lahan_2024);
  const targetLahan2025Data  = useGeoJSONLayer('target_lahan_2025', layers.target_lahan_2025);
  const targetAir2024Data    = useGeoJSONLayer('target_air_2024',   layers.target_air_2024);
  const targetAir2025Data    = useGeoJSONLayer('target_air_2025',   layers.target_air_2025);

  const layerDataMap = {
    aoi: aoiData,
    gain_lahan: gainLahanData,
    loss_lahan: lossLahanData,
    gain_air: gainAirData,
    loss_air: lossAirData,
    target_lahan_2024: targetLahan2024Data,
    target_lahan_2025: targetLahan2025Data,
    target_air_2024: targetAir2024Data,
    target_air_2025: targetAir2025Data,
  };

  // ---- 3D/2D transition ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = is3D ? INITIAL_VIEW_3D : INITIAL_VIEW_2D;
    map.easeTo({
      pitch: target.pitch,
      bearing: target.bearing,
      duration: 1200,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    });
  }, [is3D]);

  // ---- Klik polygon ----
  const onMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const features = event.features;
      if (features && features.length > 0) {
        const f = features[0];
        setSelectedFeature({
          type: 'Feature',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          properties: f.properties as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          geometry: f.geometry as any,
          id: f.id,
        });
      } else {
        setSelectedFeature(null);
      }
    },
    [setSelectedFeature]
  );

  // ---- Hover tooltip + cursor coords ----
  const onMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      // Update koordinat cursor (dari event mouse, selalu tersedia)
      setCursorCoords({ lng: event.lngLat.lng, lat: event.lngLat.lat });

      const features = event.features;
      if (features && features.length > 0) {
        setHoverInfo({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          feature: { type: 'Feature', properties: features[0].properties as any, geometry: features[0].geometry as any },
          x: event.point.x,
          y: event.point.y,
        });
      } else {
        setHoverInfo(null);
      }
    },
    [setHoverInfo, setCursorCoords]
  );

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null);
    setCursorCoords(null);
  }, [setHoverInfo, setCursorCoords]);

  // ---- Interactive layer IDs ----
  const interactiveLayerIds = LAYER_RENDER_ORDER.filter(
    (id) => id !== 'aoi' && layers[id]
  ).map((id) => `${id}-fill`);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_3D}
        mapStyle={BASEMAP_STYLE}
        interactiveLayerIds={interactiveLayerIds}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        cursor={hoverInfo ? 'pointer' : 'grab'}
      >
        {/* Sky layer diinisialisasi via mapRef.current.addLayer() di useEffect
            untuk menghindari konflik type dengan react-map-gl Layer component */}
        {/* ---- Render setiap layer GeoJSON ---- */}
        {LAYER_RENDER_ORDER.map((layerId) => {
          const config = LAYER_CONFIGS[layerId];
          const { data, loading, error } = layerDataMap[layerId];
          if (!layers[layerId] || !data || loading || error) return null;

          const isAoi = layerId === 'aoi';
          const opacity = layerOpacity[layerId] ?? config.opacity;

          return (
            <Source
              key={layerId}
              id={layerId}
              type="geojson"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={data as any}
              tolerance={isAoi ? 0.375 : 1.5}
            >
              {/* Fill layer */}
              <Layer
                id={`${layerId}-fill`}
                type="fill"
                paint={{
                  'fill-color': config.color,
                  'fill-opacity': isAoi ? 0.06 : opacity,
                }}
              />
              {/* Outline/stroke */}
              <Layer
                id={`${layerId}-outline`}
                type="line"
                paint={{
                  'line-color': config.outlineColor,
                  'line-width': isAoi ? 1.5 : 0.8,
                  'line-opacity': isAoi ? 0.5 : 0.85,
                  ...(isAoi ? { 'line-dasharray': [5, 4] } : {}),
                }}
              />
              {/* Glow outline (hanya non-AOI) */}
              {!isAoi && (
                <Layer
                  id={`${layerId}-glow`}
                  type="line"
                  paint={{
                    'line-color': config.outlineColor,
                    'line-width': 3,
                    'line-opacity': 0.15,
                    'line-blur': 4,
                  }}
                />
              )}
            </Source>
          );
        })}

        {/* ---- Navigation Controls ---- */}
        <NavigationControl position="bottom-right" showCompass={true} visualizePitch={true} />
        <ScaleControl position="bottom-left" unit="metric" />
      </Map>

      {/* ---- Hover Tooltip ---- */}
      {hoverInfo && <HoverTooltip />}

      {/* ---- Click Popup ---- */}
      <FeaturePopup />

      {/* ---- Loading overlay ---- */}
      <LayerLoadingIndicator layerDataMap={layerDataMap} layers={layers} />
    </div>
  );
}

// ---- Sub-komponen: Loading indicator ----
function LayerLoadingIndicator({
  layerDataMap,
  layers,
}: {
  layerDataMap: Record<LayerId, { data: unknown; loading: boolean; error: string | null }>;
  layers: Record<LayerId, boolean>;
}) {
  const loadingLayers = LAYER_RENDER_ORDER.filter(
    (id) => layers[id] && layerDataMap[id].loading
  );
  if (loadingLayers.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
      {loadingLayers.map((id) => (
        <div
          key={id}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium glass-panel"
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-slate-300">Memuat {LAYER_CONFIGS[id].label}...</span>
        </div>
      ))}
    </div>
  );
}
