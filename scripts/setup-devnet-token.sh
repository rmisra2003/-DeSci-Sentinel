#!/bin/bash
# Helper Script: Create a Test $BIO Token on Solana Devnet

echo "🧬 Setting up Test BIO Token on Devnet..."

# 1. Ensure Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Error: spl-token CLI is not installed."
    echo "   Please install it via: sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.4/install)\""
    exit 1
fi

# 2. Check current network
CURRENT_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$CURRENT_URL" != *"devnet"* ]]; then
    echo "⚠️  Switching to devnet..."
    solana config set --url devnet
fi

# 3. Create the Token
echo "Minting new spl-token..."
MINT_OUTPUT=$(spl-token create-token --decimals 9 2>&1)

if [[ $? -ne 0 ]]; then
    echo "❌ Failed to create token. Do you have devnet SOL?"
    echo "   Run 'solana airdrop 2' and try again."
    exit 1
fi

MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep "Creating token" | awk '{print $3}')

# 4. Create an Account & Mint Initial Supply
echo "Creating associated token account..."
spl-token create-account $MINT_ADDRESS > /dev/null

echo "Minting 1,000,000 Test BIO tokens to yourself..."
spl-token mint $MINT_ADDRESS 1000000 > /dev/null

echo ""
echo "✅ Test BIO Token created successfully!"
echo "--------------------------------------------------------"
echo "Mint Address: $MINT_ADDRESS"
echo "--------------------------------------------------------"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Open desci-sentinel-backend/.env"
echo "2. Update the mint variable:"
echo "   BIO_TOKEN_MINT=$MINT_ADDRESS"
echo "3. Restart the backend server."
echo ""
