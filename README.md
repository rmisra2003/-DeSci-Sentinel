# 🛡️ DeSci Sentinel

An autonomous web application that evaluates decentralized science (DeSci) research, verifies ownership, checks for plagiarism, and routes approved grants to BioDAOs using the Solana Devnet.

## 📝 What It Actually Does

DeSci Sentinel is a prototype designed to demonstrate how scientific research can be automatically verified and funded on-chain. When a user submits an IPFS Content Identifier (CID) containing their research, the backend performs several strict verifications before simulating a grant payout.

### 1. The Verification Pipeline
1. **IPFS Ingestion**: The backend fetches the raw research content and metadata from the IPFS network (via Pinata).
2. **Absolute Ownership**: It checks the Pinata Key-Value tags or internal JSON metadata. If the user connected a Solana wallet, the backend verifies that the connected wallet exactly matches the wallet address embedded in the IPFS metadata.
3. **Plagiarism & Freshness (Tavily AI)**: The content is summarized and searched against the live web using the Tavily AI Search API to ensure the research is novel and not plagiarized from existing publications.
4. **Internal Duplicate Check**: A basic SHA-256 fingerprinting system ensures the exact same content hasn't already been funded by the platform.
5. **Heuristic Evaluation (OpenAI)**: An LLM evaluates the text and assigns scores out of 25 for: *Reproducibility, Methodology, Novelty,* and *Impact*. 
6. **BioDAO Routing**: Based on keywords in the text (e.g., "longevity", "quantum", "psychedelics"), the system routes the research to 1 of 10 supported BioDAOs (VitaDAO, HairDAO, CryoDAO, etc.).

### 2. On-Chain Payouts (Solana Devnet)
If a submission passes all security checks and achieves a high enough Trust Score (> 80%), and the user signed the request with their Solana wallet, the system automatically executes a Devnet transaction transferring a simulated BioDAO token (or SOL fallback) to the researcher.

---

## 🛠️ System Architecture

- **Frontend (`/Frontend`)**: React 19 + Vite + TailwindCSS. Uses `@solana/wallet-adapter-react` to connect to Phantom/Solflare wallets and sign claiming messages. Features a real-time WebSocket connection to display the evaluation stepper.
- **Backend (`/bio-scholar-backend`)**: Node.js + Express + TypeScript. 
  - `Socket.IO`: Streams live logs and stepper updates to the frontend.
  - `@solana/web3.js`: Constructs and sends devnet payout transactions.
  - `tweetnacl`: Cryptographically verifies the frontend wallet signatures against the requested CID.
- **Deployment**: Configured for Render via `render.yaml` (Frontend as a Static Site, Backend as a Node Web Service).

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v20+)
- A Pinata JWT (for IPFS fetching)
- An OpenAI API Key
- A Tavily API Key
- A Solana Devnet Keypair Private Key (Base58 encoded)

### Backend Setup
1. `cd bio-scholar-backend`
2. `npm install`
3. Create a `.env` file based on the required variables outlined above.
4. `npm run dev` (Runs on port 3001)

### Frontend Setup
1. `cd Frontend`
2. `npm install`
3. Create a `.env` file with `VITE_BACKEND_URL=http://localhost:3001`
4. `npm run dev` (Runs on port 3000)

---

> **Note for Hackathon Judges:**
> This repository contains everything required to run the DeSci Sentinel evaluation pipeline locally. The devnet token mints, BioDAO token lists, and AI scoring mechanisms are fully functional endpoints. Check `App.tsx` and the frontend UI for a specific "Judges Brief" guiding you through a live demonstration!
