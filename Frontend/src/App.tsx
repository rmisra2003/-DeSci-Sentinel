import React from 'react';
import { Beaker, Zap, Shield, ChevronRight, Activity, Terminal, Search, CreditCard, BookOpen, Network, FileText, CheckCircle } from 'lucide-react';
import { KineticHeadline } from './components/KineticHeadline';
import { ScholarOrb } from './components/ScholarOrb';
import { CurationFeed } from './components/CurationFeed';
import { AgentSidebar } from './components/AgentSidebar';
import { useAgentSocket } from './hooks/useBackend';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App() {
  const { logs, connected } = useAgentSocket();

  // Configure Solana network and wallets
  const network = 'devnet';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const payoutCount = logs.filter((log) => log.status === 'Payout Sent').length;
  const avgTrustScore = logs.length
    ? Math.round(logs.reduce((acc, log) => acc + (log.trustScore || 0), 0) / logs.length)
    : 0;
  const latestLog = logs[0];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-x-hidden">
            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-slow" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 xl:right-80 p-8 flex justify-between items-center z-50">
              <div className="flex items-center gap-2 font-mono text-emerald-500 font-bold tracking-widest">
                <Beaker className="w-6 h-6" />
                <span>DESCI SENTINEL // v2.1</span>
              </div>
              <div className="hidden md:flex gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                <a href="#documentation" className="hover:text-white transition-colors">Documentation</a>
                <a href="#grant-logs" className="hover:text-white transition-colors">Grant Logs</a>
                <a href="#network" className="hover:text-white transition-colors">Network</a>
                <a href="#judges" className="hover:text-white transition-colors">Judges</a>
              </div>
            </nav>

            <div className="relative flex">
              {/* Main Content Area */}
              <div className="flex-1 xl:mr-80">
                <div className="relative flex flex-col items-center pt-32 pb-24 px-8 min-h-screen">
                  <main className="relative z-10 flex flex-col items-center max-w-4xl w-full space-y-24">
                    {/* Hero Section */}
                    <section className="flex flex-col items-center w-full">
                      <ScholarOrb />

                      <div className="mt-12 text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                          <Activity className="w-3 h-3 animate-pulse" />
                          System Status: {connected ? 'Live' : 'Simulated'}
                          <span className="mx-1 opacity-40">•</span>
                          Latency: {connected ? 'Live' : 'N/A'}
                        </div>

                        <KineticHeadline
                          text="Find Your BioDAO"
                          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight"
                        />

                        <p className="max-w-xl mx-auto text-white/40 text-sm md:text-base font-medium leading-relaxed">
                          DeSci Sentinel evaluates your research and tells you exactly which BioDAO in the Bio.xyz ecosystem is the best fit for your work — so you know where to apply for funding.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                          <button
                            onClick={() => scrollToSection('research-feed')}
                            className="group relative px-8 py-4 bg-emerald-500 text-black font-bold rounded-sm overflow-hidden transition-all hover:scale-105 active:scale-95"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              INITIALIZE RESEARCH <Zap className="w-4 h-4 fill-current" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                          </button>

                          <button
                            onClick={() => scrollToSection('network')}
                            className="group px-8 py-4 border border-white/10 font-bold rounded-sm flex items-center gap-2 hover:bg-white/5 transition-all text-white/80"
                          >
                            BIO DAO TOKENS <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Stats Highlights */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                      <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 text-white/40">
                          <Shield className="w-4 h-4" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/80">AI Research Scoring</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed font-sans">
                          Scores your research across reproducibility, methodology, novelty, and impact — then recommends the most relevant BioDAO for your work.
                        </p>
                      </div>

                      <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 text-white/40">
                          <Terminal className="w-4 h-4" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-purple-400">Bio.xyz Ecosystem Map</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed font-sans">
                          Connects researchers to 10 active BioDAOs (VitaDAO, HairDAO, PsyDAO, CryoDAO, and more) with direct links to their websites and focus areas.
                        </p>
                      </div>
                    </section>

                    {/* How It Works */}
                    <section className="w-full max-w-4xl space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">How It Works</h2>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
                          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span className={connected ? 'text-emerald-400/80' : 'text-amber-400/80'}>
                            {connected ? 'Live Evaluation' : 'Demo Mode'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Search className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">IPFS Ingest</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            DeSci Sentinel ingests research metadata from IPFS submissions to build a standardized evaluation packet.
                          </p>
                        </div>

                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Shield className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Evaluate + Score</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            Claims are scored for reproducibility, methodology, novelty, and impact. Trust scores drive funding eligibility.
                          </p>
                        </div>

                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Activity className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">BioDAO Discovery</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            AI maps your research keywords to the most relevant BioDAO in the Bio.xyz ecosystem and educates you on where to apply for grants.
                          </p>
                        </div>

                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CreditCard className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Payout + Notify</span>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            High-trust research triggers on-chain payouts. Transactions and statuses are reflected in real time.
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* What You Can Do */}
                    <section className="w-full max-w-4xl space-y-6">
                      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">What You Can Do</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Submit a CID</div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            Provide an IPFS CID when Live mode is active to trigger a full evaluation pipeline.
                          </p>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Review Scoring</div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            Click any feed card to see scoring notes, trust score, and verification hash.
                          </p>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Track Payouts</div>
                          <p className="text-sm text-white/70 leading-relaxed">
                            When a grant is approved, the payout transaction appears in the log for on-chain verification.
                          </p>
                        </div>
                      </div>

                      {!connected && (
                        <div className="glass-card p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                          <div className="flex items-center gap-2 text-amber-400 font-mono text-[10px] uppercase tracking-widest">
                            <Terminal className="w-3 h-3" />
                            Demo Mode Active
                          </div>
                          <p className="text-sm text-white/60 leading-relaxed mt-2">
                            Start the backend to enable live submissions and real-time evaluations. Demo mode simulates activity only.
                          </p>
                        </div>
                      )}
                    </section>

                    {/* Documentation */}
                    <section id="documentation" className="w-full max-w-4xl space-y-6 scroll-mt-24">
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">Documentation</h2>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">Local API Guide</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <BookOpen className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Core Endpoints</span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed font-mono">
                            `GET /api/health`
                          </p>
                          <p className="text-xs text-white/70 leading-relaxed font-mono">
                            `POST /api/evaluate`
                          </p>
                          <p className="text-xs text-white/70 leading-relaxed font-mono">
                            `GET /api/biodao/tokens?onchain=true`
                          </p>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Evaluate Payload</span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">
                            Required: `cid`
                          </p>
                          <p className="text-xs text-white/70 leading-relaxed">
                            Optional: `title`, `author`
                          </p>
                          <p className="text-xs text-white/70 leading-relaxed">
                            Claim payout: `walletAddress`, `signature`
                          </p>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Terminal className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Response Fields</span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">
                            `trustScore`, `recommendedBioDao`, `grantRecommendation`
                          </p>
                          <p className="text-xs text-white/70 leading-relaxed">
                            `reproducibilityScore`, `methodologyScore`
                          </p>
                          <p className="text-xs text-white/70 leading-relaxed">
                            `noveltyScore`, `impactScore`, `verificationHash`
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Bio.xyz Ecosystem Discovery */}
                    <section id="bio-ecosystem" className="w-full max-w-4xl space-y-6 scroll-mt-24">
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">Bio.xyz Ecosystem</h2>
                        <a href="https://bio.xyz" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300 transition-colors">bio.xyz ↗</a>
                      </div>

                      <div className="glass-card p-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-6">
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold text-white/90">How DeSci Sentinel Connects You to Bio.xyz</h3>
                          <p className="text-sm text-white/60 leading-relaxed">
                            Bio.xyz is a decentralized science ecosystem with 10 active BioDAOs — each funding a specific area of scientific research. DeSci Sentinel acts as a <span className="text-emerald-400 font-semibold">discovery layer</span>: it analyzes your research, scores it, and tells you which BioDAO is the best match for your work.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {[
                            { name: 'VitaDAO', focus: 'Longevity', url: 'https://vitadao.com' },
                            { name: 'HairDAO', focus: 'Dermatology', url: 'https://hairdao.xyz' },
                            { name: 'PsyDAO', focus: 'Psychedelics', url: 'https://psydao.io' },
                            { name: 'CryoDAO', focus: 'Cryobiology', url: 'https://cryodao.org' },
                            { name: 'AthenaDAO', focus: "Women's Health", url: 'https://athenadao.co' },
                            { name: 'ValleyDAO', focus: 'Synth Bio', url: 'https://valleydao.bio' },
                            { name: 'CerebrumDAO', focus: 'Neuro', url: 'https://cerebrumdao.com' },
                            { name: 'Curetopia', focus: 'Rare Disease', url: 'https://curetopia.xyz' },
                            { name: 'Long COVID', focus: 'Post-Viral', url: 'https://longcovidlabs.org' },
                            { name: 'Quantum Bio', focus: 'Quantum', url: 'https://quantumbiology.xyz' },
                          ].map((dao) => (
                            <a key={dao.name} href={dao.url} target="_blank" rel="noopener noreferrer" className="glass-card p-3 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-all hover:scale-105 group text-center">
                              <div className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 group-hover:text-emerald-300">{dao.name}</div>
                              <div className="text-[8px] text-white/40 mt-1">{dao.focus}</div>
                            </a>
                          ))}
                        </div>

                        <p className="text-xs text-white/40 leading-relaxed">
                          When you submit research, our AI identifies the keywords that match each BioDAO's focus area and recommends where you should apply. This is an educational tool — it does not submit to BioDAOs on your behalf.
                        </p>
                      </div>
                    </section>

                    {/* Judges Brief */}
                    <section id="judges" className="w-full max-w-4xl space-y-6 scroll-mt-24">
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">For the Judges</h2>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">Quick Guide</span>
                      </div>

                      {/* Top summary */}
                      <div className="glass-card p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-sm text-white/70 leading-relaxed">
                          <span className="text-emerald-400 font-semibold">DeSci Sentinel</span> is a research evaluation tool that helps scientists find the right BioDAO for their work.
                          A researcher uploads their paper to IPFS, submits the link here, and our AI checks if it's original, scores it, and tells them which of the 10 BioDAOs on <a href="https://bio.xyz" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">bio.xyz</a> is the best match for funding.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Try It */}
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Activity className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Try It (2 min)</span>
                          </div>
                          <ol className="list-decimal list-inside text-sm text-white/70 leading-relaxed space-y-2">
                            <li>Scroll down to the live feed.</li>
                            <li>Paste any IPFS CID and hit submit.</li>
                            <li>Watch the 3-step verification run live.</li>
                            <li>Open the result to see scores + BioDAO match.</li>
                          </ol>
                        </div>

                        {/* What's Real */}
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">What's Real</span>
                          </div>
                          <div className="space-y-2 text-sm text-white/70 leading-relaxed">
                            <p>✅ Ownership check — verifies you own the IPFS file.</p>
                            <p>✅ Plagiarism scan — searches the web for copies.</p>
                            <p>✅ AI scoring — rates your research quality.</p>
                            <p>✅ BioDAO match — recommends a real Bio.xyz DAO.</p>
                            <p>✅ Solana payout — real Devnet transaction.</p>
                          </div>
                        </div>

                        {/* What's Simulated */}
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                          <div className="flex items-center gap-2 text-amber-400">
                            <Shield className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">What's Simulated</span>
                          </div>
                          <div className="space-y-2 text-sm text-white/70 leading-relaxed">
                            <p>⚠️ The token is our own Devnet mint, not Bio's real $BIO.</p>
                            <p>⚠️ We don't submit to BioDAOs for you — we show you where to go.</p>
                            <p>⚠️ Scoring is AI-based heuristics, not formal peer review.</p>
                          </div>
                        </div>
                      </div>

                      {/* Future Vision — Full Width */}
                      <div className="glass-card p-8 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-4">
                        <div className="flex items-center gap-2 text-purple-400">
                          <Zap className="w-5 h-5" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Future Vision — What Bio.xyz Could Integrate</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">
                          Right now, DeSci Sentinel uses a custom Devnet token to simulate grant payouts. But the payout system is built to be <span className="text-purple-300 font-semibold">token-agnostic</span> — it only needs a mint address and a recipient wallet.
                        </p>
                        <p className="text-sm text-white/70 leading-relaxed">
                          If Bio Protocol ever issues an official <span className="text-purple-300 font-semibold">$BIO SPL token on Solana</span>, DeSci Sentinel could become a real autonomous grant agent: evaluate research, route it to the right BioDAO, and distribute actual funding — all without human intervention. The entire evaluation pipeline (ownership, plagiarism, scoring, routing) is already built and working. The only missing piece is a real token.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-300">Modular Payout System</span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-300">Swap Token Mint in .env</span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-300">Bio.xyz Solana Programs</span>
                        </div>
                      </div>
                    </section>

                    {/* Grant Logs */}
                    <section id="grant-logs" className="w-full max-w-4xl space-y-6 scroll-mt-24">
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">Grant Logs</h2>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">Live Feed Snapshot</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Activity className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Latest Evaluation</span>
                          </div>
                          {latestLog ? (
                            <div className="space-y-2">
                              <p className="text-sm text-white/80 font-semibold">{latestLog.title}</p>
                              <p className="text-xs text-white/50 font-mono uppercase tracking-widest">{latestLog.status}</p>
                              <p className="text-xs text-emerald-400 font-mono">Trust Score: {latestLog.trustScore}%</p>
                              <p className="text-xs text-white/60">BioDAO: {latestLog.recommendedBioDao || 'Unassigned'}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-white/50">No live evaluations yet. Submit a CID to create the first log.</p>
                          )}
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Shield className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Summary</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">Logs</div>
                              <div className="text-2xl font-mono text-white/90">{logs.length}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">Payouts</div>
                              <div className="text-2xl font-mono text-white/90">{payoutCount}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">Avg Trust</div>
                              <div className="text-2xl font-mono text-white/90">{avgTrustScore}%</div>
                            </div>
                          </div>
                          <button
                            onClick={() => scrollToSection('research-feed')}
                            className="mt-2 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300"
                          >
                            View Live Feed <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Network */}
                    <section id="network" className="w-full max-w-4xl space-y-6 scroll-mt-24">
                      <div className="flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">Network</h2>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">Solana + BioDAO</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Network className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Solana Cluster</span>
                          </div>
                          <p className="text-sm text-white/70">Network: {network}</p>
                          <p className="text-xs text-white/50 font-mono break-all">RPC: {endpoint}</p>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Shield className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Wallets</span>
                          </div>
                          <p className="text-sm text-white/70">Phantom, Solflare</p>
                          <p className="text-xs text-white/50">Auto-connect enabled for fast demos.</p>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Terminal className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">BioDAO Discovery</span>
                          </div>
                          <p className="text-sm text-white/70">10 BioDAOs from the Bio.xyz ecosystem.</p>
                          <p className="text-xs text-white/50">AI-powered keyword matching routes your research to the right DAO.</p>
                        </div>
                      </div>
                    </section>

                    {/* Curation Feed Section */}
                    <section id="research-feed" className="w-full scroll-mt-24">
                      <CurationFeed logs={logs} connected={connected} />
                    </section>
                  </main>
                </div>

                {/* Background Decorative Lines */}
                <div className="fixed inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </div>

              {/* Persistant Sidebar - Only visible on desktop (handled by Tailwind responsive classes) */}
              <AgentSidebar connected={connected} logsCount={logs.length} />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
