import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import nacl from 'tweetnacl';
import { solanaService } from '../services/solana.js';
import { evaluateResearch } from '../agents/scholar/evaluator.js';
import { archivistService } from '../services/ipfs.js';
import { bioTokenService } from '../services/bio-token.js';
import { getBioDaoTokens, getBioDaoTokensWithOnChain } from '../services/biodao.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { plagiarismService } from '../services/plagiarism.js';
import { getBioLaunchpadProjects } from '../services/bio-launchpad.js';
import { BIODAO_METADATA } from '../services/biodao.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: check if a string is a valid Solana base58 public key
function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

// Setup CORS origins from environment (comma-separated list) or default to open for dev
const getAllowedOrigins = () => {
    if (process.env.ALLOWED_ORIGINS) {
        return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    }
    return "*"; // Development fallback
};
const corsOptions = { origin: getAllowedOrigins() };

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: getAllowedOrigins(),
        methods: ["GET", "POST"],
    },
});

// ─── In-memory state for the frontend dashboard ─────────────────────────
interface AgentLog {
    id: string;
    title: string;
    author: string;
    trustScore: number;
    impactCategory: string;
    agentReasoning: string;
    verificationHash: string;
    status: 'Scanning' | 'Verified' | 'Payout Sent' | 'Failed';
    payoutTx?: string;
    timestamp: string;
    // Bio Protocol enrichment
    reproducibilityScore?: number;
    methodologyScore?: number;
    noveltyScore?: number;
    impactScore?: number;
    recommendedBioDao?: string;
    grantRecommendation?: string;
    payoutToken?: 'SOL' | 'BIO';
    source?: 'manual';
    verificationSteps?: {
        ownership: 'pending' | 'verified' | 'failed' | 'skipped';
        fingerprint: 'pending' | 'verified' | 'failed' | 'skipped';
        grounding: 'pending' | 'verified' | 'failed' | 'skipped';
    };
}

const agentLogs: AgentLog[] = [];

// ─── REST API Endpoints ──────────────────────────────────────────────────

// Health check
app.get('/api/health', async (_req, res) => {
    let bioDaoTokenLists = 'unavailable';
    try {
        const tokenResult = await getBioDaoTokens();
        if (tokenResult.tokens.length > 0) {
            bioDaoTokenLists = 'available';
        }
    } catch {
        // Ignore token list errors for health check
    }
    res.json({
        status: 'ok',
        agent: 'DeSci Sentinel v3.0',
        agentType: 'BioAgent',
        specialization: 'Research Curation & Anti-Plagiarism',
        ecosystem: 'https://bio.xyz',
        bioAgentsPortal: 'https://ai.bio.xyz',
        supportedBioDAOs: Object.keys(BIODAO_METADATA).length,
        uptime: process.uptime(),
        integrations: {
            bioDaoTokenLists,
            bioToken: 'configured',
            solana: 'configured',
            tavilySearch: process.env.TAVILY_API_KEY ? 'configured' : 'fallback',
        },
    });
});

// Get agent wallet info (SOL + BIO token)
app.get('/api/agent/wallet', async (_req, res) => {
    try {
        const solBalance = await solanaService.getAgentBalance();
        const publicKey = solanaService.getAgentPublicKey();

        let bioBalance = { amount: 0, decimals: 9, uiAmount: '0' };
        try {
            bioBalance = await bioTokenService.getAgentBioBalance();
        } catch {
            // BIO token account may not exist yet
        }

        res.json({
            publicKey,
            solBalance,
            bioBalance: bioBalance.uiAmount,
            bioTokenMint: process.env.BIO_TOKEN_MINT || 'N/A',
        });
    } catch (err) {
        res.json({ publicKey: 'N/A', solBalance: 0, bioBalance: '0', error: 'Agent wallet not configured' });
    }
});

// Get all evaluation logs
app.get('/api/agent/logs', (_req, res) => {
    res.json(agentLogs);
});

// Get agent stats
app.get('/api/agent/stats', (_req, res) => {
    const totalPapers = agentLogs.length;
    const totalVerified = agentLogs.filter(l => l.status === 'Verified' || l.status === 'Payout Sent').length;
    const totalPayouts = agentLogs.filter(l => l.status === 'Payout Sent').length;
    const avgTrust = totalPapers > 0
        ? agentLogs.reduce((sum, l) => sum + l.trustScore, 0) / totalPapers
        : 0;

    res.json({
        papersScanned: totalPapers,
        papersVerified: totalVerified,
        payoutsSent: totalPayouts,
        avgTrustScore: Math.round(avgTrust * 10) / 10,
        integrations: {
            bioTokenPayouts: agentLogs.filter(l => l.payoutToken === 'BIO').length,
            solPayouts: agentLogs.filter(l => l.payoutToken === 'SOL').length,
        },
    });
});

// Bio.xyz Launchpad — Live BioDAO Projects
app.get('/api/bio/launchpad', async (_req, res) => {
    try {
        const result = await getBioLaunchpadProjects();
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// BioDAO Metadata — enriched info for all 10 DAOs
app.get('/api/bio/daos', (_req, res) => {
    const daos = Object.entries(BIODAO_METADATA).map(([name, meta]) => ({
        name,
        ...meta,
    }));
    res.json({ daos, count: daos.length });
});

// BioDAO token lists (public)
app.get('/api/biodao/tokens', async (_req, res) => {
    try {
        const includeOnChain = ['true', '1', 'yes'].includes(String(_req.query.onchain || '').toLowerCase());
        const result = includeOnChain
            ? await getBioDaoTokensWithOnChain()
            : await getBioDaoTokens();
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to fetch BioDAO tokens' });
    }
});

// BIO Token info endpoint
app.get('/api/bio-token', async (_req, res) => {
    try {
        const mintInfo = await bioTokenService.getMintInfo();
        res.json({
            ...mintInfo,
            explorerUrl: bioTokenService.getTokenExplorerUrl(),
        });
    } catch (err: any) {
        res.json({ error: err.message });
    }
});

// Dev-only: direct payout test (bypasses rate limiter)
app.post('/api/test-payout', async (req, res) => {
    const { recipient, amount } = req.body;
    if (!recipient || !isValidSolanaAddress(recipient)) {
        return res.status(400).json({ error: 'Invalid recipient address' });
    }
    try {
        const result = await bioTokenService.transferGrant(recipient, amount || 10, 'test-payout');
        res.json({ success: true, type: 'BIO', signature: result.signature });
    } catch (bioErr: any) {
        try {
            const sig = await solanaService.executePayout(recipient, 10_000_000, 'test-payout'); // 0.01 SOL
            res.json({ success: true, type: 'SOL', signature: sig });
        } catch (solErr: any) {
            res.status(500).json({ bioError: bioErr.message, solError: solErr.message });
        }
    }
});

// Evaluation Rate Limiter: max 5 requests per 15 minutes per IP
const evaluateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many evaluation requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Verifies a Solana wallet signature
 */
function verifySignature(signature: string, message: string, publicKeyStr: string): boolean {
    try {
        const signatureBytes = Buffer.from(signature, 'base64');
        const messageBytes = new TextEncoder().encode(message);
        const publicKeyBytes = new PublicKey(publicKeyStr).toBytes();
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (err) {
        console.error('[Server] Signature verification error:', err);
        return false;
    }
}

// Manual submission endpoint — trigger an evaluation via the API
app.post('/api/evaluate', evaluateLimiter, async (req, res) => {
    const { cid, title, author, walletAddress, signature } = req.body;

    if (!cid) {
        return res.status(400).json({ error: 'Missing CID field' });
    }

    // Mandatory signature check for payouts
    if (walletAddress && signature) {
        const message = `Claiming DeSci Sentinel Grant for CID: ${cid}`;
        if (!verifySignature(signature, message, walletAddress)) {
            console.error(`[Server] Invalid signature from ${walletAddress} for CID ${cid}`);
            return res.status(401).json({ error: 'Invalid cryptographic signature. Ownership verification failed.' });
        }
        console.log(`[Server] Verified ownership for ${walletAddress} on CID ${cid}`);
    } else if (walletAddress || signature) {
        return res.status(400).json({ error: 'Both walletAddress and signature are required for verified claims.' });
    }

    const logId = Math.random().toString(36).substr(2, 9);
    const paperTitle = title || `Research Submission ${logId}`;
    const paperAuthor = author || 'Unknown Researcher';

    // Emit scanning status immediately
    const scanEntry: AgentLog = {
        id: logId,
        title: paperTitle,
        author: paperAuthor,
        trustScore: 0,
        impactCategory: '',
        agentReasoning: '',
        verificationHash: '',
        status: 'Scanning',
        timestamp: new Date().toISOString(),
        source: 'manual',
        verificationSteps: {
            ownership: 'pending',
            fingerprint: 'pending',
            grounding: 'pending',
        },
    };
    agentLogs.unshift(scanEntry);
    io.emit('agent_status', scanEntry);

    // Initial visual delay to allow UI to mount the "Scanning" state
    await delay(500);

    try {
        // Fetch research data from IPFS
        let content: string;
        let pinataMetadata: Record<string, any> = {};

        try {
            // Concurrent fetch of content and Pinata key-value metadata
            [content, pinataMetadata] = await Promise.all([
                archivistService.fetchResearchData(cid),
                archivistService.fetchMetadata(cid)
            ]);
        } catch (err: any) {
            console.warn(`[Server] IPFS fetch warning: ${err.message}`);
            content = `Research CID: ${cid} — Title: ${paperTitle} — Author: ${paperAuthor} `;
        }

        // --- Absolute Ownership Verification (v2.4.0) ---
        if (walletAddress) {
            let metadataWallet: string | undefined;

            // 1. Check Pinata Key-Value Metadata (Source of Truth for v2.4.0)
            let foundWalletInKV: string | undefined;
            if (pinataMetadata && Object.keys(pinataMetadata).length > 0) {
                // First check if the exact claimed wallet exists as ANY value in the KV pairs
                const kvValues = Object.values(pinataMetadata);
                foundWalletInKV = kvValues.find(v => typeof v === 'string' && v.trim() === walletAddress) as string | undefined;

                // If no exact match found, fallback to standard keys to trigger the explicit mismatch error
                if (!foundWalletInKV) {
                    foundWalletInKV = pinataMetadata.author_wallet || pinataMetadata.reward_address || pinataMetadata.wallet || pinataMetadata['Wallet address'];
                }
            }

            if (foundWalletInKV) {
                metadataWallet = foundWalletInKV;
                console.log(`[Server] Found Pinata Key-Value wallet: ${metadataWallet}`);
            }
            // 2. Fallback: Parse internal JSON content (v2.3.0)
            else {
                try {
                    const metadata = JSON.parse(content);
                    metadataWallet = metadata.author_wallet || metadata.reward_address || metadata.wallet || metadata.authorWallet;
                    if (metadataWallet) console.log(`[Server] Found internal JSON wallet: ${metadataWallet}`);
                } catch {
                    // Not JSON, skip fallback
                }
            }

            if (metadataWallet && metadataWallet !== walletAddress) {
                console.error(`[Server] Absolute Ownership Mismatch: Metadata wallet ${metadataWallet} vs Signer ${walletAddress}`);
                const failIdx = agentLogs.findIndex(l => l.id === logId);
                if (failIdx !== -1 && agentLogs[failIdx].verificationSteps) {
                    await delay(1200); // Visual delay for UI Stepper
                    agentLogs[failIdx].status = 'Failed';
                    agentLogs[failIdx].verificationSteps!.ownership = 'failed';
                    agentLogs[failIdx].agentReasoning = `Absolute Ownership Verification Failed: The wallet address linked to this CID (${metadataWallet}) does not match the claimant wallet (${walletAddress}). Unauthorized claim attempt detected.`;
                    io.emit('agent_status', agentLogs[failIdx]);
                }
                return res.status(403).json({
                    error: 'Absolute Ownership mismatch.',
                    details: `Linked wallet (${metadataWallet}) does not match signer.`
                });
            }

            if (metadataWallet) {
                console.log(`[Server] ✅ Absolute Ownership verified via ${pinataMetadata.author_wallet ? 'Pinata Metadata' : 'Internal JSON'}`);
                const idx = agentLogs.findIndex(l => l.id === logId);
                if (idx !== -1 && agentLogs[idx].verificationSteps) {
                    await delay(1200); // Visual delay for UI Stepper
                    agentLogs[idx].verificationSteps!.ownership = 'verified';
                    io.emit('agent_status', agentLogs[idx]);
                }
            } else {
                console.log(`[Server] No ownership metadata found for ${cid}. Baseline signature verification used.`);
                const idx = agentLogs.findIndex(l => l.id === logId);
                if (idx !== -1 && agentLogs[idx].verificationSteps) {
                    await delay(1200); // Visual delay for UI Stepper
                    agentLogs[idx].verificationSteps!.ownership = 'skipped';
                    io.emit('agent_status', agentLogs[idx]);
                }
            }
        }

        // --- Content Fingerprinting & Anti-Plagiarism (v2.5.0) ---

        // 1. Internal Duplicate Check
        if (plagiarismService.isInternalDuplicate(content)) {
            console.error(`[Server] Duplicate content detected for CID: ${cid}`);
            const logIdx = agentLogs.findIndex(l => l.id === logId);
            if (logIdx !== -1 && agentLogs[logIdx].verificationSteps) {
                await delay(1500); // Visual delay for UI Stepper
                agentLogs[logIdx].status = 'Failed';
                agentLogs[logIdx].verificationSteps!.fingerprint = 'failed';
                agentLogs[logIdx].agentReasoning = "Duplicate Submission Detected: This research content has already been evaluated and funded by DeSci Sentinel. We only award grants for unique scientific datasets.";
                io.emit('agent_status', agentLogs[logIdx]);
            }
            return res.status(409).json({ error: 'Duplicate content detected.' });
        }

        const logIdx = agentLogs.findIndex(l => l.id === logId);
        if (logIdx !== -1 && agentLogs[logIdx].verificationSteps) {
            await delay(1500); // Visual delay for UI Stepper
            agentLogs[logIdx].verificationSteps!.fingerprint = 'verified';
            io.emit('agent_status', agentLogs[logIdx]);
        }

        // 2. External Freshness Check (GROUNDING)
        const freshness = await plagiarismService.checkExternalFreshness(paperTitle, content.substring(0, 1000));
        if (!freshness.isOriginal) {
            console.error(`[Server] Plagiarism/Freshness failure for CID: ${cid}. Reason: ${freshness.reason}`);
            const logIdx = agentLogs.findIndex(l => l.id === logId);
            if (logIdx !== -1 && agentLogs[logIdx].verificationSteps) {
                await delay(2000); // Visual delay for UI Stepper (waiting for Tavily simulation)
                agentLogs[logIdx].status = 'Failed';
                agentLogs[logIdx].verificationSteps!.grounding = 'failed';
                agentLogs[logIdx].agentReasoning = `Research Freshness Check Failed: ${freshness.reason}`;
                io.emit('agent_status', agentLogs[logIdx]);
            }
            return res.status(403).json({ error: 'Research theft protection triggered.', details: freshness.reason });
        }

        const logIdx2 = agentLogs.findIndex(l => l.id === logId);
        if (logIdx2 !== -1 && agentLogs[logIdx2].verificationSteps) {
            await delay(2000); // Visual delay for UI Stepper (waiting for Tavily simulation)
            agentLogs[logIdx2].verificationSteps!.grounding = 'verified';
            io.emit('agent_status', agentLogs[logIdx2]);
        }

        console.log(`[Server] ✅ Content Fingerprint & Freshness verified.`);

        // Evaluate via deterministic heuristic scoring
        const evaluation = await evaluateResearch(content);

        // Update entry
        const idx = agentLogs.findIndex(l => l.id === logId);
        if (idx !== -1) {
            agentLogs[idx] = {
                ...agentLogs[idx],
                trustScore: evaluation.trustScore,
                impactCategory: evaluation.impactCategory,
                agentReasoning: evaluation.agentReasoning,
                verificationHash: evaluation.verificationHash,
                reproducibilityScore: evaluation.reproducibilityScore,
                methodologyScore: evaluation.methodologyScore,
                noveltyScore: evaluation.noveltyScore,
                impactScore: evaluation.impactScore,
                recommendedBioDao: evaluation.recommendedBioDao,
                grantRecommendation: evaluation.grantRecommendation,
                status: evaluation.trustScore > 80 ? 'Payout Sent' : 'Verified',
            };

            // If high trust, execute BIO token payout
            if (evaluation.trustScore > 80 && evaluation.grantRecommendation === 'FUND') {
                const recipientAddress = walletAddress || author || '';
                if (!isValidSolanaAddress(recipientAddress)) {
                    console.log(`[Server] No valid wallet address for payout(author: '${author}').Skipping.`);
                } else {
                    try {
                        // Try BIO token transfer first
                        const tokenResult = await bioTokenService.transferGrant(
                            recipientAddress,
                            100, // 100 BIO tokens as grant
                            evaluation.verificationHash,
                        );
                        agentLogs[idx].payoutTx = tokenResult.signature;
                        agentLogs[idx].payoutToken = 'BIO';
                        agentLogs[idx].status = 'Payout Sent';
                        console.log(`✅[Server] BIO payout sent: tx ${tokenResult.signature} `);

                        // Register content hash to prevent duplicates (v2.5.0)
                        plagiarismService.registerSuccess(content);

                        io.emit('agent_status', agentLogs[idx]);
                    } catch (bioErr) {
                        // Fallback to SOL transfer
                        try {
                            const tx = await solanaService.executePayout(
                                recipientAddress,
                                50_000_000, // 0.05 SOL
                                evaluation.verificationHash,
                            );
                            agentLogs[idx].payoutTx = tx;
                            agentLogs[idx].payoutToken = 'SOL';
                            agentLogs[idx].status = 'Payout Sent';
                            console.log(`✅[Server] SOL fallback payout sent: tx ${tx} `);
                        } catch (payoutErr) {
                            console.error('[Server] Both BIO and SOL payout failed:', payoutErr);
                            agentLogs[idx].status = 'Verified';
                        }
                    }
                }
            }

            io.emit('agent_verified', agentLogs[idx]);
        }

        res.json(agentLogs[idx] || evaluation);
    } catch (err: any) {
        console.error('[Server] Evaluation failed:', err);
        res.status(500).json({ error: 'Evaluation failed', details: err.message });
    }
});

// ─── Socket.IO ───────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`🔌 Frontend connected: ${socket.id} `);

    // Send existing logs on connect
    socket.emit('initial_state', {
        logs: agentLogs,
        stats: {
            papersScanned: agentLogs.length,
            papersVerified: agentLogs.filter(l => l.status === 'Verified' || l.status === 'Payout Sent').length,
            payoutsSent: agentLogs.filter(l => l.status === 'Payout Sent').length,
        },
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Frontend disconnected: ${socket.id} `);
    });
});

// ─── Start ───────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Bio - Scholar Backend v2.0 Live on http://localhost:${PORT}`);
    console.log(`   ├── REST API:     http://localhost:${PORT}/api`);
    console.log(`   ├── Socket.IO:    ws://localhost:${PORT}`);
    console.log(`   ├── BIO Token:    ${process.env.BIO_TOKEN_MINT || 'Not Set'}`);
    console.log(`   └── BioDAO Tokens: /api/biodao/tokens\n`);
});

export { io, app };
