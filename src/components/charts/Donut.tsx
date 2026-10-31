import { formatRupiah } from "../../api";
import type { ChartSlice } from "../../types";

const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#64748b",
  "#14b8a6",
  "#eab308",
];

/** Donut chart with legend. slices = [[label, amount], ...]; zero amounts are hidden. */
export function Donut({
  slices,
  centerText,
  subText,
}: {
  slices: ChartSlice[];
  centerText: string | number;
  subText: string;
}) {
  const visibleSlices = slices.filter(([, amount]) => amount > 0);
  if (!visibleSlices.length) return <div className="empty">Belum ada data</div>;

  const total = visibleSlices.reduce((sum, [, amount]) => sum + amount, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" className="donut-svg">
        <circle
          r={radius}
          cx="70"
          cy="70"
          fill="none"
          stroke="var(--border)"
          strokeWidth="22"
        />
        {visibleSlices.map(([label, amount], index) => {
          const arcLength = (amount / total) * circumference;
          const arcOffset = offset;
          offset += arcLength;
          return (
            <circle
              key={label + index}
              r={radius}
              cx="70"
              cy="70"
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="22"
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={-arcOffset}
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-center">
          {centerText}
        </text>
        <text x="70" y="82" textAnchor="middle" className="donut-sub">
          {subText}
        </text>
      </svg>
      <div className="legend">
        {visibleSlices.map(([label, amount], index) => (
          <div key={label + index}>
            <i
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span>{label}</span>
            <b>{formatRupiah(amount)}</b>
            <em>{Math.round((amount / total) * 100)}%</em>
          </div>
        ))}
      </div>
    </div>
  );
}
