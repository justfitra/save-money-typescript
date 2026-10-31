import type {
  AppsScriptPayload,
  EntryForm,
  LoadResult,
  MonthData,
  Transaction,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1j4zjt8jFbzS9cfcKQiqj3hXB-vlzhQ0GEM7RIKXzNMo/edit";
export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwtLULKN64hma56qpSPggAOCWRTqbp9aIkU6WJgDQ0chIH9cCKZTkKbGaaXmvWoREr2kg/exec";

// Sheet names and category values must match the Google Sheet exactly,
// so they stay in Indonesian. Only the code identifiers are in English.
export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const SAVINGS_SHEET = "Tabungan";
export const DEBTS_SHEET = "Hutang";
export const BUDGET_SHEET = "Anggaran";
export const BUDGET_CATEGORIES = [
  "Makan",
  "Kebutuhan",
  "Tagihan",
  "Transport",
  "Hiburan",
  "Lainnya",
];
export const CATEGORY_ICONS: Record<string, string> = {
  Makan: "fa-utensils",
  Kebutuhan: "fa-cart-shopping",
  Tagihan: "fa-receipt",
  Transport: "fa-bus",
  Hiburan: "fa-gamepad",
  Tabungan: "fa-piggy-bank",
  Pemasukan: "fa-money-bill-wave",
  Lainnya: "fa-box",
};

// ---------------------------------------------------------------------------
// Formatting and parsing helpers
// ---------------------------------------------------------------------------
/** 1500000 -> "Rp 1.500.000" (negative numbers keep the minus sign in front). */
export const formatRupiah = (amount: number): string =>
  (amount < 0 ? "-" : "") +
  "Rp " +
  Math.abs(Math.round(amount)).toLocaleString("id-ID");

/** "Rp 1.500.000" -> 1500000, "-Rp 26.000" -> -26000, "" -> 0. */
const parseRupiah = (text: string | undefined): number => {
  text = (text || "").trim();
  if (!text) return 0;
  const digits = parseInt(text.replace(/\D/g, "")) || 0;
  return text.startsWith("-") ? -digits : digits;
};

/** Minimal CSV parser that supports quoted cells and escaped quotes (""). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (insideQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') insideQuotes = false;
      else cell += char;
    } else if (char === '"') insideQuotes = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

// ---------------------------------------------------------------------------
// Reading from Google Sheets (public sheet, "gviz" endpoint)
// ---------------------------------------------------------------------------
interface GvizCell {
  f?: string | null;
  v?: string | number | boolean | null;
}
interface GvizResponse {
  status: string;
  errors?: { message: string }[];
  table: { rows: { c: (GvizCell | null)[] }[] };
}

let jsonpCounter = 0;

/** Fallback reader that works without CORS by loading the response as a <script>. */
function fetchRowsViaJsonp(
  spreadsheetId: string,
  sheetName: string,
  range?: string,
): Promise<string[][]> {
  return new Promise<string[][]>((resolve, reject) => {
    const callbackName = "__gviz" + jsonpCounter++;
    const script = document.createElement("script");
    const timeoutId = setTimeout(() => {
      script.remove();
      reject(new Error("Timeout: sheet belum publik atau akses diblokir"));
    }, 12000);
    (window as unknown as Record<string, unknown>)[callbackName] = (
      response: GvizResponse,
    ) => {
      clearTimeout(timeoutId);
      script.remove();
      if (response.status !== "ok") {
        const message = response.errors && response.errors[0].message;
        return reject(new Error(message || "Sheet tidak ditemukan"));
      }
      resolve(
        response.table.rows.map((row) =>
          row.c.map((cell) =>
            cell
              ? cell.f != null
                ? cell.f
                : cell.v == null
                  ? ""
                  : String(cell.v)
              : "",
          ),
        ),
      );
    };
    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error("Script diblokir"));
    };
    script.src = buildGvizUrl(
      spreadsheetId,
      sheetName,
      range,
      "responseHandler:" + callbackName,
    );
    document.head.appendChild(script);
  });
}

function buildGvizUrl(
  spreadsheetId: string,
  sheetName: string,
  range: string | undefined,
  outputOption: string,
): string {
  return (
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?headers=0` +
    `&tqx=${outputOption}&sheet=${encodeURIComponent(sheetName)}` +
    (range ? "&range=" + range : "")
  );
}

/** Returns the sheet as an array of rows (array of strings). Tries CSV first, then JSONP. */
async function fetchRows(
  spreadsheetId: string,
  sheetName: string,
  range?: string,
): Promise<string[][]> {
  try {
    const response = await fetch(
      buildGvizUrl(spreadsheetId, sheetName, range, "out:csv"),
    );
    if (!response.ok) throw new Error("HTTP " + response.status);
    return parseCsv(await response.text());
  } catch (error) {
    return fetchRowsViaJsonp(spreadsheetId, sheetName, range);
  }
}

/**
 * Turns raw rows into transactions. A transaction row is any row whose
 * column B looks like a date (dd/mm/yyyy). `row` is the 1-based row number in the sheet.
 * For the Savings and Debts sheets, `income` = deposited/borrowed and `expense` = withdrawn/repaid.
 */
function extractTransactions(rows: string[][]): Transaction[] {
  const transactions: Transaction[] = [];
  rows.forEach((cells, index) => {
    if (/^\d\d\/\d\d\/\d{4}$/.test((cells[1] || "").trim())) {
      transactions.push({
        row: index + 1,
        date: cells[1].trim(),
        category: (cells[2] || "").trim(),
        description: (cells[3] || "").trim(),
        income: parseRupiah(cells[4]),
        expense: parseRupiah(cells[5]),
      });
    }
  });
  return transactions;
}

/**
 * Loads every month sheet plus the Savings and Debts sheets.
 * Returns { months, savings, debts, missing } where
 *   months  = { [monthName]: { salary, transactions } }
 *   missing = human readable list of sheets that could not be loaded
 */
export async function loadSpreadsheet(
  spreadsheetId: string,
): Promise<LoadResult> {
  const months: Record<string, MonthData> = {};
  const missing: string[] = [];
  let savings: Transaction[] = [];
  let debts: Transaction[] = [];

  // A sheet is only accepted if its name appears in the top rows (column B).
  // Google silently returns the first sheet when a name does not exist.
  const loadSheet = async (
    sheetName: string,
    onLoaded: (
      rows: string[][],
      headerRows: string[][],
    ) => void | Promise<void>,
  ) => {
    try {
      const headerRows = await fetchRows(spreadsheetId, sheetName, "B1:B8");
      const nameMatches = headerRows.some((cells) =>
        String(cells[0]).toUpperCase().includes(sheetName.toUpperCase()),
      );
      if (!nameMatches) {
        missing.push(sheetName + " (sheet tidak ada)");
        return;
      }
      await onLoaded(await fetchRows(spreadsheetId, sheetName), headerRows);
    } catch (error) {
      missing.push(
        sheetName +
          " (" +
          (error instanceof Error ? error.message : String(error)) +
          ")",
      );
    }
  };

  await Promise.all([
    ...MONTH_NAMES.map((monthName) =>
      loadSheet(monthName, async (rows, headerRows) => {
        // The salary value sits in the cell right below the "Gaji" label.
        const labelIndex = headerRows.findIndex((cells) =>
          /gaji/i.test(cells[0]),
        );
        let salary = 0;
        if (labelIndex >= 0) {
          try {
            const valueRow = labelIndex + 2; // 1-based row number below the label
            const cellRows = await fetchRows(
              spreadsheetId,
              monthName,
              `B${valueRow}:B${valueRow}`,
            );
            salary = parseRupiah((cellRows[0] || [])[0]);
          } catch (error) {
            /* keep salary = 0 */
          }
        }
        months[monthName] = { salary, transactions: extractTransactions(rows) };
      }),
    ),
    loadSheet(SAVINGS_SHEET, (rows) => {
      savings = extractTransactions(rows);
    }),
    loadSheet(DEBTS_SHEET, (rows) => {
      debts = extractTransactions(rows);
    }),
  ]);
  return { months, savings, debts, missing };
}

// ---------------------------------------------------------------------------
// Writing through the Google Apps Script web app
// ---------------------------------------------------------------------------
// NOTE: the payload keys (act, sheet, row, old, v) are the contract with the
// deployed Apps Script (doPost). Do not rename them without updating the script.
const toWireDate = (isoDate: string): string =>
  isoDate.split("-").reverse().join("/");

export const buildSavePayload = ({
  sheet,
  row,
  original,
  form,
}: {
  sheet: string;
  row: number;
  original: Transaction;
  form: EntryForm;
}): AppsScriptPayload => ({
  act: row ? "update" : "add",
  sheet,
  row,
  old: { d: original.date, n: original.description },
  v: [
    toWireDate(form.date),
    form.category,
    form.description,
    +form.income || "",
    +form.expense || "",
  ],
});
export const buildDeletePayload = (
  sheet: string,
  transaction: Transaction,
): AppsScriptPayload => ({
  act: "delete",
  sheet,
  row: transaction.row,
  old: { d: transaction.date, n: transaction.description },
});
export const buildSalaryPayload = (
  sheet: string,
  salary: number,
): AppsScriptPayload => ({
  act: "gaji",
  sheet,
  v: salary,
});
/** Asks Apps Script to copy `templateSheet` into a new, empty month sheet. `salary` is optional. */
export const buildNewSheetPayload = ({
  templateSheet,
  newName,
  salary,
}: {
  templateSheet: string;
  newName: string;
  salary: string | number | null;
}): AppsScriptPayload => ({
  act: "newSheet",
  tpl: templateSheet,
  name: newName,
  salary: salary === "" || salary == null ? null : +salary,
});

/** Builds the payload that saves all budget limits to the "Anggaran" sheet. */
export const buildBudgetPayload = (
  budgets: Record<string, number>,
): AppsScriptPayload => ({
  act: "budget",
  data: budgets,
});

/**
 * Reads the "Anggaran" sheet and returns { category: limit } mapping.
 * Falls back to an empty object if the sheet does not exist yet.
 */
export async function loadBudgets(
  spreadsheetId: string,
): Promise<Record<string, number>> {
  try {
    const rows = await fetchRows(spreadsheetId, BUDGET_SHEET);
    const result: Record<string, number> = {};
    // Skip header row (row 0); data starts at row 1
    for (let i = 1; i < rows.length; i++) {
      const category = (rows[i][0] || "").trim();
      const raw = (rows[i][1] || "").trim();
      if (category && raw) {
        const amount = parseInt(raw.replace(/\D/g, "")) || 0;
        if (amount > 0) result[category] = amount;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Fire-and-forget: Apps Script answers without CORS headers, so the result is opaque. */
export const sendToAppsScript = (
  appsScriptUrl: string,
  payload: AppsScriptPayload,
): Promise<Response> =>
  fetch(appsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload),
  });
