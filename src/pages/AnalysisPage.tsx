import { formatRupiah } from "../api";
import { Donut, Icon } from "../components";
import { useFinance } from "../context/FinanceContext";
import { sumBy, sumExpensesByCategory } from "../utils/calc";

export function AnalysisPage() {
  const { months, savings, loadedMonths, summarizeMonth } = useFinance();
  const allTransactions = loadedMonths.flatMap((month) =>
    months[month].transactions.map((transaction) => ({
      ...transaction,
      month,
    })),
  );
  const monthlySummaries = loadedMonths.map((month) => ({
    month,
    ...summarizeMonth(month),
  }));
  // Savings deposits are not "spending", so they are left out of the expense analysis.
  const expensesByCategory = sumExpensesByCategory(allTransactions, "Tabungan");
  const totalSpending = expensesByCategory.reduce(
    (total, [, amount]) => total + amount,
    0,
  );
  const totalIncome =
    sumBy(monthlySummaries, "salary") + sumBy(monthlySummaries, "extraIncome");
  const negativeMonths = monthlySummaries
    .filter(({ balance }) => balance < 0)
    .map(({ month }) => month);
  const averageSpending = totalSpending / (monthlySummaries.length || 1);
  const savingsBalance = sumBy(savings, "income") - sumBy(savings, "expense");
  const topExpenses = allTransactions
    .filter((transaction) => transaction.category !== "Tabungan")
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 5);
  const loanLikeExpenses = allTransactions.filter(
    (transaction) =>
      transaction.expense && /pinjam|hutang/i.test(transaction.description),
  );
  const repayments = allTransactions.filter(
    (transaction) =>
      transaction.income && /kembali|di ?bayar/i.test(transaction.description),
  );
  const priciestMonth = [...monthlySummaries].sort(
    (a, b) => b.expenses - a.expenses,
  )[0];

  const insights = [
    <>
      Rata-rata pengeluaran (di luar tabungan):{" "}
      <b>{formatRupiah(averageSpending)}</b>/bulan,{" "}
      {Math.round((totalSpending / (totalIncome || 1)) * 100)}% dari total
      pemasukan.
    </>,
    expensesByCategory[0] && (
      <>
        Kategori terbesar: <b>{expensesByCategory[0][0]}</b> (
        {formatRupiah(expensesByCategory[0][1])},{" "}
        {Math.round((expensesByCategory[0][1] / totalSpending) * 100)}%).
      </>
    ),
    negativeMonths.length ? (
      <>
        Bulan minus: <b>{negativeMonths.join(", ")}</b> ({negativeMonths.length}{" "}
        dari {monthlySummaries.length} bulan).
      </>
    ) : (
      "Tidak ada bulan minus"
    ),
    <>
      Tabungan <b>{formatRupiah(savingsBalance)}</b> ≈{" "}
      {averageSpending ? (savingsBalance / averageSpending).toFixed(1) : 0}{" "}
      bulan pengeluaran.
    </>,
    loanLikeExpenses.length > 0 && (
      <>
        Ada <b>{loanLikeExpenses.length}</b> transaksi keluar bertuliskan
        "pinjam/hutang" senilai{" "}
        <b>{formatRupiah(sumBy(loanLikeExpenses, "expense"))}</b>; tercatat
        kembali <b>{formatRupiah(sumBy(repayments, "income"))}</b>. Ini ikut
        membengkakkan kategori Tagihan.
      </>
    ),
    priciestMonth && (
      <>
        Bulan paling boros: <b>{priciestMonth.month}</b> (
        {formatRupiah(priciestMonth.expenses)}).
      </>
    ),
  ].filter(Boolean);

  const exportCsv = () => {
    const lines = ["Bulan,Tanggal,Kategori,Deskripsi,Masuk,Keluar"];
    allTransactions.forEach((t) =>
      lines.push(
        [
          t.month,
          t.date,
          t.category,
          '"' + t.description.replace(/"/g, '""') + '"',
          t.income,
          t.expense,
        ].join(","),
      ),
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv" }),
    );
    link.download = "transaksi-2026.csv";
    link.click();
  };

  return (
    <>
      <div className="card">
        <h3>
          <Icon name="fa-lightbulb" /> Temuan
        </h3>
        <ul className="insights">
          {insights.map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Pengeluaran per kategori (setahun)</h3>
          <Donut
            slices={expensesByCategory}
            centerText={formatRupiah(totalSpending).slice(3)}
            subText="keluar"
          />
        </div>
        <div className="card">
          <h3>Sumber pengeluaran tertinggi</h3>
          <Donut
            slices={topExpenses.map((t) => [
              t.description || t.category,
              t.expense,
            ])}
            centerText="Top 5"
            subText="terbesar"
          />
        </div>
      </div>
      <div className="card mt-12">
        <h3>Rekap bulanan</h3>
        <div className="table-scroll">
          <table className="recap-table">
            <thead>
              <tr>
                <th>Bulan</th>
                <th>Masuk</th>
                <th>Keluar</th>
                <th>Sisa</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummaries.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{formatRupiah(row.salary + row.extraIncome)}</td>
                  <td>{formatRupiah(row.expenses)}</td>
                  <td className={row.balance < 0 ? "negative" : "positive"}>
                    {formatRupiah(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-12" onClick={exportCsv}>
          <Icon name="fa-download" /> Unduh semua transaksi (CSV)
        </button>
      </div>
    </>
  );
}
