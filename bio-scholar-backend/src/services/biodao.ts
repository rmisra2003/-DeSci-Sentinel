import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

const BIO_TOKEN_LIST_URL =
    process.env.BIO_TOKEN_LIST_URL || 'https://tokenlists.bio.xyz/bio-token-list.json';
const BIDDING_TOKEN_LIST_URL =
    process.env.BIO_BIDDING_TOKEN_LIST_URL || 'https://tokenlists.bio.xyz/bidding-token-list.json';

const DAO_NAMES = [
    'vitadao', 'hairdao', 'valleydao', 'athenadao',
    'cryodao', 'psydao', 'cerebrumdao', 'curetopia',
    'long covid labs', 'quantum biology dao',
];

// Enriched metadata for all 10 BioDAOs in the Bio.xyz ecosystem
export const BIODAO_METADATA: Record<string, { website: string; description: string; focusArea: string }> = {
    'VitaDAO': { website: 'https://vitadao.com', description: 'Funding early-stage longevity research, backed by Pfizer Ventures.', focusArea: 'Longevity' },
    'HairDAO': { website: 'https://www.hairdao.xyz', description: 'The network state solving hair loss via DAO-owned patents.', focusArea: 'Dermatology' },
    'ValleyDAO': { website: 'https://www.valleydao.bio', description: 'Funding synthetic biology research, partnered with Imperial College London.', focusArea: 'Synthetic Biology' },
    'AthenaDAO': { website: 'https://www.athenadao.co', description: "Advancing women's health R&D with 14 IP deals pending.", focusArea: "Women's Health" },
    'CryoDAO': { website: 'https://www.cryodao.org', description: 'Advancing cryopreservation with Oxford Cryotechnology.', focusArea: 'Cryobiology' },
    'PsyDAO': { website: 'https://psydao.io', description: 'Tokenized psychedelic science and clinical trials.', focusArea: 'Psychedelic Medicine' },
    'CerebrumDAO': { website: 'https://www.cerebrumdao.com', description: 'Tackling neurodegenerative disease with Fission Pharma.', focusArea: 'Neuroscience' },
    'Curetopia': { website: 'https://www.curetopia.xyz', description: 'Tackling the $1T rare disease space by uniting patient communities.', focusArea: 'Rare Diseases' },
    'Long COVID Labs': { website: 'https://longcovidlabs.org', description: 'Accelerating a cure for 100M+ Long COVID patients.', focusArea: 'Post-Viral Syndromes' },
    'Quantum Biology DAO': { website: 'https://quantumbiology.xyz', description: 'Building quantum microscopes to advance bio research.', focusArea: 'Quantum Biology' },
};
const SOLANA_CHAIN_IDS = (process.env.BIO_SOLANA_CHAIN_IDS || '101,102,103')
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !Number.isNaN(id));
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export interface BioDaoToken {
    name: string;
    symbol: string;
    address: string;
    chainId?: number;
    logoURI?: string;
    source: 'bio-token-list' | 'bidding-token-list' | 'fallback';
}

export interface BioDaoOnChainStatus {
    exists: boolean;
    decimals?: number;
    supply?: number;
    error?: 'unsupported-chain' | 'evm-address' | 'invalid-address' | 'not-found';
}

export interface BioDaoTokenWithOnChain extends BioDaoToken {
    onChain?: BioDaoOnChainStatus;
}

interface TokenListResponse {
    name?: string;
    tokens?: Array<{
        chainId?: number;
        address?: string;
        name?: string;
        symbol?: string;
        logoURI?: string;
    }>;
}

let cachedTokens: BioDaoToken[] = [];
let cachedAt = 0;

const CACHE_TTL_MS = 10 * 60 * 1000;

function normalize(str: string) {
    return str.toLowerCase();
}

function isSolanaChainId(chainId?: number) {
    if (chainId === undefined || chainId === null) return false;
    return SOLANA_CHAIN_IDS.includes(chainId);
}

function looksLikeSolanaAddress(address: string) {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

function isBioDaoToken(name = '', symbol = '') {
    const n = normalize(name);
    const s = normalize(symbol);
    return DAO_NAMES.some(dao => n.includes(dao) || s.includes(dao.replace('dao', '')));
}

function toBioDaoToken(
    token: { chainId?: number; address?: string; name?: string; symbol?: string; logoURI?: string },
    source: BioDaoToken['source'],
): BioDaoToken {
    return {
        name: token.name || 'Unknown',
        symbol: token.symbol || 'UNKNOWN',
        address: token.address || '',
        chainId: token.chainId,
        logoURI: token.logoURI,
        source,
    };
}

function fallbackTokens(): BioDaoToken[] {
    return [
        { name: 'VitaDAO', symbol: 'VITA', address: '', source: 'fallback' },
        { name: 'HairDAO', symbol: 'HAIR', address: '', source: 'fallback' },
        { name: 'ValleyDAO', symbol: 'VALLEY', address: '', source: 'fallback' },
        { name: 'AthenaDAO', symbol: 'ATHENA', address: '', source: 'fallback' },
    ];
}

async function fetchTokenList(url: string): Promise<TokenListResponse> {
    const response = await axios.get<TokenListResponse>(url, { timeout: 8000 });
    return response.data || {};
}

export async function getBioDaoTokens(): Promise<{ tokens: BioDaoToken[]; updatedAt: number }> {
    const now = Date.now();
    if (cachedTokens.length > 0 && now - cachedAt < CACHE_TTL_MS) {
        return { tokens: cachedTokens, updatedAt: cachedAt };
    }

    try {
        const [bioList, biddingList] = await Promise.all([
            fetchTokenList(BIO_TOKEN_LIST_URL),
            fetchTokenList(BIDDING_TOKEN_LIST_URL),
        ]);

        const bioTokens = (bioList.tokens || [])
            .filter(t => isBioDaoToken(t.name, t.symbol))
            .map(t => toBioDaoToken(t, 'bio-token-list'));

        const biddingTokens = (biddingList.tokens || [])
            .filter(t => isBioDaoToken(t.name, t.symbol))
            .map(t => toBioDaoToken(t, 'bidding-token-list'));

        const merged = [...bioTokens, ...biddingTokens];

        cachedTokens = merged.length > 0 ? merged : fallbackTokens();
        cachedAt = now;

        return { tokens: cachedTokens, updatedAt: cachedAt };
    } catch (err) {
        cachedTokens = fallbackTokens();
        cachedAt = now;
        return { tokens: cachedTokens, updatedAt: cachedAt };
    }
}

async function getOnChainStatus(token: BioDaoToken): Promise<BioDaoOnChainStatus> {
    if (!token.address) {
        return { exists: false, error: 'invalid-address' };
    }
    if (token.address.startsWith('0x')) {
        return { exists: false, error: 'evm-address' };
    }
    if (token.chainId !== undefined && !isSolanaChainId(token.chainId)) {
        return { exists: false, error: 'unsupported-chain' };
    }
    if (!looksLikeSolanaAddress(token.address)) {
        return { exists: false, error: 'invalid-address' };
    }

    try {
        const mint = await getMint(connection, new PublicKey(token.address));
        return {
            exists: true,
            decimals: mint.decimals,
            supply: Number(mint.supply),
        };
    } catch {
        return { exists: false, error: 'not-found' };
    }
}

export async function getBioDaoTokensWithOnChain(): Promise<{ tokens: BioDaoTokenWithOnChain[]; updatedAt: number }> {
    const { tokens, updatedAt } = await getBioDaoTokens();
    const enriched: BioDaoTokenWithOnChain[] = [];

    for (const token of tokens) {
        const onChain = await getOnChainStatus(token);
        enriched.push({ ...token, onChain });
    }

    return { tokens: enriched, updatedAt };
}
