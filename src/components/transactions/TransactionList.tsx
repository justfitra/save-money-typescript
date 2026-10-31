import { CATEGORY_ICONS, formatRupiah } from "../../api";
import type { EntryKind, Transaction } from "../../types";
import { Icon } from "../ui/Icon";

/**
 * List of entries, newest first.
 * kind: "transaction" (month sheet) | "savings" | "debt" - decides icon and colors.
 */
export function TransactionList({
  transactions,
  kind,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  kind: EntryKind;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  if (!transactions.length)
    return (
      <div className="entry-list">
        <div className="empty">Belum ada data</div>
      </div>
    );

  return (
    <div className="entry-list">
      {[...transactions].reverse().map((transaction) => {
        const net = transaction.income - transaction.expense;
        const isGood = kind === "debt" ? net < 0 : net >= 0;
        const iconName =
          kind === "savings"
            ? transaction.income
              ? "fa-arrow-up"
              : "fa-arrow-down"
            : kind === "debt"
              ? transaction.income
                ? "fa-file-pen"
                : "fa-circle-check"
              : CATEGORY_ICONS[transaction.category] || "fa-box";
        return (
          <div className="entry" key={transaction.row}>
            <div className="entry-icon">
              <Icon name={iconName} />
            </div>
            <div className="entry-body">
              <b>{transaction.description || "-"}</b>
              <small>
                {transaction.date} · {transaction.category}
              </small>
            </div>
            <div
              className={"entry-amount " + (isGood ? "positive" : "negative")}
            >
              {net >= 0 ? "+" : "-"}
              {formatRupiah(Math.abs(net)).slice(3)}
            </div>
            <div className="entry-actions">
              <button className="btn-ghost" onClick={() => onEdit(transaction)}>
                <Icon name="fa-pen" />
              </button>
              <button
                className="btn-ghost"
                onClick={() => onDelete(transaction)}
              >
                <Icon name="fa-trash" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
