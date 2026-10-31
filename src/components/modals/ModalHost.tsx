import { MONTH_NAMES, buildSavePayload } from "../../api";
import { useFinance } from "../../context/FinanceContext";
import { EntryModal } from "./EntryModal";
import { NewMonthModal } from "./NewMonthModal";
import { SalaryModal } from "./SalaryModal";

/** Renders whichever dialog is currently open (add/edit entry, new month sheet, salary). */
export function ModalHost() {
  const {
    editor,
    setEditor,
    sendChange,
    isNewMonthDialogOpen,
    setNewMonthDialogOpen,
    isSalaryModalOpen,
    setIsSalaryModalOpen,
    updateSalary,
    months,
    selectedMonth,
    createMonthSheet,
  } = useFinance();

  return (
    <>
      {isSalaryModalOpen && (
        <SalaryModal
          month={selectedMonth}
          currentSalary={months[selectedMonth]?.salary || 0}
          onSave={updateSalary}
          onClose={() => setIsSalaryModalOpen(false)}
        />
      )}
      {isNewMonthDialogOpen && (
        <NewMonthModal
          availableMonths={MONTH_NAMES.filter((month) => !months[month])}
          templateMonth={selectedMonth}
          onCreate={createMonthSheet}
          onClose={() => setNewMonthDialogOpen(false)}
        />
      )}
      {editor && (
        <EntryModal
          entry={editor}
          onClose={() => setEditor(null)}
          onSave={(form) => {
            setEditor(null);
            sendChange(
              buildSavePayload({
                sheet: editor.sheet,
                row: editor.row,
                original: editor.original,
                form,
              }),
            );
          }}
        />
      )}
    </>
  );
}
