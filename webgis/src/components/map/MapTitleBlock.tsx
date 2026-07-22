'use client';
import { useMapStore, useLayers } from '@/store/mapStore';

export default function MapTitleBlock() {
  const layers = useLayers();
  
  const isLahanActive = layers.target_lahan_2024 || layers.target_lahan_2025 || layers.gain_lahan || layers.loss_lahan;
  const isAirActive = layers.target_air_2024 || layers.target_air_2025 || layers.gain_air || layers.loss_air;

  let objek = 'Tidak ada layer aktif';
  if (isLahanActive && isAirActive) objek = 'Lahan & Air';
  else if (isLahanActive) objek = 'Lahan Terbuka';
  else if (isAirActive) objek = 'Kekeruhan Air';

  const { sidebarCollapsed } = useMapStore();

  return (
    <div 
      className="absolute top-4 z-40 glass-card rounded-lg p-3 shadow-lg pointer-events-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '16px' : '396px' }}
    >
      <h1 className="text-sm font-bold theme-text">Kabupaten Morowali</h1>
      <p className="text-[10px] theme-text-muted mt-0.5">
        Objek: <span className="font-semibold theme-text">{objek}</span> | Periode: <span className="font-semibold theme-text">2024–2025</span>
      </p>
    </div>
  );
}
