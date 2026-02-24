#!/bin/bash

# 1. Clean and Build
echo "🏗️ Building Anchor Program..."
anchor build

# 2. Sync Program ID
# This gets the public key from the generated keypair and updates your files
PROGRAM_ID=$(solana address -k target/deploy/bio_scholar_vault-keypair.json)
echo "🔑 Program ID detected: $PROGRAM_ID"

# Update declare_id! in Rust and Anchor.toml
sed -i "s/declare_id!(\".*\");/declare_id!(\"$PROGRAM_ID\");/g" programs/bio_scholar_vault/src/lib.rs
sed -i "s/bio_scholar_vault = \".*\"/bio_scholar_vault = \"$PROGRAM_ID\"/g" Anchor.toml

# 3. Build again with correct ID
anchor build

# 4. Deploy to Devnet
echo "🚀 Deploying to Devnet..."
anchor deploy --provider.cluster devnet

echo "✅ Deployment Complete!"