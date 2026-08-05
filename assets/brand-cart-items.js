import { Component } from '@theme/component';
import { changeCartLine } from '@theme/brand-cart';

/**
 * The bag's quantity steppers and remove links.
 *
 * Shopify re-renders this section as part of the same request that changes the
 * line, so the totals, the shipping note and the complete-the-set row all come
 * back correct together and the page never reloads.
 *
 * Without JavaScript the steppers are ordinary links carrying the change in the
 * URL, so the bag still works — it just reloads.
 */
class BrandCartItems extends Component {
  #busy = false;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
  }

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    const control = /** @type {HTMLElement | null} */ (event.target)?.closest?.('[data-line]');
    if (!(control instanceof HTMLElement)) return;

    const line = Number(control.dataset.line);
    const quantity = Number(control.dataset.quantity);

    if (!Number.isFinite(line) || !Number.isFinite(quantity)) return;

    event.preventDefault();
    this.#change(line, quantity);
  };

  /**
   * @param {number} line
   * @param {number} quantity
   */
  async #change(line, quantity) {
    if (this.#busy) return;

    this.#busy = true;
    this.setAttribute('aria-busy', 'true');

    try {
      const html = await changeCartLine({
        line,
        quantity,
        target: this,
        sectionId: this.dataset.sectionId,
      });

      if (html) this.#replaceWith(html);
    } catch (error) {
      console.error('[brand-cart-items]', error);

      // Rather than leave the page showing a quantity that was never applied,
      // fall back to the plain reload the no-JavaScript path would have done.
      window.location.reload();
    } finally {
      this.#busy = false;
      this.removeAttribute('aria-busy');
    }
  }

  /** @param {string} html - The freshly rendered section. */
  #replaceWith(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const replacement = parsed.querySelector('brand-cart-items');

    if (replacement) this.innerHTML = replacement.innerHTML;
  }
}

if (!customElements.get('brand-cart-items')) {
  customElements.define('brand-cart-items', BrandCartItems);
}
