import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  WifiOff,
  Calculator,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp, AppSection } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { currentSection, setCurrentSection, outages, creditCalculation } = useApp();
  const { t } = useLanguage();

  const handleNavClick = (section: AppSection) => {
    setCurrentSection(section);
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'overview' as AppSection, label: t('navOverview'), icon: LayoutDashboard },
    { id: 'bill' as AppSection, label: t('navBill'), badge: 'AI Scan', icon: FileSearch },
    { id: 'outage' as AppSection, label: t('navOutage'), icon: WifiOff },
    { id: 'calculator' as AppSection, label: t('navCalculator'), badge: 'Rules + AI', icon: Calculator },
    { id: 'complaint' as AppSection, label: t('navComplaint'), badge: 'TRAI / Nodal', icon: FileText },
    { id: 'payments' as AppSection, label: t('navPayments'), badge: 'PayPal', icon: CreditCard },
    { id: 'settings' as AppSection, label: t('navSettings'), icon: Settings },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('overview')}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">NetPal</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none">{t('appCategory')}</p>
          </div>
        </div>

        {/* Close Button on Mobile & Tablet */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          {t('coreAssistant')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Outage & Claim Quick Stats in Sidebar */}
      <div className="p-3 mx-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t('traiSlaGuard')}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t('downtimeLogged')}:</span>
            <span className="font-semibold text-slate-900">
              {outages.reduce((sum, o) => sum + (o.durationMinutes || 0), 0) / 60} {t('hours')}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{t('potentialCredit')}:</span>
            <span className="font-bold text-blue-700">
              ₹{creditCalculation?.estimatedCreditAmount.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        <button
          onClick={() => handleNavClick('calculator')}
          className="mt-2.5 w-full py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-blue-600" />
          {t('reviewCompensation')}
        </button>
      </div>

      {/* Target Audience Footer */}
      <div className="p-3 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          {t('indianBroadbandProtection')}
        </p>
        <p className="text-[10px] text-slate-500">{t('traiQoSCompliant')}</p>
      </div>
    </aside>
  );
};
