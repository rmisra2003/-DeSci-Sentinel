import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Activity, Award, Users, BrainCircuit, Wifi, WifiOff } from 'lucide-react';
import { fetchAgentWallet, fetchBioDaoTokens, type WalletInfo, type BioDaoToken } from '../hooks/useBackend';

interface AgentSidebarProps {
  connected?: boolean;
  logsCount?: number;
}

export const AgentSidebar = ({ connected = false, logsCount = 0 }: AgentSidebarProps) => {
  const statsRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGPathElement>(null);
  const [wallet, setWallet] = useState<WalletInfo>({ publicKey: 'Not Connected', solBalance: 0, bioBalance: '0' });
  const [daoTokens, setDaoTokens] = useState<BioDaoToken[]>([]);

  // Fetch wallet info from backend
  useEffect(() => {
    const loadWallet = async () => {
      const info = await fetchAgentWallet();
      setWallet(info);
    };
    loadWallet();
    // Refresh every 30s
    const interval = setInterval(loadWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDaoTokens = async () => {
      const tokens = await fetchBioDaoTokens(true);
      setDaoTokens(tokens);
    };
    loadDaoTokens();
    const interval = setInterval(loadDaoTokens, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;

    const stats = [
      { id: 'papers', value: Math.max(12402, logsCount) },
      { id: 'grants', value: 850.5 },
      { id: 'trust', value: 99.2 },
      { id: 'funded', value: 15.2 },
    ];

    stats.forEach((stat) => {
      const el = statsRef.current?.querySelector(`#stat-${stat.id}`);
      if (el) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent =
              stat.id === 'grants' || stat.id === 'funded'
                ? obj.val.toFixed(1)
                : Math.floor(obj.val).toLocaleString();
          },
        });
      }
    });

    // Wave animation
    if (waveRef.current) {
      const animateWave = () => {
        gsap.to(waveRef.current, {
          attr: {
            d: `M0 20 Q 25 ${Math.random() * 40} 50 20 T 100 20 T 150 20 T 200 20`,
          },
          duration: 1.5,
          ease: 'sine.inOut',
          onComplete: animateWave,
        });
      };
      animateWave();
    }
  }, [logsCount]);

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-black border-l border-white/5 p-8 flex flex-col z-40 hidden xl:flex">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold tracking-widest text-white/90">BIODAO CORE</h3>
            <p className={`font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 ${connected ? 'text-emerald-500' : 'text-amber-500'}`}>
              {connected ? (
                <><Wifi className="w-3 h-3" /> Backend: Live</>
              ) : (
                <><WifiOff className="w-3 h-3" /> Backend: Offline</>
              )}
            </p>
          </div>
        </div>
        <button className="group relative px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center gap-2 hover:bg-emerald-500/20 transition-all">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-mono text-[10px] text-emerald-400 font-bold">
            {(wallet.solBalance || 0).toFixed(2)} SOL
          </span>
          <span className="font-mono text-[10px] text-purple-400 font-bold">
            {parseFloat(wallet.bioBalance || '0').toFixed(1)} BIO
          </span>
        </button>
      </div>

      <div ref={statsRef} className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="group">
          <div className="flex items-center gap-2 mb-2 text-white/40">
            <Activity className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Science Funded</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-white/50 font-mono text-sm">$</span>
            <span id="stat-funded" className="text-4xl font-mono font-bold tracking-tighter text-white">0</span>
            <span className="text-white/50 font-mono text-sm">M+</span>
          </div>
        </div>

        <div className="group">
          <div className="flex items-center gap-2 mb-2 text-white/40">
            <Activity className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Papers Scanned</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span id="stat-papers" className="text-4xl font-mono font-bold tracking-tighter text-white">0</span>
            <span className="text-emerald-500 font-mono text-xs">↑ 12%</span>
          </div>
        </div>

        <div className="group">
          <div className="flex items-center gap-2 mb-2 text-white/40">
            <Award className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Grants Distributed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span id="stat-grants" className="text-4xl font-mono font-bold tracking-tighter text-purple-400">0</span>
            <span className="text-purple-400/50 font-mono text-xs">SOL</span>
          </div>
        </div>

        {/* BioDAO List */}
        <div className="pt-4">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20 mb-4">BioDAO Tokens (On-chain)</h4>
          <div className="flex items-center gap-3 text-[9px] font-mono uppercase text-white/30 mb-3">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On-chain</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Non-Solana</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Missing</span>
          </div>
          <div className="space-y-2">
            {(daoTokens.length > 0
              ? daoTokens.map((dao) => {
                  let status = 'Unknown';
                  let color = 'bg-white/30';
                  if (dao.onChain) {
                    if (dao.onChain.exists) {
                      status = 'On-chain';
                      color = 'bg-emerald-500';
                    } else if (dao.onChain.error === 'unsupported-chain' || dao.onChain.error === 'evm-address') {
                      status = 'Non-Solana';
                      color = 'bg-amber-500';
                    } else if (dao.onChain.error === 'not-found') {
                      status = 'Missing';
                      color = 'bg-rose-500';
                    } else {
                      status = 'Invalid';
                      color = 'bg-rose-500';
                    }
                  }
                  return {
                    name: dao.name,
                    symbol: dao.symbol,
                    status,
                    color,
                  };
                })
              : [
                  { name: 'VitaDAO', symbol: 'VITA', status: 'Unknown', color: 'bg-white/30' },
                  { name: 'HairDAO', symbol: 'HAIR', status: 'Unknown', color: 'bg-white/30' },
                  { name: 'ValleyDAO', symbol: 'VALLEY', status: 'Unknown', color: 'bg-white/30' },
                  { name: 'AthenaDAO', symbol: 'ATHENA', status: 'Unknown', color: 'bg-white/30' },
                ]
            ).map((dao, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <span className="font-mono text-[11px] text-white/70">
                  {dao.name}{dao.symbol ? ` (${dao.symbol})` : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${dao.color}`} />
                  <span className="font-mono text-[9px] text-white/30 uppercase">{dao.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Wallet Details */}
        {connected && (
          <div className="pt-4 border-t border-white/5">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20 mb-3">Scholar Wallet</h4>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <p className="font-mono text-[9px] text-white/30 uppercase mb-1">Public Key</p>
              <p className="font-mono text-[10px] text-emerald-500/60 break-all">{wallet.publicKey}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex justify-between items-center mb-4">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Evaluation Activity</span>
          <span className={`font-mono text-[10px] animate-pulse ${connected ? 'text-emerald-500' : 'text-amber-500'}`}>
            {connected ? 'LIVE' : 'SIMULATED'}
          </span>
        </div>
        <svg viewBox="0 0 200 40" className="w-full h-12">
          <path
            ref={waveRef}
            d="M0 20 Q 25 20 50 20 T 100 20 T 150 20 T 200 20"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0 20 Q 25 20 50 20 T 100 20 T 150 20 T 200 20"
            fill="none"
            stroke="#A855F7"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeLinecap="round"
          />
        </svg>
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/5">
          <p className="font-mono text-[10px] text-white/40 leading-relaxed">
            BIO_LOG: [{connected ? '0x82' : 'DEMO'}] SYNTHESIZING PROTEIN_FOLD_772... <br />
            [{connected ? '0x85' : 'DEMO'}] VERIFYING HASH_9921...
          </p>
        </div>
      </div>
    </aside>
  );
};
