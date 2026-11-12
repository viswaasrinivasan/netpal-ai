import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { createPayPalOrder, capturePayPalOrder, refundPayPalPayment } from '../../services/api';

export const PaymentsRefundPage: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    creditCalculation,
    bill,
    systemStatus,
    showToast,
  } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'checkout' | 'transactions' | 'provider_portal'>(
    'checkout'
  );

  // Checkout State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutPlan] = useState({
    name: bill?.planSpeed || '150 Mbps Fiber Unlimited (Monthly Billing)',
    provider: bill?.providerName || 'Demo Broadband',
    amountINR: bill?.monthlyRental || 999.0,
    amountUSD: 12.0, // Standard sandbox exchange for testing
  });

  // Provider Claim Review State (Administrative Portal)
  const [selectedTxId, setSelectedTxId] = useState<string>(
    transactions[0]?.id || ''
  );
  const [claimDecision, setClaimDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [approvedRefundINR, setApprovedRefundINR] = useState<number>(
    creditCalculation?.estimatedCreditAmount || 133.20
  );
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundNote, setRefundNote] = useState<string>(
    'Broadband outage service credit approved under TRAI SLA policy (4 Days Downtime)'
  );

  // Active transaction for refund
  const currentTx = transactions.find((t) => t.id === selectedTxId) || transactions[0];

  // Calculate remaining refundable balance
  const totalRefundedINR = currentTx
    ? currentTx.refunds.reduce((sum, r) => sum + (r.amountInINR || 0), 0)
    : 0;
  const remainingBalanceINR = currentTx
    ? Math.max(0, currentTx.amountInINR - totalRefundedINR)
    : 0;

  // Handle Sandbox Checkout Flow
  const handleStartCheckout = async () => {
    setIsProcessingPayment(true);
    try {
      showToast('info', 'PayPal', 'Initiating Sandbox order...');

      // 1. Create Order through Backend
      const order = await createPayPalOrder({
        amount: checkoutPlan.amountUSD,
        currency: 'USD',
        planName: `${checkoutPlan.provider} - ${checkoutPlan.name}`,
      });

      // 2. Capture Order through Backend
      showToast('info', 'PayPal', 'Capturing PayPal Sandbox funds...');
      await new Promise((r) => setTimeout(r, 800)); // Smooth UX transition

      const capturedTx = await capturePayPalOrder({
        orderId: order.orderId,
        amountInINR: checkoutPlan.amountINR,
        amountInUSD: checkoutPlan.amountUSD,
        planName: checkoutPlan.name,
      });

      await addTransaction(capturedTx);
      setSelectedTxId(capturedTx.id);
      setActiveTab('transactions');
      showToast('success', t('verified'), `Captured ₹${capturedTx.amountInINR} ($${capturedTx.amountInUSD.toFixed(2)} USD).`);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Provider-Side Authorized Partial Refund
  const handleProcessRefund = async () => {
    if (!currentTx) {
      showToast('error', 'Error', 'No transaction selected for refund.');
      return;
    }

    if (claimDecision !== 'approved') {
      showToast('error', 'Error', 'Telecom administrator must approve compensation before refunding.');
      return;
    }

    if (approvedRefundINR <= 0 || approvedRefundINR > remainingBalanceINR) {
      showToast('error', 'Error', `Refund amount must be between ₹1 and ₹${remainingBalanceINR.toFixed(2)}.`);
      return;
    }

    setIsProcessingRefund(true);
    try {
      showToast('info', 'PayPal', 'Sending refund request to PayPal REST API...');

      const refundUSD = parseFloat((approvedRefundINR / 83.0).toFixed(2));

      const res = await refundPayPalPayment({
        transactionId: currentTx.id,
        captureId: currentTx.captureId,
        refundAmountINR: approvedRefundINR,
        refundAmountUSD: refundUSD,
        reason: refundNote,
        approvedBy: 'Telecom Claims Officer (ID: TEL-8812)',
      });

      await updateTransaction(res.updatedTransaction);
      showToast('success', t('verified'), `Reversed ₹${approvedRefundINR.toFixed(2)} ($${refundUSD}) via PayPal Sandbox.`);
      setActiveTab('transactions');
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <CreditCard className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t('paymentsTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('paymentsDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                systemStatus.paypalConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{systemStatus.paypalConfigured ? 'Live Sandbox' : t('sampleDemoData')}</span>
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mt-5 flex gap-2 border-b border-slate-100 pb-3 text-xs">
          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'checkout'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('tabCheckout')}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{t('tabTransactions')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('provider_portal')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'provider_portal'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t('tabProviderPortal')}</span>
          </button>
        </div>
      </div>

      {/* Tab A: Sandbox Checkout */}
      {activeTab === 'checkout' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              {t('invoiceDetails')}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">{t('broadbandProvider')}:</span>
                <span className="font-bold text-slate-900">{checkoutPlan.provider}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">{t('planType')}:</span>
                <span className="font-semibold text-slate-900">{checkoutPlan.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">{t('billingCycle')}:</span>
                <span className="font-medium text-slate-700">30 {t('days')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">{t('totalPayable')}:</span>
                <span className="font-bold text-slate-900 text-base">
                  ₹{checkoutPlan.amountINR.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-slate-500 text-[11px]">
                <span>PayPal Sandbox:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${checkoutPlan.amountUSD.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900">
              <span className="font-bold block">{t('traiSlaGuard')}:</span>
              {t('paypalNotice')}
            </div>
          </div>

          {/* Checkout Action Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                {t('payWithPaypal')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('payPalSandboxCheckout')}
              </p>

              {/* Mock PayPal Button Appearance */}
              <div className="pt-4 space-y-3">
                <button
                  onClick={handleStartCheckout}
                  disabled={isProcessingPayment}
                  className="w-full py-3 px-4 bg-[#FFC439] hover:bg-[#F2BA36] disabled:opacity-50 text-slate-900 font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
                      <span>{t('processing')}...</span>
                    </>
                  ) : (
                    <>
                      <span className="italic font-extrabold text-blue-900 tracking-tight text-sm">
                        Pay<span className="text-blue-600">Pal</span>
                      </span>
                      <span className="text-slate-800 font-semibold text-xs ml-1">
                        Sandbox (₹{checkoutPlan.amountINR.toFixed(2)} / ${checkoutPlan.amountUSD.toFixed(2)})
                      </span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  TLS 1.3 • PayPal Sandbox Mode
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{t('apiStatus')}:</span>
              <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                PayPal Developer Sandbox
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab B: Payment Records */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('capturedTransactions')} ({transactions.length})
              </h3>
              <p className="text-xs text-slate-500">
                {t('savedRecords')}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('provider_portal')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{t('providerPortalTitle')}</span>
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              {t('sampleDemoData')}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const totalRefINR = tx.refunds.reduce((sum, r) => sum + (r.amountInINR || 0), 0);
                const remainingINR = tx.amountInINR - totalRefINR;

                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 bg-slate-50/40 space-y-3 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {tx.planName}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : tx.status === 'PARTIALLY_REFUNDED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tx.providerName} • {tx.payerName || 'Viswaa Srinivasan'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-base block">
                          ₹{tx.amountInINR.toFixed(2)} (${tx.amountInUSD.toFixed(2)} USD)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Transaction IDs and Balances */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-3 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">PayPal Order ID</span>
                        <span className="font-mono text-slate-800 font-semibold truncate block">
                          {tx.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Capture ID</span>
                        <span className="font-mono text-blue-700 font-semibold truncate block">
                          {tx.captureId || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t('statPotentialCredits')}</span>
                        <span className="font-bold text-amber-700 block">
                          ₹{totalRefINR.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t('totalPayable')}</span>
                        <span className="font-bold text-emerald-700 block">
                          ₹{remainingINR.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab C: Provider-Side Demonstration Workflow (Review & Partial Refund) */}
      {activeTab === 'provider_portal' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('providerPortalTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('providerPortalSubtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Consumer Claim Summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t('officialLetterDraft')}
              </span>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">{t('accountReference')}:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {bill?.accountNumber || 'ACT-BLR-8839210'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">{t('statTotalDowntime')}:</span>
                  <span className="font-bold text-amber-800">
                    4 {t('days')} (96 {t('hours')})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">{t('trai24hThreshold')}:</span>
                  <span className="font-semibold text-emerald-700">
                    {t('eligible')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">{t('totalInvoice')}:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{currentTx?.amountInINR.toFixed(2) || '999.00'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-900 font-bold text-sm">
                  <span>{t('claimAmount')}:</span>
                  <span className="text-blue-700">
                    ₹{creditCalculation?.estimatedCreditAmount.toFixed(2) || '133.20'}
                  </span>
                </div>
              </div>

              {/* Administrative Decision Buttons */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('providerPortalTitle')}:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setClaimDecision('approved');
                      showToast('info', t('verified'), `Authorized ₹${approvedRefundINR.toFixed(2)}.`);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      claimDecision === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('approveCredit')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setClaimDecision('rejected');
                      showToast('info', t('cancel'), 'Claim disputed.');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      claimDecision === 'rejected'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-red-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t('rejectDispute')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Refund Execution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
                  {t('partialRefundAuth')}
                </span>

                <div className="space-y-3 text-xs">
                  {/* Select target transaction */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      PayPal Capture ID:
                    </label>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-800 text-xs">
                      {currentTx?.captureId || 'CAPTURE-CAP-992140283A'}
                    </div>
                  </div>

                  {/* Refund Amount Input */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      {t('approvedRefundInr')}:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        max={remainingBalanceINR}
                        value={approvedRefundINR}
                        onChange={(e) =>
                          setApprovedRefundINR(parseFloat(e.target.value) || 0)
                        }
                        className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-blue-500"
                      />
                    </div>
                  </div>

                  {/* Refund Memo */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      {t('reasonNote')}:
                    </label>
                    <input
                      type="text"
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Execution Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleProcessRefund}
                  disabled={
                    isProcessingRefund ||
                    claimDecision !== 'approved' ||
                    approvedRefundINR <= 0 ||
                    approvedRefundINR > remainingBalanceINR
                  }
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingRefund ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('processing')}...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('authorizeAndExecuteRefund')} (₹{approvedRefundINR.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Educational Disclaimer */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
            {t('paypalNotice')}
          </div>
        </div>
      )}
    </div>
  );
};
