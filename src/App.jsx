import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Download,
  Printer,
  ExternalLink,
  Activity,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileText,
  X,
  Code2,
  Info,
  ShieldCheck,
  AlertOctagon,
  ArrowRight
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
  const [showBisproModal, setShowBisproModal] = useState(false);
  const [analystNotes, setAnalystNotes] = useState(
    'Initial KYT triage completed. Verified counterparty transaction distribution and monitored for peel-chain dispersal patterns.'
  );

  async function runInvestigation(targetChain, targetAddr) {
    setLoading(true);
    setError('');
    try {
      const result = await investigateAddress(targetChain, targetAddr);
      setReport(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch on-chain data from Blockscout / RPC.');
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
    const payload = { ...report, analystNotes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyt-audit-dossier-${report.chain}-${report.address.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const riskScore = report ? report.kyt.score : 0;
  const riskColor = riskScore > 65 ? '#ef4444' : riskScore > 25 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid #1a2233',
        background: 'rgba(10, 13, 20, 0.94)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(16, 185, 129, 0.35)'
          }}>
            <ShieldAlert size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
                On-Chain KYT &amp; Asset Recovery Investigator
              </h1>
              <span style={{
                fontSize: '11px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                FORENSICS V2.2
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', fontFamily: 'monospace' }}>
              Designed by Toti Putra Pratama • AML/KYT Compliance &amp; Forensic Operations
            </p>
          </div>
        </div>

        {/* Action Controls & Bispro Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBisproModal(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(2, 132, 199, 0.25))',
              border: '1px solid #10b981',
              color: '#34d399',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Compass size={15} />
            <span>Architecture &amp; Business Process Flow (Bispro)</span>
          </button>

          <a
            href="https://github.com/Toti-417/onchain-kyt-investigator"
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#121824',
              border: '1px solid #1f293d',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Code2 size={14} />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Bispro Highlights Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(18, 24, 36, 0.95) 100%)',
        borderBottom: '1px solid #1a2233',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            fontWeight: 800
          }}>
            AML PIPELINE SPECIFICATION
          </span>
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
            <strong>5-Step Forensic Pipeline:</strong> Address Ingestion ➔ Multi-Hop Graph Traversal ➔ OFAC/Blacklist Matching ➔ Algorithmic Risk Scoring (0–100) ➔ Compliance Dossier Export.
          </span>
        </div>
        <button
          onClick={() => setShowBisproModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          View Full Bispro Diagram &rarr;
        </button>
      </div>

      {/* Main Workspace */}
      <main style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', width: '100%', flex: 1 }}>
        
        {/* Search & Presets Panel */}
        <div style={{
          background: '#0f1422',
          border: '1px solid #1f293d',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <select
              value={chain}
              onChange={e => setChain(e.target.value)}
              style={{
                background: '#0a0d16',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <option value="ethereum">Ethereum Mainnet (Blockscout)</option>
              <option value="base">Base L2 (Blockscout)</option>
              <option value="solana">Solana Mainnet (Solana RPC)</option>
            </select>

            <input
              type="text"
              placeholder="Enter EVM (0x...) or Solana wallet address to audit..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                background: '#0a0d16',
                border: '1px solid #1e293b',
                color: '#f8fafc',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#10b981',
                color: '#022c22',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Search size={15} />
              <span>{loading ? 'Scanning Ledger...' : 'Run KYT Audit'}</span>
            </button>
          </form>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Test Scenarios:</span>
            {PRESET_CASES.map(p => (
              <button
                key={p.id}
                onClick={() => handlePreset(p)}
                style={{
                  background: address === p.address ? 'rgba(16, 185, 129, 0.2)' : '#0a0d16',
                  border: address === p.address ? '1px solid #10b981' : '1px solid #1e293b',
                  color: address === p.address ? '#34d399' : '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '14px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {report && (
          <div>
            {/* Top Risk KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '24px' }}>
              
              {/* Risk Score Card */}
              <div style={{
                background: '#0f1422',
                border: '1px solid #1f293d',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative'
              }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AML / KYT Risk Score
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'monospace', color: riskColor }}>
                    {report.kyt.score}
                  </span>
                  <span style={{ fontSize: '16px', color: '#64748b' }}>/ 100</span>
                </div>
                <div style={{
                  display: 'inline-block',
                  background: `${riskColor}22`,
                  color: riskColor,
                  border: `1px solid ${riskColor}44`,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {report.kyt.riskTier} Tier
                </div>
              </div>

              {/* Native Balance Card */}
              <div style={{
                background: '#0f1422',
                border: '1px solid #1f293d',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Native Asset Balance
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc' }}>
                    {report.balanceNative.toFixed(4)}
                  </span>
                  <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 700 }}>{report.symbol}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
                  {shortAddr(report.address)} {report.ensName ? `(${report.ensName})` : ''}
                </div>
              </div>

              {/* Counterparty Flows Card */}
              <div style={{
                background: '#0f1422',
                border: '1px solid #1f293d',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transaction Concentration
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc' }}>
                    {report.kyt.metrics.incomingCount} IN / {report.kyt.metrics.outgoingCount} OUT
                  </span>
                </div>
                <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                  {report.kyt.metrics.uniqueCounterparties} Distinct Counterparties
                </div>
              </div>

              {/* Compliance Status Card */}
              <div style={{
                background: '#0f1422',
                border: '1px solid #1f293d',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sanction &amp; Mixer Flags
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: report.kyt.flags.length > 0 ? '#ef4444' : '#10b981' }}>
                    {report.kyt.flags.length} Red Flags
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {report.kyt.flags.length > 0 ? report.kyt.flags.join(', ') : 'Clean OFAC & Mixer Match'}
                </div>
              </div>
            </div>

            {/* Split View: Transaction Graph & Analyst Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              {/* Recent Transaction Flow */}
              <div style={{
                background: '#0f1422',
                border: '1px solid #1f293d',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                    Recent Ledger Activity (Sampled Counterparties)
                  </h3>
                  <a
                    href={`${report.explorer}/address/${report.address}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    View on Explorer <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {report.txs.map((tx, idx) => (
                    <div
                      key={tx.hash || idx}
                      style={{
                        background: '#0a0d16',
                        border: '1px solid #1a2233',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          {tx.timestamp} &bull; {tx.from === report.address ? 'OUTFLOW ➔' : 'INFLOW ⬅'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: tx.from === report.address ? '#ef4444' : '#10b981' }}>
                          {tx.from === report.address ? '-' : '+'}{tx.value} {report.symbol}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Fee: {tx.fee || 'Normal'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyst Case Notes & Audit Dossier Export */}
              <div style={{
                background: '#0f1422',
                border: '1px solid #1f293d',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0' }}>
                    Compliance Officer Dossier &amp; Case Notes
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                    Record findings before exporting official compliance documentation for regulatory inspection.
                  </p>
                  <textarea
                    rows={6}
                    value={analystNotes}
                    onChange={e => setAnalystNotes(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0a0d16',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      padding: '12px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button
                    onClick={exportJson}
                    style={{
                      flex: 1,
                      background: '#10b981',
                      color: '#022c22',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} /> Export Compliance Dossier (JSON)
                  </button>

                  <button
                    onClick={() => window.print()}
                    style={{
                      background: '#1a2233',
                      color: '#cbd5e1',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Printer size={14} /> Print Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bispro Architecture Modal */}
      <AnimatePresence>
        {showBisproModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 7, 14, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#0d121f',
                border: '1px solid #202d4a',
                borderRadius: '16px',
                maxWidth: '860px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
                    <Compass size={13} /> COMPLIANCE BUSINESS PROCESS SPECIFICATION
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                    On-Chain KYT &amp; Asset Recovery Investigation Pipeline
                  </h2>
                </div>
                <button
                  onClick={() => setShowBisproModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Problem Statement */}
              <div style={{ background: '#080b13', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  1. Operational Compliance Risk Addressed
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Cryptocurrency exchanges, liquidity protocols, and financial institutions risk <strong>OFAC sanction violations, heavy regulatory fines, and reputational collapse</strong> if they process deposits linked to mixer protocols (Tornado Cash), ransomware extortion, or peel-chain money laundering. This system automates rapid address triage and produces tamper-resistant audit dossiers.
                </p>
              </div>

              {/* 5-Step Operational Pipeline */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  2. 5-Step Automated KYT Pipeline
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    {
                      step: '01',
                      title: 'Address Ingestion & Chain Auto-Detection',
                      desc: 'Accepts raw EVM (0x...) or Solana base58 wallet hashes, auto-detects network topology, and queries Blockscout API v2 or Solana RPC for account state.',
                      badge: 'Ingestion'
                    },
                    {
                      step: '02',
                      title: 'Multi-Hop Graph & Counterparty Traversal',
                      desc: 'Scrapes transaction history, calculates inflow vs outflow volumes, and aggregates unique counterparty addresses to detect high-velocity dispersal.',
                      badge: 'Graph Analysis'
                    },
                    {
                      step: '03',
                      title: 'OFAC & Mixer Blacklist Cross-Referencing',
                      desc: 'Matches direct and 2-hop counterparties against known sanction lists, darknet deposit addresses, and privacy mixing smart contracts.',
                      badge: 'Sanction Screening'
                    },
                    {
                      step: '04',
                      title: 'Algorithmic Risk Scoring (0–100)',
                      desc: 'Computes a composite risk score incorporating balance concentration, counterparty diversity, transaction velocity, and known illicit flags.',
                      badge: 'Risk Scoring'
                    },
                    {
                      step: '05',
                      title: 'Dossier Generation & Asset Recovery Export',
                      desc: 'Packages the audit trail, metrics, and analyst notes into an official JSON Case Dossier and printable PDF report for law enforcement or regulatory submission.',
                      badge: 'Reporting'
                    }
                  ].map(p => (
                    <div
                      key={p.step}
                      style={{
                        background: '#090d18',
                        border: '1px solid #1c263b',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontWeight: 800,
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace'
                      }}>
                        {p.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>{p.title}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', background: '#131b2e', padding: '2px 6px', borderRadius: '4px' }}>{p.badge}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Roles */}
              <div style={{ background: '#080b13', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  3. Target Industry Roles
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    <strong>• AML / KYT Compliance Analyst:</strong> Reviews wallet risk scores and manages suspicious transaction reports (STR/SAR).
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    <strong>• On-Chain Forensic Investigator:</strong> Traces illicit asset movements across EVM and Solana ecosystems.
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    <strong>• Asset Recovery Specialist:</strong> Documents stolen funds for freeze requests and civil recovery filings.
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Select sample scenarios above to test different risk profiles.
                </span>
                <button
                  onClick={() => setShowBisproModal(false)}
                  style={{
                    background: '#10b981',
                    color: '#022c22',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Return to Investigation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a2233',
        padding: '16px 28px',
        background: '#070a10',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div>
          On-Chain KYT &amp; Asset Recovery Investigator • Blockscout &amp; Solana RPC Forensics
        </div>
        <div>
          Maintained by <strong>Toti Putra Pratama</strong> (totiputra08@gmail.com) • Live Vercel Production
        </div>
      </footer>
    </div>
  );
}
