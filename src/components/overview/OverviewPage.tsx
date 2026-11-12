import React from 'react';
import {
  WifiOff,
  Calculator,
  FileSearch,
  FileText,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

export const OverviewPage: React.FC = () => {
  const {
    bill,
    outages,
    creditCalculation,
    complaints,
    settings,
    setCurrentSection,
    setGuidedStep,
  } = useApp();
  const { t } = useLanguage();

  const totalDowntimeMinutes = outages.reduce(
    (sum, o) => sum + (o.durationMinutes || 0),
    0
  );
  const totalDowntimeHours = (totalDowntimeMinutes / 60).toFixed(1);
  const totalDowntimeDays = (totalDowntimeMinutes / 1440).toFixed(1);

  const eligibleOutagesCount = outages.filter((o) => o.isEligibleForCredit).length;
  const pendingComplaintsCount = complaints.filter(
    (c) => c.status !== 'Submitted Externally'
  ).length;

  const dailyProratedRate = ((bill?.monthlyRental || 999) / (bill?.billingPeriodDays || 30)).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Welcome & Demo Banner (Optimized vertical height) */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('consumerProtectionActive')}
            </span>
            <span className="text-blue-100 text-xs font-medium">{t('traiQosGuard')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('welcomeHeading')}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            {t('welcomeSubheading')}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setCurrentSection('bill');
                setGuidedStep(2);
              }}
              className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSearch className="w-3.5 h-3.5" />
              {t('analyzeNewBill')}
            </button>
            <button
              onClick={() => {
                setCurrentSection('outage');
                setGuidedStep(4);
              }}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-white border border-white/20 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <WifiOff className="w-3.5 h-3.5" />
              {t('logOutageIncident')}
            </button>
            <button
              onClick={() => {
                setCurrentSection('calculator');
                setGuidedStep(5);
              }}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-white border border-white/20 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              {t('computeServiceCredit')}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Functional Dashboard Statistics populated from application records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Reported Outages */}
        <div
          onClick={() => setCurrentSection('outage')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t('statTotalOutages')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <WifiOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-slate-900">
                {outages.length}
              </p>
              <span className="text-xs text-slate-500 font-medium">{t('incidents')}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 truncate font-medium">
              {eligibleOutagesCount} {t('verifiedForSla')}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {settings.demoMode ? t('sampleDemoData') : t('savedRecords')}
            </span>
            <span className="text-blue-600 group-hover:text-blue-800 font-semibold flex items-center gap-0.5">
              {t('viewTracker')} →
            </span>
          </div>
        </div>

        {/* Stat 2: Total Downtime */}
        <div
          onClick={() => setCurrentSection('outage')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t('statTotalDowntime')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-slate-900">
                {totalDowntimeHours}
              </p>
              <span className="text-xs text-slate-500 font-medium">{t('hours')}</span>
            </div>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">
              {totalDowntimeDays} {t('days')} {t('acrossBillingCycle')}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded font-semibold text-[10px]">
              {parseFloat(totalDowntimeHours) >= 24 ? t('breachedSLA') : t('withinSLA')}
            </span>
            <span className="text-blue-600 group-hover:text-blue-800 font-semibold flex items-center gap-0.5">
              {t('auditLogs')} →
            </span>
          </div>
        </div>

        {/* Stat 3: Potential Service Credits */}
        <div
          onClick={() => setCurrentSection('calculator')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t('statPotentialCredits')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-emerald-600">
                ₹{creditCalculation?.estimatedCreditAmount.toFixed(2) || '133.20'}
              </p>
              <span className="text-xs text-emerald-700 font-medium">{t('claimable')}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('proratedPerDay')}: ₹{dailyProratedRate} × {creditCalculation?.eligibleDowntimeDays || 4.0}d
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {settings.demoMode ? t('sampleDemoData') : t('savedRecords')}
            </span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              {t('rebateReady')}
            </span>
          </div>
        </div>

        {/* Stat 4: Pending Complaints */}
        <div
          onClick={() => setCurrentSection('complaint')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t('statPendingComplaints')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-slate-900">
                {pendingComplaintsCount}
              </p>
              <span className="text-xs text-slate-500 font-medium">
                {t('incidents')}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 truncate font-medium">
              {complaints.length > 0 ? (complaints[0].recipientDesignation || 'TRAI / Nodal Officer') : t('readyToSend')}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold text-[10px]">
              {t('readyToSend')}
            </span>
            <span className="text-blue-600 group-hover:text-blue-800 font-semibold flex items-center gap-0.5">
              {t('reviewDraft')} →
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Internet Service Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Service Overview & Recent Outages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Internet Service Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t('serviceOverview')}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {bill?.fileName || t('verified')}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">{t('subscriberName')}</span>
                <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                  {bill?.customerName || settings.displayName || 'Viswaa Srinivasan'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">{t('accountReference')}</span>
                <span className="font-semibold text-slate-900 mt-0.5 block font-mono">
                  {bill?.accountNumber || settings.accountNumber || 'ACT-BLR-8839210'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">{t('billingCycle')}</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {bill?.billingPeriodStart || '2026-10-01'} to {bill?.billingPeriodEnd || '2026-10-30'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">{t('totalInvoice')}</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  ₹{bill?.totalAmountPayable.toFixed(2) || '1178.82'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  {t('dueDate')}: <strong className="text-slate-900">{bill?.dueDate || '2026-11-15'}</strong> | {t('planType')}: <strong className="text-slate-900">{bill?.planType || 'Postpaid'}</strong>
                </span>
              </div>
              <button
                onClick={() => setCurrentSection('bill')}
                className="text-blue-700 hover:text-blue-900 font-semibold text-xs flex items-center gap-1"
              >
                {t('analyzeNewBill')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section B: Recent Outages Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t('recentOutages')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('recentOutagesDesc')}
                </p>
              </div>
              <button
                onClick={() => setCurrentSection('outage')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {t('viewTracker')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 font-semibold">{t('colIncidentDate')}</th>
                    <th className="py-2.5 font-semibold">{t('colDuration')}</th>
                    <th className="py-2.5 font-semibold">{t('colRootCause')}</th>
                    <th className="py-2.5 font-semibold">{t('colEvidence')}</th>
                    <th className="py-2.5 font-semibold">{t('colSlaStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outages.map((outage) => (
                    <tr key={outage.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <span className="font-semibold text-slate-900 block">
                          {outage.outageDate}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(outage.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(outage.restorationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-slate-800 block">
                          {outage.durationFormatted}
                        </span>
                        <span className="text-[11px] text-amber-700 font-medium">
                          {(outage.durationMinutes / 60).toFixed(0)} {t('hours')}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs">
                        <p className="text-slate-800 font-medium truncate" title={outage.description}>
                          {outage.description}
                        </p>
                        {outage.ticketId && (
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                            {outage.ticketId}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {outage.evidence.length} file{outage.evidence.length === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {t('eligible')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Section D: Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              {t('quickActions')}
            </h3>

            <div className="mt-3 space-y-2">
              <button
                onClick={() => {
                  setCurrentSection('bill');
                  setGuidedStep(2);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileSearch className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t('navBill')}</p>
                    <p className="text-[11px] text-slate-500">{t('dropzoneTitle')}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => {
                  setCurrentSection('outage');
                  setGuidedStep(4);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t('logOutageIncident')}</p>
                    <p className="text-[11px] text-slate-500">{t('downtimeTrackerDesc')}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => {
                  setCurrentSection('calculator');
                  setGuidedStep(5);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t('navCalculator')}</p>
                    <p className="text-[11px] text-slate-500">{t('traiQosGuard')}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => {
                  setCurrentSection('complaint');
                  setGuidedStep(6);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t('navComplaint')}</p>
                    <p className="text-[11px] text-slate-500">{t('officialLetterDraft')}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Section C: Recent Activity Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              {t('recentActivity')}
            </h3>

            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    PayPal Sandbox
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ₹999.00 ($12.00) • {t('simulateProviderRefund')}
                  </p>
                  <button
                    onClick={() => setCurrentSection('payments')}
                    className="text-[10px] text-blue-600 font-semibold hover:underline mt-0.5 inline-block cursor-pointer"
                  >
                    {t('navPayments')} →
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {t('officialLetterDraft')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ₹{creditCalculation?.estimatedCreditAmount.toFixed(2) || '133.20'} • {t('traiSlaGuard')}
                  </p>
                  <button
                    onClick={() => setCurrentSection('complaint')}
                    className="text-[10px] text-blue-600 font-semibold hover:underline mt-0.5 inline-block cursor-pointer"
                  >
                    {t('reviewDraft')} →
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSearch className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {t('pageTitleBill')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {bill?.providerName || 'ACT Fibernet'} • Gemini 3.8 Flash
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
