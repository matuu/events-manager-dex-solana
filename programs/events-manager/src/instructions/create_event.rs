use { 
    anchor_lang::prelude::*,
    anchor_spl::token::*,
    crate::collections::Event,
};

#[derive(Accounts)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        seeds = [
            Event::SEED_EVENT.as_ref(),
            authority.key().as_ref()
        ],
        bump,
        payer = authority,
        space = 8 + Event::INIT_SPACE
    )]
    pub event: Box<Account<'info, Event>>,

    pub accepted_mint: Box<Account<'info, Mint>>,

    #[account(
        init, 
        seeds = [
            Event::SEED_EVENT_MINT.as_ref(),
            event.key().as_ref()
        ],
        bump, 
        payer = authority,
        mint::decimals = 0,
        mint::authority = event,
    )]
    pub event_mint: Box<Account<'info, Mint>>,
    
    #[account(
        init, 
        seeds = [
            Event::SEED_TREASURY_VAULT.as_ref(),
            event.key().as_ref()
        ],
        bump, 
        payer = authority,
        token::mint = accepted_mint,
        token::authority = event,
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init, 
        seeds = [
            Event::SEED_GAIN_VAULT.as_ref(),
            event.key().as_ref()
        ],
        bump, 
        payer = authority,
        token::mint = accepted_mint,
        token::authority = event,
    )]
    pub gain_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<CreateEvent>, name: String, ticket_price: u64) -> Result<()> {
    ctx.accounts.event.name = name;
    ctx.accounts.event.ticket_price = ticket_price;
    ctx.accounts.event.active = true;
    ctx.accounts.event.authority = ctx.accounts.authority.key();
    ctx.accounts.event.accepted_mint = ctx.accounts.accepted_mint.key();
    ctx.accounts.event.event_bump = ctx.bumps.event;
    ctx.accounts.event.event_mint_bump = ctx.bumps.event_mint;
    ctx.accounts.event.treasury_vault_bump = ctx.bumps.treasury_vault;
    ctx.accounts.event.gain_vault_bump = ctx.bumps.gain_vault;

    Ok(())
}