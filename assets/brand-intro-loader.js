import { Component } from '@theme/component';

/**
 * The navy card that covers the homepage on arrival.
 *
 * The animation itself is CSS. This exists to hold the page still while it
 * plays, and to put right the one thing that holding it still breaks: an
 * incoming #story or #newsletter link. Scroll is pinned to the top for the
 * duration, so the jump has to be run again once the cover lifts.
 */

/** Must outlast the CSS animation, which is 2s. */
const DURATION = 2050;

/** Clears the fixed header, which the browser knows nothing about. */
const ANCHOR_OFFSET = 56;

/** Session-scoped, so it plays once per visit rather than once ever. */
const SEEN_KEY = 'brand-intro-seen';

class BrandIntroLoader extends Component {
  /** @type {number} */
  #timer = 0;

  connectedCallback() {
    super.connectedCallback();

    // Nothing to cover in the editor — it would land on top of the section
    // being edited every time the preview reloaded.
    if (window.Shopify?.designMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#finish(false);
      return;
    }

    if (this.dataset.oncePerVisit === 'true' && this.#alreadySeen()) {
      this.#finish(false);
      return;
    }

    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    this.#timer = window.setTimeout(() => this.#finish(true), DURATION);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  /**
   * Private browsing and blocked storage both throw here rather than returning
   * nothing, so a failure is treated as "not seen" and the intro just plays.
   */
  #alreadySeen() {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return true;
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // No storage available — fall through and play it.
    }

    return false;
  }

  /** @param {boolean} jump - Whether an incoming hash still needs honouring. */
  #finish(jump) {
    this.hidden = true;
    document.body.style.overflow = '';

    if (jump) this.#jumpToHash();
  }

  #jumpToHash() {
    const { hash } = window.location;
    if (hash.length < 2) return;

    /** @type {Element | null} */
    let target = null;

    try {
      target = document.querySelector(hash);
    } catch {
      // A hash that isn't a valid selector is simply not ours.
    }

    if (!target) return;

    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET,
      behavior: 'smooth',
    });
  }
}

if (!customElements.get('brand-intro-loader')) {
  customElements.define('brand-intro-loader', BrandIntroLoader);
}
