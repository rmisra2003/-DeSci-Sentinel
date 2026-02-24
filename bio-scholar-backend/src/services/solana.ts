import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

export class SolanaService {
    private connection: Connection;
    private agentKeypair: Keypair;

    constructor() {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl, 'confirmed');

        // Load agent keypair (fallback to ephemeral keypair for demo/dev)
        const rawKey = process.env.AGENT_PRIVATE_KEY || '[]';
        let secretKey: Uint8Array;
        try {
            secretKey = Uint8Array.from(JSON.parse(rawKey));
        } catch {
            secretKey = new Uint8Array();
        }

        this.agentKeypair = secretKey.length > 0
            ? Keypair.fromSecretKey(secretKey)
            : Keypair.generate();
    }

    getAgentPublicKey(): string {
        return this.agentKeypair.publicKey.toBase58();
    }

    async getAgentBalance(): Promise<number> {
        const balance = await this.connection.getBalance(this.agentKeypair.publicKey);
        return balance / 1e9; // Convert lamports to SOL
    }

    async getProgramLogs(programId: string) {
        const pubkey = new PublicKey(programId);
        return await this.connection.getSignaturesForAddress(pubkey, { limit: 5 });
    }

    async executePayout(recipient: string, amount: number, memo: string) {
        console.log(`[Solana Service] executePayout initiated - Recipient: "${recipient}", Amount: ${amount}`);
        if (!recipient) {
            throw new Error('Recipient wallet address is required for payout');
        }
        const { TransactionInstruction } = await import('@solana/web3.js');
        console.log(`[Solana Service] Executing payout to: ${recipient}, amount: ${amount}`);
        const transaction = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
            SystemProgram.transfer({
                fromPubkey: this.agentKeypair.publicKey,
                toPubkey: new PublicKey(recipient),
                lamports: amount,
            }),
            new TransactionInstruction({
                keys: [],
                programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
                data: Buffer.from(memo),
            })
        );

        return await sendAndConfirmTransaction(this.connection, transaction, [this.agentKeypair]);
    }
}

export const solanaService = new SolanaService();
