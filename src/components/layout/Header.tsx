import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  User,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const Header: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const {
    currentSection,
    settings,
    systemStatus,
    outages,
    creditCalculation,
    resetAllData,
    setCurrentSection,
  } = useApp();
  const { t } = useLanguage();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const sectionTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: t('pageTitleOverview'),
      subtitle: t('pageSubtitleOverview'),
    },
    bill: {
      title: t('pageTitleBill'),
      subtitle: t('pageSubtitleBill'),
    },
    outage: {
      title: t('pageTitleOutage'),
      subtitle: t('pageSubtitleOutage'),
    },
    calculator: {
      title: t('pageTitleCalculator'),
      subtitle: t('pageSubtitleCalculator'),
    },
    complaint: {
      title: t('pageTitleComplaint'),
      subtitle: t('pageSubtitleComplaint'),
    },
    payments: {
      title: t('pageTitlePayments'),
      subtitle: t('pageSubtitlePayments'),
    },
    settings: {
      title: t('pageTitleSettings'),
      subtitle: t('pageSubtitleSettings'),
    },
  };

  const currentInfo = sectionTitles[currentSection] || {
    title: t('appName'),
    subtitle: t('tagline'),
  };

  const notificationCount = outages.filter((o) => o.isEligibleForCredit).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-3 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              {currentInfo.title}
            </h1>
            <p className="hidden md:block text-xs text-slate-500 font-normal truncate max-w-xs xl:max-w-md">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Badges, Language Selector, Actions, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Status Badges */}
          <div className="hidden xl:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gemini 3.8 Flash
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" />
              {systemStatus.paypalConfigured ? 'PayPal Sandbox' : t('sampleDemoData')}
            </span>
          </div>

          {/* Prominent Language Selector */}
          <LanguageSelector />

          {/* Reset Demo Button */}
          <button
            onClick={resetAllData}
            title={t('resetDemoData')}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">{t('resetDemo')}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/20 sm:hidden"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      {t('alertsAndNotifications')}
                    </span>
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {notificationCount} {t('active')}
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    <div
                      onClick={() => {
                        setCurrentSection('calculator');
                        setShowNotifications(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {t('breachedSLA')}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t('rebateReady')} ₹{creditCalculation?.estimatedCreditAmount.toFixed(2) || '133.20'}
                          </p>
                          <span className="text-[10px] text-blue-600 font-medium inline-block mt-1">
                            {t('computeServiceCredit')} →
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setCurrentSection('payments');
                        setShowNotifications(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            PayPal Sandbox
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            ₹999.00 ($12.00) • {t('simulateProviderRefund')}
                          </p>
                          <span className="text-[10px] text-blue-600 font-medium inline-block mt-1">
                            {t('navPayments')} →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-2 border-t border-slate-100 text-center bg-slate-50">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                    >
                      {t('close')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {settings.displayName.charAt(0) || 'V'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-none">
                  {settings.displayName}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  {settings.accountNumber}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/20 sm:hidden"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{settings.displayName}</p>
                    <p className="text-[11px] text-slate-500">{settings.defaultProvider}</p>
                    <p className="text-[10px] text-blue-600 font-mono mt-0.5">ID: {settings.accountNumber}</p>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        setCurrentSection('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {t('accountSettings')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
