import { Component } from '@theme/component';

/**
 * The scroll-linked masthead used on top of the homepage hero.
 *
 * At rest the full wordmark sits under the nav, over the video. Scrolling
 * shrinks it into the bar and cross-fades it for the compact logo mark. A
 * second, independent fade swaps the white marks and links for navy ones as the
 * hero scrolls away, so the nav stays readable against the page beneath.
 *
 * Pages without a hero use the plain sticky header and load none of this.
 */

/** Aspect ratio of wordmark-*.svg — the mark's width is driven by the viewport. */
const WORDMARK_RATIO = 1528.6 / 157.2;

/** How far past the hero the light-to-dark swap takes to complete, in px. */
const CONTRAST_FADE = 80;

/** @param {number} value */
const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** @param {number} value */
const smoothstep = (value) => value * value * (3 - 2 * value);

/**
 * @typedef {object} Refs
 * @property {HTMLElement} [mark] - Wraps both wordmarks; this is what scales.
 * @property {HTMLElement} [markLight] - White wordmark, shown over the hero.
 * @property {HTMLElement} [markDark] - Navy wordmark, shown once past it.
 * @property {HTMLElement} [logo] - Wraps the compact mark, centred in the bar.
 * @property {HTMLElement} [logoInner] - Scales as the compact mark fades in.
 * @property {HTMLElement} [logoLight] - White logo mark.
 * @property {HTMLElement} [logoDark] - Navy logo mark.
 * @property {HTMLElement[]} [links] - Both nav link groups.
 *
 * @extends {Component<Refs>}
 */
class BrandHeaderOverlay extends Component {
  // Deliberately no requiredRefs: a missing ref here should degrade to the
  // plain bar, not throw out of connectedCallback and leave the wordmark
  // frozen at full size with no way to recover.

  /** @type {number} */
  #frame = 0;

  #hovering = false;

  #metrics = { start: 0, end: 0, scale: 1, distance: 200, darkStart: 0, hasHero: true };

  connectedCallback() {
    super.connectedCallback();

    this.#measure();
    this.#update();

    window.addEventListener('scroll', this.#onScroll, { passive: true });
    window.addEventListener('resize', this.#onResize);
    this.addEventListener('pointerenter', this.#onPointerEnter);
    this.addEventListener('pointerleave', this.#onPointerLeave);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    window.removeEventListener('scroll', this.#onScroll);
    window.removeEventListener('resize', this.#onResize);
    this.removeEventListener('pointerenter', this.#onPointerEnter);
    this.removeEventListener('pointerleave', this.#onPointerLeave);
    cancelAnimationFrame(this.#frame);
  }

  #onScroll = () => {
    if (this.#frame) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#update();
    });
  };

  #onResize = () => {
    this.#measure();
    this.#update();
  };

  #onPointerEnter = () => {
    this.#hovering = true;
    this.#update();
  };

  #onPointerLeave = () => {
    this.#hovering = false;
    this.#update();
  };

  /**
   * Works out where the wordmark starts and ends. Both depend on the viewport
   * width, so this re-runs on resize.
   */
  #measure() {
    const viewport = document.documentElement.clientWidth || window.innerWidth;
    const barHeight = this.clientHeight;
    const compact = viewport < 760;

    // Resting width of the mark inside the bar, never more than half the screen.
    const restWidth = Math.max(70, Math.min(Number(this.dataset.markWidth) || 150, viewport * 0.5));
    const scale = restWidth / viewport;

    // The overlay treatment only makes sense on top of a hero. If the section
    // is switched off — or the homepage simply has not got one — fall back to
    // the plain bar rather than putting white links on a white page.
    const hero = document.querySelector('[data-brand-hero]');
    const hasHero = hero instanceof HTMLElement;

    this.classList.toggle('brand-nav--no-hero', !hasHero);

    this.#metrics = {
      start: barHeight + (compact ? 8 : 14),
      end: (barHeight - (viewport / WORDMARK_RATIO) * scale) / 2,
      scale,
      distance: Math.max(60, Number(this.dataset.shrinkDistance) || 200),
      darkStart: Math.max(0, (hasHero ? hero.offsetHeight : 0) - barHeight - CONTRAST_FADE),
      hasHero,
    };
  }

  #update() {
    const { mark, markLight, markDark, logo, logoInner, logoLight, logoDark, links } = this.refs;
    const { start, end, scale, distance, darkStart, hasHero } = this.#metrics;

    const scrolled = window.scrollY;
    const progress = smoothstep(clamp01(scrolled / distance));

    if (mark) {
      mark.style.transform = `translateY(${start + (end - start) * progress}px) scale(${
        1 + (scale - 1) * progress
      })`;

      // The wordmark clears out before the compact mark arrives, so the two
      // never read as one shape mid-transition.
      mark.style.opacity = `${1 - clamp01((progress - 0.56) / 0.34)}`;
    }

    const logoIn = clamp01((progress - 0.64) / 0.36);

    if (logo) logo.style.opacity = `${logoIn}`;
    if (logoInner) logoInner.style.transform = `scale(${0.78 + 0.22 * logoIn})`;

    // Hovering the bar brings the dark treatment in early, so the links are
    // legible the moment someone reaches for them.
    const contrast = hasHero
      ? Math.max(clamp01((scrolled - darkStart) / CONTRAST_FADE), this.#hovering ? 1 : 0)
      : 1;

    if (markLight) markLight.style.opacity = `${1 - contrast}`;
    if (markDark) markDark.style.opacity = `${contrast}`;
    if (logoLight) logoLight.style.opacity = `${1 - contrast}`;
    if (logoDark) logoDark.style.opacity = `${contrast}`;

    for (const group of links ?? []) group.style.setProperty('--brand-nav-contrast', `${contrast}`);

    this.style.setProperty('--brand-nav-backdrop', `${this.#hovering ? 1 : 0}`);

    // Published for the hero section, which fades its scroll cue against it.
    document.documentElement.style.setProperty('--brand-nav-progress', `${progress}`);
  }
}

if (!customElements.get('brand-header-overlay')) {
  customElements.define('brand-header-overlay', BrandHeaderOverlay);
}
