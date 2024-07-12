import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount} from "@solana/spl-token";
import { BN } from "bn.js";
import { EventsManager } from "../target/types/events_manager";
import { createMint, createFundedWallet, createAssociatedTokenAccount } from './utils';

import { assert } from "chai";

describe("event-manager", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EventsManager as Program<EventsManager>;

  // event accounts address
  let acceptedMint: PublicKey; // example: USDC

  // PDAs
  let eventPublicKey: PublicKey;
  let eventMint: PublicKey;
  let treasuryVault: PublicKey;
  let gainVault: PublicKey;

  // Sponsor
  let alice: Keypair; // alice key pair
  let aliceAcceptedMintATA: PublicKey; //alice accepted mint ATA
  let aliceEventMintATA: PublicKey; //alice event mint ATA

  // provider (event organizer) wallet 
  let walletAcceptedMintATA: PublicKey; //provider wallet accepted mint ATA

  // Sponsor
  let bob: Keypair; // bob key pair
  let bobAcceptedMintATA: PublicKey; // bob accepted mint ATA
  let bobEventMintATA: PublicKey; // bob event mint ATA


  // all this should exists **before** calling our program instructions
  before(async () => {
    acceptedMint = await createMint(provider);

    // find event account PDA
    [eventPublicKey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("event", "utf-8"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // find event mint account PDA
    [eventMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("event_mint", "utf-8"), eventPublicKey.toBuffer()],
      program.programId
    );

    // find treasury vault account PDA
    [treasuryVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury_vault", "utf-8"), eventPublicKey.toBuffer()],
      program.programId
    );

    // find gain vault account PDA
    [gainVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("gain_vault", "utf-8"), eventPublicKey.toBuffer()],
      program.programId
    );

    // creates a new wallet funded with 3 SOL 
    alice = await createFundedWallet(provider, 3);
    // create alice accepted mint ata with 100 accepted mint
    // Accepted mint = USDC  -> alice wallet = 100 USDC 
    aliceAcceptedMintATA = await createAssociatedTokenAccount(provider,acceptedMint,500, alice);
    // find alice event mint ata (only finds address)
    aliceEventMintATA = await getAssociatedTokenAddress(eventMint, alice.publicKey);

    // find provided (event organizer) wallet acceptend mint ata
    // only the address
    walletAcceptedMintATA = await getAssociatedTokenAddress(acceptedMint, provider.wallet.publicKey);

    // create bob wallet with lamports
    bob = await createFundedWallet(provider);
    // create bob accepted mint ata
    bobAcceptedMintATA = await createAssociatedTokenAccount(provider,acceptedMint,500, bob)
    // find bob event mint ata
    bobEventMintATA = await getAssociatedTokenAddress(eventMint, bob.publicKey);
  });

  // TEST: Create an Event
  it("Creates a new Event", async () => {
    const name:string = "my_event";
    const ticketPrice = new BN(2); // 2 Accepted mint (USDC)

    const tx = await program.methods.createEvent(name, ticketPrice)
    .accounts({
      event: eventPublicKey,
      acceptedMint: acceptedMint, // example: USDC
      eventMint: eventMint,
      treasuryVault: treasuryVault,
      gainVault: gainVault,
      authority: provider.wallet.publicKey, // event organizer
    })
    .rpc();

     // show new event info
     const eventAccount = await program.account.event.fetch(eventPublicKey);
     assert.isNotNull(eventAccount);
  });

   // TEST: Sponsor event
   it("Alice Should get 5 event tokens", async () => {
     
     // should have 500 USDC
     const expected_usdc_amount = 500;
     // collaborate
     const expected_sponsor_amount = 5;

     // show alice accepted mint (USDC) ATA info
     let aliceUSDCBalance = await getAccount(
      provider.connection,
      aliceAcceptedMintATA // Alice Accepted mint account (USDC account)
    );
    assert.equal(Number(aliceUSDCBalance.amount), expected_usdc_amount)

    const quantity = new BN(expected_sponsor_amount); // 5 USDC 
    await program.methods
      .sponsorEvent(quantity)
      .accounts({
        eventMint: eventMint, // 1:1 with USDC
        payerAcceptedMintAta: aliceAcceptedMintATA, // Alice USDC Account 
        event: eventPublicKey,
        authority: alice.publicKey,
        payerEventMintAta:aliceEventMintATA, // Alice Event Mint Account
        treasuryVault: treasuryVault // store all Accepted mint (USDC) from sponsorships
      })
      .signers([alice])
      .rpc();

    // show alice event mint ATA info
    // should have 5 sponsorship tokens
    const aliceAccount = await getAccount(
      provider.connection,
      aliceEventMintATA // Alice Event Mint account (should have <quantity> tokens from sponsorship)
    );
    assert.equal(Number(aliceAccount.amount), expected_sponsor_amount);

     // show alice accepted mint (USDC) ATA info
     // should have 95 (100-5) USDC
     aliceUSDCBalance = await getAccount(
      provider.connection,
      aliceAcceptedMintATA // Alice Accepted mint account (USDC account)
    );
    assert.equal(Number(aliceUSDCBalance.amount), expected_usdc_amount - expected_sponsor_amount);
  });

  // TEST: Sponsor event
  it("Bob Should get 48 event tokens", async () => {
    const expected_bob_sponsor_amount = 48;
    const quantity = new BN(expected_bob_sponsor_amount);

    await program.methods
      .sponsorEvent(quantity)
      .accounts({
        eventMint: eventMint,
        payerAcceptedMintAta: bobAcceptedMintATA,
        event: eventPublicKey,
        authority: bob.publicKey,
        payerEventMintAta:bobEventMintATA,
        treasuryVault: treasuryVault
      })
      .signers([bob])
      .rpc();

    // show bob event mint ATA info
    const bobAccount = await getAccount(
      provider.connection,
      bobEventMintATA
    );
    assert.equal(Number(bobAccount.amount), expected_bob_sponsor_amount);
  });

   // TEST: Buy Tickets
   it("Alice buy 23 tickets", async () => {
    const expected_tickets_amount = 23; 
    const current_balance = 495;

    // show alice accepted mint (USDC) ATA info     
     let aliceUSDCBalance = await getAccount(
      provider.connection,
      aliceAcceptedMintATA // Alice Accepted mint account (USDC account)
    );
    assert.equal(Number(aliceUSDCBalance.amount), current_balance)

    const quantity = new BN(expected_tickets_amount);
     await program.methods
       .buyTickets(quantity) 
       .accounts({
         payerAcceptedMintAta: aliceAcceptedMintATA, // Alice Accepted mint (USDC) account
         event: eventPublicKey,
         authority: alice.publicKey,
         gainVault: gainVault // stores all accepted mint (USDC) from tickets purchase
       })
       .signers([alice])
       .rpc();
     
     // show event gain vault info
     const gainVaultAccount = await getAccount(
       provider.connection,
       gainVault // stores all accepted mint (USDC) from tickets purchase
     );
     // should have 46 USDC ( 23 tickets x 2 USDC (tickect_price))
     assert.equal(Number(gainVaultAccount.amount), expected_tickets_amount * 2);

     // show alice accepted mint (USDC) ATA info
     aliceUSDCBalance = await getAccount(
      provider.connection,
      aliceAcceptedMintATA // Alice Accepted mint account (USDC account)
    );
    assert.equal(Number(aliceUSDCBalance.amount), current_balance - (expected_tickets_amount * 2));
   });

   // TEST: Buy 154 Tickets
   it("Bob buy 154 tickets", async () => {
    const expected_tickets_amount = 154;
    const expected_total_gain_vault = (
      (expected_tickets_amount * 2) +  // bob's tickets
      (23 * 2)  // alice's tickets
   );
    const quantity = new BN(expected_tickets_amount);
     await program.methods
       .buyTickets(quantity)
       .accounts({
         payerAcceptedMintAta: bobAcceptedMintATA,
         event: eventPublicKey,
         authority: bob.publicKey,
         gainVault: gainVault
       })
       .signers([bob])
       .rpc();

     // show event gain vault info
     const gainVaultAccount = await getAccount(
       provider.connection,
       gainVault
     );
     assert.equal(Number(gainVaultAccount.amount), expected_total_gain_vault);
 
   });

    // TEST: Withdraw Funds
    it("Event organizer should withdraw 1 from treasury", async () => {
      const expected_treasury_total = 53; // bob 48 + alice 5
      const expected_treasury_withdraw_amount = 1;
      
      // show event treasury vault info
      let treasuryVaultAccount = await getAccount(
        provider.connection,
        treasuryVault
      );
      assert.equal(Number(treasuryVaultAccount.amount), expected_treasury_total);   
   
    const amount = new BN(expected_treasury_withdraw_amount); // 1 USDC
    await program.methods
      .withdrawFunds(amount)
      .accounts({
        event: eventPublicKey,
        acceptedMint: acceptedMint, // example: USDC
        authority: provider.wallet.publicKey, // event organizer
        treasuryVault: treasuryVault, // stores all Accepted Mint (USDC) from sponsorships
        authotiryAcceptedMintAta: walletAcceptedMintATA, // account where the event organizer receives accepted mint(USDC)
      })
      .rpc();
    
    // show event treasury vault info
    treasuryVaultAccount = await getAccount(
      provider.connection,
      treasuryVault
    );
    assert.equal(Number(treasuryVaultAccount.amount), expected_treasury_total - expected_treasury_withdraw_amount);

    // show event organizer accepted mint (USDC) ATA info
    // should have 1 accepted mint (USDC) 
    const organizerUSDCBalance = await getAccount(
      provider.connection,
      walletAcceptedMintATA // event organizer Accepted mint account (USDC account)
    );
    assert.equal(Number(organizerUSDCBalance.amount), expected_treasury_withdraw_amount);

  });

  // TEST: Close Event
  it("event organizer should close event", async () => {
    // act
    await program.methods
      .closeEvent()
      .accounts({
        event: eventPublicKey,
        authority: provider.wallet.publicKey
      })
      .rpc();

    // show new event info
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.isFalse(eventAccount.active)
  });

  // TEST: Can't Buy 2 Tickets
  it("Alice can't buy tickets", async () => {
    
    let error: anchor.AnchorError;
    const quantity = new BN(2);
    try {
      await program.methods
       .buyTickets(quantity)
       .accounts({
         payerAcceptedMintAta: aliceAcceptedMintATA,
         event: eventPublicKey,
         authority: alice.publicKey,
         gainVault: gainVault
       })
       .signers([alice])
       .rpc();
    } catch (err) {
      error = err;
    }
    assert.equal(error.error.errorCode.code, "EventClosed");
   });

  // TEST: Withdraw earnings
  it("Alice Should withdraw earnings", async () => {
    const expected_sporsorship_amnt = 53, // alice 5 + bob 48
          expected_gain_vault_amnt = 354, // bob (154 * 2) + alice (23 * 2)
          expected_alice_token = 5,
          expected_alice_earning_amnt = 33;
    // show total sponsorships
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.equal(eventAccount.sponsors.toNumber(), expected_sporsorship_amnt);

   // show event gain vault amount
   let gainVaultAccount = await getAccount(
     provider.connection,
     gainVault
   );
   assert.equal(Number(gainVaultAccount.amount), expected_gain_vault_amnt)

   // show Alice sponsorship tokens
   let aliceTokens = await getAccount(
     provider.connection,
     aliceEventMintATA
   );
   assert.equal(Number(aliceTokens.amount), expected_alice_token);
   
   await program.methods
     .withdrawEarnings()
     .accounts({
       userEventMintAta: aliceEventMintATA,
       event: eventPublicKey,
       authority: alice.publicKey,
       gainVault: gainVault,
       userAcceptedMintAta: aliceAcceptedMintATA,
       eventMint: eventMint
     })
     .signers([alice])
     .rpc();
   
   // show event gain vault amount
   gainVaultAccount = await getAccount(
     provider.connection,
     gainVault
   );
   assert.equal(Number(gainVaultAccount.amount), expected_gain_vault_amnt - expected_alice_earning_amnt);
 });

});