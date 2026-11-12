import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Sparkles,
  ArrowRight,
  Info,
  RotateCcw,
  Scale,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { explainCreditWithGemini } from '../../services/api';
import { CreditCalculation } from '../../types';

export const CreditCalculatorPage: React.FC = () => {
  const {
    bill,
    outages,
    creditCalculation,
    setCreditCalculation,
    setCurrentSection,
    setGuidedStep,
    showToast,
  } = useApp();
  const { t, language } = useLanguage();

  // Inputs
  const [monthlyRental, setMonthlyRental] = useState<number>(
    bill?.monthlyRental || 999
  );
  const [billingPeriodDays, setBillingPeriodDays] = useState<number>(
    bill?.billingPeriodDays || 30
  );

  // Calculate total downtime days from logged outages
  const totalLoggedMinutes = outages.reduce(
    (sum, o) => (o.isEligibleForCredit ? sum + (o.durationMinutes || 0) : sum),
    0
  );
  const initialDowntimeDays = Math.max(
    0.5,
    parseFloat((totalLoggedMinutes / 1440).toFixed(1))
  );

  const [downtimeDays, setDowntimeDays] = useState<number>(
    initialDowntimeDays > 0 ? initialDowntimeDays : 4
  );
  const [policyType, setPolicyType] = useState<
    'trai_standard' | 'strict_sla' | 'custom_provider'
  >('trai_standard');

  const [aiExplanation, setAiExplanation] = useState<string>(
    creditCalculation?.aiExplanation ||
      'Under Telecom Regulatory Authority of India (TRAI) Quality of Service (QoS) broadband regulations, service providers are legally obligated to resolve service faults within 24 to 48 hours. When internet connectivity is disrupted exceeding SLA guidelines without proportionate advance waiver, the subscriber is entitled to a prorated rebate computed as [Base Monthly Rental / Billing Days] × Eligible Outage Duration.'
  );
  const [isExplaining, setIsExplaining] = useState(false);

  // Deterministic rule-based calculation
  const dailyRate = monthlyRental / billingPeriodDays;
  let multiplier = 1.0;
  if (policyType === 'strict_sla' && downtimeDays >= 3) {
    multiplier = 1.5; // Strict penalty multiplier for prolonged multi-day outages
  }

  const calculatedCredit = parseFloat((dailyRate * downtimeDays * multiplier).toFixed(2));
  const downtimeHours = downtimeDays * 24;

  const handleComputeAndSave = async () => {
    const breakdown = `Base Prorated Rate = ₹${monthlyRental} ÷ ${billingPeriodDays} days = ₹${dailyRate.toFixed(
      2
    )}/day × ${downtimeDays} Days${
      multiplier > 1.0 ? ` × ${multiplier} (Strict SLA penalty multiplier)` : ''
    } = ₹${calculatedCredit.toFixed(2)}`;

    const newCalc: CreditCalculation = {
      id: `calc-${Date.now()}`,
      billId: bill?.id,
      monthlyRental,
      billingPeriodDays,
      totalDowntimeMinutes: Math.round(downtimeDays * 1440),
      eligibleDowntimeHours: downtimeHours,
      eligibleDowntimeDays: downtimeDays,
      traiThresholdHours: 24,
      policyType,
      calculationBreakdown: breakdown,
      estimatedCreditAmount: calculatedCredit,
      currency: 'INR',
      calculatedAt: new Date().toISOString(),
      aiExplanation,
      disclaimer: t('calculatorDisclaimer'),
    };

    await setCreditCalculation(newCalc);
  };

  const handleGetAiExplanation = async () => {
    setIsExplaining(true);
    try {
      showToast('info', 'Gemini AI', t('geminiLegalAnalysis'));
      const explanation = await explainCreditWithGemini({
        monthlyRental,
        billingPeriodDays,
        eligibleDowntimeDays: downtimeDays,
        eligibleDowntimeHours: downtimeHours,
        creditAmount: calculatedCredit,
        provider: bill?.providerName || 'Broadband Provider',
        preferredLanguage: language,
      });
      setAiExplanation(explanation);
      showToast('success', t('verified'), 'Regulatory rationale updated by Gemini 3.8 Flash.');
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  // Sync with bill updates
  useEffect(() => {
    if (bill?.monthlyRental) {
      setMonthlyRental(bill.monthlyRental);
    }
    if (bill?.billingPeriodDays) {
      setBillingPeriodDays(bill.billingPeriodDays);
    }
  }, [bill]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Calculator className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t('creditCalculatorTitle')}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {t('creditCalculatorDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>{t('calculationParameters')}</span>
              <span className="text-[11px] font-normal text-slate-500">
                {t('traiQosGuard')}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Monthly Rental */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  {t('monthlyRentalBaseInr')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={monthlyRental}
                    onChange={(e) =>
                      setMonthlyRental(Math.max(1, parseFloat(e.target.value) || 0))
                    }
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  {t('totalInvoice')}: ₹{bill?.monthlyRental || 999}
                </span>
              </div>

              {/* Billing Cycle Days */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  {t('billingPeriodDurationDays')}
                </label>
                <input
                  type="number"
                  value={billingPeriodDays}
                  onChange={(e) =>
                    setBillingPeriodDays(Math.max(1, parseInt(e.target.value, 10) || 30))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  30 {t('days')}
                </span>
              </div>

              {/* Eligible Outage Days */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    {t('eligibleOutageDurationDays')}
                  </label>
                  <button
                    onClick={() => setDowntimeDays(initialDowntimeDays || 4)}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    {initialDowntimeDays} {t('days')}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={downtimeDays}
                  onChange={(e) =>
                    setDowntimeDays(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  {downtimeHours.toFixed(0)} {t('hours')}
                </span>
              </div>

              {/* Policy Preset */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  {t('applicableSlaPolicy')}
                </label>
                <select
                  value={policyType}
                  onChange={(e) =>
                    setPolicyType(e.target.value as any)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-blue-500"
                >
                  <option value="trai_standard">
                    {t('policyTraiStandard')}
                  </option>
                  <option value="strict_sla">
                    {t('policyStrictSla')}
                  </option>
                  <option value="custom_provider">
                    {t('policyCustomProvider')}
                  </option>
                </select>
                <span className="text-[10px] text-slate-400">
                  {t('traiQosGuard')}
                </span>
              </div>
            </div>

            {/* Slider for Interactive What-If simulation */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="font-medium">{t('interactiveSensitivity')}:</span>
                <span className="font-bold text-blue-700">{downtimeDays} {t('days')} ({downtimeHours} {t('hours')})</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={downtimeDays}
                onChange={(e) => setDowntimeDays(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5 {t('days')} (12h)</span>
                <span>4 {t('days')}</span>
                <span>15 {t('days')}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={handleComputeAndSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>{t('saveCalculationResult')}</span>
              </button>
            </div>
          </div>

          {/* Regulatory Context & Gemini Explanation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t('geminiLegalAnalysis')}
                </h3>
              </div>
              <button
                onClick={handleGetAiExplanation}
                disabled={isExplaining}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 flex items-center gap-1 cursor-pointer"
              >
                {isExplaining ? `${t('loading')}...` : t('refreshLegalAnalysis')}
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
              {aiExplanation}
            </p>

            <div className="flex items-start gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
              <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{t('traiSlaGuard')}:</span>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  {t('indianBroadbandProtection')} — TRAI QoS QoS standards.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Calculation Result Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-xl border-2 border-blue-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                {t('estimatedServiceCredit')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                {t('rebateReady')}
              </span>
            </div>

            {/* Big Amount */}
            <div className="text-center py-2">
              <span className="text-xs text-slate-500 font-medium block">
                {t('totalClaimableRebate')}
              </span>
              <div className="text-4xl font-extrabold text-slate-900 mt-1">
                ₹{calculatedCredit.toFixed(2)}
              </div>
              <span className="text-xs text-emerald-600 font-semibold block mt-1">
                ~ ${(calculatedCredit / 83.0).toFixed(2)} USD (PayPal Sandbox)
              </span>
            </div>

            {/* Breakdown Steps */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                {t('formulaBreakdown')}
              </span>

              <div className="flex justify-between text-slate-600">
                <span>{t('monthlyRentalBase')}:</span>
                <span className="font-semibold text-slate-900">₹{monthlyRental}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>{t('billingCycle')}:</span>
                <span className="font-semibold text-slate-900">{billingPeriodDays} {t('days')}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>{t('proratedPerDay')}:</span>
                <span className="font-semibold text-slate-900">
                  ₹{dailyRate.toFixed(2)} / day
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>{t('statTotalDowntime')}:</span>
                <span className="font-bold text-amber-700">
                  {downtimeDays} {t('days')} ({downtimeHours} {t('hours')})
                </span>
              </div>

              {multiplier > 1.0 && (
                <div className="flex justify-between text-indigo-700 font-medium">
                  <span>{t('policyStrictSla')}:</span>
                  <span>{multiplier}x</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                <span>{t('estimatedServiceCredit')}:</span>
                <span className="text-blue-700">₹{calculatedCredit.toFixed(2)}</span>
              </div>
            </div>

            {/* Required Disclaimer */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>{t('filter')}:</strong> {t('calculatorDisclaimer')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  handleComputeAndSave();
                  setCurrentSection('complaint');
                  setGuidedStep(6);
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{t('prepareFormalComplaint')}</span>
              </button>

              <button
                onClick={() => {
                  handleComputeAndSave();
                  setCurrentSection('payments');
                  setGuidedStep(7);
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('simulateProviderRefund')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
