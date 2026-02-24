import { getBioDaoTokensWithOnChain } from './src/services/biodao.js';

async function testBioSDK() {
    console.log('🧪 Starting BioDAO Token List Test...\n');

    try {
        const result = await getBioDaoTokensWithOnChain();
        console.log('Token List Updated At:', new Date(result.updatedAt).toISOString());
        console.log('BioDAO Tokens (On-chain):', result.tokens);
        console.log('\n✅ Token list fetched successfully.');
    } catch (error) {
        console.error('❌ Token list fetch failed:', error);
    }

    console.log('\n🧪 Test Completed.');
    process.exit(0);
}

testBioSDK().catch(console.error);
