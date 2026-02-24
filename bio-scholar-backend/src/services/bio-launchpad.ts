import axios from 'axios';

/**
 * Bio Launchpad Service
 * Fetches live BioDAO project data from the Bio.xyz ecosystem.
 * Since Bio.xyz doesn't expose a public REST API, we maintain a curated
 * registry of active BioDAO projects sourced from their official docs.
 */

export interface BioLaunchpadProject {
    name: string;
    description: string;
    focusArea: string;
    website: string;
    launchpadUrl: string;
    status: 'active' | 'launching' | 'upcoming';
    fundingRaised?: string;
    keyPartner?: string;
}

// Curated from https://app.bio.xyz/launchpad and Bio.xyz docs (Feb 2026)
const LAUNCHPAD_PROJECTS: BioLaunchpadProject[] = [
    {
        name: 'VitaDAO',
        description: 'Funding and supporting early-stage longevity research. Backed by Pfizer Ventures.',
        focusArea: 'Longevity',
        website: 'https://vitadao.com',
        launchpadUrl: 'https://app.bio.xyz/launchpad/VitaDAO',
        status: 'active',
        fundingRaised: '$8M+',
        keyPartner: 'Pfizer Ventures, Newcastle University',
    },
    {
        name: 'AthenaDAO',
        description: "Transformative women's health research funding, education, and access.",
        focusArea: "Women's Health",
        website: 'https://www.athenadao.co',
        launchpadUrl: 'https://app.bio.xyz/launchpad/AthenaDAO',
        status: 'active',
        fundingRaised: '$500K+',
        keyPartner: '14 IP Deals Pending',
    },
    {
        name: 'PsyDAO',
        description: 'Promoting progress in tokenized psychedelic science and art.',
        focusArea: 'Psychedelic Medicine',
        website: 'https://psydao.io',
        launchpadUrl: 'https://app.bio.xyz/launchpad/PsyDAO',
        status: 'active',
    },
    {
        name: 'ValleyDAO',
        description: 'Funding synthetic biology research to save the planet.',
        focusArea: 'Synthetic Biology',
        website: 'https://www.valleydao.bio',
        launchpadUrl: 'https://app.bio.xyz/launchpad/ValleyDAO',
        status: 'active',
        fundingRaised: '$2M+',
        keyPartner: 'Imperial College London',
    },
    {
        name: 'HairDAO',
        description: 'The network state solving hair loss. DAO-owned patents and consumer products.',
        focusArea: 'Dermatology',
        website: 'https://www.hairdao.xyz',
        launchpadUrl: 'https://app.bio.xyz/launchpad/HairDAO',
        status: 'active',
        keyPartner: 'Anagen Telehealth Platform',
    },
    {
        name: 'CryoDAO',
        description: 'Funding high-impact research in the field of cryopreservation.',
        focusArea: 'Cryobiology',
        website: 'https://www.cryodao.org',
        launchpadUrl: 'https://app.bio.xyz/launchpad/CryoDAO',
        status: 'active',
        fundingRaised: '$3M+',
        keyPartner: 'Oxford Cryotechnology',
    },
    {
        name: 'CerebrumDAO',
        description: 'Advancing brain health and preventing neurodegeneration.',
        focusArea: 'Neuroscience',
        website: 'https://www.cerebrumdao.com',
        launchpadUrl: 'https://app.bio.xyz/launchpad/Cerebrum%20DAO',
        status: 'active',
        fundingRaised: '$1.5M+',
        keyPartner: 'Fission Pharma',
    },
    {
        name: 'Curetopia',
        description: 'Tackling the $1T+ rare disease space by uniting families and patient communities.',
        focusArea: 'Rare Diseases',
        website: 'https://www.curetopia.xyz',
        launchpadUrl: 'https://app.bio.xyz/launchpad/Curetopia',
        status: 'active',
        keyPartner: 'Y-Combinator Alumni',
    },
    {
        name: 'Long COVID Labs',
        description: 'Accelerating a cure for 100M+ Long COVID patients.',
        focusArea: 'Post-Viral Syndromes',
        website: 'https://longcovidlabs.org',
        launchpadUrl: 'https://app.bio.xyz/launchpad/Long%20Covid%20Labs',
        status: 'active',
        keyPartner: 'Stanford Neuroscience Alumni',
    },
    {
        name: 'Quantum Biology DAO',
        description: 'Building a quantum microscope to advance bio research.',
        focusArea: 'Quantum Biology',
        website: 'https://quantumbiology.xyz',
        launchpadUrl: 'https://app.bio.xyz/launchpad/Quantum%20Biology%20DAO',
        status: 'active',
        keyPartner: 'MIT PhD Leadership',
    },
];

let cachedProjects: BioLaunchpadProject[] = [];
let cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Returns the curated list of BioDAO launchpad projects.
 * In a production environment, this could be replaced with a live API call
 * to app.bio.xyz when they expose a public endpoint.
 */
export async function getBioLaunchpadProjects(): Promise<{
    projects: BioLaunchpadProject[];
    updatedAt: number;
    source: 'cache' | 'fresh';
}> {
    const now = Date.now();

    if (cachedProjects.length > 0 && now - cachedAt < CACHE_TTL_MS) {
        return { projects: cachedProjects, updatedAt: cachedAt, source: 'cache' };
    }

    // Currently using curated data; future: fetch from Bio.xyz API
    cachedProjects = LAUNCHPAD_PROJECTS;
    cachedAt = now;

    return { projects: cachedProjects, updatedAt: cachedAt, source: 'fresh' };
}
