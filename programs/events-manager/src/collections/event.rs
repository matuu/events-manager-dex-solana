use anchor_lang::prelude::*;


#[account]
#[derive(InitSpace)]
pub struct Event {
    #[max_len(40)]
    pub name: String,
    pub ticket_price: u64,
    pub active: bool,
    pub sponsors: u64,
    pub authority: Pubkey,
    pub accepted_mint: Pubkey,

    pub event_bump: u8,
    pub event_mint_bump: u8,
    pub treasury_vault_bump: u8,
    pub gain_vault_bump: u8,
}

impl Event {
    pub const SEED_EVENT: &'static str = "event";
    pub const SEED_EVENT_MINT: &'static str = "event_mint";
    pub const SEED_TREASURY_VAULT: &'static str = "treasury_vault";
    pub const SEED_GAIN_VAULT: &'static str = "gain_vault";
}
