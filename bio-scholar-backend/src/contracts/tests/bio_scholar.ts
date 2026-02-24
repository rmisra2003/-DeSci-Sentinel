import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BioScholarVault } from "../target/types/bio_scholar_vault";
import { expect } from "chai";

describe("desci-sentinel-vault", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.BioScholarVault as Program<BioScholarVault>;

    it("Releases a grant to a researcher", async () => {
        const researcher = anchor.web3.Keypair.generate();
        const amount = new anchor.BN(1000000); // 0.001 SOL
        const verificationHash = "VERIFY_DATA_SHA256_HASH";

        // Call the smart contract
        const tx = await program.methods
            .releaseGrant(amount, verificationHash)
            .accounts({
                vault: provider.wallet.publicKey,
                researcher: researcher.publicKey,
                authority: provider.wallet.publicKey,
            })
            .rpc();

        console.log("Transaction Signature:", tx);

        const balance = await provider.connection.getBalance(researcher.publicKey);
        expect(balance).to.equal(amount.toNumber());
    });
});