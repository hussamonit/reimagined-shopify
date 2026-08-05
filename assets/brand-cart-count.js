import { Component } from '@theme/component';
import { StandardEvents } from '@shopify/events';

/**
 * Keeps the number in "CART (n)" current after an AJAX add.
 *
 * Horizon's own <cart-icon> hides itself at zero, which is right for a bubble
 * and wrong for a number inside brackets — so this listens to the same event
 * and only ever rewrites the text.
 *
 * Kept apart from brand-header.js on purpose. This one reaches outside the
 * theme for Shopify's events bundle; the masthead should not go dark if that
 * import ever fails.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} [count] - The element holding the number.
 *
 * @extends {Component<Refs>}
 */
class BrandCartCount extends Component {
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(StandardEvents.cartLinesUpdate, this.#onCartUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#onCartUpdate);
  }

  /** @param {any} event - Shopify's cart lines update event. */
  #onCartUpdate = (event) => {
    event.promise
      ?.then(({ cart, detail }) => {
        const { count } = this.refs;
        if (count) count.textContent = String(cart?.totalQuantity ?? detail?.itemCount ?? 0);
      })
      .catch((/** @type {any} */ error) => {
        if (error?.name !== 'AbortError') console.warn('[brand-cart-count] Event promise rejected:', error);
      });
  };
}

if (!customElements.get('brand-cart-count')) {
  customElements.define('brand-cart-count', BrandCartCount);
}
