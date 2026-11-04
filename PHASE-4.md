# Phase 4 — Card payments and receiving orders

Status: planned after [Phase 3](PHASE-3.md). This phase adds website checkout with credit-card payment and a staff workflow for receiving and managing orders.

## Customer flow

1. Review the cart and fulfillment/contact details.
2. Submit the order with prices, availability and charges verified on the server.
3. Pay through the selected payment provider's hosted checkout or secure payment components.
4. See a payment/order result and an order reference. Make payment status and restaurant acceptance separate, clear states.

Card details are handled by the payment provider; the app does not collect or store raw card numbers or security codes. Confirm payment using verified provider events, rather than relying on a customer-facing success redirect.

## Receiving and managing orders

- Persist orders and their item/price snapshots independently of later menu edits.
- Staff-only incoming-orders view with a clear new-order notification and order details.
- Track payment state separately from fulfillment state.
- Proposed fulfillment states: received, accepted, preparing, ready/out for delivery, completed, and canceled. Confirm the exact workflow with staff before implementation.
- Handle payment failures, abandoned checkout, duplicate submissions/events, cancellations and refunds without charging or creating an order twice.
- Preserve an order's history so staff can understand what was paid, accepted and fulfilled.

## Decisions before implementation

- A payment provider supporting the restaurant's business location, settlement account and required currency; verify current eligibility and fees before choosing one.
- When staff accept an order relative to payment, and what happens if a paid order cannot be fulfilled.
- Refund/cancellation policy and who can perform those actions.
- Staff notification method and the devices used to receive orders.
- Customer order-status updates and whether WhatsApp remains an alternative ordering channel.

## Acceptance

Use provider test mode to verify successful/failed payments, duplicate and delayed events, interrupted checkout, paid-but-not-yet-accepted orders, cancellation/refunds, staff permissions, notifications and recovery after a temporary service outage. Complete the provider's production setup before enabling real payments.
