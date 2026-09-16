"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cases as sampleCases, RiskCase, riskTier, calculateRiskScore, defaultWeights } from "../lib/risk-engine";

type PresetKey = "finance" | "fiveCs" | "education";

type CsvField = { field: string; meaning: string };

type Preset = {
  key: PresetKey;
  label: string;
  eyebrow: string;
  title: string;
  entityLabel: string;
  caseTypeLabel: string;
  exposureLabel: string;
  exposureShort: string;
  factorLabels: { financial: string; behavior: string; compliance: string; operational: string };
  csvFields: CsvField[];
};

const PRESETS: Record<PresetKey, Preset> = {
  finance: {
    key: "finance",
    label: "Finance — Credit Risk",
    eyebrow: "Risk Intelligence Desk",
    title: "Risk-Based Case Prioritization",
    entityLabel: "Client",
    caseTypeLabel: "Case Type",
    exposureLabel: "Exposure (USD)",
    exposureShort: "Exposure",
    factorLabels: {
      financial: "Financial Risk",
      behavior: "Behavioral Risk",
      compliance: "Compliance Risk",
      operational: "Operational Risk"
    },
    csvFields: [
      { field: "financial", meaning: "Financial Risk" },
      { field: "behavior", meaning: "Behavioral Risk" },
      { field: "compliance", meaning: "Compliance Risk" },
      { field: "operational", meaning: "Operational Risk" }
    ]
  },
  fiveCs: {
    key: "fiveCs",
    label: "Finance — 5 Cs of Credit",
    eyebrow: "Teaching case",
    title: "5 Cs of Credit Risk Scoring",
    entityLabel: "Borrower",
    caseTypeLabel: "Facility Type",
    exposureLabel: "Loan Exposure (USD)",
    exposureShort: "Loan Exposure",
    factorLabels: {
      financial: "Capacity",
      behavior: "Character",
      compliance: "Conditions",
      operational: "Capital"
    },
    csvFields: [
      { field: "financial", meaning: "Capacity" },
      { field: "behavior", meaning: "Character" },
      { field: "compliance", meaning: "Conditions" },
      { field: "operational", meaning: "Capital" }
    ]
  },
  education: {
    key: "education",
    label: "Education — Student Risk",
    eyebrow: "Advising snapshot",
    title: "Student Risk & Intervention Dashboard",
    entityLabel: "Student",
    caseTypeLabel: "Program",
    exposureLabel: "Financial Aid at Risk (USD)",
    exposureShort: "Aid at Risk",
    factorLabels: {
      financial: "Academic Performance",
      behavior: "Attendance & Engagement",
      compliance: "Fee/Tuition Compliance",
      operational: "Extracurricular Engagement"
    },
    csvFields: [
      { field: "financial", meaning: "Academic Performance" },
      { field: "behavior", meaning: "Attendance & Engagement" },
      { field: "compliance", meaning: "Fee/Tuition Compliance" },
      { field: "operational", meaning: "Extracurricular Engagement" }
    ]
  }
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function parseCsv(text: string): RiskCase[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const rows = lines.slice(1);

  return rows.map((line, i) => {
    const values = line.split(",").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ""));

    const exposure = Number(row.exposure) || 0;
    const factors = {
      financial: Number(row.financial) || 0,
      behavior: Number(row.behavior) || 0,
      compliance: Number(row.compliance) || 0,
      operational: Number(row.operational) || 0
    };
    const score = calculateRiskScore(factors, defaultWeights);
    const tier = riskTier(score);

    return {
      id: row.id || `ROW-${i + 1}`,
      client: row.client || "Unnamed",
      caseType: row.casetype || row.case_type || "General",
      exposure,
      score,
      tier
    };
  });
}

export default function Home() {
  const [presetKey, setPresetKey] = useState<PresetKey>("finance");
  const preset = PRESETS[presetKey];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", presetKey);
  }, [presetKey]);

  const [cases, setCases] = useState<RiskCase[]>(sampleCases);
  const [usingUpload, setUsingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTier, setSelectedTier] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"score" | "exposure">("score");
  const [showAssessment, setShowAssessment] = useState(false);

  function handleFile(file: File) {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = parseCsv(text);
        if (!parsed.length) {
          setUploadError("No rows found. Check that your CSV has a header row and at least one data row.");
          return;
        }
        setCases(parsed);
        setUsingUpload(true);
        setSelectedTier("All");
      } catch (e) {
        setUploadError("Couldn't read that file. Make sure it's a plain CSV.");
      }
    };
    reader.onerror = () => setUploadError("Couldn't read that file. Make sure it's a plain CSV.");
    reader.readAsText(file);
  }

  function resetToSample() {
    setCases(sampleCases);
    setUsingUpload(false);
    setUploadError(null);
    setSelectedTier("All");
  }

  const filtered = useMemo(() => {
    return [...cases]
      .filter(c => selectedTier === "All" || c.tier === selectedTier)
      .filter(c =>
        `${c.id} ${c.client} ${c.caseType}`.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b[sort] - a[sort]);
  }, [cases, selectedTier, query, sort]);

  const highExposure = cases
    .filter(c => c.tier === "High")
    .reduce((sum, c) => sum + c.exposure, 0);

  const counts = {
    High: cases.filter(c => c.tier === "High").length,
    Medium: cases.filter(c => c.tier === "Medium").length,
    Low: cases.filter(c => c.tier === "Low").length
  };

  const total = cases.length || 1;
  const highPct = (counts.High / total) * 100;
  const mediumPct = (counts.Medium / total) * 100;
  const lowPct = (counts.Low / total) * 100;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{preset.eyebrow}</p>
          <h1>{preset.title}</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={presetKey}
            onChange={e => setPresetKey(e.target.value as PresetKey)}
            style={{ minWidth: 190 }}
          >
            {Object.values(PRESETS).map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button className="secondary" onClick={() => fileInputRef.current?.click()}>
            Upload File (CSV)
          </button>
          <button className="primary" onClick={() => setShowAssessment(true)}>+ New Assessment</button>
        </div>
      </header>

      <div className="panel" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div className="chipRow">
          {preset.csvFields.map(f => (
            <span key={f.field} className="chip"><b>{f.field}</b>{f.meaning}</span>
          ))}
        </div>
        <button className="secondary" onClick={() => setShowCsvHelp(true)}>What columns does my CSV need?</button>
      </div>

      {usingUpload && (
        <div className="panel" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="muted">Showing {cases.length} record(s) from your uploaded file — scores calculated automatically.</span>
          <button className="secondary" onClick={resetToSample}>Reset to sample data</button>
        </div>
      )}
      {uploadError && (
        <div className="panel" style={{ padding: "12px 16px", marginBottom: 16, borderColor: "var(--high)", color: "var(--high-text)" }}>
          {uploadError}
        </div>
      )}

      <section className="toolbar">
        <div className="searchWrap">
          <span>⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${preset.entityLabel.toLowerCase()}, ID or ${preset.caseTypeLabel.toLowerCase()}...`}
          />
        </div>
        <label className="sortControl">
          Sort by
          <select value={sort} onChange={e => setSort(e.target.value as "score" | "exposure")}>
            <option value="score">Risk Score</option>
            <option value="exposure">{preset.exposureShort}</option>
          </select>
        </label>
      </section>

      <section className="grid">
        <div className="panel queue">
          <div className="panelHead">
            <div>
              <p className="muted">{preset.entityLabel} queue</p>
              <h2>Prioritized records</h2>
            </div>
            <span className="countPill">{filtered.length} records</span>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{preset.entityLabel}</th>
                  <th>{preset.caseTypeLabel}</th>
                  <th>{preset.exposureShort}</th>
                  <th>Score</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="mono">{c.id}</td>
                    <td>{c.client}</td>
                    <td>{c.caseType}</td>
                    <td className="mono">{formatMoney(c.exposure)}</td>
                    <td className="mono"><strong>{c.score.toFixed(1)}</strong></td>
                    <td><span className={`badge ${c.tier.toLowerCase()}`}>{c.tier}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rightCol">
          <div className="metrics">
            <Metric title={`Total ${preset.exposureShort} at High Risk`} value={formatMoney(highExposure)} sub="Across current high-risk queue" />
            <Metric title="High-Risk Record Count" value={String(counts.High)} sub="Require priority review" />
          </div>

          <div className="lower">
            <div className="panel chartPanel">
              <div className="panelHead">
                <div>
                  <p className="muted">Portfolio mix</p>
                  <h2>Records by risk tier</h2>
                </div>
              </div>
              <div className="donutArea">
                <div
                  className="donut"
                  style={{
                    background: `conic-gradient(var(--high) 0 ${highPct}%, var(--medium) ${highPct}% ${highPct + mediumPct}%, var(--low) ${highPct + mediumPct}% 100%)`
                  }}
                >
                  <div className="donutInner">
                    <strong>{total}</strong>
                    <span>Total records</span>
                  </div>
                </div>
                <div className="legend">
                  <button onClick={() => setSelectedTier(selectedTier === "High" ? "All" : "High")}><i className="dot highDot"/>High <b>{counts.High}</b><span>{highPct.toFixed(1)}%</span></button>
                  <button onClick={() => setSelectedTier(selectedTier === "Medium" ? "All" : "Medium")}><i className="dot mediumDot"/>Medium <b>{counts.Medium}</b><span>{mediumPct.toFixed(1)}%</span></button>
                  <button onClick={() => setSelectedTier(selectedTier === "Low" ? "All" : "Low")}><i className="dot lowDot"/>Low <b>{counts.Low}</b><span>{lowPct.toFixed(1)}%</span></button>
                </div>
              </div>
            </div>

            <div className="panel filterPanel">
              <div className="panelHead">
                <div>
                  <p className="muted">Quick filter</p>
                  <h2>Filter by tier</h2>
                </div>
              </div>
              <div className="filterGrid">
                {(["High", "Medium", "Low"] as const).map(tier => (
                  <button
                    key={tier}
                    className={`filterCard ${tier.toLowerCase()} ${selectedTier === tier ? "selected" : ""}`}
                    onClick={() => setSelectedTier(selectedTier === tier ? "All" : tier)}
                  >
                    <span className={`dot ${tier.toLowerCase()}Dot`}/>
                    <span>{tier}</span>
                    <strong>{counts[tier]}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <span>{preset.label}</span>
        <span>Scores update automatically as you edit or upload data.</span>
      </footer>

      {showAssessment && (
        <AssessmentModal preset={preset} onClose={() => setShowAssessment(false)} />
      )}

      {showCsvHelp && (
        <div className="modalBackdrop" onClick={() => setShowCsvHelp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modalHead">
              <div>
                <p className="muted">CSV format</p>
                <h2>Required columns</h2>
              </div>
              <button className="close" onClick={() => setShowCsvHelp(false)}>×</button>
            </div>
            <div style={{ padding: 22 }}>
              <p className="mono" style={{ fontSize: 12, marginBottom: 14 }}>
                id,client,caseType,exposure,financial,behavior,compliance,operational
              </p>
              <p style={{ marginBottom: 10 }}>
                The column names in your file never change. Only what they mean changes with the preset you pick above:
              </p>
              <div className="chipRow">
                {preset.csvFields.map(f => (
                  <span key={f.field} className="chip"><b>{f.field}</b>{f.meaning}</span>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
                <span className="mono">exposure</span> is a dollar amount, currently labeled &ldquo;{preset.exposureLabel}&rdquo;.
              </p>
            </div>
            <div className="modalActions">
              <button className="primary" onClick={() => setShowCsvHelp(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="metric panel">
      <p className="muted">{title}</p>
      <div className="metricValue">{value}</div>
      <span>{sub}</span>
    </div>
  );
}

function AssessmentModal({ preset, onClose }: { preset: Preset; onClose: () => void }) {
  const [exposure, setExposure] = useState(500000);
  const [financial, setFinancial] = useState(3);
  const [behavior, setBehavior] = useState(2);
  const [compliance, setCompliance] = useState(3);
  const [operational, setOperational] = useState(2);

  const score = calculateRiskScore(
    { financial, behavior, compliance, operational },
    defaultWeights
  );
  const tier = riskTier(score);

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modalHead">
          <div>
            <p className="muted">New assessment</p>
            <h2>Calculate risk score</h2>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <div className="formGrid">
          <label>{preset.exposureLabel}<input type="number" value={exposure} onChange={e => setExposure(Number(e.target.value))}/></label>
          <ScoreInput label={preset.factorLabels.financial} value={financial} setValue={setFinancial}/>
          <ScoreInput label={preset.factorLabels.behavior} value={behavior} setValue={setBehavior}/>
          <ScoreInput label={preset.factorLabels.compliance} value={compliance} setValue={setCompliance}/>
          <ScoreInput label={preset.factorLabels.operational} value={operational} setValue={setOperational}/>
        </div>

        <div className="scorePreview">
          <div>
            <span>Calculated Risk Score</span>
            <strong>{score.toFixed(2)} / 5.00</strong>
          </div>
          <span className={`badge ${tier.toLowerCase()}`}>{tier}</span>
        </div>

        <div className="modalActions">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={onClose}>Save Assessment</button>
        </div>
      </div>
    </div>
  );
}

function ScoreInput({ label, value, setValue }: { label: string; value: number; setValue: (n: number) => void }) {
  return (
    <label>{label}
      <select value={value} onChange={e => setValue(Number(e.target.value))}>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {n === 1 ? "Low" : n === 5 ? "Critical" : "Moderate"}</option>)}
      </select>
    </label>
  );
}