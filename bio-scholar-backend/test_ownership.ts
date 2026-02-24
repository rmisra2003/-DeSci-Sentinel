import * as dotenv from 'dotenv';
dotenv.config();

async function testPinataMetadata() {
    const cid = 'bafybeidmqltsusklxpmkyrvo6lbvv7mjwktfnfc6zbra2p5xsouwnvo6u4';
    const claimantWallet = 'BWyBhbUXr4Yn4UcaZkNBouoGsx6kDsVRPkBrxKRF421Y';
    const jwt = process.env.PINATA_JWT;

    console.log(`🔍 Testing Pinata Metadata for CID: ${cid}`);

    try {
        const res = await fetch(`https://api.pinata.cloud/data/pinList?includesCount=false&hashContains=${cid}`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        const data = await res.json();
        const pin = data.rows?.[0];

        console.log(`\n📋 Pinata Record:`, JSON.stringify(pin, null, 2));

        if (pin && pin.metadata && pin.metadata.keyvalues) {
            const kv = pin.metadata.keyvalues;
            const wallet = kv.author_wallet || kv.reward_address || kv.wallet;

            console.log(`\n🔑 Extracted Wallet from KV: ${wallet || 'NONE'}`);
            if (wallet === claimantWallet) {
                console.log(`🟢 STATUS: MATCH!`);
            } else if (wallet) {
                console.log(`🔴 STATUS: MISMATCH! Expected: ${claimantWallet}, Found: ${wallet}`);
            }
        } else {
            console.log(`\n🟡 STATUS: NO KEY-VALUES FOUND ON PINATA. Absolute Ownership check will be skipped (fallback to basic signature).`);
        }
    } catch (err: any) {
        console.log(`❌ Error fetching Pinata Metadata: ${err.message}`);
    }
}

testPinataMetadata();
