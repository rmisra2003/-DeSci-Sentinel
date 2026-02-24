# 🧬 DESCI SENTINEL — LLM Context File

> **Last Updated:** 2026-02-23
> **Version:** 3.0.0
> **Status:** Production-Ready (Bio.xyz Deep Integration complete).

---

## 1. PROJECT OVERVIEW

**DeSci Sentinel** is an **autonomous DeSci (Decentralized Science) agent** deeply integrated into the **Bio.xyz ecosystem**. As a registered **BioAgent**, it evaluates research submissions and distributes on-chain grants directly to the researcher's wallet, mapping discoveries seamlessly to all **10 active BioDAOs** (VitaDAO, HairDAO, CryoDAO, PsyDAO, CerebrumDAO, Curetopia, ValleyDAO, AthenaDAO, Long COVID Labs, Quantum Biology DAO).

### Core Value Proposition (v3.0.0)
- **BioDAO Orchestrated Routing** — Dedicated NLP parsing logic targets specific BioDAOs.
- **Bio.xyz Launchpad Feed** — Live integration with `app.bio.xyz` to surface active ecosystem projects.
- **Anti-Theft Protocol (Grounded Search)** — Live Tavily AI interrogations ensure novelty and prevent plagiarism.
- **Absolute Ownership Verification** — Verifies claimant identity by matching Ed25519 signatures with **Pinata Key-Value tags**.
- **User-Centric Payouts** — `$BIO` and `$SOL` grants are executed deterministically on-chain.

---

---

## 2. ARCHITECTURE & SECURITY (v3.0.0)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite :3000)                        │
│                                                                      │
│  App.tsx ─── WalletProvider ──┬── CurationFeed (VerificationStepper) │
│                               ├── BioLaunchpad (Ecosystem Map)       │
│                               └── AgentSidebar (wallet, stats)       │
│                                                                      │
│  SECURITY: Real-time status updates via Socket.IO.                   │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTP (with Signature)
┌──────────────────────────▼───────────────────────────────────────────┐
│                    BACKEND (Express + Socket.IO :3001)               │
│                                                                      │
│  server.ts ────┬── Signature/Absolute Ownership Verification         │
│                ├── Anti-Plagiarism (Tavily Grounding)                │
│                ├── Evaluation NLP (10x BioDAO Target Matching)       │
│                └── Bio.xyz Ecosystem API (/api/bio/launchpad)        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. FILE MAP

### Backend (`desci-sentinel-backend/`)
- `src/api/server.ts`: Enforces the security pipeline and exposes BioAgent core endpoints.
- `src/agents/scholar/evaluator.ts`: Scans text to assign exactly 1 of 10 BioDAOs.
- `src/services/bio-launchpad.ts`: Exposes active Bio.xyz projects.
- `src/services/plagiarism.ts`: Handles hashing and Tavily API grounding.

### Frontend (`Frontend/`)
- `src/components/CurationFeed.tsx`: Features the `VerificationStepper` for live progress tracking.
- `src/hooks/useBackend.ts`: Manages WebSocket states (`AgentLog`).

---

## 4. RECENT UPDATES (v3.0.0)
- **Expanded BioDAO Logic**: Evaluator now routes correctly to subsets like *Curetopia* (Rare Diseases) and *CerebrumDAO* (Neuroscience).
- **Bio.xyz Launchpad Integration**: Exposing native `app.bio.xyz` metrics via the backend.
- **Centralized BioAgent Identity**: Reconfigured `/api/health` specifying the autonomous agent's parameters in the broader network.
- **Live Grounded Playbooks**: Completed stress testing on all internal anti-theft pipelines.

---

## 5. REPOSITORY STATUS
- **`README.md`**: Master entrance for Judges.
- **`JUDGES_GUIDE.md`**: Strategic technical document for evaluations.
- **`backend_test.ts`**: Verification script for devnet pipeline.

---

*This context file reflects the definitive, secure version of the DeSci Sentinel agent.*
