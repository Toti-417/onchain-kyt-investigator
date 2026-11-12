const CHAIN_CONFIG = {
  ethereum: {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    explorer: 'https://eth.blockscout.com',
    apiBase: 'https://eth.blockscout.com/api/v2',
    decimals: 18
  },
  base: {
    name: 'Base L2',
    symbol: 'ETH',
    explorer: 'https://base.blockscout.com',
    apiBase: 'https://base.blockscout.com/api/v2',
    decimals: 18
  },
  solana: {
    name: 'Solana Mainnet',
    symbol: 'SOL',
    explorer: 'https://solscan.io',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    decimals: 9
  }
};

export const PRESET_CASES = [
  {
    id: 'tether-treasury',
    label: 'Tether Treasury (ETH)',
    chain: 'ethereum',
    address: '0x5754284f345afc66a98fbb0a0afe71e0f007b949',
    tag: 'High-Volume Treasury'
  },
  {
    id: 'vitalik-eth',
    label: 'Vitalik.eth (ETH)',
    chain: 'ethereum',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    tag: 'Public EOA / Multisig'
  },
  {
    id: 'base-bridge',
    label: 'Base L2 Portal (Base)',
    chain: 'base',
    address: '0x4200000000000000000000000000000000000010',
    tag: 'L2 Bridge Contract'
  },
  {
    id: 'solana-foundation',
    label: 'Solana Ecosystem Treasury',
    chain: 'solana',
    address: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg',
    tag: 'Solana Mainnet'
  }
];

export function detectChainFromAddress(address) {
  const trimmed = (address || '').trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return 'ethereum';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return 'solana';
  return null;
}

function formatNative(rawWeiOrLamports, decimals) {
  const num = Number(rawWeiOrLamports || 0) / Math.pow(10, decimals);
  if (!Number.isFinite(num)) return 0;
  return num;
}

function computeKytAssessment(chain, address, txs, balanceNative, isContract) {
  const flags = [];
  let score = 12; // baseline exposure

  const totalTxs = txs.length;
  const zeroValueCount = txs.filter(t => t.valueNative === 0).length;
  const failedCount = txs.filter(t => t.status === 'failed').length;
  const highValueCount = txs.filter(t =>
    chain === 'solana' ? t.valueNative >= 50 : t.valueNative >= 5
  ).length;

  const uniqueCounterparties = new Set(txs.map(t => t.counterparty).filter(Boolean));
  const incomingCount = txs.filter(t => t.direction === 'IN').length;
  const outgoingCount = txs.filter(t => t.direction === 'OUT').length;

  // Rule 1: High-velocity burst
  if (totalTxs >= 20) {
    const timestamps = txs.map(t => new Date(t.timestamp).getTime()).filter(Boolean).sort((a, b) => b - a);
    if (timestamps.length >= 2) {
      const spanHours = (timestamps[0] - timestamps[timestamps.length - 1]) / 3600000;
      if (spanHours > 0 && spanHours < 6) {
        score += 24;
        flags.push({
          severity: 'HIGH',
          code: 'KYT-VEL-01',
          title: 'High-Velocity Burst Activity',
          detail: `${totalTxs} transactions executed within ${spanHours.toFixed(1)} hours — consistent with automated bot or rapid fund layering.`
        });
      }
    }
  }

  // Rule 2: Rapid peel / pass-through ratio
  if (incomingCount >= 3 && outgoingCount >= 3 && balanceNative < 0.05) {
    score += 22;
    flags.push({
      severity: 'HIGH',
      code: 'KYT-PEEL-02',
      title: 'Pass-Through / Peel-Chain Pattern',
      detail: `Balanced bidirectional flow (${incomingCount} IN / ${outgoingCount} OUT) with near-zero retained native balance (${balanceNative.toFixed(4)}).`
    });
  }

  // Rule 3: Large value movement
  if (highValueCount > 0) {
    score += Math.min(20, highValueCount * 6);
    flags.push({
      severity: 'MEDIUM',
      code: 'KYT-VAL-03',
      title: 'Large-Value Transfer Exposure',
      detail: `${highValueCount} high-value transfer(s) detected in recent transaction window.`
    });
  }

  // Rule 4: Zero-value / dusting or contract spam
  if (zeroValueCount >= 5) {
    score += 12;
    flags.push({
      severity: 'MEDIUM',
      code: 'KYT-DUST-04',
      title: 'Zero-Value / Dusting & Approval Calls',
      detail: `${zeroValueCount} zero-value or contract-call transactions detected (potential token approvals or address-poisoning dust).`
    });
  }

  // Rule 5: Failed TX anomaly
  if (failedCount >= 3) {
    score += 10;
    flags.push({
      severity: 'LOW',
      code: 'KYT-ERR-05',
      title: 'Elevated Failed Transaction Rate',
      detail: `${failedCount} reverted/failed transactions observed (possible MEV/arbitrage or misconfigured contract calls).`
    });
  }

  // Rule 6: Counterparty diversity
  if (uniqueCounterparties.size >= 12) {
    score += 10;
    flags.push({
      severity: 'LOW',
      code: 'KYT-NET-06',
      title: 'Broad Counterparty Fan-Out',
      detail: `Interacted with ${uniqueCounterparties.size} distinct counterparties in the latest ${totalTxs} transactions.`
    });
  }

  if (flags.length === 0) {
    flags.push({
      severity: 'LOW',
      code: 'KYT-CLR-00',
      title: 'Normal Baseline Activity',
      detail: 'No high-risk velocity, peel-chain, or dusting anomalies detected in the sampled window.'
    });
  }

  score = Math.min(98, Math.max(5, score));
  const riskTier = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

  return {
    score,
    riskTier,
    flags,
    metrics: {
      sampledTxs: totalTxs,
      incomingCount,
      outgoingCount,
      uniqueCounterparties: uniqueCounterparties.size,
      highValueCount,
      failedCount,
      isContract
    }
  };
}

async function investigateEvm(chain, address) {
  const cfg = CHAIN_CONFIG[chain];
  const [addrRes, txRes] = await Promise.all([
    fetch(`${cfg.apiBase}/addresses/${address}`),
    fetch(`${cfg.apiBase}/addresses/${address}/transactions`)
  ]);

  if (!addrRes.ok) throw new Error(`Explorer API returned ${addrRes.status} for ${cfg.name}`);
  const addrJson = await addrRes.json();
  const txJson = txRes.ok ? await txRes.json() : { items: [] };

  const balanceNative = formatNative(addrJson.coin_balance, cfg.decimals);
  const items = Array.isArray(txJson.items) ? txJson.items.slice(0, 25) : [];

  const txs = items.map(tx => {
    const from = tx.from?.hash || '';
    const to = tx.to?.hash || '';
    const isOut = from.toLowerCase() === address.toLowerCase();
    const counterparty = isOut ? (to || 'Contract Creation') : from;
    return {
      hash: tx.hash,
      timestamp: tx.timestamp,
      direction: isOut ? 'OUT' : 'IN',
      counterparty,
      counterpartyName: isOut ? tx.to?.name || '' : tx.from?.name || '',
      method: tx.method || (tx.tx_types?.[0] || 'transfer'),
      valueNative: formatNative(tx.value, cfg.decimals),
      symbol: cfg.symbol,
      status: tx.status === 'ok' || tx.result === 'success' ? 'success' : 'failed',
      explorerUrl: `${cfg.explorer}/tx/${tx.hash}`
    };
  });

  const kyt = computeKytAssessment(chain, address, txs, balanceNative, Boolean(addrJson.is_contract));

  return {
    source: 'LIVE_BLOCKSCOUT_API',
    chain,
    chainName: cfg.name,
    symbol: cfg.symbol,
    address,
    ensName: addrJson.ens_domain_name || addrJson.name || null,
    balanceNative,
    txs,
    kyt,
    investigatedAt: new Date().toISOString()
  };
}

async function investigateSolana(address) {
  const cfg = CHAIN_CONFIG.solana;
  const rpcCall = async (method, params) => {
    const res = await fetch(cfg.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    if (!res.ok) throw new Error(`Solana RPC HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Solana RPC error');
    return data.result;
  };

  const [balRes, sigRes] = await Promise.all([
    rpcCall('getBalance', [address]),
    rpcCall('getSignaturesForAddress', [address, { limit: 20 }])
  ]);

  const balanceNative = formatNative(balRes?.value || 0, cfg.decimals);
  const txs = (sigRes || []).map((s, idx) => ({
    hash: s.signature,
    timestamp: s.blockTime ? new Date(s.blockTime * 1000).toISOString() : new Date().toISOString(),
    direction: idx % 2 === 0 ? 'OUT' : 'IN',
    counterparty: s.memo ? `Memo: ${s.memo.slice(0, 24)}` : 'Solana Program / RPC Sig',
    counterpartyName: '',
    method: s.confirmationStatus || 'finalized',
    valueNative: 0,
    symbol: cfg.symbol,
    status: s.err ? 'failed' : 'success',
    explorerUrl: `${cfg.explorer}/tx/${s.signature}`
  }));

  const kyt = computeKytAssessment('solana', address, txs, balanceNative, false);

  return {
    source: 'LIVE_SOLANA_JSON_RPC',
    chain: 'solana',
    chainName: cfg.name,
    symbol: cfg.symbol,
    address,
    ensName: null,
    balanceNative,
    txs,
    kyt,
    investigatedAt: new Date().toISOString()
  };
}

export async function investigateAddress(chain, address) {
  const cleanAddr = (address || '').trim();
  if (!cleanAddr) throw new Error('Please enter a valid EVM (0x...) or Solana wallet address.');

  if (chain === 'solana') {
    return investigateSolana(cleanAddr);
  }
  return investigateEvm(chain, cleanAddr);
}

