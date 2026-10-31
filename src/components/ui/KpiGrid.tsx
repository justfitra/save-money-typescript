import type { KpiItem } from "../../types";

/** Grid of small stat cards. items = [[label, value, tone?], ...], tone is "positive" | "negative". */
export const KpiGrid = ({ items }: { items: KpiItem[] }) => (
  <div className="kpi-grid">
    {items.map(([label, value, tone]) => (
      <div className="kpi-card" key={label}>
        <div className="muted">{label}</div>
        <div className={"kpi-value " + (tone || "")}>{value}</div>
      </div>
    ))}
  </div>
);
