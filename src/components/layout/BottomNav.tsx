import type { ViewId } from "../../types";
import { Icon } from "../ui/Icon";

export const NAV_ITEMS: { id: ViewId; icon: string; label: string }[] = [
  { id: "summary", icon: "fa-house", label: "Ringkasan" },
  { id: "transactions", icon: "fa-list-ul", label: "Transaksi" },
  { id: "budget", icon: "fa-bullseye", label: "Anggaran" },
  { id: "savings", icon: "fa-piggy-bank", label: "Tabungan" },
  { id: "debts", icon: "fa-handshake", label: "Hutang" },
  { id: "analysis", icon: "fa-chart-pie", label: "Analisis" },
];

/** Page switcher: fixed at the bottom on phones, centered at the top on wide screens. */
export function BottomNav({
  active,
  onSelect,
}: {
  active: ViewId;
  onSelect: (view: ViewId) => void;
}) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, icon, label }) => (
        <button
          key={id}
          className={id === active ? "active" : ""}
          onClick={() => onSelect(id)}
        >
          <span>
            <Icon name={icon} />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
