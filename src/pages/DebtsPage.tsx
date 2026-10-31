import { DEBTS_SHEET, formatRupiah } from "../api";
import { Donut, KpiGrid, ProgressRing, TransactionList } from "../components";
import { useFinance } from "../context/FinanceContext";
import { sumBy } from "../utils/calc";

export function DebtsPage() {
  const { debts, handleEdit, handleDelete } = useFinance();
  const totalDebt = sumBy(debts, "income");
  const totalRepaid = sumBy(debts, "expense");
  const remaining = totalDebt - totalRepaid;
  const repaidPercent = totalDebt ? (totalRepaid / totalDebt) * 100 : 0;

  return (
    <>
      <KpiGrid
        items={[
          ["Total hutang", formatRupiah(totalDebt)],
          ["Dikembalikan", formatRupiah(totalRepaid)],
          [
            "Sisa hutang",
            formatRupiah(remaining),
            remaining > 0 ? "negative" : "positive",
          ],
        ]}
      />
      <div className="grid-2">
        <div className="card">
          <h3>Progres pelunasan</h3>
          <div style={{ width: 130, margin: "auto" }}>
            <ProgressRing
              percent={repaidPercent}
              color="var(--positive)"
              text={Math.round(repaidPercent) + "%"}
            />
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            {remaining > 0 ? "Tinggal " + formatRupiah(remaining) : "Lunas"}
          </div>
        </div>
        <div className="card">
          <h3>Hutang vs dikembalikan</h3>
          <Donut
            slices={[
              ["Sisa hutang", Math.max(remaining, 0)],
              ["Dikembalikan", totalRepaid],
            ]}
            centerText={formatRupiah(remaining).slice(3)}
            subText="sisa"
          />
        </div>
      </div>
      <div className="card mt-12">
        <h3>Catatan hutang</h3>
        <TransactionList
          transactions={debts}
          kind="debt"
          onEdit={handleEdit(DEBTS_SHEET)}
          onDelete={handleDelete(DEBTS_SHEET)}
        />
      </div>
    </>
  );
}
