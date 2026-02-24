import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

async function runTest() {
    console.log('🧪 Starting DeSci Sentinel Backend End-to-End Test v2.5.0');

    const BACKEND_URL = 'http://localhost:3001';

    // 1. Generate a test wallet
    const testWallet = Keypair.generate();
    const walletAddress = testWallet.publicKey.toBase58();
    console.log(`[Test] Generated Test Wallet: ${walletAddress}`);

    // 2. Prepare submission data
    const testCid = 'QmXyzMockResearchCID' + Math.random().toString(36).substring(7);
    const message = `Claiming DeSci Sentinel Grant for CID: ${testCid}`;

    // 3. Sign the message
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, testWallet.secretKey);
    const signatureBase64 = Buffer.from(signatureBytes).toString('base64');

    console.log(`[Test] Signed message for CID: ${testCid}`);

    const payload = {
        cid: testCid,
        title: 'Original Research v2.5.0',
        author: 'Test Agent',
        walletAddress: walletAddress,
        signature: signatureBase64
    };

    // --- TEST CASE 1: Valid Original Submission ---
    console.log('\n🧪 Testing Case 1: Valid Original Submission');
    try {
        const response = await fetch(`${BACKEND_URL}/api/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data: any = await response.json();
        console.log(`[Test] Status: ${response.status}, Agent Status: ${data.status}`);
        if (response.status === 200) {
            console.log('✅ PASS: Basic endpoint connectivity and signature verification.');
        } else {
            console.log(`❌ FAIL: Unexpected status ${response.status}`);
        }
    } catch (err: any) {
        console.error('❌ FAIL: Connection error', err.message);
    }

    // --- TEST CASE 2: Nobel Prize Theft (External Freshness) ---
    console.log('\n🧪 Testing Case 2: Real Grounded Search (Famous Paper)');
    const nobelCid = 'QmNobelTheftTest' + Math.random().toString(36).substring(7);
    const nobelPayload = {
        ...payload,
        cid: nobelCid,
        title: 'Attention Is All You Need',
    };

    const nobelMsg = `Claiming DeSci Sentinel Grant for CID: ${nobelCid}`;
    const nobelSig = nacl.sign.detached(new TextEncoder().encode(nobelMsg), testWallet.secretKey);
    nobelPayload.signature = Buffer.from(nobelSig).toString('base64');

    try {
        const response = await fetch(`${BACKEND_URL}/api/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nobelPayload)
        });
        const data: any = await response.json();
        console.log(`[Test] Status: ${response.status}, Error: ${data.error}`);
        if (response.status === 403 && data.error === 'Research theft protection triggered.') {
            console.log('✅ PASS: Correctly rejected famous/published research.');
        } else {
            console.log('❌ FAIL: Failed to detect prior publication.');
        }
    } catch (err: any) {
        console.error('❌ FAIL:', err.message);
    }

    // --- TEST CASE 3: Duplicate Content (Internal Plagiarism) ---
    // Note: This only triggers if the first submission was FUNDED (Score > 80).
    // Since our mock content gets ~40, we'll skip the automated 409 check for now 
    // unless we mock the evaluator to return 100.
    console.log('\n🧪 Testing Case 3: Duplicate Prevention Summary');
    console.log('ℹ️ INFO: Internal duplicate prevention is verified via unit logic in plagiarism.ts.');
}

runTest();
