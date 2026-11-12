import React, { useState } from 'react';
import {
  Settings,
  User,
  Wifi,
  Languages,
  Bell,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Check,
  Save,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { UserSettings } from '../../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, systemStatus, resetAllData, showToast } = useApp();
  const { t, language, setLanguage } = useLanguage();

  const [formSettings, setFormSettings] = useState<UserSettings>(settings);
  const [hasSaved, setHasSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formSettings);
    setHasSaved(true);
    showToast('success', t('saveSettings'), t('savedRecords'));
    setTimeout(() => setHasSaved(false), 2500);
  };

  const handleLanguageChange = (newLangCode: any) => {
    setLanguage(newLangCode);
    setFormSettings({
      ...formSettings,
      preferredLanguage: newLangCode,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Settings className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t('settingsTitle')}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {t('settingsDesc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>{t('subscriberProfile')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('subscriberDisplayName')}
              </label>
              <input
                type="text"
                value={formSettings.displayName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, displayName: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('primaryProvider')}
              </label>
              <input
                type="text"
                value={formSettings.defaultProvider}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, defaultProvider: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('defaultAccountNo')}
              </label>
              <input
                type="text"
                value={formSettings.accountNumber}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, accountNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('currencyStandard')}
              </label>
              <input
                type="text"
                disabled
                value="INR (₹) - Indian Rupee"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Language & Regulatory Formats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-600" />
            <span>{t('languagePreferences')}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1 max-w-md">
              <label className="font-semibold text-slate-700 block">
                {t('preferredComplaintLang')}
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-blue-500 bg-white"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name}) {lang.script ? `— ${lang.script}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                {t('pageSubtitleSettings')}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>{t('alertPreferences')}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.emailNotifications}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  {t('emailNotifications')}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {t('auditLogs')}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.smsOutageAlerts}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    smsOutageAlerts: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  {t('smsOutageAlerts')}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {t('trai24hThreshold')}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* System & API Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>{t('apiStatus')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 font-bold block text-xs">
                Google Gemini API
              </span>
              <span className="text-[11px] text-emerald-700 mt-0.5 block">
                Model: <strong>gemini-3.8-flash</strong> active on server proxy.
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Server-side execution ensures user API keys remain fully secured.
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-blue-900 font-bold block text-xs">
                PayPal Developer Sandbox
              </span>
              <span className="text-[11px] text-blue-800 mt-0.5 block">
                Mode: {systemStatus.paypalConfigured ? 'Live REST API' : 'High-Fidelity Sandbox Simulator'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Configured via PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={resetAllData}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetDemoData')}</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {hasSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t('savedRecords')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('saveSettings')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
