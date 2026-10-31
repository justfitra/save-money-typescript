import { useState, type ChangeEvent } from "react";
import { CATEGORY_ICONS, DEBTS_SHEET, SAVINGS_SHEET } from "../../api";
import type { EditorState, EntryForm, EntryKind } from "../../types";

// Labels for the 4 editable columns (category, description, income, expense) per sheet type.
const FIELD_LABELS: Record<EntryKind, string[]> = {
  transaction: ["Kategori", "Deskripsi", "Masuk", "Keluar"],
  savings: ["Bulan/Sheet", "Keterangan", "Disetor", "Diambil"],
  debt: ["Bulan/Sheet", "Keterangan", "Hutang", "Dikembalikan"],
};

/** "dd/mm/yyyy" -> "yyyy-mm-dd" for <input type="date">; empty -> today. */
const toInputDate = (displayDate: string): string => {
  if (!displayDate) return new Date().toISOString().slice(0, 10);
  const [day, month, year] = displayDate.split("/");
  return `${year}-${month}-${day}`;
};

/**
 * Add / edit dialog. entry = { sheet, row, original } (row = 0 means "add new").
 * onSave receives the form values: { date, category, description, income, expense }.
 */
export function EntryModal({
  entry,
  onSave,
  onClose,
}: {
  entry: EditorState;
  onSave: (form: EntryForm) => void;
  onClose: () => void;
}) {
  const { sheet, row, original } = entry;
  const kind =
    sheet === SAVINGS_SHEET
      ? "savings"
      : sheet === DEBTS_SHEET
        ? "debt"
        : "transaction";
  const [categoryLabel, descriptionLabel, incomeLabel, expenseLabel] =
    FIELD_LABELS[kind];
  const [form, setForm] = useState<EntryForm>({
    date: toInputDate(original.date),
    category: original.category,
    description: original.description,
    income: original.income || "",
    expense: original.expense || "",
  });
  const updateField =
    (field: keyof EntryForm) => (event: ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: event.target.value });

  return (
    <div className="modal-backdrop">
      <div className="card">
        <b>
          {row ? "Ubah" : "Tambah"} — {sheet}
        </b>
        <label>Tanggal</label>
        <input type="date" value={form.date} onChange={updateField("date")} />
        <label>{categoryLabel}</label>
        <input
          value={form.category}
          onChange={updateField("category")}
          list={kind === "transaction" ? "category-options" : undefined}
        />
        <datalist id="category-options">
          {Object.keys(CATEGORY_ICONS).map((category) => (
            <option key={category}>{category}</option>
          ))}
        </datalist>
        <label>{descriptionLabel}</label>
        <input value={form.description} onChange={updateField("description")} />
        <label>{incomeLabel}</label>
        <input
          type="number"
          inputMode="numeric"
          value={form.income}
          onChange={updateField("income")}
        />
        <label>{expenseLabel}</label>
        <input
          type="number"
          inputMode="numeric"
          value={form.expense}
          onChange={updateField("expense")}
        />
        <div className="form-row" style={{ marginTop: 14 }}>
          <button onClick={() => form.date && onSave(form)}>Simpan</button>
          <button className="btn-ghost" onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
