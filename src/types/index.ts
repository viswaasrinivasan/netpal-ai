export type Language =
  | 'en'
  | 'hi'
  | 'bn'
  | 'mr'
  | 'te'
  | 'ta'
  | 'gu'
  | 'ur'
  | 'kn'
  | 'or'
  | 'ml'
  | 'pa'
  | 'bho'
  | 'raj'
  | 'as'
  | 'mag'
  | 'mai'
  | 'hne'
  | 'bgc'
  | 'mwr'
  | 'sat';

export interface BroadbandBill {
  id: string;
  providerName: string;
  customerName: string;
  accountNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billingPeriodDays: number;
  monthlyRental: number;
  additionalCharges: number;
  taxes: number;
  totalAmountPayable: number;
  dueDate: string;
  planType: 'Postpaid' | 'Prepaid';
  planSpeed?: string;
  fileName?: string;
  analyzedAt: string;
  isVerifiedByUser: boolean;
}

export interface OutageEvidence {
  id: string;
  fileName: string;
  fileType: string;
  extractedText?: string;
  notes?: string;
  uploadedAt: string;
  previewUrl?: string;
}

export interface OutageRecord {
  id: string;
  provider: string;
  outageDate: string;
  startTime: string;
  restorationTime: string;
  durationMinutes: number;
  durationFormatted: string;
  ticketId?: string;
  description: string;
  status: 'Reported' | 'Verified' | 'Under Review' | 'Resolved';
  isEligibleForCredit: boolean;
  evidence: OutageEvidence[];
  createdAt: string;
}

export interface CreditCalculation {
  id: string;
  billId?: string;
  monthlyRental: number;
  billingPeriodDays: number;
  totalDowntimeMinutes: number;
  eligibleDowntimeHours: number;
  eligibleDowntimeDays: number;
  traiThresholdHours: number; // e.g. 24 hours SLA threshold
  policyType: 'trai_standard' | 'strict_sla' | 'custom_provider';
  calculationBreakdown: string;
  estimatedCreditAmount: number;
  currency: string;
  calculatedAt: string;
  aiExplanation?: string;
  disclaimer: string;
}

export interface ComplaintLetter {
  id: string;
  subject: string;
  language: Language;
  provider: string;
  accountReference: string;
  recipientDesignation: string; // e.g., "Nodal Officer & Appellate Authority"
  content: string;
  claimAmount: number;
  outageSummary: string;
  createdAt: string;
  status: 'Draft' | 'Ready to Send' | 'Submitted Externally';
}

export interface PayPalTransaction {
  id: string; // PayPal Order ID or Transaction ID
  captureId?: string; // PayPal Capture ID used for refund
  planName: string;
  providerName: string;
  amountInINR: number;
  amountInUSD: number;
  currency: 'INR' | 'USD';
  status: 'COMPLETED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  payerName?: string;
  payerEmail?: string;
  refunds: PayPalRefund[];
  isSimulated: boolean;
}

export interface PayPalRefund {
  refundId: string;
  captureId: string;
  amountInINR: number;
  amountInUSD: number;
  currency: 'INR' | 'USD';
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  reason: string;
  approvedBy: string;
  isSimulated: boolean;
}

export interface UserSettings {
  displayName: string;
  defaultProvider: string;
  accountNumber: string;
  preferredLanguage: Language;
  currency: 'INR';
  emailNotifications: boolean;
  smsOutageAlerts: boolean;
  demoMode: boolean;
}

export interface AppStateData {
  bill: BroadbandBill | null;
  outages: OutageRecord[];
  creditCalculation: CreditCalculation | null;
  complaints: ComplaintLetter[];
  transactions: PayPalTransaction[];
  settings: UserSettings;
}
