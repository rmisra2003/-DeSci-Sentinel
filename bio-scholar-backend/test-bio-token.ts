import { bioTokenService } from './src/services/bio-token.js';

async function testBioToken() {
    console.log('🪙  Starting Bio Token Service Test...\n');

    try {
        console.log('--- Fetching Mint Info ---');
        const mintInfo = await bioTokenService.getMintInfo();
        console.log('Mint Info Result:', mintInfo);
        console.log('Explorer URL:', bioTokenService.getTokenExplorerUrl());

        console.log('\n--- Fetching Agent Balance ---');
        const balance = await bioTokenService.getAgentBioBalance();
        console.log('Agent Balance Result:', balance);

        console.log('\n✅ Token service fetched info successfully.');
    } catch (error) {
        console.error('❌ Token service failed:', error);
    }

    console.log('\n🧪 Test Completed.');
    process.exit(0);
}

testBioToken().catch(console.error);
