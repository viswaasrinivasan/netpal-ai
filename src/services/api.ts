import {
  BroadbandBill,
  OutageRecord,
  CreditCalculation,
  ComplaintLetter,
  PayPalTransaction,
  UserSettings,
  AppStateData,
  Language,
} from '../types';

export interface SystemStatus {
  geminiConfigured: boolean;
  paypalConfigured: boolean;
  paypalEnvironment: string;
  paypalClientId: string;
  appUrl: string;
  demoModeActive: boolean;
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status fetch failed');
    return await res.json();
  } catch (err) {
    return {
      geminiConfigured: true,
      paypalConfigured: false,
      paypalEnvironment: 'sandbox',
      paypalClientId: '',
      appUrl: '',
      demoModeActive: true,
    };
  }
}

export async function fetchStoreData(): Promise<AppStateData> {
  const res = await fetch('/api/store');
  if (!res.ok) throw new Error('Failed to fetch application state');
  return await res.json();
}

export async function updateStoreData(updates: Partial<AppStateData>): Promise<void> {
  await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function resetStoreData(): Promise<AppStateData> {
  const res = await fetch('/api/store/reset', { method: 'POST' });
  const data = await res.json();
  return data.store;
}

export async function scanBillWithGemini(params: {
  imageBase64?: string;
  mimeType?: string;
  textContent?: string;
  fileName?: string;
}): Promise<BroadbandBill> {
  const res = await fetch('/api/ai/scan-bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to analyze bill document with Gemini');
  }

  return data.bill;
}

export async function scanEvidenceWithGemini(params: {
  imageBase64?: string;
  mimeType?: string;
  textContent?: string;
}): Promise<any> {
  const res = await fetch('/api/ai/scan-evidence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to scan evidence screenshot with Gemini');
  }

  return data.evidenceData;
}

export async function explainCreditWithGemini(params: {
  monthlyRental: number;
  billingPeriodDays: number;
  eligibleDowntimeDays: number;
  eligibleDowntimeHours: number;
  creditAmount: number;
  provider: string;
  preferredLanguage?: Language;
}): Promise<string> {
  const res = await fetch('/api/ai/explain-credit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate credit explanation');
  return data.explanation;
}

export async function generateComplaintWithGemini(params: {
  provider: string;
  accountReference: string;
  customerName: string;
  monthlyRental: number;
  billingPeriodDays: number;
  totalDowntimeHours: number;
  calculatedCredit: number;
  outagesList: OutageRecord[];
  preferredLanguage: Language;
  tone?: string;
  complaintChannel?: string;
}): Promise<ComplaintLetter> {
  const res = await fetch('/api/ai/generate-complaint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate complaint with Gemini');
  }

  return data.complaint;
}

export async function createPayPalOrder(params: {
  amount: number;
  currency?: string;
  planName: string;
}): Promise<{ orderId: string; status: string; isSimulated: boolean }> {
  const res = await fetch('/api/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to initiate PayPal order');
  }

  return data;
}

export async function capturePayPalOrder(params: {
  orderId: string;
  amountInINR: number;
  amountInUSD: number;
  planName: string;
  payerName?: string;
  payerEmail?: string;
}): Promise<PayPalTransaction> {
  const res = await fetch('/api/paypal/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to capture PayPal order');
  }

  return data.transaction;
}

export async function refundPayPalPayment(params: {
  transactionId: string;
  captureId?: string;
  refundAmountINR: number;
  refundAmountUSD?: number;
  reason?: string;
  approvedBy?: string;
}): Promise<{ refund: any; updatedTransaction: PayPalTransaction; message: string }> {
  const res = await fetch('/api/paypal/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to process PayPal refund');
  }

  return data;
}
