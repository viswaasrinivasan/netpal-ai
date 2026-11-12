import React, { useState, useRef } from 'react';
import {
  WifiOff,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { OutageRecord, OutageEvidence } from '../../types';
import { scanEvidenceWithGemini } from '../../services/api';

export const DowntimeTrackerPage: React.FC = () => {
  const {
    outages,
    addOutage,
    updateOutage,
    deleteOutage,
    bill,
    setCurrentSection,
    setGuidedStep,
    showToast,
  } = useApp();
  const { t } = useLanguage();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOutageId, setEditingOutageId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    outageDate: string;
    startTime: string;
    restorationTime: string;
    provider: string;
    ticketId: string;
    description: string;
    isEligibleForCredit: boolean;
  }>({
    outageDate: new Date().toISOString().split('T')[0],
    startTime: `${new Date().toISOString().split('T')[0]}T10:00:00`,
    restorationTime: `${new Date().toISOString().split('T')[0]}T22:00:00`,
    provider: bill?.providerName || 'Demo Broadband',
    ticketId: '',
    description: '',
    isEligibleForCredit: true,
  });

  // Attached evidence state in form
  const [evidenceList, setEvidenceList] = useState<OutageEvidence[]>([]);
  const [isScanningEvidence, setIsScanningEvidence] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const totalDowntimeMinutes = outages.reduce(
    (acc, o) => acc + (o.durationMinutes || 0),
    0
  );
  const totalDowntimeHours = (totalDowntimeMinutes / 60).toFixed(1);
  const totalDowntimeDays = (totalDowntimeMinutes / 1440).toFixed(2);
  const eligibleOutages = outages.filter((o) => o.isEligibleForCredit);

  // Calculate duration between start and restoration
  const calculateDuration = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      const diffMs = Math.max(0, end - start);
      const minutes = Math.round(diffMs / (1000 * 60));
      const hours = (minutes / 60).toFixed(1);
      const days = (minutes / 1440).toFixed(1);

      let formatted = `${hours} hrs`;
      if (minutes >= 1440) {
        formatted += ` (${days} Days)`;
      }
      return { minutes, formatted };
    } catch (e) {
      return { minutes: 0, formatted: '0 hrs' };
    }
  };

  // Handle Evidence Upload & Gemini Scan
  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';

      const newEv: OutageEvidence = {
        id: `ev-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        previewUrl: file.type.startsWith('image') ? result : undefined,
        uploadedAt: new Date().toISOString(),
      };

      setEvidenceList((prev) => [...prev, newEv]);

      // Call Gemini 3.8 Flash to extract dates, times, ticket ID from the screenshot
      try {
        setIsScanningEvidence(true);
        showToast('info', 'Scanning Evidence', 'Gemini is reading screenshot for ticket & downtime details...');

        const extracted = await scanEvidenceWithGemini({
          imageBase64: base64Data,
          mimeType: file.type,
        });

        if (extracted) {
          // Auto-fill form fields if identified
          setFormData((prev) => ({
            ...prev,
            outageDate: extracted.outageDate && extracted.outageDate !== 'Not found' ? extracted.outageDate : prev.outageDate,
            startTime: extracted.startTime && extracted.startTime.includes('T') ? extracted.startTime : prev.startTime,
            restorationTime: extracted.restorationTime && extracted.restorationTime.includes('T') ? extracted.restorationTime : prev.restorationTime,
            ticketId: extracted.ticketId && extracted.ticketId !== 'Not found' ? extracted.ticketId : prev.ticketId,
            description: extracted.issueDescription ? `${extracted.issueDescription} (${extracted.extractedText || ''})` : prev.description,
          }));

          newEv.extractedText = extracted.extractedText || extracted.issueDescription;
          showToast('success', 'Details Extracted', 'Auto-populated incident timestamps from evidence.');
        }
      } catch (err: any) {
        console.warn('Evidence scan error', err);
      } finally {
        setIsScanningEvidence(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const { minutes, formatted } = calculateDuration(
      formData.startTime,
      formData.restorationTime
    );

    if (editingOutageId) {
      const updated: OutageRecord = {
        id: editingOutageId,
        provider: formData.provider,
        outageDate: formData.outageDate,
        startTime: formData.startTime,
        restorationTime: formData.restorationTime,
        durationMinutes: minutes,
        durationFormatted: formatted,
        ticketId: formData.ticketId || undefined,
        description: formData.description || 'Service disruption reported by user',
        status: minutes >= 1440 ? 'Verified' : 'Reported',
        isEligibleForCredit: formData.isEligibleForCredit,
        evidence: evidenceList,
        createdAt: new Date().toISOString(),
      };
      updateOutage(updated);
    } else {
      const newOutage: OutageRecord = {
        id: `outage-${Date.now()}`,
        provider: formData.provider,
        outageDate: formData.outageDate,
        startTime: formData.startTime,
        restorationTime: formData.restorationTime,
        durationMinutes: minutes,
        durationFormatted: formatted,
        ticketId: formData.ticketId || `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
        description: formData.description || 'Broadband downtime recorded',
        status: minutes >= 1440 ? 'Verified' : 'Reported',
        isEligibleForCredit: formData.isEligibleForCredit,
        evidence: evidenceList,
        createdAt: new Date().toISOString(),
      };
      addOutage(newOutage);
    }

    setIsFormOpen(false);
    setEditingOutageId(null);
    setEvidenceList([]);
  };

  const handleEditClick = (outage: OutageRecord) => {
    setEditingOutageId(outage.id);
    setFormData({
      outageDate: outage.outageDate,
      startTime: outage.startTime,
      restorationTime: outage.restorationTime,
      provider: outage.provider,
      ticketId: outage.ticketId || '',
      description: outage.description,
      isEligibleForCredit: outage.isEligibleForCredit,
    });
    setEvidenceList(outage.evidence || []);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <WifiOff className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {t('downtimeTrackerTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('downtimeTrackerDesc')}
            </p>
          </div>

          <button
            onClick={() => {
              setEditingOutageId(null);
              setFormData({
                outageDate: new Date().toISOString().split('T')[0],
                startTime: `${new Date().toISOString().split('T')[0]}T09:00:00`,
                restorationTime: `${new Date().toISOString().split('T')[0]}T21:00:00`,
                provider: bill?.providerName || 'Demo Broadband',
                ticketId: '',
                description: '',
                isEligibleForCredit: true,
              });
              setEvidenceList([]);
              setIsFormOpen(!isFormOpen);
            }}
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen ? t('closeForm') : t('reportNewOutage')}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">{t('totalOutages')}</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {outages.length} {t('incidents')}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-amber-800 block text-[11px] font-medium">{t('cumulativeDowntime')}</span>
            <span className="text-base font-bold text-amber-900 mt-0.5 block">
              {totalDowntimeHours} {t('hours')} ({totalDowntimeDays} {t('days')})
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-emerald-800 block text-[11px] font-medium">{t('eligibleForRebate')}</span>
            <span className="text-base font-bold text-emerald-900 mt-0.5 block">
              {eligibleOutages.length} {t('eligible')}
            </span>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-blue-800 block text-[11px] font-medium">{t('trai24hThreshold')}</span>
            <span className="text-base font-bold text-blue-900 mt-0.5 block">
              {t('claimable')}
            </span>
          </div>
        </div>
      </div>

      {/* Outage Entry Form (Modal or Inline Accordion) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitForm}
          className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-sm space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <WifiOff className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {editingOutageId ? t('edit') : t('reportNewOutage')}
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {t('traiQosGuard')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Outage Date */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('outageIncidentDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.outageDate}
                onChange={(e) => setFormData({ ...formData, outageDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Start Date & Time */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('disruptionStartTime')} *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Restoration Date & Time */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('restorationTime')} *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.restorationTime}
                onChange={(e) =>
                  setFormData({ ...formData, restorationTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Broadband Provider */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('broadbandProvider')}
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Ticket Ref ID */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('troubleTicketId')}
              </label>
              <input
                type="text"
                placeholder="TKT-ACT-982143"
                value={formData.ticketId}
                onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-500 font-mono text-xs"
              />
            </div>

            {/* Eligibility Checkbox */}
            <div className="space-y-1 flex flex-col justify-end">
              <label className="font-semibold text-slate-700 block mb-1">
                {t('creditQualification')}
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEligibleForCredit}
                  onChange={(e) =>
                    setFormData({ ...formData, isEligibleForCredit: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-slate-800 font-medium text-xs">
                  {t('countTowardsSla')}
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-700 block">
              {t('issueDescription')} *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Optical fiber cut during underground road work; Router showed blinking red LOS light; Gateway unreachable."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-500 font-normal"
            />
          </div>

          {/* Evidence Upload Section with Gemini Extraction */}
          <div className="pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">
                  {t('supportingEvidence')}
                </span>
              </div>
              <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('geminiExtractsTimes')}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={() => evidenceInputRef.current?.click()}
                disabled={isScanningEvidence}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-slate-500" />
                <span>{t('uploadScreenshot')}</span>
              </button>
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleEvidenceUpload}
                className="hidden"
              />

              {isScanningEvidence && (
                <span className="text-xs text-blue-600 animate-pulse font-medium">
                  {t('processing')}...
                </span>
              )}
            </div>

            {/* Uploaded Evidence Badges */}
            {evidenceList.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2 overflow-hidden">
                      {ev.previewUrl ? (
                        <img
                          src={ev.previewUrl}
                          alt="Evidence"
                          className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {ev.fileName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {ev.extractedText || ev.notes || t('verified')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEvidenceList(evidenceList.filter((x) => x.id !== ev.id))
                      }
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingOutageId(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
            >
              {editingOutageId ? t('saveChanges') : t('save')}
            </button>
          </div>
        </form>
      )}

      {/* Chronological Outage Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t('chronologicalRecords')} ({outages.length})
            </h3>
            <p className="text-xs text-slate-500">
              {t('downtimeTrackerDesc')}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentSection('calculator');
              setGuidedStep(5);
            }}
            className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{t('proceedToCalculator')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {outages.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">{t('noOutagesRecorded')}</p>
            <p className="text-xs mt-1">
              {t('reportNewOutage')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {outages.map((outage, idx) => (
              <div
                key={outage.id}
                className="py-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                      #{outages.length - idx}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {outage.outageDate}
                        </span>
                        {outage.ticketId && (
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            {outage.ticketId}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            outage.isEligibleForCredit
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {outage.isEligibleForCredit
                            ? t('eligible')
                            : t('withinSLA')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {outage.provider}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="text-right mr-2">
                      <span className="font-bold text-sm text-amber-900 block">
                        {outage.durationFormatted}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {outage.durationMinutes} mins downtime
                      </span>
                    </div>

                    <button
                      onClick={() => handleEditClick(outage)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit outage record"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteOutage(outage.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-700 font-medium pl-9">
                  {outage.description}
                </p>

                {/* Timestamps & Evidence */}
                <div className="pl-9 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Start: {new Date(outage.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>→</span>
                    <span>
                      Restored: {new Date(outage.restorationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {outage.evidence && outage.evidence.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold text-blue-700">
                        {outage.evidence.length} Evidence Snapshot{outage.evidence.length === 1 ? '' : 's'}:
                      </span>
                      {outage.evidence.map((ev) => (
                        <span
                          key={ev.id}
                          className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono truncate max-w-[140px]"
                          title={ev.fileName}
                        >
                          {ev.fileName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
