'use client';
// ============================================================
// MetricsGauge — SVG Gauge Premium dengan gradient + glow
// Theme-aware: track dan teks menggunakan CSS variable colors
// ============================================================

import { useMapStore } from '@/store/mapStore';

interface Props {
  label: string;
  value: number; // 0 - 1
  color: string;
  glowColor?: string;
}

export default function MetricsGauge({ label, value, color, glowColor }: Props) {
  const theme = useMapStore((s) => s.theme);
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

  // Theme-aware colors
  const trackColor = theme === 'light' ? '#e2e8f0' : '#1e293b';
  const trackInner = theme === 'light' ? '#f1f5f9' : '#0f172a';
  const textColor = theme === 'light' ? '#0f172a' : '#f1f5f9';
  const labelColor = theme === 'light' ? '#64748b' : '#64748b';

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
          stroke={trackColor}
          strokeWidth={7}
          strokeLinecap="round"
        />

        {/* Inner dark track */}
        <path
          d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke={trackInner}
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
          fill={textColor}
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
          fill={labelColor}
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
