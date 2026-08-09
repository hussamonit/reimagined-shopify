import { Component } from '@theme/component';
import { addToCart } from '@theme/brand-cart';
import { getScrollTop, onScroll } from '@theme/brand-scroll';

/**
 * The product page: the view gallery, and the buy column with its sticky
 * companion bar on phones.
 */

/** Past this much scrolling, the phone buy bar slides up. */
const STICKY_AFTER = 380;

/** A swipe shorter than this is a tap that wandered. */
const SWIPE_THRESHOLD = 40;

/**
 * The main image and its thumbnail rail.
 *
 * Every render the owner uploads becomes a view, in the order the media is set
 * on the product. Arrows and the rail drive it on a desktop; on a phone the
 * arrows are hidden and it answers to swipes instead.
 *
 * @typedef {object} GalleryRefs
 * @property {HTMLElement[]} [views] - One wrapper per render.
 * @property {HTMLButtonElement[]} [thumbs] - The rail.
 * @property {HTMLElement} [label] - The view name, top left.
 *
 * @extends {Component<GalleryRefs>}
 */
class BrandProductGallery extends Component {
  #index = 0;

  /** @type {number | null} */
  #touchStart = null;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#onClick);
    this.addEventListener('touchstart', this.#onTouchStart, { passive: true });
    this.addEventListener('touchend', this.#onTouchEnd, { passive: true });
    this.addEventListener('keydown', this.#onKeyDown);

    this.#show(0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('touchstart', this.#onTouchStart);
    this.removeEventListener('touchend', this.#onTouchEnd);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  get #count() {
    return this.refs.views?.length ?? 0;
  }

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    const target = /** @type {HTMLElement | null} */ (event.target);
    const step = target?.closest?.('[data-step]');

    if (step instanceof HTMLElement) {
      event.preventDefault();
      this.#move(Number(step.dataset.step));
      return;
    }

    const thumb = target?.closest?.('[data-view-index]');
    if (thumb instanceof HTMLElement) {
      event.preventDefault();
      this.#show(Number(thumb.dataset.viewIndex));
    }
  };

  /** @param {TouchEvent} event */
  #onTouchStart = (event) => {
    this.#touchStart = event.changedTouches[0]?.clientX ?? null;
  };

  /** @param {TouchEvent} event */
  #onTouchEnd = (event) => {
    if (this.#touchStart == null) return;

    const travelled = (event.changedTouches[0]?.clientX ?? 0) - this.#touchStart;
    this.#touchStart = null;

    if (Math.abs(travelled) < SWIPE_THRESHOLD) return;

    this.#move(travelled < 0 ? 1 : -1);
  };

  /** @param {KeyboardEvent} event */
  #onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') this.#move(-1);
    else if (event.key === 'ArrowRight') this.#move(1);
  };

  /** @param {number} step */
  #move(step) {
    if (!this.#count) return;

    // Wraps, so the arrows never dead-end on the first or last render.
    this.#show((this.#index + step + this.#count) % this.#count);
  }

  /** @param {number} index */
  #show(index) {
    const { views, thumbs, label } = this.refs;
    if (!views?.length) return;

    this.#index = index;

    views.forEach((view, i) => {
      view.hidden = i !== index;
    });

    thumbs?.forEach((thumb, i) => {
      thumb.setAttribute('aria-current', String(i === index));
    });

    if (label) label.textContent = views[index]?.dataset.viewLabel ?? '';
  }
}

if (!customElements.get('brand-product-gallery')) {
  customElements.define('brand-product-gallery', BrandProductGallery);
}

/**
 * The buy column, and the bar that follows it on phones.
 *
 * A size has to be chosen before anything can be added — the button says so
 * rather than failing quietly. Picking a size that is sold out swaps the button
 * for the panel asking to be told when it returns.
 *
 * @typedef {object} BuyRefs
 * @property {HTMLButtonElement[]} [sizes] - The size row.
 * @property {HTMLButtonElement} [addButton] - Add to bag.
 * @property {HTMLElement} [addLabel] - Text inside it.
 * @property {HTMLElement} [hint] - Shown if add is pressed with no size chosen.
 * @property {HTMLElement} [notify] - The back-in-stock panel.
 * @property {HTMLInputElement} [notifyTag] - Carries the chosen size into the signup.
 * @property {HTMLElement} [notifySize] - The size named in the panel's heading.
 * @property {HTMLElement} [bar] - The sticky phone bar.
 * @property {HTMLButtonElement} [barButton] - Its button.
 * @property {HTMLElement} [barLabel] - Its button text.
 * @property {HTMLElement[]} [priceNow] - Every current-price figure on the page.
 * @property {HTMLElement[]} [priceWas] - Every was-price beside them.
 *
 * @extends {Component<BuyRefs>}
 */
class BrandProductBuy extends Component {
  /** @type {HTMLButtonElement | null} */
  #chosen = null;

  #busy = false;

  /** @type {(() => void) | null} */
  #stopScroll = null;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#onClick);
    this.#stopScroll = onScroll(this.#onScroll);
    this.#onScroll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('click', this.#onClick);
    this.#stopScroll?.();
  }

  #onScroll = () => {
    this.refs.bar?.classList.toggle('is-visible', getScrollTop() > STICKY_AFTER);
  };

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    const target = /** @type {HTMLElement | null} */ (event.target);

    const size = target?.closest?.('[data-variant-id]');
    if (size instanceof HTMLButtonElement) {
      event.preventDefault();
      this.#choose(size);
      return;
    }

    const add = target?.closest?.('[data-add]');
    if (add instanceof HTMLButtonElement) {
      event.preventDefault();
      this.#add(add);
    }
  };

  /** @param {HTMLButtonElement} button */
  #choose(button) {
    const { sizes, hint, notify, notifyTag, notifySize, addButton, addLabel, barButton, barLabel } = this.refs;

    this.#chosen = button;

    for (const option of sizes ?? []) {
      option.setAttribute('aria-pressed', String(option === button));
    }

    if (hint) hint.hidden = true;

    const soldOut = button.dataset.available !== 'true';
    const label = button.dataset.sizeLabel ?? '';

    // A sold-out size offers the waiting list in place of the button.
    if (notify) notify.hidden = !soldOut;
    if (addButton) addButton.hidden = soldOut;
    if (notifySize) notifySize.textContent = label;
    if (notifyTag) notifyTag.value = `${notifyTag.dataset.prefix ?? 'notify'}:${label}`;

    // The phone bar has no waiting list to swap itself for, so it says why it
    // cannot be pressed instead of failing at the cart.
    if (barButton) barButton.disabled = soldOut;

    this.#showPrice(button);

    const ready = addLabel?.dataset.readyLabel ?? '';
    if (addLabel && ready) addLabel.textContent = ready;

    if (barLabel) {
      const soldOutLabel = barLabel.dataset.soldOutLabel ?? '';
      barLabel.textContent = soldOut && soldOutLabel ? soldOutLabel : ready || barLabel.textContent;
    }
  }

  /**
   * Moves every price on the page onto the chosen size.
   *
   * The page opens on the product's lowest price, which is only the whole
   * story while every size costs the same. Once one is reduced — or priced
   * differently at all — the figure has to follow the size being looked at.
   *
   * @param {HTMLButtonElement} button
   */
  #showPrice(button) {
    const { priceNow, priceWas } = this.refs;
    const { price, compare } = button.dataset;

    if (price) {
      for (const element of priceNow ?? []) element.textContent = price;
    }

    for (const element of priceWas ?? []) {
      element.hidden = !compare;

      const value = element.querySelector('.brand-price__was-value');
      if (value) value.textContent = compare ?? '';
    }
  }

  /** @param {HTMLButtonElement} button */
  async #add(button) {
    const { hint, sizes } = this.refs;

    // The bar's button doubles as a prompt: with no size chosen it scrolls the
    // row into view rather than doing nothing.
    if (!this.#chosen) {
      if (hint) hint.hidden = false;
      sizes?.[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sizes?.[0]?.focus({ preventScroll: true });
      return;
    }

    // Belt and braces: the controls already reflect a sold-out size, but a
    // stale click should not reach the cart and fail there.
    if (this.#chosen.dataset.available !== 'true') return;

    const variantId = this.#chosen.dataset.variantId;
    if (!variantId || this.#busy) return;

    this.#busy = true;
    button.disabled = true;

    try {
      await addToCart({ variantId, target: this, source: 'brand-product' });
    } catch (error) {
      console.error('[brand-product]', error);
    } finally {
      this.#busy = false;
      button.disabled = false;
    }
  }
}

if (!customElements.get('brand-product-buy')) {
  customElements.define('brand-product-buy', BrandProductBuy);
}
