use { 
    anchor_lang::prelude::*,
    crate::instructions::*,
};


mod collections;
mod instructions;

declare_id!("FaVJjaBbAR5nQvXmkLkVRKxf5B1TXFRDSh6Be7vwN95s");


#[program]
pub mod events_manager {
    use super::*;

    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        ticket_price: u64
    ) -> Result<()> {
        instructions::create_event::handle(ctx, name, ticket_price)
    }

    pub fn sponsor_event(ctx: Context<Sponsor>, quantity: u64) -> Result<()> {
        instructions::sponsor::handle(ctx, quantity)
    }

    // buy tickets
    pub fn buy_tickets (
        ctx: Context<BuyTickets>,
        quantity: u64,
    ) -> Result<()> {
        instructions::buy_tickets::handle(ctx, quantity)
    }

     // withdraw funds
     pub fn withdraw_earnings(
        ctx: Context<WithdrawEarnings>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_earnings::handle(ctx, amount)
    }
}
