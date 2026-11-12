# NetPal AI 🛡️⚡

> **Every minute offline deserves an explanation. Every eligible outage deserves compensation.**

NetPal AI is an independent prototype that helps Indian broadband subscribers organise bill details, document service interruptions, estimate potential service credits, and prepare consumer grievance drafts.

**Live demo:** https://netpal-ai.vercel.app  
**Repository:** https://github.com/viswaasrinivasan/netpal-ai

## Project overview

Broadband customers may have to piece together information from bills, outage messages, support screenshots, and complaint channels. NetPal AI brings these tasks into one guided workflow.

The project combines document extraction and evidence summarisation with a transparent, user-reviewable calculation and complaint drafting. It also includes a PayPal Sandbox workflow to demonstrate payment capture and refund API concepts. It is a prototype, not an ISP service or an official TRAI platform.

## Problem statement

When a broadband connection is interrupted, a subscriber may have difficulty:
- finding the eligible rental amount and billing period in an invoice;
- keeping a clear timeline of outages and support-ticket references;
- understanding whether a service-credit rule may apply;
- preparing a structured complaint with supporting information.

NetPal AI aims to make those steps easier and more understandable.

## Features

- **Broadband bill scanner:** submits bill image/document content to Gemini for structured extraction of provider, plan, billing dates, rental, taxes, and payable amount. Users should review extracted values before relying on them.
- **Downtime and incident tracker:** analyses uploaded outage evidence or text to identify possible dates, times, ticket references, and issue descriptions. AI extraction is not independent verification.
- **Potential service-credit calculator:** applies a deterministic proportional calculation to user-confirmed inputs. The result is an estimate, not a guaranteed refund or legal determination.
- **Grievance draft generator:** prepares complaint text in English and supported Indian languages, including Tamil, for the subscriber to review and edit.
- **TXT/PDF exports:** supports saving generated complaint content.
- **PayPal Sandbox demonstration:** shows a test payment-capture and refund workflow. It does not connect to an ISP billing system or pay an actual broadband refund.
- **Guided evaluation tour:** provides sample data and a walkthrough of the main screens.

## Guided evaluation tour

The demo journey is organised into eight steps:

1. **Overview dashboard** — inspect the sample broadband plan, outage summary, and potential claim.
2. **Analyse a bill** — upload a bill or load the sample ACT Fibernet bill.
3. **Review extracted details** — inspect and correct the extracted rental, tax, account, and billing-cycle fields.
4. **View the downtime timeline** — review the sample outage records and associated evidence.
5. **Estimate a potential credit** — inspect the calculation and its inputs.
6. **Generate a grievance draft** — create and review a complaint in a supported language, then copy or export it.
7. **PayPal Sandbox checkout** — explore the test payment flow where the backend is configured.
8. **Provider-side refund demonstration** — explore the sample operations workflow and Sandbox refund flow where configured.

The ACT Fibernet plan, ₹999 rental, 96-hour downtime, three outage records, and ₹133.20 example calculation are **demonstration data**, not verified customer records or a claim against ACT Fibernet.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling and interface | Tailwind CSS, Lucide React, Motion |
| Backend | Node.js, Express, TypeScript |
| AI integration | Google Gemini API via `@google/genai` |
| Payment demonstration | PayPal JavaScript SDK and PayPal REST APIs |
| Document export | jsPDF |
| Demo persistence | In-memory state with local JSON-file persistence |

## Installation and setup

### Prerequisites

- Node.js with npm
- A Google Gemini API key for AI-powered routes
- PayPal Sandbox application credentials only if you want to test the PayPal API integration

### 1. Clone the repository

```bash
git clone https://github.com/viswaasrinivasan/netpal-ai.git
cd netpal-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file in the project root. Use the variable names shown below and add your own credentials locally:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=sandbox
```

Do not commit your real `.env` file or share API credentials. The committed `.env.example` contains placeholders only.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build and run

```bash
npm run build
npm start
```

Other available scripts:

- `npm run lint` — TypeScript check.
- `npm run preview` — Vite preview server.

## How PayPal Sandbox is integrated

The backend uses PayPal's REST API to demonstrate a test transaction lifecycle:

1. It requests an OAuth access token using the configured PayPal application credentials.
2. It creates a Sandbox order.
3. It captures the approved Sandbox order.
4. It can submit a full or partial refund request against a captured Sandbox payment, subject to PayPal Sandbox API behavior.

Set `PAYPAL_ENVIRONMENT=sandbox` and provide the Sandbox Client ID and Secret on the backend. Keep the Client Secret server-side; never expose it in frontend code or commit it to Git.

**Demo-mode caveat:** when credentials are absent or an API operation fails, the current backend contains simulation/fallback behavior. A simulated transaction or refund is not a real PayPal API success. Check the application's status and transaction details carefully when evaluating it.

The sample ₹999 / $12.00 payment and ₹133.20 refund are illustrative demo values. No real payment is taken, no ISP merchant account is connected, and no broadband bill is refunded.

## How Google Gemini AI is integrated

The backend initialises the Google GenAI SDK using the server-side `GEMINI_API_KEY`. The current source uses the `gemini-3.8-flash` model identifier and structured JSON responses for:

- broadband bill field extraction;
- outage-evidence summarisation;
- service-credit explanation;
- complaint drafting in supported languages.

AI output can be incomplete or incorrect. Users should check names, dates, amounts, ticket IDs, and generated complaint text against original records before using them. The API key must remain on the server and must never be embedded in client-side code.

## Environment variable reference

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Server-side key for Gemini API calls |
| `APP_URL` | Application base URL used by the backend |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox application Client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox application Secret; keep private |
| `PAYPAL_ENVIRONMENT` | Use `sandbox` for testing |

The `.env.example` file documents the expected variables. Copy it to `.env` locally and replace placeholders on your own machine. Do not commit `.env`, `.env.local`, or any file containing real credentials.

## Limitations and future scope

### Current limitations

- **Prototype status:** this is not affiliated with, endorsed by, or integrated with TRAI or any broadband provider.
- **Regulatory interpretation:** TRAI's 2024 Quality of Service regulations contain specific fault-repair benchmarks and rebate provisions with conditions. Eligibility depends on the applicable regulation, service type, fault records, and circumstances. NetPal AI does not make a binding legal determination. Check the current regulation and provider grievance process before making a claim.
- **Estimates only:** the calculator depends on user-provided and AI-extracted inputs. It does not establish that a particular outage qualifies for compensation.
- **AI accuracy:** extracted data and generated text require human review.
- **Sandbox only:** PayPal Sandbox demonstrates test payment APIs; it does not issue actual ISP compensation or refund a broadband subscription.
- **Persistence:** the current backend stores state in memory and attempts local JSON-file persistence. This is suitable only for a prototype; local filesystem writes are not durable storage on many serverless hosting platforms.
- **Deployment:** the project uses an Express server. A frontend deployment alone does not guarantee that Express API routes or file persistence work in a serverless hosting environment. The backend may need a compatible server host or serverless adaptation.
- **Security hardening:** before production use, add authentication, authorisation, input validation, rate limiting, secure data storage, audit logging, and appropriate privacy controls. Do not use the prototype to store real customer bills or personal information.

### Future scope

- Integrate secure, durable database storage and user authentication.
- Add evidence integrity checks, user-confirmed outage timelines, and exportable case histories.
- Improve accessibility, voice input, and regional-language review.
- Build secure integrations with provider complaint channels where official APIs or approved processes are available.
- Add a verified rules engine that tracks regulatory updates and clearly explains eligibility assumptions.
- Harden payment workflows and connect to participating merchants only through authorised integrations.

## Consumer protection and legal notice

NetPal AI is an independent informational prototype. It is not legal advice, a government service, a telecom provider portal, or an official TRAI tool. Complaint drafts and potential service-credit amounts are informational aids only. Subscribers should verify applicable rules, provider terms, outage evidence, and complaint procedures independently.

PayPal Sandbox operations are test transactions only. They do not move real money or guarantee compensation from a broadband provider.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
