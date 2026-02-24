/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/bio_scholar_vault.json`.
 */
export type BioScholarVault = {
  "address": "GHtSfSFd3Y9u7JNkv3f4t3w8c62j68MvLYio8iRwitAo",
  "metadata": {
    "name": "bioScholarVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "releaseGrant",
      "discriminator": [
        138,
        102,
        178,
        193,
        234,
        137,
        85,
        96
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "researcher",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "scholarAgent"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "verificationHash",
          "type": "string"
        }
      ]
    }
  ]
};
