
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

async function test() {
    console.log('Connecting to:', rpcUrl);
    try {
        const version = await connection.getVersion();
        console.log('Solana Version:', version);

        const rawKey = process.env.AGENT_PRIVATE_KEY || '[]';
        const secretKey = Uint8Array.from(JSON.parse(rawKey));
        const keypair = Keypair.fromSecretKey(secretKey);

        console.log('Agent Wallet:', keypair.publicKey.toBase58());
        const balance = await connection.getBalance(keypair.publicKey);
        console.log('Balance:', balance / 1e9, 'SOL');

        if (process.env.BIO_TOKEN_MINT) {
            const mint = new PublicKey(process.env.BIO_TOKEN_MINT);
            console.log('BIO Mint:', mint.toBase58());
            const { getMint } = await import('@solana/spl-token');
            const mintInfo = await getMint(connection, mint);
            console.log('Mint Info Decimals:', mintInfo.decimals);
        }
    } catch (err) {
        console.error('Test Failed:', err);
    }
}

test();
