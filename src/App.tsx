import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GuidedTourBanner } from './components/layout/GuidedTourBanner';
import { OverviewPage } from './components/overview/OverviewPage';
import { BillScannerPage } from './components/bill/BillScannerPage';
import { DowntimeTrackerPage } from './components/outage/DowntimeTrackerPage';
import { CreditCalculatorPage } from './components/calculator/CreditCalculatorPage';
import { ComplaintGeneratorPage } from './components/complaint/ComplaintGeneratorPage';
import { PaymentsRefundPage } from './components/payments/PaymentsRefundPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentSection, toasts, removeToast } = useApp();
  const { isRTL } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased flex flex-col lg:flex-row selection:bg-blue-100 selection:text-blue-900"
    >
      {/* Mobile & Tablet Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-2xs lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <GuidedTourBanner />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentSection === 'overview' && <OverviewPage />}
          {currentSection === 'bill' && <BillScannerPage />}
          {currentSection === 'outage' && <DowntimeTrackerPage />}
          {currentSection === 'calculator' && <CreditCalculatorPage />}
          {currentSection === 'complaint' && <ComplaintGeneratorPage />}
          {currentSection === 'payments' && <PaymentsRefundPage />}
          {currentSection === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Toast Notifications */}
      <div className={`fixed bottom-4 z-50 space-y-2 max-w-sm w-full pointer-events-none ${isRTL ? 'left-4' : 'right-4'}`}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs flex items-start gap-2.5 bg-white transition-all animate-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'success'
                ? 'border-emerald-200 text-emerald-950'
                : toast.type === 'error'
                ? 'border-red-200 text-red-950'
                : 'border-blue-200 text-blue-950'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 leading-tight">{toast.title}</p>
              <p className="text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 -mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </LanguageProvider>
  );
}

