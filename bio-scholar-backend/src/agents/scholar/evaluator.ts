import { createHash } from "crypto";

export interface EvaluationResult {
    trustScore: number;
    impactCategory: string;
    agentReasoning: string;
    verificationHash: string;
    reproducibilityScore?: number;
    methodologyScore?: number;
    noveltyScore?: number;
    impactScore?: number;
    recommendedBioDao?: string;
    grantRecommendation?: string;
    payoutTx?: string;
}

/**
 * Evaluate research using deterministic heuristics so the pipeline works without external AI services.
 */
export async function evaluateResearch(
    content: string,
    options: {
        deepResearch?: boolean; // Kept for interface compatibility
    } = {}
): Promise<EvaluationResult> {
    const normalized = content.toLowerCase();
    const verificationHash = createHash('sha256').update(content).digest('hex').slice(0, 16);

    const reproducibilityScore = scoreSignals(normalized, [
        'dataset',
        'ipfs',
        'open data',
        'repository',
        'protocol',
        'supplementary',
        'replicate',
    ]);
    const methodologyScore = scoreSignals(normalized, [
        'control',
        'randomized',
        'double-blind',
        'placebo',
        'cohort',
        'statistical',
        'p-value',
        'in vitro',
        'in vivo',
        'sample',
    ]);
    const noveltyScore = scoreSignals(normalized, [
        'novel',
        'first',
        'breakthrough',
        'new approach',
        'unprecedented',
        'prototype',
    ]);
    const impactScore = scoreSignals(normalized, [
        'clinical',
        'therapeutic',
        'treatment',
        'patient',
        'disease',
        'longevity',
        'biotech',
        'genomics',
        'drug',
    ]);

    const trustScore = clampScore(reproducibilityScore + methodologyScore + noveltyScore + impactScore, 100);
    const recommendedBioDao = pickBioDao(normalized);
    const impactCategory = pickImpactCategory(normalized);
    const grantRecommendation = trustScore >= 80 ? 'FUND' : trustScore >= 60 ? 'REVIEW' : 'REJECT';

    const agentReasoning = [
        `Heuristic evaluation based on keyword signals in the submission.`,
        `Reproducibility: ${reproducibilityScore}/25, Methodology: ${methodologyScore}/25, Novelty: ${noveltyScore}/25, Impact: ${impactScore}/25.`,
        `Recommended BioDAO: ${recommendedBioDao}.`,
        `Grant Recommendation: ${grantRecommendation}.`,
    ].join(' ');

    const evaluation: EvaluationResult = {
        trustScore,
        impactCategory,
        agentReasoning,
        verificationHash,
        reproducibilityScore,
        methodologyScore,
        noveltyScore,
        impactScore,
        recommendedBioDao,
        grantRecommendation,
    };

    console.log(`📊 [Evaluator] Final Trust Score: ${evaluation.trustScore}/100`);
    console.log(`   Category: ${evaluation.impactCategory}`);
    console.log(`   BioDAO: ${evaluation.recommendedBioDao || 'N/A'}`);

    return evaluation;
}

function scoreSignals(text: string, signals: string[]): number {
    let score = 10;
    for (const signal of signals) {
        if (text.includes(signal)) {
            score += 3;
        }
    }
    return clampScore(score, 25);
}

function clampScore(score: number, max: number): number {
    if (score < 0) return 0;
    if (score > max) return max;
    return score;
}

function pickBioDao(text: string): string {
    if (containsAny(text, ['hair', 'follicle', 'alopecia', 'scalp', 'dermatology'])) return 'HairDAO';
    if (containsAny(text, ['longevity', 'aging', 'senescence', 'lifespan', 'geroscience', 'senolytic'])) return 'VitaDAO';
    if (containsAny(text, ['fermentation', 'bioeconomy', 'agriculture', 'plant', 'enzyme', 'synthetic biology'])) return 'ValleyDAO';
    if (containsAny(text, ['women', 'pregnancy', 'menopause', 'endometriosis', 'fertility', 'ivf', 'maternal'])) return 'AthenaDAO';
    if (containsAny(text, ['cryopreservation', 'cryogenics', 'freezing', 'tissue storage', 'vitrification'])) return 'CryoDAO';
    if (containsAny(text, ['psychedelic', 'psilocybin', 'mdma', 'ketamine', 'lsd', 'psychotherapy'])) return 'PsyDAO';
    if (containsAny(text, ['neurodegeneration', 'alzheimer', 'parkinson', 'brain health', 'dementia', 'cerebral', 'neuron'])) return 'CerebrumDAO';
    if (containsAny(text, ['rare disease', 'orphan drug', 'genetic disorder', 'inherited', 'monogenic'])) return 'Curetopia';
    if (containsAny(text, ['long covid', 'post-viral', 'chronic fatigue', 'post-acute', 'sars-cov-2 sequelae'])) return 'Long COVID Labs';
    if (containsAny(text, ['quantum biology', 'quantum microscope', 'photosynthesis', 'quantum coherence', 'tunneling'])) return 'Quantum Biology DAO';
    return 'Unassigned';
}

function pickImpactCategory(text: string): string {
    if (containsAny(text, ['genomic', 'genomics', 'dna', 'rna'])) return 'Genomics';
    if (containsAny(text, ['drug', 'compound', 'therapeutic'])) return 'Drug Discovery';
    if (containsAny(text, ['longevity', 'aging'])) return 'Longevity';
    if (containsAny(text, ['clinical', 'trial', 'patient'])) return 'Clinical Trials';
    if (containsAny(text, ['synthetic biology', 'biotech', 'enzyme'])) return 'Biotech';
    if (containsAny(text, ['psychedelic', 'psilocybin', 'mdma'])) return 'Psychedelic Medicine';
    if (containsAny(text, ['neurodegeneration', 'alzheimer', 'parkinson', 'brain'])) return 'Neuroscience';
    if (containsAny(text, ['rare disease', 'orphan', 'genetic disorder'])) return 'Rare Diseases';
    if (containsAny(text, ['cryopreservation', 'cryogenics', 'freezing'])) return 'Cryobiology';
    if (containsAny(text, ['long covid', 'post-viral'])) return 'Post-Viral Syndromes';
    if (containsAny(text, ['quantum', 'microscope'])) return 'Quantum Biology';
    return 'General DeSci';
}

function containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
}
