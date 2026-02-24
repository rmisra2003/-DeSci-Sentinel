import dotenv from 'dotenv';
dotenv.config();

// Boot the API server
import './api/server.js';

// Services
import { bioTokenService } from './services/bio-token.js';

async function bootstrap() {
    console.log('\n🧬 ═══════════════════════════════════════════');
    console.log('   DESCI SENTINEL AUTONOMOUS AGENT v2.0');
    console.log('   Powered by Bio Protocol (BioDAO Tokens) + Solana');
    console.log('   ═══════════════════════════════════════════\n');


    // ─── Check BIO Token ───────────────────────────────────────────────
    try {
        const mintInfo = await bioTokenService.getMintInfo();
        console.log(`✅ BIO Token: ${mintInfo.address}`);
        console.log(`   Decimals: ${mintInfo.decimals}`);
    } catch {
        console.log('⚠️  BIO Token: Unable to fetch mint info');
    }


    console.log('\n🧬 DeSci Sentinel Agent fully initialized and ready!\n');
}

bootstrap();
