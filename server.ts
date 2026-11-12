import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  SAMPLE_BROADBAND_BILL,
  SAMPLE_OUTAGES,
  SAMPLE_CREDIT_CALCULATION,
  SAMPLE_COMPLAINT,
  SAMPLE_TRANSACTION,
  INITIAL_USER_SETTINGS,
} from './src/data/sampleData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body limits for base64 documents and screenshots
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[NetPal AI] Gemini SDK initialized successfully.');
  } catch (err) {
    console.error('[NetPal AI] Failed to initialize Gemini SDK:', err);
  }
} else {
  console.log('[NetPal AI] Notice: GEMINI_API_KEY is not set or using placeholder.');
}

// In-memory data store with file persistence
const DATA_FILE = path.join(__dirname, 'netpal_store.json');

interface StoreData {
  bill: any;
  outages: any[];
  creditCalculation: any;
  complaints: any[];
  transactions: any[];
  settings: any;
}

let store: StoreData = {
  bill: SAMPLE_BROADBAND_BILL,
  outages: SAMPLE_OUTAGES,
  creditCalculation: SAMPLE_CREDIT_CALCULATION,
  complaints: [SAMPLE_COMPLAINT],
  transactions: [SAMPLE_TRANSACTION],
  settings: INITIAL_USER_SETTINGS,
};

// Try loading persisted data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    store = { ...store, ...parsed };
    console.log('[NetPal AI] Loaded persisted store from file.');
  }
} catch (err) {
  console.warn('[NetPal AI] Could not load persisted store:', err);
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[NetPal AI] Failed to save store:', err);
  }
}

// Helper for PayPal Sandbox Access Token
async function getPayPalAccessToken(clientId: string, clientSecret: string, isLive: boolean): Promise<string> {
  const host = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${host}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal OAuth failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// --- API ROUTES ---

// 1. Status / Config Check
app.get('/api/status', (req: Request, res: Response) => {
  const hasGemini = !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  const hasPayPal = !!(paypalClientId && paypalClientSecret);
  const paypalEnvironment = (process.env.PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase();

  res.json({
    geminiConfigured: hasGemini,
    paypalConfigured: hasPayPal,
    paypalEnvironment,
    paypalClientId: hasPayPal ? paypalClientId : '',
    appUrl: process.env.APP_URL || '',
    demoModeActive: !hasPayPal || store.settings.demoMode,
  });
});

// 2. Data Store Get & Update
app.get('/api/store', (req: Request, res: Response) => {
  res.json(store);
});

app.post('/api/store', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    store = { ...store, ...updates };
    saveStore();
    res.json({ success: true, store });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/store/reset', (req: Request, res: Response) => {
  store = {
    bill: SAMPLE_BROADBAND_BILL,
    outages: SAMPLE_OUTAGES,
    creditCalculation: SAMPLE_CREDIT_CALCULATION,
    complaints: [SAMPLE_COMPLAINT],
    transactions: [SAMPLE_TRANSACTION],
    settings: INITIAL_USER_SETTINGS,
  };
  saveStore();
  res.json({ success: true, store });
});

// 3. AI Bill Scanner
app.post('/api/ai/scan-bill', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, textContent, fileName } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is provided in Settings or environment variables.',
      });
    }

    const promptText = `
You are an expert Indian broadband billing document extractor for NetPal AI.
Analyze the provided broadband bill image or document carefully.
Extract the relevant details accurately.
CRITICAL RULES:
- If a value cannot be identified with high confidence, return "Not found" or 0 for numbers.
- Do NOT invent or hallucinate provider names or amounts.
- Extract numbers cleanly without currency symbols (e.g. 999 instead of ₹999).
- For planType, specify "Postpaid", "Prepaid", or "Not found".
- Dates should preferably be in ISO format (YYYY-MM-DD) if discernible, or "Not found".
- Look for common Indian broadband providers: Airtel Xstream, JioFiber, ACT Fibernet, Tata Play Fiber, BSNL, Hathway, Excitel, You Broadband, Spectranet, etc.
- Also extract any Customer Name, Account Number/Relationship ID, Billing Period Start and End date, Base Rental, Taxes (e.g. 18% GST), and Total Payable.
`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      });
    }
    if (textContent) {
      contents.push({
        text: `Document text content:\n${textContent}\n`,
      });
    }
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            providerName: { type: Type.STRING, description: 'Provider name or Not found' },
            customerName: { type: Type.STRING, description: 'Customer name or Not found' },
            accountNumber: { type: Type.STRING, description: 'Account number/User ID or Not found' },
            billingPeriodStart: { type: Type.STRING, description: 'Billing start date YYYY-MM-DD or Not found' },
            billingPeriodEnd: { type: Type.STRING, description: 'Billing end date YYYY-MM-DD or Not found' },
            billingPeriodDays: { type: Type.INTEGER, description: 'Total days in billing cycle, default 30' },
            monthlyRental: { type: Type.NUMBER, description: 'Base plan monthly rental amount in INR' },
            additionalCharges: { type: Type.NUMBER, description: 'Additional or one-time charges in INR' },
            taxes: { type: Type.NUMBER, description: 'Tax amount (GST) in INR' },
            totalAmountPayable: { type: Type.NUMBER, description: 'Total invoice amount payable in INR' },
            dueDate: { type: Type.STRING, description: 'Payment due date YYYY-MM-DD or Not found' },
            planType: { type: Type.STRING, description: 'Postpaid, Prepaid, or Not found' },
            planSpeed: { type: Type.STRING, description: 'Plan speed e.g. 150 Mbps Fiber or Not found' },
            notes: { type: Type.STRING, description: 'Brief observation about the invoice' },
          },
          required: ['providerName', 'monthlyRental', 'totalAmountPayable', 'planType'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Construct standardized bill object
    const extractedBill = {
      id: `bill-${Date.now()}`,
      providerName: parsed.providerName || 'Not found',
      customerName: parsed.customerName || 'Not found',
      accountNumber: parsed.accountNumber || 'Not found',
      billingPeriodStart: parsed.billingPeriodStart || 'Not found',
      billingPeriodEnd: parsed.billingPeriodEnd || 'Not found',
      billingPeriodDays: parsed.billingPeriodDays && parsed.billingPeriodDays > 0 ? parsed.billingPeriodDays : 30,
      monthlyRental: typeof parsed.monthlyRental === 'number' ? parsed.monthlyRental : 0,
      additionalCharges: typeof parsed.additionalCharges === 'number' ? parsed.additionalCharges : 0,
      taxes: typeof parsed.taxes === 'number' ? parsed.taxes : 0,
      totalAmountPayable: typeof parsed.totalAmountPayable === 'number' ? parsed.totalAmountPayable : 0,
      dueDate: parsed.dueDate || 'Not found',
      planType: parsed.planType === 'Prepaid' ? 'Prepaid' : 'Postpaid',
      planSpeed: parsed.planSpeed || 'Not found',
      fileName: fileName || 'Uploaded_Bill.pdf',
      analyzedAt: new Date().toISOString(),
      isVerifiedByUser: false,
    };

    res.json({ success: true, bill: extractedBill });
  } catch (err: any) {
    console.error('[NetPal AI] Error analyzing bill with Gemini:', err);
    res.status(500).json({
      error: 'Failed to extract bill information via Gemini API: ' + (err.message || 'Unknown error'),
    });
  }
});

// 4. AI Evidence Scanner (Outages)
app.post('/api/ai/scan-evidence', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, textContent } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured.',
      });
    }

    const promptText = `
You are an expert broadband outage and SLA diagnostic investigator for NetPal AI.
Analyze the provided screenshot or message (e.g. ISP SMS notification, WhatsApp support chat, router red LOS light photo, ISP mobile app ticket status, or gateway error).
Extract the following information:
1. outageDate: The date of the outage (YYYY-MM-DD or Not found)
2. startTime: Start timestamp if available (YYYY-MM-DDTHH:mm:ss or approximate ISO string, or Not found)
3. restorationTime: Restoration timestamp if noted (or Not found / Still ongoing)
4. ticketId: Trouble ticket ID / reference number (e.g. TKT-..., or Not found)
5. provider: Broadband provider name if identifiable
6. issueDescription: Concrete technical reason (e.g. optical fiber cut, power trip at junction box, red LOS light, BRAS gateway unreachable)
7. extractedText: Verbatim relevant snippet from the screenshot or text
`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      });
    }
    if (textContent) {
      contents.push({ text: `Evidence context:\n${textContent}\n` });
    }
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outageDate: { type: Type.STRING },
            startTime: { type: Type.STRING },
            restorationTime: { type: Type.STRING },
            durationMinutesEstimate: { type: Type.INTEGER },
            ticketId: { type: Type.STRING },
            provider: { type: Type.STRING },
            issueDescription: { type: Type.STRING },
            extractedText: { type: Type.STRING },
          },
          required: ['issueDescription', 'extractedText'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, evidenceData: parsed });
  } catch (err: any) {
    console.error('[NetPal AI] Error scanning evidence with Gemini:', err);
    res.status(500).json({ error: err.message || 'Evidence analysis failed' });
  }
});

const LANGUAGE_PROMPT_MAP: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी) in standard formal Devanagari script',
  bn: 'Bengali (বাংলা) in authentic Bengali script',
  mr: 'Marathi (मराठी) in formal Marathi script',
  te: 'Telugu (తెలుగు) in authentic Telugu script',
  ta: 'Tamil (தமிழ் - தூய அலுவல் தமிழ்) with proper Indian telecom terminology',
  gu: 'Gujarati (ગુજરાતી) in authentic Gujarati script',
  ur: 'Urdu (اردو) in standard Urdu script with formal grievance terminology (جناب عالی، ٹیلی کام ریگولیٹری)',
  kn: 'Kannada (ಕನ್ನಡ) in authentic Kannada script',
  or: 'Odia (ଓଡ଼ିଆ) in authentic Odia script',
  ml: 'Malayalam (മലയാളം) in authentic Malayalam script',
  pa: 'Punjabi (ਪੰਜਾਬੀ) in Gurmukhi script',
  bho: 'Bhojpuri (भोजपुरी) with natural regional Bhojpuri grammar and respectful tone',
  raj: 'Rajasthani (राजस्थानी) with authentic regional Rajasthani/Maru expressions',
  as: 'Assamese (অসমীয়া) in authentic Assamese script',
  mag: 'Magahi (मगही) with authentic regional Magahi expressions',
  mai: 'Maithili (मैथिली) in formal Maithili literary register',
  hne: 'Chhattisgarhi (छत्तीसगढ़ी) with natural regional Chhattisgarhi expressions',
  bgc: 'Haryanvi (हरियाणवी) with natural regional Haryanvi expressions',
  mwr: 'Marwari (मारवाड़ी) with authentic Marwari vocabulary',
  sat: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ / संताली) with authentic Santali expressions and terminology',
};

// 5. AI Credit Explanation
app.post('/api/ai/explain-credit', async (req: Request, res: Response) => {
  try {
    const {
      monthlyRental,
      billingPeriodDays,
      eligibleDowntimeDays,
      eligibleDowntimeHours,
      creditAmount,
      provider,
      preferredLanguage = 'en',
    } = req.body;

    const targetLangDesc = LANGUAGE_PROMPT_MAP[preferredLanguage] || 'English';

    if (!ai) {
      return res.json({
        explanation: `Under TRAI Quality of Service (QoS) guidelines, broadband consumers are entitled to a prorated rebate when outages exceed resolution benchmarks. Based on a monthly rental of ₹${monthlyRental} over ${billingPeriodDays} days and ${eligibleDowntimeDays} days (${eligibleDowntimeHours} hours) of qualifying interruption, your estimated credit is ₹${creditAmount}.`,
      });
    }

    const prompt = `
You are a telecom consumer rights legal analyst for NetPal AI in India.
Explain concisely in 2-3 structured sentences why a subscriber of ${provider || 'broadband'} with a monthly plan of ₹${monthlyRental} is legally and procedurally entitled to a prorated service credit of ₹${creditAmount} for ${eligibleDowntimeDays} days (${eligibleDowntimeHours} hours) of verified service outage during a ${billingPeriodDays}-day billing cycle.
Cite Telecom Regulatory Authority of India (TRAI) Quality of Service (QoS) Regulations regarding fault restoration timelines (24-48 hours benchmark). Keep it factual, professional, and clear.

IMPORTANT LANGUAGE REQUIREMENT:
Generate the ENTIRE explanation in ${targetLangDesc}. Ensure natural phrasing, correct script glyphs, and proper regulatory terminology.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ explanation: response.text?.trim() || '' });
  } catch (err: any) {
    console.error('[NetPal AI] Error generating credit explanation:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Complaint Generator (Supports 20 Indian Languages + English)
app.post('/api/ai/generate-complaint', async (req: Request, res: Response) => {
  try {
    const {
      provider,
      accountReference,
      customerName,
      monthlyRental,
      billingPeriodDays,
      totalDowntimeHours,
      calculatedCredit,
      outagesList,
      preferredLanguage = 'en',
      tone = 'professional',
      complaintChannel = 'Nodal Officer & Appellate Authority',
    } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please configure GEMINI_API_KEY to generate live AI complaints.',
      });
    }

    const targetLangDesc = LANGUAGE_PROMPT_MAP[preferredLanguage] || 'English';

    const prompt = `
You are an expert consumer advocate and grievance specialist for Indian broadband consumers.
Generate a comprehensive, formal, and authoritative complaint letter to the ${complaintChannel} of ${provider || 'the Broadband Service Provider'}.

DETAILS:
- Subscriber Name: ${customerName || 'Registered Subscriber'}
- Broadband Account / Connection ID: ${accountReference || 'Not Provided'}
- Monthly Rental: ₹${monthlyRental || 999}
- Total Documented Outage: ${totalDowntimeHours || 96} hours
- Requested Service Credit / Refund: ₹${calculatedCredit || 133.20}
- Verified Outages: ${JSON.stringify(outagesList || [])}
- Target Language: ${targetLangDesc}
- Tone: ${tone}

LETTER REQUIREMENTS:
1. Formal Subject Line referencing Account ID, Outage duration, and statutory credit claim.
2. Designation & Address block to the Nodal Officer / Appellate Authority.
3. Accurate customer and subscription details.
4. Chronological breakdown of each outage incident with ticket numbers and root cause.
5. Reference to TRAI QoS (Quality of Service) regulations for broadband fault restoration SLA (mandating fault resolution within 24-48 hours or rebate on monthly charges).
6. Clear, transparent mathematical credit calculation: (₹${monthlyRental} ÷ ${billingPeriodDays} days) × Outage duration = ₹${calculatedCredit}.
7. Specific relief sought: Adjustment in next billing invoice or immediate reversal, plus assurance of network reliability.
8. Professional, respectful yet resolute closing.

CRITICAL MULTILINGUAL INSTRUCTIONS:
- Write the entire grievance letter body and subject in ${targetLangDesc}.
- Use natural regional language expressions rather than literal machine translation.
- Preserve numerical amounts (₹${calculatedCredit}, ₹${monthlyRental}), Account ID (${accountReference}), and technical identifiers clearly.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            recipientDesignation: { type: Type.STRING },
            content: { type: Type.STRING },
            claimAmount: { type: Type.NUMBER },
            outageSummary: { type: Type.STRING },
          },
          required: ['subject', 'recipientDesignation', 'content', 'claimAmount', 'outageSummary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const newComplaint = {
      id: `comp-${Date.now()}`,
      subject: parsed.subject,
      language: preferredLanguage,
      provider: provider || 'Broadband Provider',
      accountReference: accountReference || 'N/A',
      recipientDesignation: parsed.recipientDesignation || 'Nodal Officer & Appellate Authority',
      content: parsed.content,
      claimAmount: typeof parsed.claimAmount === 'number' ? parsed.claimAmount : calculatedCredit || 133.20,
      outageSummary: parsed.outageSummary || `${totalDowntimeHours} hours cumulative downtime`,
      createdAt: new Date().toISOString(),
      status: 'Ready to Send',
    };

    // Save to store
    store.complaints.unshift(newComplaint);
    saveStore();

    res.json({ success: true, complaint: newComplaint });
  } catch (err: any) {
    console.error('[NetPal AI] Error generating complaint:', err);
    res.status(500).json({ error: err.message || 'Complaint generation failed' });
  }
});

// 7. PayPal Sandbox Endpoints

// Create PayPal Order
app.post('/api/paypal/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'USD', planName = 'Demo Broadband Subscription' } = req.body;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isLive = process.env.PAYPAL_ENVIRONMENT === 'live';

    // If real credentials present, call PayPal Sandbox REST API
    if (clientId && clientSecret) {
      try {
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, isLive);
        const host = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        const orderRes = await fetch(`${host}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: `NETPAL-REF-${Date.now()}`,
                description: planName,
                amount: {
                  currency_code: currency,
                  value: amount.toFixed(2),
                },
              },
            ],
            application_context: {
              brand_name: 'NetPal AI Demo',
              landing_page: 'NO_PREFERENCE',
              user_action: 'PAY_NOW',
            },
          }),
        });

        if (!orderRes.ok) {
          const errText = await orderRes.text();
          throw new Error(`PayPal create order failed: ${orderRes.status} ${errText}`);
        }

        const orderData = await orderRes.json();
        return res.json({
          success: true,
          orderId: orderData.id,
          status: orderData.status,
          isSimulated: false,
        });
      } catch (paypalErr: any) {
        console.warn('[NetPal AI] PayPal API call failed, falling back to Sandbox Simulator:', paypalErr.message);
      }
    }

    // High-fidelity Sandbox Simulator for testing & evaluation
    const orderId = `PAYPAL-ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    res.json({
      success: true,
      orderId,
      status: 'CREATED',
      isSimulated: true,
      message: 'PayPal Sandbox order generated in simulation mode.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Capture PayPal Order
app.post('/api/paypal/capture-order', async (req: Request, res: Response) => {
  try {
    const { orderId, amountInINR = 999, amountInUSD = 12.0, planName = 'Demo Broadband Monthly Subscription', payerName = 'Viswaa Srinivasan', payerEmail = 'viswaa.consumer@example.com' } = req.body;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isLive = process.env.PAYPAL_ENVIRONMENT === 'live';

    let captureId = `CAPTURE-CAP-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    let isSimulated = true;

    if (clientId && clientSecret && !orderId.startsWith('PAYPAL-ORD-')) {
      try {
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, isLive);
        const host = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        const capRes = await fetch(`${host}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!capRes.ok) {
          const errText = await capRes.text();
          throw new Error(`PayPal capture failed: ${capRes.status} ${errText}`);
        }

        const capData = await capRes.json();
        const firstCapture = capData.purchase_units?.[0]?.payments?.captures?.[0];
        if (firstCapture?.id) {
          captureId = firstCapture.id;
          isSimulated = false;
        }
      } catch (paypalErr: any) {
        console.warn('[NetPal AI] PayPal capture failed, using simulation capture ID:', paypalErr.message);
      }
    }

    const newTransaction = {
      id: orderId,
      captureId,
      planName,
      providerName: store.settings.defaultProvider || 'Demo Broadband',
      amountInINR: Number(amountInINR),
      amountInUSD: Number(amountInUSD),
      currency: 'USD',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      payerName,
      payerEmail,
      refunds: [],
      isSimulated,
    };

    store.transactions.unshift(newTransaction);
    saveStore();

    res.json({
      success: true,
      transaction: newTransaction,
      message: 'PayPal payment captured successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Process Partial or Full Refund (Provider Demonstration Workflow)
app.post('/api/paypal/refund', async (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      captureId,
      refundAmountINR,
      refundAmountUSD,
      reason = 'Broadband outage service credit approved under SLA policy',
      approvedBy = 'Demo Telecom Operations Specialist',
    } = req.body;

    // Locate transaction
    const transaction = store.transactions.find(
      (t) => t.id === transactionId || (captureId && t.captureId === captureId)
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction record not found.' });
    }

    // Calculate previous refunds
    const totalPreviouslyRefundedINR = transaction.refunds.reduce(
      (sum: number, r: any) => sum + (r.amountInINR || 0),
      0
    );
    const remainingBalanceINR = transaction.amountInINR - totalPreviouslyRefundedINR;

    const reqRefundINR = Number(refundAmountINR);
    if (reqRefundINR <= 0) {
      return res.status(400).json({ error: 'Refund amount must be greater than zero.' });
    }

    if (reqRefundINR > remainingBalanceINR + 0.01) {
      return res.status(400).json({
        error: `Refund amount (₹${reqRefundINR.toFixed(2)}) exceeds remaining eligible balance (₹${remainingBalanceINR.toFixed(2)}). Duplicate or excessive refunds are prevented.`,
      });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isLive = process.env.PAYPAL_ENVIRONMENT === 'live';

    let refundId = `REFUND-SANDBOX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    let isSimulated = true;

    // Attempt actual PayPal Refund API if real credentials and non-simulated capture
    if (clientId && clientSecret && transaction.captureId && !transaction.isSimulated) {
      try {
        const accessToken = await getPayPalAccessToken(clientId, clientSecret, isLive);
        const host = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        const refundValUSD = (refundAmountUSD || reqRefundINR / 83.0).toFixed(2);

        const refRes = await fetch(`${host}/v2/payments/captures/${transaction.captureId}/refund`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: {
              value: refundValUSD,
              currency_code: 'USD',
            },
            note_to_payer: `NetPal AI broadband service credit refund for account ${store.settings.accountNumber}`,
          }),
        });

        if (!refRes.ok) {
          const errText = await refRes.text();
          throw new Error(`PayPal refund failed: ${refRes.status} ${errText}`);
        }

        const refData = await refRes.json();
        refundId = refData.id;
        isSimulated = false;
      } catch (paypalErr: any) {
        console.warn('[NetPal AI] Real PayPal refund call failed, using simulation refund ID:', paypalErr.message);
      }
    }

    const newRefund = {
      refundId,
      captureId: transaction.captureId || 'N/A',
      amountInINR: reqRefundINR,
      amountInUSD: Number((refundAmountUSD || reqRefundINR / 83.0).toFixed(2)),
      currency: 'USD',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      reason,
      approvedBy,
      isSimulated,
    };

    transaction.refunds.push(newRefund);

    const newTotalRefundedINR = totalPreviouslyRefundedINR + reqRefundINR;
    if (newTotalRefundedINR >= transaction.amountInINR - 0.5) {
      transaction.status = 'REFUNDED';
    } else {
      transaction.status = 'PARTIALLY_REFUNDED';
    }

    saveStore();

    res.json({
      success: true,
      refund: newRefund,
      updatedTransaction: transaction,
      message: `Partial refund of ₹${reqRefundINR.toFixed(2)} ($${newRefund.amountInUSD.toFixed(2)}) processed successfully.`,
    });
  } catch (err: any) {
    console.error('[NetPal AI] Error processing refund:', err);
    res.status(500).json({ error: err.message || 'Refund processing failed' });
  }
});

// Vite / Static Files handler
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NetPal AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[NetPal AI] Server failed to start:', err);
});
