import { BroadbandBill, OutageRecord, CreditCalculation, ComplaintLetter, PayPalTransaction, UserSettings } from '../types';

export const INITIAL_USER_SETTINGS: UserSettings = {
  displayName: 'Viswaa Srinivasan',
  defaultProvider: 'Demo Broadband (ACT Fibernet Partner)',
  accountNumber: 'ACT-BLR-8839210',
  preferredLanguage: 'en',
  currency: 'INR',
  emailNotifications: true,
  smsOutageAlerts: true,
  demoMode: true,
};

export const SAMPLE_BROADBAND_BILL: BroadbandBill = {
  id: 'bill-act-2026-10',
  providerName: 'Demo Broadband (ACT Fibernet)',
  customerName: 'Viswaa Srinivasan',
  accountNumber: 'ACT-BLR-8839210',
  billingPeriodStart: '2026-10-01',
  billingPeriodEnd: '2026-10-30',
  billingPeriodDays: 30,
  monthlyRental: 999,
  additionalCharges: 0,
  taxes: 179.82, // 18% GST in India
  totalAmountPayable: 1178.82,
  dueDate: '2026-11-15',
  planType: 'Postpaid',
  planSpeed: '150 Mbps Fiber Unlimited',
  fileName: 'ACT_Fibernet_Tax_Invoice_Oct2026.pdf',
  analyzedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  isVerifiedByUser: true,
};

export const SAMPLE_OUTAGES: OutageRecord[] = [
  {
    id: 'outage-01',
    provider: 'Demo Broadband (ACT Fibernet)',
    outageDate: '2026-10-08',
    startTime: '2026-10-08T09:15:00',
    restorationTime: '2026-10-10T09:15:00', // 48 hours = 2 days
    durationMinutes: 2880,
    durationFormatted: '48h 00m (2.0 Days)',
    ticketId: 'TKT-ACT-982143',
    description: 'Main feeder optical fiber cut near Outer Ring Road metro underground cable trenching. Red LOS indicator illuminated on router.',
    status: 'Verified',
    isEligibleForCredit: true,
    evidence: [
      {
        id: 'ev-01',
        fileName: 'sms_outage_alert_oct8.png',
        fileType: 'image/png',
        extractedText: 'Dear Customer, your ACT connection ACT-BLR-8839210 is down due to a major optical fiber cut. Ref ticket TKT-ACT-982143. Expected restoration: 24-48 hrs.',
        notes: 'SMS broadcast received from ISP confirming widespread infrastructure failure',
        uploadedAt: '2026-10-08T10:00:00Z',
      },
      {
        id: 'ev-02',
        fileName: 'router_los_red_light.jpg',
        fileType: 'image/jpeg',
        extractedText: 'Router ONT Model ZXHN F670L - Status: PON LED Off, LOS LED Blinking Red (Loss of Signal)',
        notes: 'Photo of optical network terminal showing hardware level loss of fiber signal',
        uploadedAt: '2026-10-08T11:30:00Z',
      }
    ],
    createdAt: '2026-10-08T09:30:00Z',
  },
  {
    id: 'outage-02',
    provider: 'Demo Broadband (ACT Fibernet)',
    outageDate: '2026-10-18',
    startTime: '2026-10-18T14:00:00',
    restorationTime: '2026-10-19T14:00:00', // 24 hours = 1 day
    durationMinutes: 1440,
    durationFormatted: '24h 00m (1.0 Day)',
    ticketId: 'TKT-ACT-985512',
    description: 'Sub-station junction box power supply trip and optical splitter damage during storm. Unresolved for 24 hours.',
    status: 'Verified',
    isEligibleForCredit: true,
    evidence: [
      {
        id: 'ev-03',
        fileName: 'app_ticket_status.png',
        fileType: 'image/png',
        extractedText: 'ACT Broadband App: Service Outage Reported for Area Indiranagar Stage 2. Engineers dispatched. Status: In Progress.',
        notes: 'In-app notification snapshot confirming outage ticket status',
        uploadedAt: '2026-10-18T14:30:00Z',
      }
    ],
    createdAt: '2026-10-18T14:15:00Z',
  },
  {
    id: 'outage-03',
    provider: 'Demo Broadband (ACT Fibernet)',
    outageDate: '2026-10-25',
    startTime: '2026-10-25T08:00:00',
    restorationTime: '2026-10-26T08:00:00', // 24 hours = 1 day
    durationMinutes: 1440,
    durationFormatted: '24h 00m (1.0 Day)',
    ticketId: 'TKT-ACT-989021',
    description: 'BRAS gateway node misconfiguration post scheduled maintenance. Connection failed authorization for entire day.',
    status: 'Verified',
    isEligibleForCredit: true,
    evidence: [
      {
        id: 'ev-04',
        fileName: 'speedtest_timeout_error.png',
        fileType: 'image/png',
        extractedText: 'Error 504: Gateway Unreachable. PPPoE authentication timeout. Server failed to respond.',
        notes: 'Diagnostic screenshot showing continuous ping packet loss and gateway timeout',
        uploadedAt: '2026-10-25T09:00:00Z',
      }
    ],
    createdAt: '2026-10-25T08:30:00Z',
  }
];

export const SAMPLE_CREDIT_CALCULATION: CreditCalculation = {
  id: 'calc-act-01',
  billId: 'bill-act-2026-10',
  monthlyRental: 999,
  billingPeriodDays: 30,
  totalDowntimeMinutes: 5760, // 96 hours = 4 days
  eligibleDowntimeHours: 96,
  eligibleDowntimeDays: 4,
  traiThresholdHours: 24,
  policyType: 'trai_standard',
  calculationBreakdown: 'Proportional Base Credit = ₹999 (Monthly Base Rental) × 4 Days Eligible Outage ÷ 30 Days Billing Period = ₹133.20',
  estimatedCreditAmount: 133.20,
  currency: 'INR',
  calculatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  aiExplanation: 'Under Telecom Regulatory Authority of India (TRAI) Quality of Service (QoS) broadband regulations, service providers are legally obligated to resolve service faults within 24 to 48 hours. When internet connectivity is disrupted exceeding SLA guidelines without proportionate advance waiver, the subscriber is entitled to a prorated rebate computed as [Base Monthly Rental / Billing Days] × Eligible Outage Duration.',
  disclaimer: 'This is an estimated service credit, not a guaranteed refund. Actual eligibility depends on applicable regulations, service conditions, provider policies and verified outage records.',
};

export const SAMPLE_COMPLAINT: ComplaintLetter = {
  id: 'comp-01',
  subject: 'Formal Claim for Proportional Service Credit & Rebate: Persistent Outages (4 Days / 96 Hours) on Account ACT-BLR-8839210',
  language: 'en',
  provider: 'Demo Broadband (ACT Fibernet)',
  accountReference: 'ACT-BLR-8839210',
  recipientDesignation: 'Nodal Officer & Customer Care Grievance Redressal Cell',
  claimAmount: 133.20,
  outageSummary: '3 verified outage incidents spanning 96 cumulative hours (4.0 billing days) during October 2026 billing cycle.',
  content: `To:
The Nodal Officer & Appellate Authority
Demo Broadband / ACT Fibernet Grievance Redressal Unit
Bangalore Circle, Karnataka, India

Subject: Formal Claim for Proportional Service Credit & Rebate: Persistent Outages (4 Days / 96 Hours) on Account ACT-BLR-8839210

Dear Sir / Madam,

I am writing to formally log a grievance and claim a statutory service credit for extensive, recurring service interruptions experienced on my broadband connection during the billing period of October 01, 2026 to October 30, 2026.

1. CUSTOMER & SERVICE PARTICULARS:
- Registered Name: Viswaa Srinivasan
- Broadband Account / User ID: ACT-BLR-8839210
- Plan Subscribed: 150 Mbps Fiber Unlimited (Postpaid, ₹999/month base rental)
- Billing Cycle Duration: 30 Days

2. CHRONOLOGICAL RECORD OF DOCUMENTED OUTAGES:
A. Incident 1: October 08, 2026 (09:15) to October 10, 2026 (09:15) — Duration: 48 Hours. Ticket Ref: TKT-ACT-982143. Root Cause: Optical feeder cable severed.
B. Incident 2: October 18, 2026 (14:00) to October 19, 2026 (14:00) — Duration: 24 Hours. Ticket Ref: TKT-ACT-985512. Root Cause: Junction box power failure and splitter damage.
C. Incident 3: October 25, 2026 (08:00) to October 26, 2026 (08:00) — Duration: 24 Hours. Ticket Ref: TKT-ACT-989021. Root Cause: BRAS gateway authorization failure post-maintenance.

TOTAL ELIGIBLE SERVICE DOWNTIME: 96 Hours (4 Full Billing Days).

3. REGULATORY COMPLIANCE & ELIGIBILITY CONTEXT:
Pursuant to TRAI Quality of Service (QoS) benchmarks and standard Indian Consumer Protection guidelines, telecom service providers are mandated to maintain minimum network availability and restore service interruptions within stipulated timelines. An outage spanning 4 cumulative days out of a 30-day billing cycle breaches guaranteed availability parameters.

4. SERVICE CREDIT CALCULATION:
- Base Monthly Rental: ₹999.00
- Prorated Per-Day Cost: ₹999 ÷ 30 days = ₹33.30 / day
- Total Eligible Downtime: 4 Days
- Calculated Service Credit Claim: ₹133.20 (Rupees One Hundred Thirty-Three and Twenty Paise)

5. RELIEF REQUESTED:
I request your office to:
1. Validate the attached ticket numbers and network outage logs.
2. Credit the sum of ₹133.20 as an adjustment against my upcoming invoice or reverse this prorated charge to my original payment source.
3. Provide an assurance regarding fiber route redundancy in the sector to avoid future recurring incidents.

Time-stamped SMS notifications, ticket acknowledgements, and ONT diagnostic screenshots are preserved as supporting evidence.

Looking forward to your prompt response within the stipulated 3-day turnaround timeframe.

Yours sincerely,
Viswaa Srinivasan
Mobile / Registered Contact: +91 98401 23456
Bangalore, India`,
  createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  status: 'Ready to Send',
};

export const SAMPLE_TRANSACTION: PayPalTransaction = {
  id: 'PAYPAL-ORD-893201948B',
  captureId: 'CAPTURE-CAP-992140283A',
  planName: 'Demo Broadband 150 Mbps Fiber (October Billing Cycle)',
  providerName: 'Demo Broadband',
  amountInINR: 999.00,
  amountInUSD: 12.00, // Equivalent for PayPal Sandbox USD testing
  currency: 'USD',
  status: 'COMPLETED',
  createdAt: '2026-10-02T11:24:00Z',
  payerName: 'Viswaa Srinivasan',
  payerEmail: 'viswaa.consumer@example.com',
  refunds: [],
  isSimulated: true,
};
