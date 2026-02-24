import axios from 'axios';
import axiosRetry from 'axios-retry';

// Create a dedicated axios instance for IPFS
const ipfsClient = axios.create({ timeout: 15000 });

// Configure exponential backoff
axiosRetry(ipfsClient, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    onRetry: (retryCount, error, requestConfig) => {
        console.warn(`[Archivist] IPFS fetch retry (${retryCount}/2): ${error.message} on ${requestConfig.url}`);
    }
});

export class ArchivistService {
    async fetchResearchData(cid: string): Promise<string> {
        const cleanCid = cid.replace('ipfs://', '').trim();
        const jwt = process.env.PINATA_JWT;

        // --- Attempt 1: Authenticated Pinata dedicated gateway ---
        if (jwt) {
            try {
                const url = `https://gateway.pinata.cloud/ipfs/${cleanCid}`;
                console.log(`[Archivist] Trying authenticated Pinata gateway...`);
                const response = await ipfsClient.get(url, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                const data = typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data);
                console.log(`[Archivist] ✅ Fetched ${data.length} bytes from Pinata (authenticated)`);
                return data;
            } catch (err: any) {
                console.warn(`[Archivist] Pinata authenticated fetch failed: ${err.message}`);
            }
        }

        // --- Attempt 2: Public IPFS gateways as fallback ---
        const publicGateways = [
            'https://dweb.link/ipfs/',
            'https://ipfs.io/ipfs/',
            'https://gateway.ipfs.io/ipfs/',
        ];

        for (const gateway of publicGateways) {
            try {
                const url = `${gateway}${cleanCid}`;
                console.log(`[Archivist] Trying public gateway: ${url}`);
                const response = await ipfsClient.get(url);
                const data = typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data);
                console.log(`[Archivist] ✅ Fetched ${data.length} bytes from ${gateway}`);
                return data;
            } catch (err: any) {
                console.warn(`[Archivist] Gateway ${gateway} failed: ${err.message}`);
            }
        }

        throw new Error(`All IPFS gateways failed for CID: ${cleanCid}`);
    }

    /**
     * Fetches custom Pinata metadata (key-value pairs) for a CID.
     * This allows ownership verification for non-JSON files (PDFs, images).
     */
    async fetchMetadata(cid: string): Promise<Record<string, any>> {
        const cleanCid = cid.replace('ipfs://', '').trim();
        const jwt = process.env.PINATA_JWT;

        if (!jwt) {
            console.warn('[Archivist] No PINATA_JWT found. Metadata fetch skipped.');
            return {};
        }

        try {
            const url = `https://api.pinata.cloud/data/pinList?cid=${cleanCid}&status=pinned`;
            const response = await ipfsClient.get(url, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            const pins = response.data?.rows || [];
            if (pins.length > 0 && pins[0].metadata?.keyvalues) {
                console.log(`[Archivist] ✅ Fetched Pinata metadata for ${cleanCid}`);
                return pins[0].metadata.keyvalues;
            }
        } catch (err: any) {
            console.error(`[Archivist] Failed to fetch Pinata metadata: ${err.message}`);
        }

        return {};
    }
}

export const archivistService = new ArchivistService();