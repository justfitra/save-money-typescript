import { useFinance } from "../../context/FinanceContext";
import { Icon } from "../ui/Icon";

/** Collapsible panel with the Google Sheet link and the Apps Script URL. */
export function SettingsPanel() {
  const { sheetUrl, setSheetUrl, appsScriptUrl, setAppsScriptUrl } =
    useFinance();
  return (
    <details className="settings">
      <summary>
        <Icon name="fa-gear" /> Pengaturan sumber data
      </summary>
      <div className="card">
        <label className="muted">Link Google Sheet</label>
        <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
        <label className="muted">URL Apps Script</label>
        <input
          value={appsScriptUrl}
          onChange={(e) => setAppsScriptUrl(e.target.value)}
        />
      </div>
    </details>
  );
}
