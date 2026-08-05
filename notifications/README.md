# Notification emails

These are **not theme files**. Shopify's notification templates live in the
admin, not in the theme, so nothing here is served by the storefront — Shopify
ignores this folder when it syncs. They are kept in the repo so the wording is
versioned alongside the pages it echoes.

## Installing

For each file: open **Settings → Notifications**, choose the notification named
below, click **Edit code**, select everything in the email body box and replace
it with the contents of the file. Send a test to yourself before saving over a
working template.

| File | Shopify notification |
|---|---|
| `order-confirmation.liquid` | Order confirmation |
| `shipping-notification.liquid` | Shipping confirmation |

## The jersey squares

Each line shows the jersey's year in its own colour on a bone square, rather
than a photograph — it keeps the emails light and there is no broken-image state
when a mail client blocks remote content.

The year and the colour cannot come from the product's metafields: notification
emails run on a smaller set of Liquid objects than the storefront and metafields
are not among them. So the five jerseys are listed by handle near the top of the
line-item loop in each file.

Adding a sixth jersey means one more `when` line in both files. A product with no
entry falls back to its size on a plain navy square, which still reads as
deliberate rather than broken.

## Fonts

Arial and Courier New rather than Archivo and IBM Plex Mono. Web fonts do not
load in Outlook and several mobile clients, and a failed web font falls back
somewhere unpredictable — these stacks hold the brand's proportions everywhere.
