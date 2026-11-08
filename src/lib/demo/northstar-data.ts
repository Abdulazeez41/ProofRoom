export interface DemoDocumentDefinition {
  documentId: string;
  name: string;
  category: string;
  description: string;
  version: number;
  content: string;
}

export const NORTHSTAR_DEMO_COMPANY = {
  name: "Northstar Technologies, Inc.",
  foundedYear: 2023,
  founderAccount: "founder.testnet",
  investorAccount: "investor.testnet",
  roomName: "Northstar Series A Due Diligence",
  description:
    "Confidential virtual data room for Northstar Technologies $8M Series A financing round. Contains audited financial performance, enterprise customer agreements, and corporate governance files.",
  purpose: "Fundraising",
};

export const DEMO_SUGGESTED_QUESTIONS = [
  "Which customer contracts contain change-of-control clauses?",
  "What was Northstar's total revenue and ARR growth between 2024 and 2025?",
  "What percentage of 2025 revenue comes from the three largest customers?",
  "What are the major financial risks and contractual liabilities outlined in the disclosures?",
  "Summarize the proposed Series A liquidation preferences and governance terms.",
];

export const DEMO_DOCUMENTS: DemoDocumentDefinition[] = [
  {
    documentId: "doc-fin-2025",
    name: "Northstar_Audited_Financial_Statements_2024_2025.txt",
    category: "Financials",
    description: "Audited balance sheet, income statement, and ARR customer breakdown.",
    version: 1,
    content: `NORTHSTAR TECHNOLOGIES, INC.
ANNUAL AUDITED FINANCIAL STATEMENTS & KPI SUMMARY
FISCAL YEARS ENDED DECEMBER 31, 2024 AND DECEMBER 31, 2025

1. REVENUE PERFORMANCE & GROWTH
- FY 2024 Total Revenue: $4,250,000 USD
- FY 2025 Total Revenue: $11,800,000 USD (YoY Growth: +177.6%)
- Ending Annual Recurring Revenue (ARR) as of Dec 31, 2025: $14,200,000 USD
- Gross Profit Margin FY 2025: 78.4% ($9,251,200 USD)
- Adjusted EBITDA FY 2025: -$1,420,000 USD (Operating cash burn rate: $118,000/month)
- Cash & Equivalents on Hand (Dec 31, 2025): $3,850,000 USD

2. CUSTOMER CONCENTRATION ANALYSIS
Total Active Enterprise Clients (Dec 31, 2025): 84 clients.
Customer Concentration by FY 2025 Revenue:
- Customer A (Acrobat Aerospace Corp): $2,800,000 USD (23.7% of total revenue)
- Customer B (Meridian Health Systems): $1,650,000 USD (14.0% of total revenue)
- Customer C (Apex Global Logistics): $1,150,000 USD (9.7% of total revenue)
Total Top 3 Customer Concentration: 47.4% of FY 2025 revenue ($5,600,000 USD).
Remaining 81 enterprise accounts represent 52.6% of FY 2025 revenue.

3. DISCLOSED FINANCIAL & OPERATIONAL RISKS
- High Customer Concentration: 47.4% of recurring revenue is tied to the three largest enterprise master contracts.
- Runway Assessment: Current cash balance of $3,850,000 provides approximately 18 months of runway at baseline operational burn rate without additional capital.
- Currency Exposure: 92% of revenue is USD-denominated; 8% EUR-denominated without active forward hedging.`,
  },
  {
    documentId: "doc-msa-aerospace",
    name: "Enterprise_MSA_Acrobat_Aerospace.txt",
    category: "Contracts",
    description: "Master Services Agreement with Acrobat Aerospace Corp including corporate control provisions.",
    version: 1,
    content: `MASTER CLOUD SERVICES AGREEMENT
BETWEEN NORTHSTAR TECHNOLOGIES, INC. ("PROVIDER") AND ACROBAT AEROSPACE CORP ("CUSTOMER")
EFFECTIVE DATE: MARCH 15, 2024 | CONTRACT ID: MSA-2024-ACRO-091

SECTION 8: FEES AND PAYMENT TERMS
8.1 Annual Subscription License: Customer shall pay Provider an annual recurring fee of $2,800,000 USD, invoiced annually in advance with Net-30 payment terms.
8.2 Minimum Term: Initial term of thirty-six (36) months expiring March 14, 2027.

SECTION 14: ASSIGNMENT AND CHANGE OF CONTROL
14.1 General Assignment: Neither party may assign or transfer this Agreement without the prior written consent of the other party, except as provided in Section 14.2.
14.2 Permitted Mergers: Provider may assign this Agreement in connection with a bona fide corporate restructuring, provided the surviving entity retains equal or greater technical capability.
14.3 CHANGE OF CONTROL NOTIFICATION AND TERMINATION:
Notwithstanding Section 14.2, in the event of any Change of Control of Provider (defined as any acquisition, merger, reorganization, or sale of more than 50% of voting stock to a third-party commercial entity, or any acquisition by a direct competitor of Customer):
(a) Provider must notify Customer in writing within fifteen (15) calendar days prior to the closing of such transaction;
(b) Customer shall have the unilateral right to immediately terminate this Agreement within ninety (90) days following notice, without penalty or liability for remaining license fees;
(c) Upon such termination, Provider shall refund all prepaid, unearned fees on a pro-rata basis within thirty (30) days.

SECTION 19: CONFIDENTIALITY AND DATA SOVEREIGNTY
All Customer telemetry and flight simulation logs processed through Provider's cloud infrastructure must be encrypted at rest and in transit using cryptographic keys held exclusively by Customer.`,
  },
  {
    documentId: "doc-term-sheet",
    name: "Series_A_Preferred_Stock_Term_Sheet.txt",
    category: "Corporate",
    description: "Series A Investment Term Sheet with valuation, liquidation preference, and governance.",
    version: 1,
    content: `NORTHSTAR TECHNOLOGIES, INC.
CONFIDENTIAL SUMMARY OF PROPOSED TERMS FOR SERIES A PREFERRED STOCK FINANCING

INVESTMENT SUMMARY:
- Issuer: Northstar Technologies, Inc., a Delaware corporation.
- Financing Amount: $8,000,000 USD ("Investment Amount").
- Pre-Money Valuation: $32,000,000 USD.
- Post-Money Valuation: $40,000,000 USD.
- Lead Investor: Series A Lead Syndicate (Participating Account: investor.testnet).

TERMS OF SERIES A PREFERRED STOCK:
1. Liquidation Preference: Non-participating 1.0x preferred liquidation preference over Common Stock upon any liquidation, dissolution, or sale of the company.
2. Board of Directors: The Board shall consist of five (5) members:
   - Two (2) designated by Common Stock holders (Founder and Chief Technology Officer).
   - One (1) designated by the Series A Lead Investor.
   - Two (2) independent industry experts mutually approved by Founder and Lead Investor.
3. Anti-Dilution Protection: Broad-based weighted average anti-dilution adjustment in the event of down-round issuances.
4. Pro-Rata Rights: Major Investors holding at least 5% of preferred stock retain right of first refusal to participate in future equity financing rounds.
5. Information & Data Room Rights: Lead Investor retains standard quarterly inspection rights and perpetual access to audited due diligence virtual workspaces.`,
  },
];
