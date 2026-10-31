import { useState } from "react";
import { CATEGORY_ICONS, buildSalaryPayload, formatRupiah } from "../api";
import { Icon, KpiGrid, MonthPills, TransactionList } from "../components";
import { useFinance } from "../context/FinanceContext";
import type { MonthSummary } from "../types";

export function TransactionsPage({ summary }: { summary: MonthSummary }) {
  const {
    months,
    loadedMonths,
    selectedMonth,
    setSelectedMonth,
    sendChange,
    handleEdit,
    handleDelete,
    setNewMonthDialogOpen,
  } = useFinance();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const query = searchQuery.toLowerCase();
  const filtered = months[selectedMonth].transactions.filter(
    (transaction) =>
      (!categoryFilter || transaction.category === categoryFilter) &&
      (!query ||
        (transaction.description + " " + transaction.category)
          .toLowerCase()
          .includes(query)),
  );
  const changeSalary = () => {
    const input = prompt(
      `Gaji / pemasukan utama ${selectedMonth} (angka):`,
      String(months[selectedMonth].salary),
    );
    if (input !== null && +input >= 0)
      sendChange(buildSalaryPayload(selectedMonth, +input));
  };

  return (
    <>
      <MonthPills
        months={loadedMonths}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
      />
      <KpiGrid
        items={[
          ["Gaji utama", formatRupiah(summary.salary)],
          ["Pemasukan tambahan", formatRupiah(summary.extraIncome)],
          ["Pengeluaran", formatRupiah(summary.expenses)],
          [
            "Sisa",
            formatRupiah(summary.balance),
            summary.balance < 0 ? "negative" : "positive",
          ],
        ]}
      />
      <div className="card">
        <div className="form-row">
          <input
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">Semua kategori</option>
            {Object.keys(CATEGORY_ICONS).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="form-row" style={{ margin: "10px 0" }}>
          <button className="btn-ghost" onClick={changeSalary}>
            <Icon name="fa-briefcase" /> Ubah gaji
          </button>
          <button
            className="btn-ghost"
            onClick={() => setNewMonthDialogOpen(true)}
          >
            <Icon name="fa-folder-plus" /> Sheet bulan baru
          </button>
        </div>
        <TransactionList
          transactions={filtered}
          kind="transaction"
          onEdit={handleEdit(selectedMonth)}
          onDelete={handleDelete(selectedMonth)}
        />
      </div>
    </>
  );
}
