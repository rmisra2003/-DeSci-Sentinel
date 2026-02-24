import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
    getMint,
    getAccount,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import dotenv from 'dotenv';

dotenv.config();

/**
 * BIO Token Service
 * 
 * Handles BIO SPL token operations on Solana for grant payouts.
 * Uses the official BIO token mint: bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ (mainnet)
 * 
 * In devnet mode, this service can use a test mint or fall back to SOL transfers.
 */

// Official BIO Token Addresses
const BIO_TOKEN_MINT_MAINNET = 'bioJ9JTqW62MLz7UKHU69gtKhPpGi1BQhccj2kmSvUJ';

export interface TokenBalance {
    amount: number;
    decimals: number;
    uiAmount: string;
}

export interface TokenTransferResult {
    signature: string;
    amount: number;
    recipient: string;
    tokenMint: string;
}

export class BioTokenService {
    private connection: Connection;
    private agentKeypair: Keypair;
    private bioMint: PublicKey;
    private isDevnet: boolean;

    constructor() {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.isDevnet = rpcUrl.includes('devnet') || rpcUrl.includes('localhost');

        // Load agent keypair — safe parse, fall back to ephemeral keypair
        let secretKey: Uint8Array | null = null;
        try {
            const rawKey = process.env.AGENT_PRIVATE_KEY || '';
            if (rawKey && rawKey.startsWith('[')) {
                const parsed = JSON.parse(rawKey);
                secretKey = Uint8Array.from(parsed);
            }
        } catch {
            console.warn('⚠️  [BIO Token] AGENT_PRIVATE_KEY is invalid — using ephemeral keypair (no payouts)');
        }
        this.agentKeypair = secretKey && secretKey.length === 64
            ? Keypair.fromSecretKey(secretKey)
            : Keypair.generate();

        // Use configured BIO mint or the official mainnet one
        const mintAddress = process.env.BIO_TOKEN_MINT || BIO_TOKEN_MINT_MAINNET;
        this.bioMint = new PublicKey(mintAddress);

        console.log(`🪙 [BIO Token] Initialized — mint: ${this.bioMint.toBase58()}`);
        console.log(`🪙 [BIO Token] Network: ${this.isDevnet ? 'Devnet' : 'Mainnet'}`);
        console.log(`🪙 [BIO Token] Agent wallet: ${this.agentKeypair.publicKey.toBase58()}`);
    }

    /**
     * Get BIO token balance for the agent wallet
     */
    async getAgentBioBalance(): Promise<TokenBalance> {
        try {
            // First check if the mint actually exists on this network
            let mintInfo;
            try {
                mintInfo = await getMint(this.connection, this.bioMint);
            } catch {
                // Mint doesn't exist on this network (expected on devnet with mainnet mint)
                return { amount: 0, decimals: 9, uiAmount: '0.000000000' };
            }

            // Derive the associated token account address without creating it
            const { getAssociatedTokenAddress } = await import('@solana/spl-token');
            const ataAddress = await getAssociatedTokenAddress(
                this.bioMint,
                this.agentKeypair.publicKey,
            );

            try {
                const tokenAccount = await getAccount(this.connection, ataAddress);
                const amount = Number(tokenAccount.amount);
                const decimals = mintInfo.decimals;
                const uiAmount = (amount / Math.pow(10, decimals)).toFixed(decimals);
                return { amount, decimals, uiAmount };
            } catch {
                // Token account doesn't exist yet — balance is 0
                return { amount: 0, decimals: mintInfo.decimals, uiAmount: '0' };
            }
        } catch (error: any) {
            return { amount: 0, decimals: 9, uiAmount: '0' };
        }
    }

    /**
     * Get BIO token balance for any wallet address
     */
    async getBalance(walletAddress: string): Promise<TokenBalance> {
        try {
            const owner = new PublicKey(walletAddress);
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.agentKeypair,
                this.bioMint,
                owner,
            );

            const mintInfo = await getMint(this.connection, this.bioMint);
            const amount = Number(tokenAccount.amount);
            const decimals = mintInfo.decimals;
            const uiAmount = (amount / Math.pow(10, decimals)).toFixed(decimals);

            return { amount, decimals, uiAmount };
        } catch (error: any) {
            return { amount: 0, decimals: 9, uiAmount: '0.000000000' };
        }
    }

    /**
     * Transfer BIO tokens as a research grant payout
     * 
     * @param recipient - Recipient wallet address
     * @param uiAmount - Human-readable amount (e.g. 100 for 100 BIO tokens)
     * @param memo - Verification hash / memo for the transaction
     */
    async transferGrant(
        recipient: string,
        uiAmount: number,
        memo: string,
    ): Promise<TokenTransferResult> {
        try {
            const recipientPubkey = new PublicKey(recipient);
            const mintInfo = await getMint(this.connection, this.bioMint);
            const rawAmount = Math.floor(uiAmount * Math.pow(10, mintInfo.decimals));

            // Get or create token accounts for both parties
            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.agentKeypair,
                this.bioMint,
                this.agentKeypair.publicKey,
            );

            const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.agentKeypair,
                this.bioMint,
                recipientPubkey,
            );

            // Build the transaction
            const { TransactionInstruction } = await import('@solana/web3.js');
            const transaction = new Transaction().add(
                // Priority fee for faster inclusion
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
                // SPL Token transfer
                createTransferInstruction(
                    senderTokenAccount.address,
                    recipientTokenAccount.address,
                    this.agentKeypair.publicKey,
                    BigInt(rawAmount),
                    [],
                    TOKEN_PROGRAM_ID,
                ),
                // Memo instruction with verification hash
                new TransactionInstruction({
                    keys: [],
                    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                    data: Buffer.from(`[DESCI SENTINEL] Grant: ${memo}`),
                }),
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.agentKeypair],
            );

            console.log(`✅ [BIO Token] Grant sent: ${uiAmount} BIO → ${recipient}`);
            console.log(`   TX: ${signature}`);

            return {
                signature,
                amount: uiAmount,
                recipient,
                tokenMint: this.bioMint.toBase58(),
            };
        } catch (error: any) {
            console.error('[BIO Token] Transfer failed:', error.message);
            throw new Error(`BIO token transfer failed: ${error.message}`);
        }
    }

    /**
     * Get token mint information
     */
    async getMintInfo() {
        try {
            const mintInfo = await getMint(this.connection, this.bioMint);
            return {
                address: this.bioMint.toBase58(),
                decimals: mintInfo.decimals,
                supply: Number(mintInfo.supply),
                isInitialized: mintInfo.isInitialized,
            };
        } catch (error: any) {
            return {
                address: this.bioMint.toBase58(),
                decimals: 9,
                supply: 0,
                isInitialized: false,
                error: error.message,
            };
        }
    }

    /**
     * Get the explorer URL for a transaction
     */
    getExplorerUrl(signature: string): string {
        const cluster = this.isDevnet ? '?cluster=devnet' : '';
        return `https://solscan.io/tx/${signature}${cluster}`;
    }

    /**
     * Get the explorer URL for a token
     */
    getTokenExplorerUrl(): string {
        const cluster = this.isDevnet ? '?cluster=devnet' : '';
        return `https://solscan.io/token/${this.bioMint.toBase58()}${cluster}`;
    }
}

export const bioTokenService = new BioTokenService();
