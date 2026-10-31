import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  MONTH_NAMES,
  SAVINGS_SHEET,
  DEBTS_SHEET,
  DEFAULT_SHEET_URL,
  APPS_SCRIPT_URL,
  loadSpreadsheet,
  loadBudgets,
  buildBudgetPayload,
  buildSalaryPayload,
  sendToAppsScript,
  buildNewSheetPayload,
  buildDeletePayload,
} from "../api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { sumBy } from "../utils/calc";
import type {
  AppsScriptPayload,
  EditorState,
  LoadResult,
  MonthData,
  MonthSummary,
  SpreadsheetData,
  Transaction,
} from "../types";

/** Everything the pages need: loaded data, selection, and actions that change the sheet. */
interface FinanceContextValue {
  // settings and personal targets (saved on this device only)
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
  budgets: Record<string, number>; // category -> monthly limit
  setBudgets: (budgets: Record<string, number>) => void;
  salaries: Record<string, number>; // month -> monthly salary cache
  savingsGoal: number;
  setSavingsGoal: (goal: number) => void;
  // data from Google Sheets
  months: Record<string, MonthData>;
  savings: Transaction[];
  debts: Transaction[];
  loadedMonths: string[];
  hasData: boolean;
  statusMessage: string;
  // selected month and its summary
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  summary: MonthSummary | null;
  summarizeMonth: (month: string) => MonthSummary;
  /** Persists budgets to the "Anggaran" sheet via Apps Script, then re-syncs. */
  saveBudgets: (budgets: Record<string, number>) => Promise<void>;
  /** Updates salary optimistically and syncs to Google Sheet via Apps Script. */
  updateSalary: (month: string, newSalary: number) => Promise<void>;
  // actions
  syncData: () => Promise<LoadResult | null>;
  sendChange: (payload: AppsScriptPayload) => Promise<void>;
  createMonthSheet: (values: {
    monthName: string;
    salary: string;
  }) => Promise<void>;
  openEditor: (sheet: string, row?: number) => void;
  handleEdit: (sheet: string) => (transaction: Transaction) => void;
  handleDelete: (sheet: string) => (transaction: Transaction) => void;
  // dialogs
  editor: EditorState | null;
  setEditor: (editor: EditorState | null) => void;
  isNewMonthDialogOpen: boolean;
  setNewMonthDialogOpen: (isOpen: boolean) => void;
  isSalaryModalOpen: boolean;
  setIsSalaryModalOpen: (isOpen: boolean) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function useFinance(): FinanceContextValue {
  const value = useContext(FinanceContext);
  if (!value)
    throw new Error("useFinance must be used inside <FinanceProvider>");
  return value;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [sheetUrl, setSheetUrl] = useLocalStorage("url", DEFAULT_SHEET_URL);
  const [appsScriptUrl, setAppsScriptUrl] = useLocalStorage(
    "gas",
    APPS_SCRIPT_URL,
  );
  const [budgets, setBudgets] = useLocalStorage<Record<string, number>>(
    "bg",
    {},
  ); // { category: monthly limit }
  const [salariesCache, setSalariesCache] = useLocalStorage<
    Record<string, number>
  >("salaries_cache", {});
  const [savingsGoal, setSavingsGoal] = useLocalStorage("goal", 0);

  // Data loaded from Google Sheets
  const [data, setData] = useState<SpreadsheetData>({
    months: {},
    savings: [],
    debts: [],
  });
  const [statusMessage, setStatusMessage] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("Oktober");
  const [editor, setEditor] = useState<EditorState | null>(null); // while the dialog is open
  const [isNewMonthDialogOpen, setNewMonthDialogOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  const { months, savings, debts } = data;
  const loadedMonths = MONTH_NAMES.filter((month) => months[month]);
  const hasData = loadedMonths.length > 0;

  const syncData = useCallback(async () => {
    const spreadsheetId = (sheetUrl.match(/\/d\/([\w-]+)/) || [])[1];
    if (!spreadsheetId) {
      setStatusMessage("Link tidak valid");
      return null;
    }
    setStatusMessage("Mengambil data...");
    const [result, sheetBudgets] = await Promise.all([
      loadSpreadsheet(spreadsheetId),
      loadBudgets(spreadsheetId),
    ]);
    const available = MONTH_NAMES.filter((month) => result.months[month]);
    if (!available.length) {
      setStatusMessage(
        "Gagal membaca. Pastikan sheet publik (Pelihat). " +
          result.missing.join("; "),
      );
      return null;
    }

    // Merge: sheet values update cache; cached values protect against empty reads
    setSalariesCache((prev: Record<string, number>) => {
      const merged = { ...prev };
      available.forEach((month) => {
        const sheetSalary = result.months[month]?.salary || 0;
        if (sheetSalary > 0) {
          merged[month] = sheetSalary;
        } else if (merged[month]) {
          result.months[month].salary = merged[month];
        }
      });
      return merged;
    });

    setData(result);
    // Merge: sheet values win over localStorage cache
    if (Object.keys(sheetBudgets).length > 0) {
      setBudgets({ ...budgets, ...sheetBudgets });
    }
    setSelectedMonth((current) =>
      result.months[current] ? current : available[available.length - 1],
    );
    setStatusMessage(
      "Tersinkron " +
        new Date().toLocaleTimeString("id-ID") +
        " · Termuat: " +
        available.join(", ") +
        (result.missing.length
          ? " · Tidak termuat: " + result.missing.join(", ")
          : ""),
    );
    return result;
  }, [sheetUrl]);

  useEffect(() => {
    syncData();
  }, []);

  /** Sends a change to Apps Script, then re-syncs after a short delay. */
  const sendChange = async (payload: AppsScriptPayload) => {
    if (!appsScriptUrl) return setStatusMessage("Isi URL Apps Script dulu.");
    try {
      await sendToAppsScript(appsScriptUrl, payload);
      setStatusMessage("Terkirim, menyinkron ulang...");
      setTimeout(syncData, 2500);
    } catch (error) {
      setStatusMessage("Gagal mengirim: " + error);
    }
  };

  /** Saves budget limits to both localStorage and the "Anggaran" sheet. */
  const saveBudgets = async (newBudgets: Record<string, number>) => {
    setBudgets(newBudgets);
    if (!appsScriptUrl) {
      setStatusMessage("Anggaran tersimpan di perangkat (Apps Script belum diisi).");
      return;
    }
    try {
      await sendToAppsScript(appsScriptUrl, buildBudgetPayload(newBudgets));
      setStatusMessage("Anggaran tersimpan ke Sheet ✓");
    } catch (error) {
      setStatusMessage("Gagal simpan anggaran ke Sheet: " + error);
    }
  };

  /** Updates salary optimistically and syncs to Google Sheet via Apps Script. */
  const updateSalary = async (month: string, newSalary: number) => {
    // 1. Optimistic update in state
    setData((prev) => {
      const existing = prev.months[month];
      if (!existing) return prev;
      return {
        ...prev,
        months: {
          ...prev.months,
          [month]: {
            ...existing,
            salary: newSalary,
          },
        },
      };
    });

    // 2. Cache in localStorage immediately
    setSalariesCache((prev: Record<string, number>) => ({
      ...prev,
      [month]: newSalary,
    }));

    if (!appsScriptUrl) {
      setStatusMessage(
        "Gaji diperbarui di perangkat (URL Apps Script belum diatur).",
      );
      return;
    }

    // 3. Send to Google Apps Script
    setStatusMessage(`Menyimpan gaji ${month} ke Google Sheet...`);
    try {
      await sendToAppsScript(
        appsScriptUrl,
        buildSalaryPayload(month, newSalary),
      );
      setStatusMessage(`Gaji ${month} berhasil disinkronkan ke Google Sheet ✓`);
      setTimeout(syncData, 3000);
    } catch (error) {
      setStatusMessage("Gagal menyinkronkan gaji: " + error);
    }
  };

  /**
   * Creates the sheet of a new month by copying the selected month, then waits
   * (polling) until the new sheet shows up and switches to it. Apps Script gives
   * no readable answer, so polling is the only way to know it worked.
   */
  const createMonthSheet = async ({
    monthName,
    salary,
  }: {
    monthName: string;
    salary: string;
  }) => {
    setNewMonthDialogOpen(false);
    if (!appsScriptUrl) return setStatusMessage("Isi URL Apps Script dulu.");
    try {
      await sendToAppsScript(
        appsScriptUrl,
        buildNewSheetPayload({
          templateSheet: selectedMonth,
          newName: monthName,
          salary,
        }),
      );
    } catch (error) {
      return setStatusMessage("Gagal mengirim: " + error);
    }
    setStatusMessage(`Membuat sheet ${monthName}...`);
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const result = await syncData();
      if (result && result.months[monthName]) {
        setSelectedMonth(monthName);
        setStatusMessage(`Sheet ${monthName} berhasil dibuat.`);
        return;
      }
    }
    setStatusMessage(
      `Sheet ${monthName} belum muncul. Pastikan kode Apps Script versi terbaru sudah di-deploy ulang, lalu tekan Sinkron.`,
    );
  };

  const getTransactions = (sheet: string): Transaction[] =>
    sheet === SAVINGS_SHEET
      ? savings
      : sheet === DEBTS_SHEET
        ? debts
        : months[sheet].transactions;

  /** Opens the dialog. row = 0 adds a new entry, otherwise edits that sheet row. */
  const openEditor = (sheet: string, row = 0) => {
    const existing = row
      ? getTransactions(sheet).find((transaction) => transaction.row === row)
      : undefined;
    if (row && !existing) return; // the row disappeared after a sync
    const blankEntry: Transaction = {
      row: 0,
      date: "",
      category:
        sheet === SAVINGS_SHEET || sheet === DEBTS_SHEET
          ? selectedMonth
          : "Makan",
      description: "",
      income: 0,
      expense: 0,
    };
    setEditor({ sheet, row, original: existing ?? blankEntry });
  };
  const handleEdit = (sheet: string) => (transaction: Transaction) =>
    openEditor(sheet, transaction.row);
  const handleDelete = (sheet: string) => (transaction: Transaction) => {
    if (confirm("Hapus baris ini dari Google Sheet?"))
      sendChange(buildDeletePayload(sheet, transaction));
  };

  const summarizeMonth = (month: string): MonthSummary => {
    const { salary, transactions } = months[month];
    const extraIncome = sumBy(transactions, "income");
    const expenses = sumBy(transactions, "expense");
    return {
      salary,
      extraIncome,
      expenses,
      balance: salary + extraIncome - expenses,
    };
  };

  const summary =
    hasData && months[selectedMonth] ? summarizeMonth(selectedMonth) : null;
  const value: FinanceContextValue = {
    sheetUrl,
    setSheetUrl,
    appsScriptUrl,
    setAppsScriptUrl,
    budgets,
    setBudgets,
    salaries: salariesCache,
    saveBudgets,
    updateSalary,
    savingsGoal,
    setSavingsGoal,
    months,
    savings,
    debts,
    loadedMonths,
    hasData,
    statusMessage,
    selectedMonth,
    setSelectedMonth,
    summary,
    summarizeMonth,
    syncData,
    sendChange,
    createMonthSheet,
    openEditor,
    handleEdit,
    handleDelete,
    editor,
    setEditor,
    isNewMonthDialogOpen,
    setNewMonthDialogOpen,
    isSalaryModalOpen,
    setIsSalaryModalOpen,
  };
  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}
