import { Icon } from "../ui/Icon";

export function Header({ onSync }: { onSync: () => void }) {
  return (
    <header className="app-header">
      <h1>
        <Icon name="fa-wallet" /> Pengatur Keuangan
      </h1>
      <p className="muted">Catatan keuangan yang tersambung ke Google Sheet</p>
      <button onClick={onSync}>
        <Icon name="fa-rotate" /> Sinkron
      </button>
    </header>
  );
}
