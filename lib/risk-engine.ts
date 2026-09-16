export type RiskTier = "High" | "Medium" | "Low";

export type RiskCase = {
  id: string;
  client: string;
  caseType: string;
  exposure: number;
  score: number;
  tier: RiskTier;
};

export function calculateRiskScore(factors: Record<string, number>, weights: Record<string, number>) {
  const entries = Object.entries(factors);
  if (!entries.length) return 0;

  const totalWeight = entries.reduce((sum, [key]) => sum + (weights[key] ?? 0), 0);
  if (!totalWeight) return 0;

  const weighted = entries.reduce((sum, [key, value]) => sum + value * (weights[key] ?? 0), 0);
  return weighted / totalWeight;
}

export function riskTier(score: number): RiskTier {
  if (score >= 3.5) return "High";
  if (score >= 2.5) return "Medium";
  return "Low";
}

export const defaultWeights = {
  financial: 0.35,
  behavior: 0.20,
  compliance: 0.30,
  operational: 0.15
};

export const cases: RiskCase[] = [
  { id: "CR-1013", client: "SME Credit Line", caseType: "Credit", exposure: 950000, score: 5.0, tier: "High" },
  { id: "CR-1016", client: "Trade Finance Invoice", caseType: "Trade", exposure: 680000, score: 5.0, tier: "High" },
  { id: "CR-1021", client: "Trade Finance Invoice", caseType: "Trade", exposure: 590000, score: 5.0, tier: "High" },
  { id: "CR-1026", client: "Supplier Payment", caseType: "Payment", exposure: 900000, score: 5.0, tier: "High" },
  { id: "CR-1001", client: "Working Capital Loan", caseType: "Credit", exposure: 990000, score: 4.7, tier: "High" },
  { id: "CR-1007", client: "Trade Finance Invoice", caseType: "Trade", exposure: 590000, score: 4.7, tier: "High" },
  { id: "CR-1024", client: "Import Facility", caseType: "Trade", exposure: 760000, score: 4.7, tier: "High" },
  { id: "CR-1038", client: "Working Capital Loan", caseType: "Credit", exposure: 780000, score: 4.7, tier: "High" },
  { id: "CR-1005", client: "Working Capital Loan", caseType: "Credit", exposure: 510000, score: 3.6, tier: "High" },
  { id: "CR-1015", client: "SME Credit Line", caseType: "Credit", exposure: 160000, score: 3.6, tier: "High" },
  { id: "CR-1011", client: "SME Credit Line", caseType: "Credit", exposure: 300000, score: 3.3, tier: "Medium" },
  { id: "CR-1027", client: "Import Facility", caseType: "Trade", exposure: 530000, score: 3.3, tier: "Medium" },
  { id: "CR-1040", client: "Trade Finance Invoice", caseType: "Trade", exposure: 240000, score: 3.3, tier: "Medium" },
  { id: "CR-1014", client: "Working Capital Loan", caseType: "Credit", exposure: 500000, score: 3.2, tier: "Medium" },
  { id: "CR-1004", client: "Working Capital Loan", caseType: "Credit", exposure: 300000, score: 3.0, tier: "Medium" },
  { id: "CR-1012", client: "Trade Finance Invoice", caseType: "Trade", exposure: 224000, score: 3.0, tier: "Medium" },
  { id: "CR-1019", client: "Trade Finance Invoice", caseType: "Trade", exposure: 300000, score: 3.0, tier: "Medium" },
  { id: "CR-1034", client: "Supplier Payment", caseType: "Payment", exposure: 150000, score: 2.3, tier: "Low" },
  { id: "CR-1020", client: "Trade Finance Invoice", caseType: "Trade", exposure: 48000, score: 2.0, tier: "Low" },
  { id: "CR-1032", client: "Working Capital Loan", caseType: "Credit", exposure: 150000, score: 2.0, tier: "Low" },
  { id: "CR-1008", client: "Working Capital Loan", caseType: "Credit", exposure: 48000, score: 1.7, tier: "Low" },
  { id: "CR-1017", client: "Supplier Payment", caseType: "Payment", exposure: 80000, score: 1.6, tier: "Low" },
  { id: "CR-1030", client: "SME Credit Line", caseType: "Credit", exposure: 60000, score: 1.6, tier: "Low" },
  { id: "CR-1031", client: "Import Facility", caseType: "Trade", exposure: 60000, score: 1.6, tier: "Low" },
  { id: "CR-1035", client: "Supplier Payment", caseType: "Payment", exposure: 15000, score: 1.6, tier: "Low" }
];
