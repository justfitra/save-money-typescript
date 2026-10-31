import { useEffect, useState } from "react";
import { DEBTS_SHEET, SAVINGS_SHEET } from "./api";
import {
  AddButton,
  BottomNav,
  Header,
  ModalHost,
  SettingsPanel,
} from "./components";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import {
  AnalysisPage,
  BudgetPage,
  DebtsPage,
  SavingsPage,
  SummaryPage,
  TransactionsPage,
} from "./pages";
import type { MonthSummary, ViewId } from "./types";

/** Maps the active menu item to its page. */
function renderPage(view: ViewId, summary: MonthSummary) {
  switch (view) {
    case "summary":
      return <SummaryPage summary={summary} />;
    case "transactions":
      return <TransactionsPage summary={summary} />;
    case "budget":
      return <BudgetPage />;
    case "savings":
      return <SavingsPage />;
    case "debts":
      return <DebtsPage />;
    case "analysis":
      return <AnalysisPage />;
  }
}

function AppShell() {
  const {
    syncData,
    statusMessage,
    hasData,
    summary,
    selectedMonth,
    openEditor,
  } = useFinance();
  const [activeView, setActiveView] = useState<ViewId>("summary");

  useEffect(() => {
    syncData();
  }, []);

  // The "+" button adds to the sheet that belongs to the current page.
  const addTargetSheet =
    activeView === "savings"
      ? SAVINGS_SHEET
      : activeView === "debts"
        ? DEBTS_SHEET
        : selectedMonth;

  return (
    <>
      <main className="page">
        <Header onSync={syncData} />
        <SettingsPanel />
        <p className="status-message">{statusMessage}</p>
        {hasData && summary && renderPage(activeView, summary)}
      </main>
      <AddButton onClick={() => hasData && openEditor(addTargetSheet)} />
      <BottomNav
        active={activeView}
        onSelect={(view) => {
          setActiveView(view);
          scrollTo(0, 0);
        }}
      />
      <ModalHost />
    </>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  );
}
