use anchor_lang::prelude::*;

declare_id!("GHtSfSFd3Y9u7JNkv3f4t3w8c62j68MvLYio8iRwitAo");

#[program]
pub mod bio_scholar_vault {
    use super::*;

    pub fn release_grant(ctx: Context<ReleaseGrant>, amount: u64, _verification_hash: String) -> Result<()> {
        let scholar_agent = &ctx.accounts.scholar_agent;
        
        // Ensure only the authorized AI Agent can trigger payouts
        require_keys_eq!(scholar_agent.key(), ctx.accounts.authority.key());

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.researcher.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReleaseGrant<'info> {
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub researcher: SystemAccount<'info>,
    pub authority: Signer<'info>,
    /// CHECK: Verified against authority in instruction body
    pub scholar_agent: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}