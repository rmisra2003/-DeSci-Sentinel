import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  CheckCircle,
  Search,
  CreditCard,
  X,
  ExternalLink,
  Send,
  Loader2,
  Activity,
  AlertCircle,
  Fingerprint,
  Globe,
  UserCheck,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { type AgentLog, type AgentStatus, submitResearch } from '../hooks/useBackend';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_SUBSCORE = 25;

type StepStatus = 'pending' | 'verified' | 'failed' | 'skipped';

interface StepProps {
  label: string;
  status: StepStatus;
  icon: React.ElementType;
}

function Step({ label, status, icon: Icon }: StepProps) {
  const getColors = () => {
    switch (status) {
      case 'verified':
        return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'failed':
        return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
      case 'skipped':
        return 'text-white/20 border-white/5 bg-white/5';
      default:
        return 'text-white/40 border-white/10 bg-white/5';
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-500',
        getColors(),
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', status === 'pending' && 'animate-pulse')} />
      <span className="text-[8px] font-mono uppercase tracking-tighter">{label}</span>
      {status === 'verified' && <CheckCircle className="w-2 h-2 absolute top-1 right-1" />}
      {status === 'failed' && <AlertCircle className="w-2 h-2 absolute top-1 right-1" />}
    </div>
  );
}

function getEvaluationStatuses(paper: AgentLog) {
  const fallback: StepStatus = paper.status === 'Scanning'
    ? 'pending'
    : paper.status === 'Failed'
      ? 'failed'
      : 'verified';

  const ownership = paper.verificationSteps?.ownership ?? fallback;
  const fingerprint = paper.verificationSteps?.fingerprint ?? fallback;
  const grounding = paper.verificationSteps?.grounding ?? fallback;
  const decision: StepStatus = paper.status === 'Failed'
    ? 'failed'
    : paper.status === 'Scanning'
      ? 'pending'
      : 'verified';

  return { ownership, fingerprint, grounding, decision };
}

function getDetailedStatus(paper: AgentLog, steps: ReturnType<typeof getEvaluationStatuses>) {
  if (paper.status === 'Failed') {
    if (steps.ownership === 'failed') return 'Ownership check failed. The submitted wallet does not match the CID metadata.';
    if (steps.fingerprint === 'failed') return 'Uniqueness check failed. The content matches a prior submission.';
    if (steps.grounding === 'failed') return 'Freshness check failed. The work appears previously published or copied.';
    return 'Evaluation stopped after a failed check. Review the details below.';
  }

  if (paper.status === 'Scanning') {
    if (steps.ownership === 'pending') return 'Verifying ownership metadata or signature (if provided).';
    if (steps.fingerprint === 'pending') return 'Checking for internal duplicates across recent submissions.';
    if (steps.grounding === 'pending') return 'Checking freshness against public sources.';
    return 'Scoring the submission and routing to the best-fit BioDAO.';
  }

  return 'Evaluation complete. Review the scoring breakdown and notes below.';
}

function EvaluationStepper({ paper, detailed = false }: { paper: AgentLog; detailed?: boolean }) {
  const steps = getEvaluationStatuses(paper);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Step label="Ownership" status={steps.ownership} icon={UserCheck} />
        <Step label="Uniqueness" status={steps.fingerprint} icon={Fingerprint} />
        <Step label="Freshness" status={steps.grounding} icon={Globe} />
        <Step label="Decision" status={steps.decision} icon={Activity} />
      </div>

      {detailed && (
        <div className="bg-white/5 border border-white/5 rounded-lg p-3 w-full animate-in fade-in transition-all">
          <p className="font-mono text-[10px] sm:text-xs text-white/70 leading-relaxed uppercase tracking-wider">
            <span className="text-emerald-500/80 mr-2">▶</span>
            {getDetailedStatus(paper, steps)}
          </p>
        </div>
      )}
    </div>
  );
}

const ScoreRow = ({ label, score }: { label: string; score?: number }) => {
  const hasScore = typeof score === 'number' && !Number.isNaN(score);
  const safeScore = hasScore ? Math.max(0, Math.min(MAX_SUBSCORE, score as number)) : 0;
  const pct = hasScore ? Math.round((safeScore / MAX_SUBSCORE) * 100) : 0;
  const barColor = pct >= 70 ? 'bg-emerald-500/70' : pct >= 50 ? 'bg-amber-400/70' : 'bg-rose-500/70';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">{label}</span>
        <span className={cn('text-[10px] font-mono', hasScore ? 'text-white/70' : 'text-white/20')}>
          {hasScore ? `${safeScore}/${MAX_SUBSCORE}` : 'N/A'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', hasScore ? barColor : 'bg-white/5')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

function buildInsights(paper: AgentLog) {
  const strengths: string[] = [];
  const needsWork: string[] = [];

  const checks = [
    {
      label: 'Reproducibility',
      score: paper.reproducibilityScore,
      strong: 'Reproducibility looks strong: methods and data appear well described.',
      weak: 'Add clearer methods, datasets, or protocols to improve reproducibility.',
    },
    {
      label: 'Methodology',
      score: paper.methodologyScore,
      strong: 'Methodology is well structured with clear experimental design.',
      weak: 'Clarify experimental design, controls, and evaluation criteria.',
    },
    {
      label: 'Novelty',
      score: paper.noveltyScore,
      strong: 'Novelty signals are strong with a clear new contribution.',
      weak: 'Highlight what is new versus prior work or known approaches.',
    },
    {
      label: 'Impact',
      score: paper.impactScore,
      strong: 'Impact potential is high with clear downstream value.',
      weak: 'Clarify real-world impact, beneficiaries, or feasibility.',
    },
  ];

  checks.forEach((check) => {
    if (typeof check.score !== 'number') return;
    if (check.score >= 18) strengths.push(check.strong);
    if (check.score <= 12) needsWork.push(check.weak);
  });

  if (strengths.length === 0) strengths.push('No strong signals detected yet. Add more detail to improve scoring.');
  if (needsWork.length === 0) needsWork.push('No major issues flagged. This submission is in good shape.');

  return { strengths, needsWork };
}

const DEMO_PAPERS: AgentLog[] = [
  {
    id: '1',
    title: 'On-chain Genomic Synthesis via Zero-Knowledge Proofs',
    author: 'Dr. Aris Thorne',
    trustScore: 98,
    impactCategory: 'Genomics',
    agentReasoning: 'Heuristic scoring indicates strong reproducibility signals and high potential impact for genomic research.',
    verificationHash: 'a3f2e1d4c5b6...',
    reproducibilityScore: 24,
    methodologyScore: 23,
    noveltyScore: 24,
    impactScore: 24,
    recommendedBioDao: 'VitaDAO',
    grantRecommendation: 'FUND',
    status: 'Verified',
    timestamp: new Date().toISOString(),
    verificationSteps: {
      ownership: 'verified',
      fingerprint: 'verified',
      grounding: 'verified',
    },
  },
  {
    id: '2',
    title: 'Decentralized Clinical Trials: A Privacy-First Framework',
    author: 'Sarah Jenkins',
    trustScore: 85,
    impactCategory: 'Clinical Trials',
    agentReasoning: 'Scoring flags solid methodology but limited reproducibility detail in the submission.',
    verificationHash: '',
    reproducibilityScore: 12,
    methodologyScore: 20,
    noveltyScore: 20,
    impactScore: 22,
    recommendedBioDao: 'AthenaDAO',
    grantRecommendation: 'REVIEW',
    status: 'Scanning',
    timestamp: new Date().toISOString(),
    verificationSteps: {
      ownership: 'pending',
      fingerprint: 'pending',
      grounding: 'pending',
    },
  },
  {
    id: '3',
    title: 'Automated Drug Discovery using Federated Learning',
    author: 'Research Node 0x42',
    trustScore: 92,
    impactCategory: 'Drug Discovery',
    agentReasoning: 'High novelty and impact signals detected. Payout processed to the research node.',
    verificationHash: 'f8e7d6c5b4a3...',
    reproducibilityScore: 18,
    methodologyScore: 22,
    noveltyScore: 24,
    impactScore: 22,
    recommendedBioDao: 'ValleyDAO',
    grantRecommendation: 'FUND',
    status: 'Payout Sent',
    payoutTx: '5xKm...demo',
    timestamp: new Date().toISOString(),
    verificationSteps: {
      ownership: 'verified',
      fingerprint: 'verified',
      grounding: 'verified',
    },
  },
];

const StatusBadge = ({ status }: { status: AgentStatus }) => {
  const configs = {
    'Scanning': { icon: Search, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    'Verified': { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    'Payout Sent': { icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'Failed': { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  };
  const { icon: Icon, color, bg } = configs[status];

  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider', color, bg)}>
      <Icon className="w-3 h-3" />
      {status}
    </div>
  );
};

const RecommendationBadge = ({ recommendation }: { recommendation?: string }) => {
  if (!recommendation) return null;
  const color = recommendation === 'FUND'
    ? 'text-emerald-400'
    : recommendation === 'REVIEW'
      ? 'text-amber-400'
      : 'text-rose-400';
  return (
    <span className={cn('text-[10px] font-mono uppercase tracking-wider', color)}>
      {recommendation}
    </span>
  );
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
}

interface CurationFeedProps {
  logs?: AgentLog[];
  connected?: boolean;
}

export const CurationFeed = ({ logs, connected }: CurationFeedProps) => {
  const { publicKey, signMessage } = useWallet();
  const [papers, setPapers] = useState<AgentLog[]>(DEMO_PAPERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitCid, setSubmitCid] = useState('');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitAuthor, setSubmitAuthor] = useState('');
  const [claimPayout, setClaimPayout] = useState(false);

  // Use real logs from backend when available
  useEffect(() => {
    if (connected) {
      setPapers(logs || []);
    } else if (logs && logs.length > 0) {
      setPapers(logs);
    } else {
      setPapers(DEMO_PAPERS);
    }
  }, [logs, connected]);

  useEffect(() => {
    if (!publicKey) setClaimPayout(false);
  }, [publicKey]);

  // When disconnected, simulate new data arriving (demo mode)
  useEffect(() => {
    if (connected) return;

    const interval = setInterval(() => {
      const reproducibilityScore = Math.floor(Math.random() * 16) + 10;
      const methodologyScore = Math.floor(Math.random() * 16) + 10;
      const noveltyScore = Math.floor(Math.random() * 16) + 10;
      const impactScore = Math.floor(Math.random() * 16) + 10;
      const trustScore = Math.round(((reproducibilityScore + methodologyScore + noveltyScore + impactScore) / (MAX_SUBSCORE * 4)) * 100);

      const status = (['Scanning', 'Verified', 'Payout Sent'] as AgentStatus[])[Math.floor(Math.random() * 3)];
      const verificationSteps: AgentLog['verificationSteps'] =
        status === 'Scanning'
          ? { ownership: 'pending', fingerprint: 'pending', grounding: 'pending' }
          : { ownership: 'verified', fingerprint: 'verified', grounding: 'verified' };

      const newPaper: AgentLog = {
        id: Math.random().toString(36).substr(2, 9),
        title: [
          'Neural-Link Protein Synthesis',
          'Quantum Biology: A New Frontier',
          'CRISPR-Cas9 Efficiency Optimization',
          'Decentralized Peer Review Protocol',
        ][Math.floor(Math.random() * 4)],
        author: `Research Node ${Math.floor(Math.random() * 1000)}`,
        trustScore,
        impactCategory: ['Genomics', 'Drug Discovery', 'Longevity', 'Biotech'][Math.floor(Math.random() * 4)],
        agentReasoning: 'Heuristic scoring suggests strong methodology and reproducibility signals.',
        verificationHash: Math.random().toString(36).substr(2, 12),
        status,
        timestamp: new Date().toISOString(),
        reproducibilityScore,
        methodologyScore,
        noveltyScore,
        impactScore,
        recommendedBioDao: ['VitaDAO', 'ValleyDAO', 'AthenaDAO', 'HairDAO'][Math.floor(Math.random() * 4)],
        grantRecommendation: trustScore > 85 ? 'FUND' : 'REVIEW',
        verificationSteps,
      };
      setPapers((prev) => [newPaper, ...prev.slice(0, 5)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [connected]);

  const handleSubmit = async () => {
    if (!submitCid.trim()) return;

    setSubmitting(true);
    try {
      let walletAddress: string | undefined;
      let signatureBase64: string | undefined;

      if (claimPayout) {
        if (!publicKey || !signMessage) {
          throw new Error('Connect a wallet to claim payout.');
        }
        const message = `Claiming DeSci Sentinel Grant for CID: ${submitCid}`;
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);
        signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));
        walletAddress = publicKey.toBase58();
      }

      await submitResearch(
        submitCid,
        submitTitle || undefined,
        submitAuthor || undefined,
        walletAddress,
        signatureBase64,
      );

      setSubmitCid('');
      setSubmitTitle('');
      setSubmitAuthor('');
      setClaimPayout(false);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(`Submission failed: ${err.message || 'Request rejected'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPaper = papers.find((p) => p.id === selectedId);
  const insights = selectedPaper ? buildInsights(selectedPaper) : null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          BioDAO Curation Feed
        </h2>
        <div className="flex gap-2 items-center">
          <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
          <span className={cn('font-mono text-[10px] uppercase', connected ? 'text-emerald-500/80' : 'text-amber-500/80')}>
            {connected ? 'Live' : 'Demo Mode'}
          </span>
        </div>
      </div>

      {connected && (
        <div className="glass-card rounded-xl p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
              <Send className="w-3 h-3" />
              Submit Research for Evaluation
            </h3>
            <div className="scale-75 origin-right">
              <WalletMultiButton />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={submitCid}
              onChange={(e) => setSubmitCid(e.target.value)}
              placeholder="IPFS CID (e.g. QmXyz...)"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
                placeholder="Paper Title (optional)"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <input
                type="text"
                value={submitAuthor}
                onChange={(e) => setSubmitAuthor(e.target.value)}
                placeholder="Author or Team (optional)"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className={cn('flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest', publicKey ? 'text-emerald-500/70' : 'text-white/20')}>
              <input
                type="checkbox"
                checked={claimPayout}
                onChange={(e) => setClaimPayout(e.target.checked)}
                disabled={!publicKey}
                className="accent-emerald-500"
              />
              Claim payout with connected wallet
            </label>
            <button
              onClick={handleSubmit}
              disabled={submitting || !submitCid.trim()}
              className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {claimPayout ? 'Evaluate & Claim' : 'Evaluate'}
            </button>
          </div>

          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest text-center leading-relaxed">
            Paste a CID to run heuristic scoring and BioDAO routing. Connect a wallet only if you want to claim payouts.
          </p>
        </div>
      )}

      <div className="relative space-y-4">
        {connected && papers.length === 0 && (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">No research scanned yet. Submit a CID above.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {papers.map((paper) => (
            <motion.div
              key={paper.id}
              layoutId={paper.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => setSelectedId(paper.id)}
              className="glass-card group cursor-pointer relative overflow-hidden rounded-xl p-5 hover:border-emerald-500/30 transition-colors"
            >
              {paper.status === 'Scanning' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/40 blur-[1px] animate-scan" />
                  <div className="absolute top-0 left-0 w-full h-[40px] bg-gradient-to-b from-emerald-500/5 to-transparent animate-scan" />
                </div>
              )}

              <div className="absolute inset-0 border border-emerald-500/0 group-hover:border-emerald-500/30 transition-colors rounded-xl" />
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-shimmer" />

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                    <Shield className="w-5 h-5 text-emerald-500/50" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-sm text-white/90 group-hover:text-emerald-400 transition-colors">
                      {paper.title}
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                      BY {paper.author} • {timeAgo(paper.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-white/30 uppercase">Trust Score</div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                      {paper.status === 'Scanning' ? '...' : `${paper.trustScore}%`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={paper.status} />
              </div>

              <div className="mb-4">
                <EvaluationStepper paper={paper} detailed={true} />
              </div>

              {paper.status === 'Failed' && paper.agentReasoning && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 animate-in fade-in">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-500 mb-1 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    What Went Wrong
                  </h4>
                  <p className="font-sans text-xs text-rose-200/80 leading-relaxed italic">
                    "{paper.agentReasoning}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RecommendationBadge recommendation={paper.grantRecommendation} />
                  {paper.recommendedBioDao && (
                    <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider">
                      {paper.recommendedBioDao}
                    </span>
                  )}
                  <div className="text-[10px] font-mono text-white/20 uppercase group-hover:text-emerald-500/50 transition-colors flex items-center gap-1">
                    Open Details <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedId && selectedPaper && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              layoutId={selectedId}
              className="glass-card relative w-full max-w-2xl rounded-2xl overflow-hidden p-8 md:p-12"
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <StatusBadge status={selectedPaper.status} />
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-4 mb-2">
                  {selectedPaper.title}
                </h2>
                <p className="font-mono text-xs text-emerald-500/60 uppercase tracking-widest">
                  Principal Investigator: {selectedPaper.author}
                </p>
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-mono text-white/30 uppercase mb-4 tracking-widest">Live Evaluation</div>
                  <EvaluationStepper paper={selectedPaper} detailed={true} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 border-y border-white/5 py-6">
                <div>
                  <div className="text-[10px] font-mono text-white/30 uppercase mb-1">Trust Score</div>
                  <div className="text-3xl font-mono font-bold text-emerald-400">{selectedPaper.trustScore}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-white/30 uppercase mb-1">Impact Category</div>
                  <div className="text-lg font-mono font-bold text-white/90">{selectedPaper.impactCategory || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-white/30 uppercase mb-1">BioDAO</div>
                  <div className="text-lg font-mono font-bold text-white/90">{selectedPaper.recommendedBioDao || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-white/30 uppercase mb-1">Recommendation</div>
                  <div className="text-lg font-mono font-bold text-white/90">{selectedPaper.grantRecommendation || 'REVIEW'}</div>
                </div>
                {selectedPaper.payoutTx && (
                  <div>
                    <div className="text-[10px] font-mono text-white/30 uppercase mb-1">Payout TX</div>
                    <div className="text-xs font-mono text-blue-400 break-all">{selectedPaper.payoutTx.slice(0, 20)}...</div>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">Scoring Breakdown</h4>
                  <div className="space-y-3">
                    <ScoreRow label="Reproducibility" score={selectedPaper.reproducibilityScore} />
                    <ScoreRow label="Methodology" score={selectedPaper.methodologyScore} />
                    <ScoreRow label="Novelty" score={selectedPaper.noveltyScore} />
                    <ScoreRow label="Impact" score={selectedPaper.impactScore} />
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">Quick Read</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-2">What Looks Strong</div>
                      <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
                        {insights?.strengths.map((item, idx) => (
                          <li key={`strength-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-rose-300 mb-2">Needs Work</div>
                      <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
                        {insights?.needsWork.map((item, idx) => (
                          <li key={`needs-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className={cn('font-mono text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2', selectedPaper.status === 'Failed' ? 'text-rose-500' : 'text-emerald-500')}>
                  {selectedPaper.status === 'Failed' ? <AlertCircle className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                  {selectedPaper.status === 'Failed' ? 'What Went Wrong' : 'Evaluator Notes'}
                </h4>
                <div className={cn('rounded-xl p-6 border font-sans leading-relaxed italic', selectedPaper.status === 'Failed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-white/5 border-white/5 text-white/70')}>
                  "{selectedPaper.agentReasoning}"
                </div>
              </div>

              {selectedPaper.verificationHash && (
                <div className="mt-6">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Verification Hash</h4>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5 font-mono text-xs text-emerald-500/60 break-all">
                    {selectedPaper.verificationHash}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
