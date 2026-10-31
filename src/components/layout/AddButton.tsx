import { Icon } from "../ui/Icon";

/** Floating "+" button. */
export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Tambah">
      <Icon name="fa-plus" />
    </button>
  );
}
