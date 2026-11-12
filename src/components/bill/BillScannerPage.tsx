import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { scanBillWithGemini } from '../../services/api';
import { BroadbandBill } from '../../types';
import { SAMPLE_BROADBAND_BILL } from '../../data/sampleData';

export const BillScannerPage: React.FC = () => {
  const { bill, updateBill, setCurrentSection, setGuidedStep, showToast } = useApp();
  const { t } = useLanguage();

  const [selectedFile, setSelectedFile] = useState<{
    file: File | null;
    previewUrl: string | null;
    base64: string | null;
    mimeType: string;
    fileName: string;
  }>({
    file: null,
    previewUrl: null,
    base64: null,
    mimeType: 'application/pdf',
    fileName: '',
  });

  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields for review & manual correction
  const [editableBill, setEditableBill] = useState<BroadbandBill | null>(bill);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please upload a valid PDF document or PNG/JPEG image.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      setSelectedFile({
        file,
        previewUrl: file.type.startsWith('image/') ? result : null,
        base64: base64Data,
        mimeType: file.type,
        fileName: file.name,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile({
      file: null,
      previewUrl: null,
      base64: null,
      mimeType: 'application/pdf',
      fileName: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSampleBill = () => {
    setSelectedFile({
      file: null,
      previewUrl: null,
      base64: null,
      mimeType: 'application/pdf',
      fileName: 'ACT_Fibernet_Tax_Invoice_Oct2026.pdf (Sample)',
    });
    setEditableBill(SAMPLE_BROADBAND_BILL);
    updateBill(SAMPLE_BROADBAND_BILL);
    showToast('info', t('sampleDemoData'), 'Ready-to-analyze ACT Fibernet October invoice loaded.');
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile.base64 && !selectedFile.fileName.includes('Sample')) {
      setErrorMsg('Please upload a broadband bill file or select the sample bill to analyze.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      if (selectedFile.base64) {
        // Call Gemini 3.8 Flash via backend API
        const extracted = await scanBillWithGemini({
          imageBase64: selectedFile.base64,
          mimeType: selectedFile.mimeType,
          fileName: selectedFile.fileName,
        });

        setEditableBill(extracted);
        await updateBill(extracted);
        showToast('success', t('verified'), 'Successfully extracted billing metrics with Gemini 3.8 Flash.');
      } else {
        // Sample bill fallback simulation for instant analysis
        await new Promise((r) => setTimeout(r, 1200));
        setEditableBill(SAMPLE_BROADBAND_BILL);
        await updateBill(SAMPLE_BROADBAND_BILL);
        showToast('success', t('verified'), 'Extracted billing metrics from ACT Fibernet statement.');
      }
      setGuidedStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze bill document.');
      showToast('error', 'Error', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!editableBill) return;
    const verified: BroadbandBill = {
      ...editableBill,
      isVerifiedByUser: true,
    };
    await updateBill(verified);
    setIsEditing(false);
    showToast('success', t('verified'), 'Your corrections have been saved to your active plan.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t('billScannerTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('billScannerDesc')}
            </p>
          </div>

          <button
            onClick={handleLoadSampleBill}
            className="self-start sm:self-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-blue-600" />
            {t('loadSampleBill')}
          </button>
        </div>
      </div>

      {/* Upload Dropzone & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {t('dropzoneTitle')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('dropzoneSub')}
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <p className="text-xs font-bold text-slate-800">
                {t('dropzoneClick')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Airtel, Jio, ACT, Tata Play, BSNL
              </p>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Selected File Status */}
          {selectedFile.fileName && (
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-white text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  {selectedFile.mimeType.startsWith('image') ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {selectedFile.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Gemini 3.8 Flash
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearFile}
                  title={t('delete')}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Start Analysis Button */}
          <div className="mt-4">
            <button
              onClick={handleStartAnalysis}
              disabled={isScanning || (!selectedFile.base64 && !selectedFile.fileName)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('geminiExtracting')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('startAiBillAnalysis')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Preview / Guidelines */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {t('documentPreview')}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedFile.fileName || t('sampleDemoData')}
          </p>

          <div className="flex-1 min-h-[220px] bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-center items-center text-center">
            {selectedFile.previewUrl ? (
              <div className="max-h-56 overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={selectedFile.previewUrl}
                  alt="Bill Preview"
                  className="max-h-52 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-500 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800">
                  {selectedFile.fileName || t('sampleDemoData')}
                </p>
                <p className="text-[11px] text-slate-400">
                  {t('traiQosGuard')}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-[11px] text-amber-800">
            {t('ruleNotFound')}
          </div>
        </div>
      </div>

      {/* Extracted Bill Details (Review & Edit) */}
      {editableBill && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t('extractedParticulars')}
                </h3>
                {editableBill.isVerifiedByUser && (
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {t('userVerified')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('verified')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  onClick={handleSaveEdits}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {t('saveChanges')}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t('edit')}
                </button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Provider */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('broadbandProvider')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableBill.providerName}
                  onChange={(e) =>
                    setEditableBill({ ...editableBill, providerName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-semibold text-slate-900">
                  {editableBill.providerName}
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('subscriberName')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableBill.customerName}
                  onChange={(e) =>
                    setEditableBill({ ...editableBill, customerName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-900">
                  {editableBill.customerName}
                </div>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('accountReference')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableBill.accountNumber}
                  onChange={(e) =>
                    setEditableBill({ ...editableBill, accountNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-slate-900">
                  {editableBill.accountNumber}
                </div>
              )}
            </div>

            {/* Monthly Rental */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('monthlyRentalBase')}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editableBill.monthlyRental}
                  onChange={(e) =>
                    setEditableBill({
                      ...editableBill,
                      monthlyRental: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100 font-bold text-blue-900 text-sm">
                  ₹{editableBill.monthlyRental.toFixed(2)}
                </div>
              )}
            </div>

            {/* Taxes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('taxesGst')}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editableBill.taxes}
                  onChange={(e) =>
                    setEditableBill({
                      ...editableBill,
                      taxes: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-900">
                  ₹{editableBill.taxes.toFixed(2)}
                </div>
              )}
            </div>

            {/* Total Amount Payable */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('totalPayable')}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editableBill.totalAmountPayable}
                  onChange={(e) =>
                    setEditableBill({
                      ...editableBill,
                      totalAmountPayable: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-bold text-slate-900">
                  ₹{editableBill.totalAmountPayable.toFixed(2)}
                </div>
              )}
            </div>

            {/* Billing Period Start & End */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('billingPeriodStartEnd')}
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editableBill.billingPeriodStart}
                    onChange={(e) =>
                      setEditableBill({ ...editableBill, billingPeriodStart: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-blue-500"
                  />
                  <input
                    type="date"
                    value={editableBill.billingPeriodEnd}
                    onChange={(e) =>
                      setEditableBill({ ...editableBill, billingPeriodEnd: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-900">
                  {editableBill.billingPeriodStart} to {editableBill.billingPeriodEnd} ({editableBill.billingPeriodDays} {t('days')})
                </div>
              )}
            </div>

            {/* Plan Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('planType')}
              </label>
              {isEditing ? (
                <select
                  value={editableBill.planType}
                  onChange={(e) =>
                    setEditableBill({
                      ...editableBill,
                      planType: e.target.value as 'Postpaid' | 'Prepaid',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-blue-500"
                >
                  <option value="Postpaid">Postpaid</option>
                  <option value="Prepaid">Prepaid</option>
                </select>
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-900">
                  {editableBill.planType}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">
                {t('paymentDueDate')}
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editableBill.dueDate}
                  onChange={(e) =>
                    setEditableBill({ ...editableBill, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-500"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium text-slate-900">
                  {editableBill.dueDate}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {t('verified')} • Gemini 3.8 Flash
            </span>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setCurrentSection('outage');
                  setGuidedStep(4);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{t('proceedToDowntime')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
