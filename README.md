# NetPal AI 🛡️⚡

> **Tagline:** *Every minute offline deserves an explanation. Every eligible outage deserves compensation.*  
> **Product Category:** AI-powered broadband consumer protection and payment/refund assistant.  
> **Target Audience:** Indian broadband subscribers (Airtel Xstream, JioFiber, ACT Fibernet, Tata Play Fiber, BSNL Bharat Fibre, Hathway, Excitel).

---

## 🚀 Overview

**NetPal AI** is an AI-powered broadband consumer rights and payment reconciliation assistant designed specifically for Indian broadband consumers. Under the Telecom Regulatory Authority of India (TRAI) Quality of Service (QoS) regulations, broadband service providers are required to restore service faults within 24 to 48 hours or provide proportional rebates on monthly subscription charges.

NetPal AI bridges the gap between complicated telecom invoices, fragmented outage evidence, and consumer grievance systems:
1. **AI Broadband Bill Scanner**: Upload PDF or image invoices to extract base rental amounts, GST taxes, and billing cycles using Gemini 3.8 Flash.
2. **Downtime & Incident Tracker**: Chronologically records service disruptions, extracts outage timestamps and trouble ticket IDs from uploaded screenshots/SMS evidence using Gemini.
3. **Transparent Service Credit Calculator**: Deterministically calculates proportional statutory credits based on TRAI regulations:
   $$\text{Potential Credit} = \frac{\text{Eligible Monthly Rental Amount} \times \text{Eligible Outage Duration}}{\text{Billing Period Duration}}$$
4. **AI Regulatory Grievance Generator**: Drafts comprehensive, formal complaint letters addressed to telecom Nodal Officers in **English** and **Tamil (தமிழ்)** with instant TXT and PDF letterhead downloads.
5. **PayPal Sandbox Payment & Partial Refund Flow**: Demonstrates full payment capture and authorized provider-side partial refund workflows using the PayPal REST API.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, jsPDF.
- **Backend**: Node.js & Express server with TypeScript (`server.ts`).
- **AI Engine**: Google Gemini API (`@google/genai` SDK) using `gemini-3.8-flash` with structured JSON schema outputs.
- **Payment & Refund Demonstration**: PayPal REST API (Sandbox Checkout, Capture, and Partial Refund endpoints).
- **Persistence**: High-reliability lightweight JSON store with local file backup and seamless demo-data hydration.

---

## 📋 Guided Evaluation Tour (Step 1 to Step 8)

For instant evaluation, NetPal AI features an interactive top banner that guides users through the exact 8-step user journey:

- **STEP 1: Overview Dashboard** — Inspect current broadband plan (ACT Fibernet 150 Mbps, ₹999/mo), downtime summary (96 hours / 4 days), and eligible claim status.
- **STEP 2: Analyze Broadband Bill** — Upload any telecom invoice or click *"Load Sample Bill (ACT Fibernet)"* for instant parsing.
- **STEP 3: Review Extracted Details** — Review and edit Gemini extracted rental, 18% GST (₹179.82), account number, and billing cycle.
- **STEP 4: View Downtime Timeline** — Inspect 3 verified outages (4 cumulative days) and examine attached screenshots and router diagnostics.
- **STEP 5: Calculate Service Credit** — Review the deterministic calculation ($\text{₹}999 \times 4 \div 30 = \text{₹}133.20$) and Gemini's TRAI QoS legal rationale.
- **STEP 6: Generate Formal Complaint** — Generate a formal grievance in **English** or **Tamil (தமிழ்)**, copy to clipboard, or download as an official PDF.
- **STEP 7: PayPal Sandbox Checkout** — Execute a sandbox subscription payment capture ($12.00 USD / ₹999).
- **STEP 8: Authorized Partial Refund** — Switch to the Telecom Provider Operations Portal, approve the claim, and issue an authorized partial refund of ₹133.20 via the PayPal Sandbox API.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
GEMINI_API_KEY="your-gemini-api-key"

# APP_URL: The URL where this applet is hosted.
APP_URL="http://localhost:3000"

# PAYPAL SANDBOX CREDENTIALS (Optional):
# If omitted, NetPal AI runs in high-fidelity Sandbox Simulation / Demo Mode.
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_ENVIRONMENT="sandbox"
```

### 1. Google Gemini API Setup
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create an API key.
3. Configure `GEMINI_API_KEY` in `.env` (or via AI Studio Secrets).

### 2. PayPal Developer Sandbox Setup
1. Log in to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Navigate to **Apps & Credentials** and select **Sandbox**.
3. Create an App or use the default sandbox app.
4. Copy the **Client ID** and **Secret** to `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
5. Set `PAYPAL_ENVIRONMENT="sandbox"`.
*Note: If credentials are left blank, NetPal AI automatically activates its high-fidelity Sandbox Simulation mode so all checkout and refund workflows work seamlessly.*

---

## 💻 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (Express + Vite)
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 📦 Building for Production

```bash
# Build client and bundle server
npm run build

# Start production server
npm start
```

---

## ⚖️ Consumer Protection & Legal Notice

NetPal AI generates estimates and drafts based on published Telecom Regulatory Authority of India (TRAI) Quality of Service (QoS) regulations and standard Indian Consumer Protection guidelines. Actual refunds and service credits remain subject to telecom provider verification, field audits, and mutual terms of service. PayPal Sandbox features demonstrate technical transaction lifecycles and require participating ISP merchant integration in production.
