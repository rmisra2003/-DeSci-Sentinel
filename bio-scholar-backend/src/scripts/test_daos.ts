import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

async function runTest() {
    console.log('🧪 Testing BioDAO Routing (v3.0.0)');

    const BACKEND_URL = 'http://localhost:3001';
    const testWallet = Keypair.generate();
    const walletAddress = testWallet.publicKey.toBase58();

    const testCases = [
        { title: 'Cryopreservation of Human Tissue', target: 'CryoDAO' },
        { title: 'Psychedelic Medicine for PTSD', target: 'PsyDAO' },
        { title: 'Quantum Microscope for Cells', target: 'Quantum Biology DAO' },
        { title: 'Rare Disease Gene Therapy', target: 'Curetopia' },
    ];

    for (const tc of testCases) {
        const testCid = 'QmXyzMock' + Math.random().toString(36).substring(7);
        const message = `Claiming DeSci Sentinel Grant for CID: ${testCid}`;
        const signatureBytes = nacl.sign.detached(new TextEncoder().encode(message), testWallet.secretKey);

        const payload = {
            cid: testCid,
            title: tc.title,
            author: 'Test Agent',
            walletAddress: walletAddress,
            signature: Buffer.from(signatureBytes).toString('base64')
        };

        const res = await fetch(`${BACKEND_URL}/api/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data: any = await res.json();

        console.log(`- ${tc.title} -> routed to: ${data.recommendedBioDao} (Expected: ${tc.target})`);
        if (data.recommendedBioDao !== tc.target) {
            console.error('❌ Mismatch!');
        } else {
            console.log('✅ Match!');
        }
    }
}

runTest();
