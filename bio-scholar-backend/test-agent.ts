import { evaluateResearch } from './src/agents/scholar/evaluator.js';

async function testAgent() {
    console.log('🧪 Starting DeSci Sentinel Agent Test...\n');

    const sampleResearch = `
Title: Accelerated Hair Regeneration via Topical Application of Novel Peptide Compound XYZ-99
Authors: Dr. A. Smith, Dr. J. Doe
Abstract: We present a novel peptide compound, XYZ-99, which demonstrates significant acceleration in hair follicle regeneration in murine models. Topical application over 14 days resulted in a 300% increase in active anagen phase follicles compared to control. The mechanism appears to involve the Wnt/β-catenin signaling pathway.
Methodology: 50 C57BL/6 mice were divided into 5 groups. Group 1 received vehicle control, Groups 2-4 received varying concentrations of XYZ-99, and Group 5 received minoxidil as a positive control. Hair regrowth was quantified using digital planimetry and histological analysis.
    `;

    console.log('--- Submitting Research to Agent ---');
    console.log(sampleResearch);
    console.log('\n--- Agent Evaluation Pipeline Running ---\n');

    try {
        const result = await evaluateResearch(sampleResearch);

        console.log('\n✅ Agent Evaluation Complete:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\n❌ Agent Evaluation Failed:', error);
    }

    console.log('\n🧪 Test Completed.');
    process.exit(0);
}

testAgent().catch(console.error);
