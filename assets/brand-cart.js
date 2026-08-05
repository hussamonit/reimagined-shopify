import { CartLinesUpdateEvent } from '@shopify/events';

/**
 * Adding a single variant to the bag.
 *
 * Raises the same CartLinesUpdateEvent that Horizon's own product form raises,
 * with a promise resolved once the cart has been re-read. That is what the cart
 * drawer, the cart icon and the header count all listen to, so anything adding
 * through here keeps every one of them in step without touching any of them.
 *
 * Shared by the tile quick-add and the product page, so the two cannot drift
 * apart.
 *
 * @param {object} options
 * @param {string} options.variantId
 * @param {Element} options.target - Element to raise the event from; it must be in the document.
 * @param {number} [options.quantity]
 * @param {string} [options.source] - Names the caller in the event detail.
 * @returns {Promise<void>} Resolves once the cart has been re-read.
 */
export async function addToCart({ variantId, target, quantity = 1, source = 'brand' }) {
  const deferred = CartLinesUpdateEvent.createPromise();

  target.dispatchEvent(
    new CartLinesUpdateEvent({
      action: 'add',
      context: 'product',
      lines: [{ merchandiseId: variantId, quantity }],
      promise: deferred.promise,
    })
  );

  try {
    const response = await fetch(Theme.routes.cart_add_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(variantId), quantity }] }),
    });

    const result = await response.json();

    // The cart API answers 200 with a `status` field when it refuses.
    if (result.status) throw new Error(result.description || result.message || 'Add to cart failed');

    const cart = await fetch(`${Theme.routes.cart_url}.json`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    }).then((cartResponse) => cartResponse.json());

    deferred.resolve({
      cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart),
      detail: {
        items: cart.items,
        source,
        itemCount: quantity,
        didError: false,
      },
    });
  } catch (error) {
    deferred.reject(error);
    throw error;
  }
}

/**
 * Changes the quantity of a line already in the bag, or removes it with a
 * quantity of zero.
 *
 * Asks Shopify to re-render one section along with the change, so the page can
 * update the bag in place instead of reloading around it.
 *
 * @param {object} options
 * @param {number} options.line - 1-based line index.
 * @param {number} options.quantity
 * @param {Element} options.target - Element to raise the event from.
 * @param {string} [options.sectionId] - Section to have re-rendered.
 * @returns {Promise<string | null>} The section's new HTML, when one was asked for.
 */
export async function changeCartLine({ line, quantity, target, sectionId }) {
  const deferred = CartLinesUpdateEvent.createPromise();

  target.dispatchEvent(
    new CartLinesUpdateEvent({
      action: quantity === 0 ? 'remove' : 'update',
      context: 'cart',
      lines: [{ merchandiseId: String(line), quantity }],
      promise: deferred.promise,
    })
  );

  try {
    /** @type {Record<string, unknown>} */
    const body = { line, quantity };
    if (sectionId) body.sections = sectionId;

    const cart = await fetch(Theme.routes.cart_change_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    }).then((response) => response.json());

    deferred.resolve({
      cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart),
      detail: {
        items: cart.items,
        source: 'brand-cart',
        itemCount: cart.item_count,
        didError: false,
      },
    });

    return sectionId ? (cart.sections?.[sectionId] ?? null) : null;
  } catch (error) {
    deferred.reject(error);
    throw error;
  }
}
