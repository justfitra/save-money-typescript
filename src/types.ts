/** One row of a month sheet. For the Savings / Debts sheets see the notes in README. */
export interface Transaction {
  /** 1-based row number in the Google Sheet */
  row: number;
  /** dd/mm/yyyy, exactly as shown in the sheet */
  date: string;
  category: string;
  description: string;
  /** Month sheet: money in. Savings: deposited. Debts: borrowed. */
  income: number;
  /** Month sheet: money out. Savings: withdrawn. Debts: repaid. */
  expense: number;
}

export interface MonthData {
  salary: number;
  transactions: Transaction[];
}

export interface SpreadsheetData {
  months: Record<string, MonthData>;
  savings: Transaction[];
  debts: Transaction[];
}

export interface LoadResult extends SpreadsheetData {
  /** Human readable reasons for sheets that could not be loaded */
  missing: string[];
}

export interface MonthSummary {
  salary: number;
  extraIncome: number;
  expenses: number;
  balance: number;
}

/** Decides icons, colors and labels of a list/dialog. */
export type EntryKind = "transaction" | "savings" | "debt";

/** CSS class used to color a value: "positive" = green, "negative" = red. */
export type Tone = "positive" | "negative";
export type KpiItem = [label: string, value: string, tone?: Tone];
export type ChartSlice = [label: string, amount: number];

export type ViewId =
  "summary" | "transactions" | "budget" | "savings" | "debts" | "analysis";

/** Values typed in the add/edit dialog (inputs give strings). */
export interface EntryForm {
  date: string;
  category: string;
  description: string;
  income: string | number;
  expense: string | number;
}

/** State of the add/edit dialog. row = 0 means "add a new entry". */
export interface EditorState {
  sheet: string;
  row: number;
  original: Transaction;
}

/** Everything the app can ask the Apps Script web app to do (keys must match apps-script.gs). */
export type AppsScriptPayload =
  | {
      act: "add" | "update";
      sheet: string;
      row: number;
      old: { d: string; n: string };
      v: [string, string, string, number | "", number | ""];
    }
  | { act: "delete"; sheet: string; row: number; old: { d: string; n: string } }
  | { act: "gaji"; sheet: string; v: number }
  | { act: "newSheet"; tpl: string; name: string; salary: number | null }
  | { act: "budget"; data: Record<string, number> };
