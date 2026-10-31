import { useState } from "react";
import { formatRupiah } from "../../api";
import { Icon } from "../ui/Icon";

export interface SalaryModalProps {
  month: string;
  currentSalary: number;
  onSave: (month: string, newSalary: number) => void;
  onClose: () => void;
}

/** Strips non-numeric characters and parses as integer. */
const parseInput = (raw: string): number =>
  parseInt(raw.replace(/\D/g, "")) || 0;

/** Format number with Indonesian thousand separators (e.g. 5.000.000) */
const formatNumber = (n: number): string =>
  n > 0 ? n.toLocaleString("id-ID") : "";

export function SalaryModal({
  month,
  currentSalary,
  onSave,
  onClose,
}: SalaryModalProps) {
  const [raw, setRaw] = useState(formatNumber(currentSalary));

  const salary = parseInput(raw);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const num = parseInt(digits) || 0;
    setRaw(num > 0 ? num.toLocaleString("id-ID") : "");
  };

  const handleAdd = (amount: number) => {
    const next = salary + amount;
    setRaw(formatNumber(next));
  };

  const handleSetPreset = (amount: number) => {
    setRaw(formatNumber(amount));
  };

  const handleSave = () => {
    onSave(month, salary);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card budget-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="budget-modal-header">
          <div className="budget-modal-icon">
            <Icon name="fa-briefcase" />
          </div>
          <div>
            <b className="budget-modal-title">Gaji Utama</b>
            <div className="muted">Bulan {month}</div>
          </div>
        </div>

        {/* Current Salary Note */}
        {currentSalary > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              background: "var(--primary-soft)",
              borderRadius: "10px",
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            <span className="muted">Gaji saat ini:</span>
            <b style={{ color: "var(--primary-dark)" }}>
              {formatRupiah(currentSalary)}
            </b>
          </div>
        )}

        {/* Input */}
        <label className="budget-input-label">Nominal Gaji (Rp)</label>
        <div className="budget-input-wrap">
          <span className="budget-rp-prefix">Rp</span>
          <input
            className="budget-input"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={raw}
            onChange={handleChange}
            autoFocus
          />
        </div>

        {/* Quick presets */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 8 }}
            onClick={() => handleAdd(500000)}
          >
            +500 rb
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 8 }}
            onClick={() => handleAdd(1000000)}
          >
            +1 jt
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 8 }}
            onClick={() => handleAdd(2000000)}
          >
            +2 jt
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 8 }}
            onClick={() => handleSetPreset(5000000)}
          >
            5 jt
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: "4px 8px",
              fontSize: 11,
              borderRadius: 8,
              color: "var(--negative)",
            }}
            onClick={() => setRaw("")}
          >
            Reset
          </button>
        </div>

        <p className="muted" style={{ margin: "6px 0 14px", fontSize: 12 }}>
          💡 Nilai akan disimpan otomatis dan disinkronkan ke Google Sheet (kolom
          B).
        </p>

        {/* Actions */}
        <div className="form-row">
          <button id="salary-save-btn" onClick={handleSave}>
            💾 Simpan Gaji
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
