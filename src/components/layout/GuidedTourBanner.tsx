import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

export const GuidedTourBanner: React.FC = () => {
  const {
    guidedStep,
    setGuidedStep,
    nextGuidedStep,
    prevGuidedStep,
    isGuidedTourActive,
    setIsGuidedTourActive,
  } = useApp();
  const { t } = useLanguage();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const demoSteps = [
    {
      step: 1,
      label: t('pageTitleOverview'),
      shortDesc: t('welcomeSubheading'),
      actionText: `${t('next')}: ${t('navBill')}`,
    },
    {
      step: 2,
      label: t('dropzoneTitle'),
      shortDesc: t('billScannerDesc'),
      actionText: `${t('next')}: ${t('extractedParticulars')}`,
    },
    {
      step: 3,
      label: t('extractedParticulars'),
      shortDesc: '₹999 + GST 18% (₹179.82) — 30 Days Cycle',
      actionText: `${t('next')}: ${t('navOutage')}`,
    },
    {
      step: 4,
      label: t('downtimeTrackerTitle'),
      shortDesc: t('downtimeTrackerDesc'),
      actionText: `${t('next')}: ${t('navCalculator')}`,
    },
    {
      step: 5,
      label: t('creditCalculatorTitle'),
      shortDesc: '₹999 × 4 ÷ 30 = ₹133.20 (TRAI QoS SLA)',
      actionText: `${t('next')}: ${t('navComplaint')}`,
    },
    {
      step: 6,
      label: t('complaintGeneratorTitle'),
      shortDesc: t('complaintGeneratorDesc'),
      actionText: `${t('next')}: ${t('navPayments')}`,
    },
    {
      step: 7,
      label: 'PayPal Sandbox Checkout',
      shortDesc: t('paymentsDesc'),
      actionText: `${t('next')}: ${t('partialRefundAuth')}`,
    },
    {
      step: 8,
      label: t('partialRefundAuth'),
      shortDesc: '₹133.20 PayPal Sandbox Refund',
      actionText: `${t('resetDemo')} (1/8)`,
    },
  ];

  if (!isGuidedTourActive) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-blue-800">
          <Compass className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">{t('tourInteractiveTour')}:</span>
          <span className="text-blue-600">{t('tourExploreSteps')}</span>
        </div>
        <button
          onClick={() => {
            setIsGuidedTourActive(true);
            setIsCollapsed(false);
          }}
          className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2.5 py-1 rounded-md transition-colors"
        >
          <Play className="w-3 h-3 fill-blue-600 text-blue-600" />
          {t('resumeGuidedDemo')}
        </button>
      </div>
    );
  }

  const currentStepInfo = demoSteps[guidedStep - 1] || demoSteps[0];

  // Collapsed compact single-line view
  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/25 text-blue-300 font-bold text-[10px] shrink-0 border border-blue-400/30">
              {guidedStep}
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider shrink-0 hidden sm:inline">
              {t('evaluationGuide')}:
            </span>
            <span className="font-semibold text-slate-100 truncate text-xs">
              {guidedStep}/8 — {currentStepInfo.label}
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px] truncate">
              • {currentStepInfo.shortDesc}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={prevGuidedStep}
              disabled={guidedStep === 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title={t('back')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (guidedStep === 8) {
                  setGuidedStep(1);
                } else {
                  nextGuidedStep();
                }
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded shadow-2xs flex items-center gap-1 transition-colors"
            >
              <span>{currentStepInfo.actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              title={t('expand')}
            >
              <span>{t('expand')}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsGuidedTourActive(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              title={t('close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded multi-step view
  return (
    <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Step badge & description */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-sm shrink-0 border border-blue-400/30">
              {guidedStep}/8
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  {guidedStep}/8: {currentStepInfo.label}
                </span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/20 px-2 py-0.5 rounded-full font-medium">
                  {t('evaluationGuide')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                {currentStepInfo.shortDesc}
              </p>
            </div>
          </div>

          {/* Stepper buttons and Quick step pills */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {/* Step Indicators */}
            <div className="hidden lg:flex items-center gap-1 mr-2">
              {demoSteps.map((s) => (
                <button
                  key={s.step}
                  onClick={() => setGuidedStep(s.step)}
                  title={`${s.step}: ${s.label}`}
                  className={`w-6 h-6 rounded text-[11px] font-semibold transition-all ${
                    s.step === guidedStep
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : s.step < guidedStep
                      ? 'bg-blue-950 text-blue-300 hover:bg-blue-900'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s.step}
                </button>
              ))}
            </div>

            {/* Back button */}
            <button
              onClick={prevGuidedStep}
              disabled={guidedStep === 1}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center transition-colors ${
                guidedStep === 1
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={t('back')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Next Step / Action Button */}
            <button
              onClick={() => {
                if (guidedStep === 8) {
                  setGuidedStep(1);
                } else {
                  nextGuidedStep();
                }
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <span>{currentStepInfo.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Collapse Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors text-xs ml-1"
              title={t('collapse')}
            >
              <span className="hidden sm:inline text-[11px]">{t('collapse')}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setIsGuidedTourActive(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
