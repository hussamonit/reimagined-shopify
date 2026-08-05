import { Component } from '@theme/component';
import { addToCart } from '@theme/brand-cart';

/**
 * Adding to the bag from outside a product page.
 *
 * Two modes. On a tile, every size chip is a one-click add. With
 * `data-select="true"` — the featured jersey — the chips pick a size instead
 * and a separate `[data-add]` button does the adding, which is the same
 * two-step the product page uses.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement} [addButton] - The separate add button, in select mode.
 * @property {HTMLElement} [addLabel] - Text inside that button.
 *
 * @extends {Component<Refs>}
 */
class BrandQuickAdd extends Component {
  /** @type {string | null} */
  #selected = null;

  #busy = false;

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
    if (!variantId || this.#busy) return;

    this.#busy = true;
    button.disabled = true;

    try {
      await addToCart({ variantId, target: this, source: 'brand-quick-add' });
    } catch (error) {
      console.error('[brand-quick-add]', error);
    } finally {
      this.#busy = false;
      button.disabled = false;
    }
  }
}

if (!customElements.get('brand-quick-add')) {
  customElements.define('brand-quick-add', BrandQuickAdd);
}
