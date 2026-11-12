import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  Edit3,
  RefreshCw,
  Check,
  Languages,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { generateComplaintWithGemini } from '../../services/api';
import { ComplaintLetter, Language } from '../../types';
import { SAMPLE_COMPLAINT } from '../../data/sampleData';

export const ComplaintGeneratorPage: React.FC = () => {
  const {
    bill,
    outages,
    creditCalculation,
    complaints,
    settings,
    updateComplaint,
    setCurrentSection,
    setGuidedStep,
    showToast,
  } = useApp();
  const { t, language } = useLanguage();

  const activeComplaint = complaints[0] || SAMPLE_COMPLAINT;

  // Configuration options
  const [provider, setProvider] = useState<string>(
    bill?.providerName || settings.defaultProvider || 'Demo Broadband (ACT Fibernet)'
  );
  const [accountReference, setAccountReference] = useState<string>(
    bill?.accountNumber || settings.accountNumber || 'ACT-BLR-8839210'
  );
  const [customerName, setCustomerName] = useState<string>(
    bill?.customerName || settings.displayName || 'Viswaa Srinivasan'
  );
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(
    (settings.preferredLanguage as Language) || language
  );
  const [tone] = useState<string>('Firm & Professional');
  const [complaintChannel, setComplaintChannel] = useState<string>(
    'Nodal Officer & Appellate Authority'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(activeComplaint.content);
  const [editedSubject, setEditedSubject] = useState<string>(activeComplaint.subject);
  const [hasCopied, setHasCopied] = useState(false);

  // Sync edits when activeComplaint changes
  React.useEffect(() => {
    setEditedContent(activeComplaint.content);
    setEditedSubject(activeComplaint.subject);
  }, [activeComplaint]);

  // Generate with Gemini API
  const handleGenerateComplaint = async () => {
    setIsGenerating(true);
    try {
      showToast(
        'info',
        'Gemini AI',
        t('draftingComplaint')
      );

      const totalDowntimeMinutes = outages.reduce(
        (sum, o) => sum + (o.durationMinutes || 0),
        0
      );
      const totalHours = Math.round(totalDowntimeMinutes / 60);

      const newComplaint = await generateComplaintWithGemini({
        provider,
        accountReference,
        customerName,
        monthlyRental: bill?.monthlyRental || 999,
        billingPeriodDays: bill?.billingPeriodDays || 30,
        totalDowntimeHours: totalHours || 96,
        calculatedCredit: creditCalculation?.estimatedCreditAmount || 133.20,
        outagesList: outages,
        preferredLanguage,
        tone,
        complaintChannel,
      });

      setEditedContent(newComplaint.content);
      setEditedSubject(newComplaint.subject);
      setIsEditing(false);
      showToast('success', t('verified'), t('officialLetterDraft'));
      setGuidedStep(7);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const fullText = `SUBJECT: ${editedSubject}\n\n${editedContent}`;
    navigator.clipboard.writeText(fullText);
    setHasCopied(true);
    showToast('success', 'Copied to Clipboard', 'Ready to paste into provider support portal or email.');
    setTimeout(() => setHasCopied(false), 2500);
  };

  // Download as TXT
  const handleDownloadTxt = () => {
    const fullText = `NETPAL AI - BROADBAND CONSUMER COMPLAINT\nGenerated on: ${new Date().toLocaleDateString()}\n\nSUBJECT: ${editedSubject}\n\n${editedContent}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Broadband_Grievance_${accountReference}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('success', 'TXT Downloaded', 'Saved plain text complaint file.');
  };

  // Download as PDF using jsPDF
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Letterhead
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('FORMAL CONSUMER GRIEVANCE & SERVICE CREDIT CLAIM', 20, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Prepared via NetPal AI | Consumer Protection & SLA Rebate Assistant', 20, 28);
      doc.text(`Date of Issue: ${new Date().toLocaleDateString()} | Reference ID: ${activeComplaint.id}`, 20, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 36, 190, 36);

      // Subject
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138); // blue-900
      const splitSubject = doc.splitTextToSize(`Subject: ${editedSubject}`, 170);
      doc.text(splitSubject, 20, 44);

      let yPos = 44 + splitSubject.length * 5 + 4;

      // Body text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const splitContent = doc.splitTextToSize(editedContent, 170);

      // Simple multi-page pagination
      for (let i = 0; i < splitContent.length; i++) {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(splitContent[i], 20, yPos);
        yPos += 4.8;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `NetPal AI Consumer Claim | Page ${p} of ${pageCount} | TRAI Quality of Service Compliance Document`,
          20,
          288
        );
      }

      doc.save(`Broadband_Complaint_${accountReference}.pdf`);
      showToast('success', 'PDF Generated', 'Official PDF letter downloaded.');
    } catch (err: any) {
      showToast('error', 'PDF Error', err.message);
    }
  };

  const handleSaveDraft = async () => {
    const updated: ComplaintLetter = {
      ...activeComplaint,
      subject: editedSubject,
      content: editedContent,
      createdAt: new Date().toISOString(),
    };
    await updateComplaint(updated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t('complaintGeneratorTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('complaintGeneratorDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCurrentSection('payments');
                setGuidedStep(7);
              }}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{t('navPayments')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Generator Configuration Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>{t('complaintParams')}</span>
          <span className="text-[11px] font-normal text-slate-500">
            {t('traiSlaGuard')}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Broadband Provider */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              {t('broadbandProvider')}
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-blue-500"
            />
          </div>

          {/* Account ID */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              {t('accountReference')}
            </label>
            <input
              type="text"
              value={accountReference}
              onChange={(e) => setAccountReference(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-blue-500"
            />
          </div>

          {/* Preferred Language - ALL 20 INDIAN LANGUAGES + ENGLISH */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('selectLanguage')}</span>
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-blue-500 bg-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} — {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Escalation Level */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              {t('recipientDesignation')}
            </label>
            <select
              value={complaintChannel}
              onChange={(e) => setComplaintChannel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-blue-500 bg-white"
            >
              <option value="Nodal Officer & Appellate Authority">
                Nodal Officer & Appellate Authority
              </option>
              <option value="Principal Grievance Redressal Cell">
                ISP Grievance Redressal Cell
              </option>
              <option value="National Consumer Helpline (NCH / INGRAM)">
                National Consumer Helpline (NCH)
              </option>
            </select>
          </div>
        </div>

        {/* Generate / Regenerate Action Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">
              {t('claimAmount')}: ₹{creditCalculation?.estimatedCreditAmount.toFixed(2) || '133.20'}
            </span>
            <span>•</span>
            <span>
              {t('colEvidence')}: {outages.reduce((c, o) => c + o.evidence.length, 0)} files
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateComplaint}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('draftingComplaint')}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('generateWithGemini')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Complaint Document Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        {/* Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('officialLetterDraft')}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {t('readyToSend')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSaveDraft}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {t('saveChanges')}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('editLetter')}
              </button>
            )}

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copy')}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('downloadTxt')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('downloadPdf')}</span>
            </button>
          </div>
        </div>

        {/* Letter Preview / Editor */}
        <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 font-sans space-y-4">
          {/* Subject Line */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {t('colRootCause')}:
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-blue-500"
              />
            ) : (
              <div className="font-bold text-xs sm:text-sm text-blue-900 bg-white p-3 rounded-lg border border-slate-200">
                {editedSubject}
              </div>
            )}
          </div>

          {/* Letter Body */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {t('officialLetterDraft')}:
            </label>
            {isEditing ? (
              <textarea
                rows={18}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-4 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800 leading-relaxed focus:outline-blue-500"
              />
            ) : (
              <div className="bg-white p-5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
                {editedContent}
              </div>
            )}
          </div>
        </div>

        {/* Required Submission Disclaimer */}
        <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong>{t('filter')}:</strong> {t('submissionNotice')}
          </p>
        </div>
      </div>
    </div>
  );
};
