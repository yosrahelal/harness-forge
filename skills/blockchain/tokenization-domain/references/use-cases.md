# Use cases

## Fiat-backed stablecoin (EU: e-money token, EMT)

- **Lifecycle**: client pays fiat → issuer receives funds into safeguarded accounts → mint to the client's allow-listed address → transfers → redemption request → burn → fiat paid out at par.
- **Key controls**: mint only against confirmed receipt of funds; supply equals or is below the reserve; redemption at par at any time; no interest paid to holders by the issuer; freeze and recovery for legal orders; allow-list or deny-list depending on the model.
- **Design questions**: who mints (issuer backend through custody policy), reconciliation of supply with reserve accounts (daily, intraday), proof of reserves and attestation frequency, multi-chain supply (canonical chain or per-chain issuance), handling of blocklisted addresses, distributor and CASP relationships, redemption SLA.

## Deposit token (tokenized deposit)

- A bank deposit liability represented on a ledger, usually restricted to the bank's clients, often on a permissioned network.
- Differs from an EMT in issuer, regulation and protection (deposit guarantee); the boundary with MiCA must be checked case by case with legal.
- Typical uses: intragroup or interbank payments, programmable treasury, cash leg for DvP.

## Tokenized money market fund (and other funds)

- **Actors**: management company, depositary, fund administrator / valuator (NAV), transfer agent / registrar, distributor, investors.
- **Order lifecycle**: order before cut-off → KYC and allow-list check → NAV computed and published for the dealing date → units issued or cancelled (mint / burn) → cash settlement → register updated.
- **Two token models**:
  - *Accumulating, NAV-priced*: the token is the unit; its value follows NAV; mint and burn quantities = amount ÷ NAV.
  - *Stable-value with distribution*: price kept constant per unit (for example public-debt CNAV, LVNAV within its collar), income distributed by minting additional units daily or periodically; requires a distribution routine and rounding policy.
- **Design questions**: NAV publication on-chain (who signs, bounds, correction process, decimals and rounding), synchronous vs asynchronous subscription (ERC-7540 request / claim pattern), forward pricing (orders at unknown NAV) vs instantaneous, cash leg (fiat off-chain, stablecoin, deposit token), secondary transfers between investors (allowed? allow-list on receiver), register of record and reconciliation with the transfer agent, fee accrual, gating and suspension (MMF liquidity tools), reporting.
- **Invariants worth testing**: units outstanding × NAV ≈ fund net assets (within rounding); no mint without a matching settled order; redemption pays at the NAV of the dealing date; rounding never favours the investor systematically.

## Tokenized bonds and securities

- Issuance (primary placement, DvP), coupon payments (pull or push, snapshot of holders), redemption at maturity, corporate actions, transfer restrictions, investor eligibility.
- Settlement models: on-chain cash (stablecoin, deposit token, wholesale CBDC trials), off-chain cash with conditional delivery, or a DLT market infrastructure (DLT Pilot regime venues).

## Settlement and DvP

- Atomic swap of asset and cash leg on the same ledger; cross-ledger DvP via hash-time-locks, notaries or trusted coordinators; central-bank money settlement trials (ECB exploratory work and announced follow-ups: check current status).

## Custody and wallets

- Self-custody by institutions (HSM or MPC), third-party custodians, omnibus vs segregated wallets, recovery of lost investor keys (forced transfer by the issuer under legal procedure), wallet allow-listing linked to KYC.
