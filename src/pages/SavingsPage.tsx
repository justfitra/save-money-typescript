import { SAVINGS_SHEET, formatRupiah } from "../api";
import {
  Donut,
  Icon,
  KpiGrid,
  ProgressRing,
  TransactionList,
} from "../components";
import { useFinance } from "../context/FinanceContext";
import { sumBy } from "../utils/calc";

export function SavingsPage() {
  const { savings, handleEdit, handleDelete, savingsGoal, setSavingsGoal } =
    useFinance();
  const totalDeposited = sumBy(savings, "income");
  const totalWithdrawn = sumBy(savings, "expense");
  const balance = totalDeposited - totalWithdrawn;
  const goalPercent = savingsGoal ? (balance / savingsGoal) * 100 : 0;
  const changeGoal = () => {
    const input = prompt("Target tabungan (Rp):", String(savingsGoal || ""));
    if (input !== null) setSavingsGoal(+input || 0);
  };

  return (
    <>
      <KpiGrid
        items={[
          ["Total disetor", formatRupiah(totalDeposited)],
          ["Total diambil", formatRupiah(totalWithdrawn)],
          ["Saldo tabungan", formatRupiah(balance), "positive"],
        ]}
      />
      <div className="grid-2">
        <div className="card">
          <h3>
            <Icon name="fa-bullseye" /> Target tabungan
          </h3>
          <div style={{ width: 130, margin: "auto" }}>
            <ProgressRing
              percent={goalPercent}
              color="var(--primary)"
              text={savingsGoal ? Math.round(goalPercent) + "%" : "–"}
            />
          </div>
          <div className="muted" style={{ margin: "8px 0" }}>
            {savingsGoal
              ? formatRupiah(balance) + " dari " + formatRupiah(savingsGoal)
              : "Belum ada target"}
          </div>
          <button className="btn-ghost" onClick={changeGoal}>
            Atur target
          </button>
        </div>
        <div className="card">
          <h3>Disetor vs diambil</h3>
          <Donut
            slices={[
              ["Disetor", totalDeposited],
              ["Diambil", totalWithdrawn],
            ]}
            centerText={formatRupiah(balance).slice(3)}
            subText="saldo"
          />
        </div>
      </div>
      <div className="card mt-12">
        <h3>Riwayat tabungan</h3>
        <TransactionList
          transactions={savings}
          kind="savings"
          onEdit={handleEdit(SAVINGS_SHEET)}
          onDelete={handleDelete(SAVINGS_SHEET)}
        />
      </div>
    </>
  );
}
