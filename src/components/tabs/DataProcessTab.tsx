'use client';
// ============================================================
// DataProcessTab — Tab 2: Transparansi Data & Metodologi
// ============================================================

export default function DataProcessTab() {
  const spectralFeatures = [
    { tag: 'Band 2', desc: 'Blue (490nm)' },
    { tag: 'Band 3', desc: 'Green (560nm)' },
    { tag: 'Band 4', desc: 'Red (665nm)' },
    { tag: 'Band 8', desc: 'NIR (842nm)' },
    { tag: 'NDVI', desc: 'Normalized Difference Vegetation Index' },
    { tag: 'BSI', desc: 'Bare Soil Index' },
    { tag: 'NDWI', desc: 'Normalized Difference Water Index' },
    { tag: 'MNDWI', desc: 'Modified NDWI' },
  ];

  return (
    <div className="space-y-4">
      {/* Sumber Data */}
      <Section title="Sumber Data Satelit">
        <InfoRow label="Sensor" value="Sentinel-2 MSI (ESA Copernicus)" />
        <InfoRow label="Resolusi Spasial" value="10 m/piksel" />
        <InfoRow label="Periode 2024" value="Juni – Agustus 2024" />
        <InfoRow label="Periode 2025" value="Juni – Agustus 2025" />
        <InfoRow label="Lokasi Fokus" value="Kec. Bahodopi & Kawasan IMIP" />
      </Section>

      {/* Algoritma */}
      <Section title="Model Machine Learning">
        <InfoRow label="Algoritma (Lahan)" value="Random Forest Classifier" />
        <InfoRow label="Algoritma (Perairan)" value="Random Forest Classifier" />
        <InfoRow label="Metode Sampling" value="Stratified Random (Ground Truth)" />
        <InfoRow label="Validasi" value="Train/Test Split 80/20" />
        <InfoRow label="Optimasi" value="GridSearchCV (Best Params)" />
      </Section>

      {/* Fitur Spektral */}
      <Section title="Fitur Spektral yang Digunakan">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {spectralFeatures.map((f) => (
            <div key={f.tag} className="group relative">
              <span className="
                px-2 py-0.5 rounded-md text-[11px] font-mono font-medium
                bg-slate-800 text-cyan-400 border border-cyan-900/50
                cursor-default
              ">
                [{f.tag}]
              </span>
              <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10
                hidden group-hover:block
                px-2 py-1 rounded text-[10px] text-slate-200
                bg-slate-800 border border-slate-700 shadow-xl
                whitespace-nowrap
              ">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Alur Proses */}
      <Section title="Alur Pemrosesan">
        <ol className="space-y-2 mt-1">
          {[
            'Akuisisi citra Sentinel-2 via Google Earth Engine',
            'Preprocessing: cloud masking, komposit median',
            'Perhitungan indeks spektral (NDVI, BSI, NDWI, MNDWI)',
            'Labeling ground truth & sampling stratifikasi',
            'Training Random Forest + optimasi hyperparameter',
            'Prediksi kelas per piksel → vektor GeoJSON',
            'Deteksi perubahan: diferensiasi 2024 vs 2025',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="
                flex-shrink-0 w-4 h-4 rounded-full text-[9px] font-bold
                bg-orange-500/20 text-orange-400 flex items-center justify-center mt-0.5
              ">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 text-xs">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-slate-300 text-right">{value}</span>
    </div>
  );
}
