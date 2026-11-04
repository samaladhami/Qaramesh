# Phase 3 — Order through WhatsApp

Status: planned. Phase 2 remains the current menu and admin system. This phase adds ordering without taking card payments on the website.

## Customer flow

1. Browse the published menu and add available dishes to a cart.
2. Adjust quantities, remove dishes, and enter order notes.
3. Choose the supported fulfillment option and supply the required contact/details.
4. Review items, quantities, prices, any configured charges, and the total.
5. Open WhatsApp with a readable Arabic order addressed to the restaurant. The customer reviews and sends it in WhatsApp; staff receive and confirm the order there.

Opening WhatsApp does not prove the message was sent or the restaurant accepted the order. The website must not show a confirmed order merely because the WhatsApp link was opened. Recheck availability and current published prices before preparing the order; ask the customer to review any changes.

## Scope

- Mobile-friendly cart and Arabic order review, consistent with the existing menu.
- Correct quantity calculations using integer prices, including configured delivery charges if delivery is offered.
- WhatsApp handoff with a clear itemized message and order notes.
- Preserve the cart if the customer returns from WhatsApp.
- Existing staff menu editing, drafts and publishing continue to work.
- No website card-payment checkout or automatic restaurant order confirmation in this phase.

## Decisions before implementation

- Restaurant WhatsApp receiving number.
- Pickup, delivery, or both; required customer details for each.
- Delivery areas, fees, minimum order and opening/ordering hours, if applicable.
- Dish options/add-ons and how they affect prices.
- Whether a staff-controlled ordering pause is needed when the restaurant is busy.

## Acceptance

Verify real WhatsApp handoff on iPhone, Android and desktop; Arabic formatting; cart persistence; quantity/total calculations; unavailable dishes; published price changes; and the distinction between sending a request and receiving restaurant confirmation.

Next: [Phase 4 — Card payments and receiving orders](PHASE-4.md).
