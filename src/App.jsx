import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Printer,
  ExternalLink,
  Activity,
  GitBranch,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  PRESET_CASES,
  detectChainFromAddress,
  investigateAddress
} from './services/kytEngine';

function shortAddr(addr) {
  if (!addr || addr.length < 14) return addr || '-';
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function App() {
  const [chain, setChain] = useState('ethereum');
  const [address, setAddress] = useState(PRESET_CASES[0].address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [analystNotes, setAnalystNotes] = useState(
    'Initial KYT triage completed. Review high-velocity outflows and counterparty concentration before escalation.'
  );

  async function runInvestigation(targetChain, targetAddr) {
    setLoading(true);
    setError('');
    try {
      const result = await investigateAddress(targetChain, targetAddr);
      setReport(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch on-chain data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runInvestigation(PRESET_CASES[0].chain, PRESET_CASES[0].address);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const detected = detectChainFromAddress(address);
    const nextChain = detected === 'solana' ? 'solana' : chain === 'solana' ? 'ethereum' : chain;
    if (nextChain !== chain) setChain(nextChain);
    runInvestigation(nextChain, address);
  }

  function handlePreset(preset) {
    setChain(preset.chain);
    setAddress(preset.address);
    runInvestigation(preset.chain, preset.address);
  }

  function exportJson() {
    if (!report) return;
    const payload = { ...report, analystNotes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyt-dossier-${report.chain}-${report.address.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tierClass = report ? `risk-${report.kyt.riskTier.split(' ')[0]}` : '';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1>
            <ShieldAlert size={22} color="#14b8a6" />
            On-Chain KYT &amp; Asset Recovery Investigator
          </h1>
          <p>
            Real-Time AML Risk Scoring, Fund-Flow Triage &amp; Compliance Dossier Generator (ETH &bull; Base L2 &bull; Solana)
          </p>
        </div>
        <div className="badge-row no-print">
          <a className="pill" href="https://web3-telemetry-tracker.vercel.app" target="_blank" rel="noreferrer">
            <Activity size={14} /> Telemetry Tracker
          </a>
          <a className="pill" href="https://github.com/Toti-417" target="_blank" rel="noreferrer">
            <GitBranch size={14} /> GitHub: Toti-417
          </a>
        </div>
      </header>

      <section className="search-panel no-print" aria-label="Address investigation">
        <form className="search-form" onSubmit={handleSubmit}>
          <select
            className="select"
            aria-label="Blockchain network"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
          >
            <option value="ethereum">Ethereum Mainnet</option>
            <option value="base">Base L2</option>
            <option value="solana">Solana Mainnet</option>
          </select>
          <input
            className="input mono"
            type="text"
            placeholder="Enter EVM (0x...) or Solana wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            aria-label="Wallet address"
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <Search size={16} />
            {loading ? 'Investigating...' : 'Run KYT Scan'}
          </button>
        </form>

        <div className="presets">
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sample Cases:</span>
          {PRESET_CASES.map((p) => (
            <button
              key={p.id}
              type="button"
              className="preset-btn"
              onClick={() => handlePreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="error-box" role="alert">{error}</div>}

      {report && (
        <>
          <section className="grid-4" aria-label="KYT Risk Summary">
            <div className="card">
              <div className="card-label">AML / KYT Risk Score</div>
              <div className={`card-value ${tierClass}`}>
                {report.kyt.score} / 100
              </div>
              <div className="card-sub">{report.kyt.riskTier} &bull; {report.chainName}</div>
            </div>

            <div className="card">
              <div className="card-label">Native Balance</div>
              <div className="card-value">
                {report.balanceNative.toFixed(4)} {report.symbol}
              </div>
              <div className="card-sub mono">
                {shortAddr(report.address)} {report.ensName ? `(${report.ensName})` : ''}
              </div>
            </div>

            <div className="card">
              <div className="card-label">Sampled Flow (In / Out)</div>
              <div className="card-value">
                {report.kyt.metrics.incomingCount} IN / {report.kyt.metrics.outgoingCount} OUT
              </div>
              <div className="card-sub">
                {report.kyt.metrics.uniqueCounterparties} unique counterparties
              </div>
            </div>

            <div className="card">
              <div className="card-label">Compliance Actions</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={exportJson}>
                  <Download size={14} /> JSON
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                  <Printer size={14} /> Print PDF
                </button>
              </div>
              <div className="card-sub">Source: {report.source}</div>
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <div className="card-label">Triggered KYT &amp; Red-Flag Rules</div>
              <div className="flag-list">
                {report.kyt.flags.map((f) => (
                  <div key={f.code} className={`flag-item sev-${f.severity}`}>
                    <div className="flag-head">
                      <span>{f.code}: {f.title}</span>
                      <span>{f.severity}</span>
                    </div>
                    <div className="flag-detail">{f.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-label">Asset Recovery &amp; Analyst Case Notes</div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '8px' }}>
                Document investigation findings, freeze/escalation decisions, and counterparty attribution for compliance audit trails.
              </p>
              <textarea
                className="input"
                rows={6}
                style={{ width: '100%', marginTop: '6px', resize: 'vertical' }}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                aria-label="Analyst compliance notes"
              />
              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
                Investigated at: <span className="mono">{report.investigatedAt}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-label">Recent On-Chain Transactions &amp; Counterparty Trace</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Direction</th>
                    <th scope="col">Method / Status</th>
                    <th scope="col">Counterparty</th>
                    <th scope="col">Value</th>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {report.txs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ color: '#94a3b8' }}>
                        No recent transactions returned by explorer/RPC for this address.
                      </td>
                    </tr>
                  ) : (
                    report.txs.map((tx) => (
                      <tr key={tx.hash}>
                        <td className={`dir-${tx.direction}`}>{tx.direction}</td>
                        <td>
                          {tx.status === 'success' ? (
                            <CheckCircle2 size={13} color="#10b981" style={{ verticalAlign: 'middle', marginRight: 5 }} />
                          ) : (
                            <AlertTriangle size={13} color="#f43f5e" style={{ verticalAlign: 'middle', marginRight: 5 }} />
                          )}
                          {tx.method}
                        </td>
                        <td className="mono">
                          {tx.counterpartyName ? `${tx.counterpartyName} (${shortAddr(tx.counterparty)})` : shortAddr(tx.counterparty)}
                        </td>
                        <td className="mono">
                          {tx.valueNative.toFixed(4)} {tx.symbol}
                        </td>
                        <td style={{ color: '#94a3b8' }}>
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '-'}
                        </td>
                        <td className="mono">
                          <a
                            href={tx.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#14b8a6', textDecoration: 'none' }}
                          >
                            {shortAddr(tx.hash)} <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

