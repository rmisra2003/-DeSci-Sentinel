import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ─── Types matching the backend AgentLog ─────────────────────────────────
export type AgentStatus = 'Scanning' | 'Verified' | 'Payout Sent' | 'Failed';

export interface AgentLog {
    id: string;
    title: string;
    author: string;
    trustScore: number;
    impactCategory: string;
    agentReasoning: string;
    verificationHash: string;
    status: AgentStatus;
    payoutTx?: string;
    timestamp: string;
    // Bio Protocol fields
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

export interface AgentStats {
    papersScanned: number;
    papersVerified: number;
    payoutsSent: number;
    avgTrustScore: number;
}

export interface WalletInfo {
    publicKey: string;
    solBalance: number;
    bioBalance: string;
    bioTokenMint?: string;
    balance?: number; // legacy fallback
}

export interface BioDaoToken {
    name: string;
    symbol: string;
    address: string;
    chainId?: number;
    logoURI?: string;
    source?: string;
    onChain?: {
        exists: boolean;
        decimals?: number;
        supply?: number;
        error?: string;
    };
}

// ─── Backend URL (proxied via Vite in dev, direct in prod) ───────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// ─── Socket.IO Hook ─────────────────────────────────────────────────────
export function useAgentSocket() {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 Connected to DeSci Sentinel Backend');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Disconnected from DeSci Sentinel Backend');
            setConnected(false);
        });

        // Receive initial state on connection
        socket.on('initial_state', (data: { logs: AgentLog[]; stats: any }) => {
            setLogs(data.logs);
        });

        // New paper being scanned
        socket.on('agent_status', (entry: AgentLog) => {
            setLogs((prev) => {
                // Replace if exists, otherwise prepend
                const exists = prev.findIndex((l) => l.id === entry.id);
                if (exists !== -1) {
                    const updated = [...prev];
                    updated[exists] = entry;
                    return updated;
                }
                return [entry, ...prev].slice(0, 20); // Keep max 20 in UI
            });
        });

        // Paper evaluated
        socket.on('agent_verified', (entry: AgentLog) => {
            setLogs((prev) => {
                const exists = prev.findIndex((l) => l.id === entry.id);
                if (exists !== -1) {
                    const updated = [...prev];
                    updated[exists] = entry;
                    return updated;
                }
                return [entry, ...prev].slice(0, 20);
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return { logs, connected, socket: socketRef };
}

// ─── REST API helpers ────────────────────────────────────────────────────
export async function fetchAgentWallet(): Promise<WalletInfo> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/agent/wallet`);
        return await res.json();
    } catch {
        return { publicKey: 'Not Connected', solBalance: 0, bioBalance: '0' };
    }
}

export async function fetchAgentStats(): Promise<AgentStats> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/agent/stats`);
        return await res.json();
    } catch {
        return { papersScanned: 0, papersVerified: 0, payoutsSent: 0, avgTrustScore: 0 };
    }
}

export async function fetchAgentLogs(): Promise<AgentLog[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/agent/logs`);
        return await res.json();
    } catch {
        return [];
    }
}

export async function submitResearch(
    cid: string,
    title?: string,
    author?: string,
    walletAddress?: string,
    signature?: string, // Base64 encoded signature
): Promise<AgentLog | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cid, title, author, walletAddress, signature }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        return await res.json();
    } catch (err: any) {
        throw err;
    }
}

export async function fetchHealthCheck(): Promise<any | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        return await res.json();
    } catch {
        return null;
    }
}

export async function fetchBioDaoTokens(withOnChain = false): Promise<BioDaoToken[]> {
    try {
        const query = withOnChain ? '?onchain=true' : '';
        const res = await fetch(`${BACKEND_URL}/api/biodao/tokens${query}`);
        const data = await res.json();
        return data.tokens || [];
    } catch {
        return [];
    }
}


export async function fetchBioTokenInfo(): Promise<any | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/bio-token`);
        return await res.json();
    } catch {
        return null;
    }
}
