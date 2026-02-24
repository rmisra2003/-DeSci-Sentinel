import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const REGISTRY_PATH = path.join(process.cwd(), 'funded_hashes.json');

export interface PlagiarismResult {
    isOriginal: boolean;
    reason?: string;
    confidence: number;
}

class PlagiarismService {
    private registry: Set<string> = new Set();

    constructor() {
        this.loadRegistry();
    }

    private loadRegistry() {
        try {
            if (fs.existsSync(REGISTRY_PATH)) {
                const data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
                this.registry = new Set(data);
                console.log(`[Plagiarism] Loaded ${this.registry.size} funded hashes.`);
            }
        } catch (err) {
            console.error('[Plagiarism] Failed to load registry:', err);
        }
    }

    private saveRegistry() {
        try {
            fs.writeFileSync(REGISTRY_PATH, JSON.stringify(Array.from(this.registry), null, 2));
        } catch (err) {
            console.error('[Plagiarism] Failed to save registry:', err);
        }
    }

    /**
     * Normalizes text by removing whitespace, special characters, and converting to lowercase.
     * This ensures that small formatting changes don't bypass the plagiarism check.
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/[\n\r\t]/g, ' ')
            .replace(/\s+/g, '') // Remove all whitespace for strict content matching
            .replace(/[^\w]/g, ''); // Keep only alphanumeric
    }

    /**
     * Calculates a SHA-256 hash of the normalized research content.
     */
    public calculateFingerprint(content: string): string {
        const normalized = this.normalize(content);
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /**
     * Checks if the content fingerprint already exists in our funded registry.
     */
    public isInternalDuplicate(content: string): boolean {
        const fingerprint = this.calculateFingerprint(content);
        return this.registry.has(fingerprint);
    }

    /**
     * Records a successful payout fingerprint to prevent future duplicates.
     */
    public registerSuccess(content: string) {
        const fingerprint = this.calculateFingerprint(content);
        this.registry.add(fingerprint);
        this.saveRegistry();
    }

    /**
     * Dummy implementation for External Freshness Check.
     * In a real agent, this would use `search_web` and an LLM to verify if the 
     * specific paper abstract or title is already a well-known publication.
     */
    public async checkExternalFreshness(title: string, abstract: string): Promise<PlagiarismResult> {
        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey) {
            console.log(`[Plagiarism] No TAVILY_API_KEY found. Falling back to manual famous markers check.`);
            // NOBEL THEFT PROTECTION: Logic to simulate detection of famous research
            const famousTags = ['crispr', 'mrna', 'qubit', 'relativity', 'string theory', 'dna structure'];
            const normalizedTitle = title.toLowerCase();

            if (famousTags.some(tag => normalizedTitle.includes(tag))) {
                return {
                    isOriginal: false,
                    reason: "Evidence of Prior Publication: This research matches historical breakthroughs or highly cited literature.",
                    confidence: 0.95
                };
            }
            return { isOriginal: true, confidence: 0.8 };
        }

        console.log(`[Plagiarism] Performing REAL Grounded Search for: "${title.substring(0, 50)}..."`);
        try {
            const query = `scientific research paper titled "${title}" published literature`;
            const response = await axios.post('https://api.tavily.com/search', {
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                include_answer: false,
                max_results: 5
            });

            const results = response.data.results || [];

            // Heuristic: If we find a search result with a very similar title
            const matches = results.filter((r: any) => {
                const searchTitle = r.title.toLowerCase();
                const targetTitle = title.toLowerCase();
                return searchTitle.includes(targetTitle.substring(0, 30)) || targetTitle.includes(searchTitle.substring(0, 30));
            });

            if (matches.length > 0) {
                return {
                    isOriginal: false,
                    reason: `High Similarity Detected on Web: Matches found at ${matches[0].url} (${matches[0].title})`,
                    confidence: 0.95
                };
            }

            return {
                isOriginal: true,
                confidence: 0.9
            };

        } catch (err: any) {
            console.error(`[Plagiarism] Tavily Search failed: ${err.message}`);
            return { isOriginal: true, confidence: 0.5, reason: "Search skipped due to technical error." };
        }
    }
}

export const plagiarismService = new PlagiarismService();
