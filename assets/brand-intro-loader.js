import { Component } from '@theme/component';
import { getScroller, scrollTo } from '@theme/brand-scroll';

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

    // An inline script in the section may already have hidden this before the
    // first paint, which is the whole point of it — do not undo that here.
    if (this.hidden) return;

    // Nothing to cover in the editor — it would land on top of the section
    // being edited every time the preview reloaded.
    if (window.Shopify?.designMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#finish(false);
      return;
    }

    if (this.dataset.oncePerVisit === 'true') this.#markSeen();

    // Horizon locks scrolling with an attribute on <html>, which covers both
    // the document and the inner container it scrolls on desktop.
    document.documentElement.setAttribute('scroll-lock', '');
    getScroller().scrollTop = 0;

    this.#timer = window.setTimeout(() => this.#finish(true), DURATION);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  /**
   * Private browsing and blocked storage both throw here rather than returning
   * nothing, so a failure just means the intro plays again next time.
   */
  #markSeen() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // No storage available.
    }
  }

  /** @param {boolean} jump - Whether an incoming hash still needs honouring. */
  #finish(jump) {
    this.hidden = true;
    document.documentElement.removeAttribute('scroll-lock');

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

    scrollTo(target.getBoundingClientRect().top + getScroller().scrollTop - ANCHOR_OFFSET, 'smooth');
  }
}

if (!customElements.get('brand-intro-loader')) {
  customElements.define('brand-intro-loader', BrandIntroLoader);
}
