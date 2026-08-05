import { Component } from '@theme/component';
import { CartLinesUpdateEvent } from '@shopify/events';

/**
 * Adding to the bag from outside a product page.
 *
 * Two modes. On a tile, every size chip is a one-click add. With
 * `data-select="true"` — the featured jersey — the chips pick a size instead
 * and a separate `[data-add]` button does the adding, which is the same
 * two-step the product page uses.
 *
 * Deliberately raises the same CartLinesUpdateEvent that Horizon's own product
 * form raises, with a promise resolved once the cart has been re-read. That is
 * what the cart drawer, the cart icon and our own "CART (n)" all listen to, so
 * adding this way keeps every one of them in step without touching any of them.
 */

const BUSY = 'is-adding';

/**
 * @typedef {object} Refs
 * @property {HTMLButtonElement} [addButton] - The separate add button, in select mode.
 * @property {HTMLElement} [addLabel] - Text inside that button.
 *
 * @extends {Component<Refs>}
 */
class BrandQuickAdd extends Component {
  /** @type {string | null} */
  #selected = null;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
  }

  get #selectMode() {
    return this.dataset.select === 'true';
  }

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    const target = /** @type {HTMLElement | null} */ (event.target)?.closest?.('[data-variant-id], [data-add]');
    if (!(target instanceof HTMLButtonElement) || target.disabled) return;

    event.preventDefault();

    if (target.hasAttribute('data-add')) {
      if (this.#selected) this.#add(target, this.#selected);
      return;
    }

    if (this.#selectMode) {
      this.#select(target);
      return;
    }

    this.#add(target, target.dataset.variantId ?? '');
  };

  /** @param {HTMLButtonElement} chip */
  #select(chip) {
    for (const option of this.querySelectorAll('[data-variant-id]')) {
      option.setAttribute('aria-pressed', String(option === chip));
    }

    this.#selected = chip.dataset.variantId ?? null;

    const { addButton, addLabel } = this.refs;
    if (addButton) addButton.disabled = false;
    if (addLabel && addLabel.dataset.readyLabel) addLabel.textContent = addLabel.dataset.readyLabel;
  }

  /**
   * @param {HTMLButtonElement} button - Whichever control was pressed.
   * @param {string} variantId
   */
  async #add(button, variantId) {
    if (!variantId || this.classList.contains(BUSY)) return;

    this.classList.add(BUSY);
    button.disabled = true;

    const deferred = CartLinesUpdateEvent.createPromise();

    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action: 'add',
        context: 'product',
        lines: [{ merchandiseId: variantId, quantity: 1 }],
        promise: deferred.promise,
      })
    );

    try {
      const response = await fetch(Theme.routes.cart_add_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] }),
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
          source: 'brand-quick-add',
          sourceId: this.id,
          itemCount: 1,
          didError: false,
        },
      });
    } catch (error) {
      deferred.reject(error);
      console.error('[brand-quick-add]', error);
    } finally {
      this.classList.remove(BUSY);
      button.disabled = false;
    }
  }
}

if (!customElements.get('brand-quick-add')) {
  customElements.define('brand-quick-add', BrandQuickAdd);
}
