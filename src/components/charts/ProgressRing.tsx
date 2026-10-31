/** Single circular progress indicator. percent is clamped to 100 for the arc. */
export function ProgressRing({
  percent,
  color,
  text,
  size,
}: {
  percent: number;
  color: string;
  text: string;
  size?: number;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (Math.min(percent, 100) / 100) * circumference;
  return (
    <svg
      viewBox="0 0 100 100"
      style={size ? { width: size, height: size } : undefined}
    >
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth="12"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="var(--text)"
      >
        {text}
      </text>
    </svg>
  );
}
