# Pengatur Keuangan (React + Vite + TypeScript)

    npm install
    npm run dev        # jalankan lokal
    npm run build      # cek tipe (tsc) lalu build ke folder dist/
    npm run typecheck  # hanya cek tipe

## Struktur folder
    src/
      main.tsx                 titik masuk, memuat CSS
      App.tsx                  kerangka: header, halaman aktif, navigasi, dialog
      types.ts                 tipe data (Transaction, MonthData, AppsScriptPayload, ...)
      api.ts                   konfigurasi, baca Google Sheet, kirim ke Apps Script
      context/
        FinanceContext.tsx     state + aksi bersama (useFinance)
      hooks/
        useLocalStorage.ts
      utils/
        calc.ts                sumBy, sumExpensesByCategory
      pages/                   satu file per halaman
        SummaryPage, TransactionsPage, BudgetPage, SavingsPage, DebtsPage, AnalysisPage
      components/
        ui/                    Icon, KpiGrid, MonthPills
        charts/                Donut, ProgressRing
        transactions/          TransactionList
        modals/                EntryModal, NewMonthModal, ModalHost
        layout/                Header, SettingsPanel, BottomNav, AddButton
      styles/
        theme.css              warna (tema hijau + mode gelap)
        layout.css             kerangka halaman, navigasi, rata tengah
        components.css         kartu, tombol, grafik, daftar, dialog
    apps-script.gs             kode untuk Google Apps Script (Web app)

## Istilah data
`transaction = { row, date, category, description, income, expense }`
Sheet Tabungan: income = disetor, expense = diambil.
Sheet Hutang: income = hutang, expense = dikembalikan.
Nama sheet dan nilai kategori tetap bahasa Indonesia karena harus sama dengan isi Google Sheet.
