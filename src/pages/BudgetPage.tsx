import { useState } from "react";
import { BUDGET_CATEGORIES, CATEGORY_ICONS, formatRupiah } from "../api";
import { BudgetModal, Icon, MonthPills, ProgressRing } from "../components";
import { useFinance } from "../context/FinanceContext";

export function BudgetPage() {
  const {
    months,
    loadedMonths,
    selectedMonth,
    setSelectedMonth,
    budgets,
    saveBudgets,
    appsScriptUrl,
  } = useFinance();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const spentByCategory: Record<string, number> = {};
  months[selectedMonth].transactions.forEach(({ category, expense }) => {
    if (expense)
      spentByCategory[category] = (spentByCategory[category] || 0) + expense;
  });

  const handleSaveBudget = (category: string, limit: number) => {
    const updated = { ...budgets };
    if (limit > 0) {
      updated[category] = limit;
    } else {
      delete updated[category];
    }
    saveBudgets(updated);
  };

  const totalBudget = BUDGET_CATEGORIES.reduce(
    (sum, cat) => sum + (budgets[cat] || 0),
    0,
  );
  const totalSpent = BUDGET_CATEGORIES.reduce(
    (sum, cat) => sum + (spentByCategory[cat] || 0),
    0,
  );
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalColor =
    totalPercent > 100
      ? "var(--negative)"
      : totalPercent > 80
        ? "var(--warning)"
        : "var(--positive)";

  return (
    <>
      <MonthPills
        months={loadedMonths}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
      />

      {/* Info card */}
      <div className="card">
        <h3>
          <Icon name="fa-bullseye" /> Anggaran {selectedMonth}
        </h3>

        {/* Total summary bar */}
        {totalBudget > 0 && (
          <div className="budget-total-bar">
            <div className="budget-total-track">
              <div
                className="budget-total-fill"
                style={{
                  width: Math.min(totalPercent, 100) + "%",
                  background: totalColor,
                }}
              />
            </div>
            <div className="budget-total-labels">
              <span className="muted">Total dipakai</span>
              <span style={{ color: totalColor, fontWeight: 700 }}>
                {Math.round(totalPercent)}%
              </span>
              <span className="muted">
                {formatRupiah(totalSpent)} / {formatRupiah(totalBudget)}
              </span>
            </div>
          </div>
        )}

        <div className="muted" style={{ marginTop: 8 }}>
          {appsScriptUrl ? (
            <>
              <Icon name="fa-cloud" /> Anggaran tersimpan ke Google Sheet
            </>
          ) : (
            <>
              <Icon name="fa-mobile-screen" /> Tersimpan di perangkat ini saja
              — isi URL Apps Script untuk sync ke Sheet
            </>
          )}
        </div>
      </div>

      {/* Category cards */}
      <div className="budget-grid">
        {BUDGET_CATEGORIES.map((category) => {
          const limit = budgets[category] || 0;
          const spent = spentByCategory[category] || 0;
          const percentUsed = limit ? (spent / limit) * 100 : 0;
          const color =
            percentUsed > 100
              ? "var(--negative)"
              : percentUsed > 80
                ? "var(--warning)"
                : "var(--positive)";
          return (
            <div
              className="card budget-card-item"
              key={category}
              onClick={() => setEditingCategory(category)}
              title="Ketuk untuk mengatur batas"
            >
              <ProgressRing
                percent={percentUsed}
                color={limit ? color : "var(--border)"}
                text={limit ? Math.round(percentUsed) + "%" : "–"}
              />
              <div>
                <b>
                  <Icon name={CATEGORY_ICONS[category]} /> {category}
                </b>
              </div>
              <div className="muted">
                {formatRupiah(spent)} /{" "}
                {limit ? formatRupiah(limit) : "belum diatur"}
              </div>
              {percentUsed > 100 && (
                <div className="negative" style={{ fontSize: 12 }}>
                  Lewat {formatRupiah(spent - limit)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Budget modal */}
      {editingCategory && (
        <BudgetModal
          category={editingCategory}
          currentLimit={budgets[editingCategory] || 0}
          currentSpent={spentByCategory[editingCategory] || 0}
          onSave={handleSaveBudget}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </>
  );
}

