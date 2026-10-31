import { useState } from "react";

/**
 * Dialog for creating the sheet of a new month.
 * availableMonths = month names that do not have a sheet yet.
 * The new sheet is a copy of `templateMonth` with all transactions removed.
 */
export function NewMonthModal({
  availableMonths,
  templateMonth,
  onCreate,
  onClose,
}: {
  availableMonths: string[];
  templateMonth: string;
  onCreate: (values: { monthName: string; salary: string }) => void;
  onClose: () => void;
}) {
  const [monthName, setMonthName] = useState(availableMonths[0] || "");
  const [salary, setSalary] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="card">
        <b>Buat sheet bulan baru</b>
        {availableMonths.length === 0 ? (
          <p className="muted">
            Semua bulan (Januari–Desember) sudah punya sheet.
          </p>
        ) : (
          <>
            <label>Bulan</label>
            <select
              style={{ width: "100%" }}
              value={monthName}
              onChange={(event) => setMonthName(event.target.value)}
            >
              {availableMonths.map((month) => (
                <option key={month}>{month}</option>
              ))}
            </select>
            <label>Gaji / pemasukan utama (opsional)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder={`Kosongkan untuk mengikuti sheet ${templateMonth}`}
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
            />
            <p className="muted">
              Format dan rumus disalin dari sheet {templateMonth}, semua
              transaksinya dikosongkan.
            </p>
          </>
        )}
        <div className="form-row" style={{ marginTop: 14 }}>
          {availableMonths.length > 0 && (
            <button onClick={() => onCreate({ monthName, salary })}>
              Buat sheet
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
