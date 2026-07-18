'use client';
// ============================================================
// ConfusionMatrixChart — Heatmap tabel HTML murni (tanpa library eksternal)
// Mengganti echarts-for-react untuk menghindari infinite render loop
// ============================================================

interface Props {
  matrix: number[][];
  labels: string[];
}

export default function ConfusionMatrixChart({ matrix, labels }: Props) {
  const maxVal = Math.max(...matrix.flat(), 1);

  // Interpolasi warna: 0 → slate-900, max → orange-500
  const getColor = (val: number) => {
    const ratio = val / maxVal;
    if (ratio < 0.25) return { bg: '#0f172a', text: '#475569' };
    if (ratio < 0.5)  return { bg: '#1d4ed8', text: '#dbeafe' };
    if (ratio < 0.75) return { bg: '#c2410c', text: '#fed7aa' };
    return { bg: '#f97316', text: '#fff' };
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Label axis */}
      <div className="flex flex-col gap-1">
        {/* Header: Prediksi */}
        <div className="flex">
          {/* spacer untuk label Aktual */}
          <div className="w-24 flex-shrink-0" />
          <div className="flex-1 text-center text-[9px] text-slate-500 mb-1 font-medium uppercase tracking-wider">
            Prediksi
          </div>
        </div>

        {/* Sub-header label kolom */}
        <div className="flex items-center">
          <div className="w-24 flex-shrink-0" />
          {labels.map((lbl) => (
            <div
              key={lbl}
              className="flex-1 text-center text-[9px] text-slate-400 truncate px-1 mb-1"
              title={lbl}
            >
              {lbl.length > 10 ? lbl.slice(0, 10) + '…' : lbl}
            </div>
          ))}
        </div>

        {/* Rows */}
        {matrix.map((row, i) => (
          <div key={i} className="flex items-center gap-1">
            {/* Label baris (Aktual) */}
            <div
              className="w-24 flex-shrink-0 text-[9px] text-slate-400 text-right pr-2 truncate"
              title={labels[i]}
            >
              {i === 0 && (
                <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">
                  Aktual
                </span>
              )}
              {labels[i]?.length > 10 ? labels[i].slice(0, 10) + '…' : labels[i]}
            </div>

            {/* Sel-sel matrix */}
            {row.map((val, j) => {
              const { bg, text } = getColor(val);
              const isDiag = i === j;
              return (
                <div
                  key={j}
                  className="flex-1 aspect-square flex items-center justify-center rounded-md font-bold text-sm transition-transform hover:scale-105"
                  style={{
                    backgroundColor: bg,
                    color: text,
                    border: isDiag ? '2px solid #f9731680' : '2px solid #1e293b',
                    minHeight: '48px',
                  }}
                  title={`Aktual: ${labels[i]}\nPrediksi: ${labels[j]}\nJumlah: ${val}`}
                >
                  {val}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[9px] text-slate-600">Rendah</span>
        <div className="flex gap-0.5">
          {['#0f172a', '#1d4ed8', '#c2410c', '#f97316'].map((c) => (
            <div key={c} className="w-4 h-2 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-[9px] text-slate-600">Tinggi</span>
      </div>
    </div>
  );
}
