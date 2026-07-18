'use client';
// ============================================================
// MetricsGauge — SVG Gauge Premium dengan gradient + glow
// ============================================================

interface Props {
  label: string;
  value: number; // 0 - 1
  color: string;
  glowColor?: string;
}

export default function MetricsGauge({ label, value, color, glowColor }: Props) {
  const percentage = Math.round(value * 100);
  const glow = glowColor ?? color;

  // SVG arc params
  const size     = 96;
  const cx       = size / 2;
  const cy       = size / 2 + 6;
  const r        = 34;
  const startDeg = -215;
  const totalArc = 250; // derajat

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Background arc
  const bgS  = toRad(startDeg);
  const bgE  = toRad(startDeg + totalArc);
  const bgX1 = cx + r * Math.cos(bgS);
  const bgY1 = cy + r * Math.sin(bgS);
  const bgX2 = cx + r * Math.cos(bgE);
  const bgY2 = cy + r * Math.sin(bgE);

  // Value arc
  const arcDeg = totalArc * Math.min(percentage / 100, 1);
  const vEnd   = toRad(startDeg + arcDeg);
  const vX2    = cx + r * Math.cos(vEnd);
  const vY2    = cy + r * Math.sin(vEnd);
  const vLarge = arcDeg > 180 ? 1 : 0;

  // Gradient id (unique per instance)
  const gradId = `gauge-grad-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col items-center group">
      <svg
        width={size}
        height={size + 4}
        viewBox={`0 0 ${size} ${size + 4}`}
        className="overflow-visible"
        aria-label={`${label}: ${percentage}%`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${gradId}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track (background arc) */}
        <path
          d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={7}
          strokeLinecap="round"
        />

        {/* Inner dark track */}
        <path
          d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke="#0f172a"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Progress arc — glow layer */}
        {percentage > 0 && (
          <path
            d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 ${vLarge} 1 ${vX2} ${vY2}`}
            fill="none"
            stroke={glow}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.2}
            filter={`url(#glow-${gradId})`}
            className="gauge-arc"
          />
        )}

        {/* Progress arc — main */}
        {percentage > 0 && (
          <path
            d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 ${vLarge} 1 ${vX2} ${vY2}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={7}
            strokeLinecap="round"
            className="gauge-arc"
          />
        )}

        {/* End dot (cap) */}
        {percentage > 2 && (
          <circle
            cx={vX2}
            cy={vY2}
            r={4}
            fill={color}
            filter={`url(#glow-${gradId})`}
          />
        )}

        {/* Percentage text — center */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f1f5f9"
          fontSize="15"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="-0.5"
        >
          {percentage}%
        </text>

        {/* Label — below */}
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize="8"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="0.5"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
