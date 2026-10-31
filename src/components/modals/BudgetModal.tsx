import { useState } from "react";
import { CATEGORY_ICONS, formatRupiah } from "../../api";
import { Icon } from "../ui/Icon";

interface BudgetModalProps {
  category: string;
  currentLimit: number;
  currentSpent: number;
  onSave: (category: string, limit: number) => void;
  onClose: () => void;
}

/** Strips non-numeric characters and parses as integer. */
const parseInput = (raw: string): number =>
  parseInt(raw.replace(/\D/g, "")) || 0;

/** Format angka ke format lokal Indonesia tanpa prefix Rp */
const formatNumber = (n: number): string =>
  n > 0 ? n.toLocaleString("id-ID") : "";

export function BudgetModal({
  category,
  currentLimit,
  currentSpent,
  onSave,
  onClose,
}: BudgetModalProps) {
  const [raw, setRaw] = useState(formatNumber(currentLimit));

  const limit = parseInput(raw);
  const percentUsed = limit > 0 ? Math.min((currentSpent / limit) * 100, 100) : 0;
  const isOver = currentSpent > limit && limit > 0;
  const color =
    isOver
      ? "var(--negative)"
      : percentUsed > 80
        ? "var(--warning)"
        : "var(--positive)";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const num = parseInt(digits) || 0;
    setRaw(num > 0 ? num.toLocaleString("id-ID") : "");
  };

  const handleSave = () => {
    onSave(category, limit);
    onClose();
  };

  const handleRemove = () => {
    onSave(category, 0);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card budget-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="budget-modal-header">
          <div className="budget-modal-icon">
            <Icon name={CATEGORY_ICONS[category] ?? "fa-box"} />
          </div>
          <div>
            <b className="budget-modal-title">{category}</b>
            <div className="muted">Atur batas pengeluaran bulanan</div>
          </div>
        </div>

        {/* Live preview bar */}
        {limit > 0 && (
          <div className="budget-preview">
            <div className="budget-preview-bar">
              <div
                className="budget-preview-fill"
                style={{ width: percentUsed + "%", background: color }}
              />
            </div>
            <div className="budget-preview-labels">
              <span className="muted">Dipakai: {formatRupiah(currentSpent)}</span>
              <span style={{ color }} className="budget-preview-pct">
                {Math.round(percentUsed)}%
              </span>
              <span className="muted">Batas: {formatRupiah(limit)}</span>
            </div>
            {isOver && (
              <div className="negative" style={{ fontSize: 12, textAlign: "center" }}>
                ⚠ Melebihi {formatRupiah(currentSpent - limit)}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <label className="budget-input-label">Batas Anggaran (Rp)</label>
        <div className="budget-input-wrap">
          <span className="budget-rp-prefix">Rp</span>
          <input
            className="budget-input"
            type="text"
            inputMode="numeric"
            placeholder="0 = belum diatur"
            value={raw}
            onChange={handleChange}
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="form-row" style={{ marginTop: 16 }}>
          <button id={`budget-save-${category}`} onClick={handleSave}>
            💾 Simpan ke Sheet
          </button>
          {currentLimit > 0 && (
            <button
              id={`budget-remove-${category}`}
              className="btn-ghost"
              onClick={handleRemove}
            >
              🗑 Hapus
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
