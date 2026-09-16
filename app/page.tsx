"use client";

import { useMemo, useState } from "react";
import { cases, RiskCase, riskTier } from "../lib/risk-engine";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default function Home() {
  const [selectedTier, setSelectedTier] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"score" | "exposure">("score");
  const [showAssessment, setShowAssessment] = useState(false);

  const filtered = useMemo(() => {
    return [...cases]
      .filter(c => selectedTier === "All" || c.tier === selectedTier)
      .filter(c =>
        `${c.id} ${c.client} ${c.caseType}`.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b[sort] - a[sort]);
  }, [selectedTier, query, sort]);

  const highExposure = cases
    .filter(c => c.tier === "High")
    .reduce((sum, c) => sum + c.exposure, 0);

  const counts = {
    High: cases.filter(c => c.tier === "High").length,
    Medium: cases.filter(c => c.tier === "Medium").length,
    Low: cases.filter(c => c.tier === "Low").length
  };

  const total = cases.length;
  const highPct = (counts.High / total) * 100;
  const mediumPct = (counts.Medium / total) * 100;
  const lowPct = (counts.Low / total) * 100;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">RISK INTELLIGENCE</p>
          <h1>Risk-Based Case Prioritization</h1>
        </div>
        <button className="primary" onClick={() => setShowAssessment(true)}>+ New Assessment</button>
      </header>

      <section className="toolbar">
        <div className="searchWrap">
          <span>⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search case, client or case type..."
          />
        </div>
        <label className="sortControl">
          Sort by
          <select value={sort} onChange={e => setSort(e.target.value as "score" | "exposure")}>
            <option value="score">Risk Score</option>
            <option value="exposure">Exposure</option>
          </select>
        </label>
      </section>

      <section className="grid">
        <div className="panel queue">
          <div className="panelHead">
            <div>
              <p className="muted">CASE QUEUE</p>
              <h2>Prioritized Cases</h2>
            </div>
            <span className="countPill">{filtered.length} cases</span>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Client</th>
                  <th>Case Type</th>
                  <th>Exposure</th>
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
                    <td>{formatMoney(c.exposure)}</td>
                    <td><strong>{c.score.toFixed(1)}</strong></td>
                    <td><span className={`badge ${c.tier.toLowerCase()}`}>{c.tier}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rightCol">
          <div className="metrics">
            <Metric title="Total Exposure · High Risk" value={formatMoney(highExposure)} sub="Across current high-risk queue" />
            <Metric title="Number of High-Risk Cases" value={String(counts.High)} sub="Require priority review" />
          </div>

          <div className="lower">
            <div className="panel chartPanel">
              <div className="panelHead">
                <div>
                  <p className="muted">PORTFOLIO MIX</p>
                  <h2>Cases by Risk Tier</h2>
                </div>
              </div>
              <div className="donutArea">
                <div
                  className="donut"
                  style={{
                    background: `conic-gradient(#ef4444 0 ${highPct}%, #facc15 ${highPct}% ${highPct + mediumPct}%, #22c55e ${highPct + mediumPct}% 100%)`
                  }}
                >
                  <div className="donutInner">
                    <strong>{total}</strong>
                    <span>Total cases</span>
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
                  <p className="muted">QUICK FILTER</p>
                  <h2>Filter by Tier</h2>
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
        <span>Risk Intelligence · v1.0</span>
        <span>Configurable scoring engine · Built for GitHub</span>
      </footer>

      {showAssessment && <AssessmentModal onClose={() => setShowAssessment(false)} />}
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

function AssessmentModal({ onClose }: { onClose: () => void }) {
  const [exposure, setExposure] = useState(500000);
  const [financial, setFinancial] = useState(3);
  const [behavior, setBehavior] = useState(2);
  const [compliance, setCompliance] = useState(3);
  const [operational, setOperational] = useState(2);

  const score = (financial * 0.35 + behavior * 0.2 + compliance * 0.3 + operational * 0.15);
  const tier = riskTier(score);

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modalHead">
          <div>
            <p className="muted">NEW ASSESSMENT</p>
            <h2>Calculate Risk Score</h2>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <div className="formGrid">
          <label>Exposure (USD)<input type="number" value={exposure} onChange={e => setExposure(Number(e.target.value))}/></label>
          <ScoreInput label="Financial Risk" value={financial} setValue={setFinancial}/>
          <ScoreInput label="Behavioral Risk" value={behavior} setValue={setBehavior}/>
          <ScoreInput label="Compliance Risk" value={compliance} setValue={setCompliance}/>
          <ScoreInput label="Operational Risk" value={operational} setValue={setOperational}/>
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
