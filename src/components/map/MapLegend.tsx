'use client';
import { useMapStore, useLayers } from '@/store/mapStore';
import { LAYER_CONFIGS } from '@/types/geospatial';

export default function MapLegend() {
  const layers = useLayers();
  
  const { sidebarCollapsed } = useMapStore();
  const activeLayerKeys = Object.keys(layers).filter(k => layers[k as keyof typeof layers] && k !== 'aoi');
  
  if (activeLayerKeys.length === 0) return null;

  return (
    <div 
      className="absolute bottom-6 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-lg pointer-events-auto min-w-[140px] transition-all duration-300"
      style={{ left: sidebarCollapsed ? '16px' : '396px' }}
    >
      <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-700/50 pb-1">
        Legenda
      </h3>
      <div className="space-y-1.5">
        {activeLayerKeys.map((key) => {
          const config = LAYER_CONFIGS[key as keyof typeof LAYER_CONFIGS];
          if (!config) return null;
          
          return (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-[2px] border flex-shrink-0" 
                style={{ 
                  backgroundColor: config.color,
                  borderColor: config.outlineColor
                }} 
              />
              <span className="text-[10px] text-slate-200">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
