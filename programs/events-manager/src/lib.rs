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
}
