import { formatRupiah } from "../api";
import { Donut, Icon, KpiGrid, MonthPills } from "../components";
import { useFinance } from "../context/FinanceContext";
import { sumBy, sumExpensesByCategory } from "../utils/calc";
import type { MonthSummary } from "../types";

export function SummaryPage({ summary }: { summary: MonthSummary }) {
  const {
    months,
    savings,
    debts,
    loadedMonths,
    selectedMonth,
    setSelectedMonth,
    summarizeMonth,
  } = useFinance();
  const monthlySummaries = loadedMonths.map((month) => ({
    month,
    ...summarizeMonth(month),
  }));
  const totalSalary = sumBy(monthlySummaries, "salary");
  const totalExtraIncome = sumBy(monthlySummaries, "extraIncome");
  const totalExpenses = sumBy(monthlySummaries, "expenses");
  const totalIncome = totalSalary + totalExtraIncome;
  const savingsBalance = sumBy(savings, "income") - sumBy(savings, "expense");
  const remainingDebt = sumBy(debts, "income") - sumBy(debts, "expense");
  const monthIndex = loadedMonths.indexOf(selectedMonth);
  const previousExpenses =
    monthIndex > 0 ? summarizeMonth(loadedMonths[monthIndex - 1]).expenses : 0;
  const changePercent = previousExpenses
    ? Math.round(
        ((summary.expenses - previousExpenses) / previousExpenses) * 100,
      )
    : null;

  return (
    <>
      <div className="hero">
        <small>Sisa uang {selectedMonth}</small>
        <h2 className={summary.balance < 0 ? "negative" : ""}>
          {formatRupiah(summary.balance)}
        </h2>
        <div>
          Masuk {formatRupiah(summary.salary + summary.extraIncome)} · Keluar{" "}
          {formatRupiah(summary.expenses)}
          {changePercent != null && (
            <>
              {" "}
              ·{" "}
              <Icon
                name={changePercent > 0 ? "fa-caret-up" : "fa-caret-down"}
              />{" "}
              {Math.abs(changePercent)}% dari bulan lalu
            </>
          )}
        </div>
      </div>
      <MonthPills
        months={loadedMonths}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
      />
      <KpiGrid
        items={[
          ["Total masuk", formatRupiah(totalIncome)],
          ["Total keluar", formatRupiah(totalExpenses)],
          ["Tabungan", formatRupiah(savingsBalance), "positive"],
          [
            "Sisa hutang",
            formatRupiah(remainingDebt),
            remainingDebt > 0 ? "negative" : "positive",
          ],
        ]}
      />
      <div className="grid-2">
        <div className="card">
          <h3>Pengeluaran {selectedMonth} per kategori</h3>
          <Donut
            slices={sumExpensesByCategory(months[selectedMonth].transactions)}
            centerText={formatRupiah(summary.expenses).slice(3)}
            subText="keluar"
          />
        </div>
        <div className="card">
          <h3>Pemasukan vs pengeluaran (setahun)</h3>
          <Donut
            slices={[
              ["Pemasukan", totalIncome],
              ["Pengeluaran", totalExpenses],
            ]}
            centerText={
              Math.round((totalExpenses / (totalIncome || 1)) * 100) + "%"
            }
            subText="terpakai"
          />
        </div>
        <div className="card">
          <h3>Porsi pengeluaran per bulan</h3>
          <Donut
            slices={monthlySummaries.map(({ month, expenses }) => [
              month,
              expenses,
            ])}
            centerText={loadedMonths.length}
            subText="bulan"
          />
        </div>
      </div>
    </>
  );
}
