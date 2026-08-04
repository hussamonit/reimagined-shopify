/**
 * Scroll reveals for the whole storefront.
 *
 * A section opts in by putting `data-reveal` on an element, with the stagger in
 * milliseconds as the value:
 *
 *   <div data-reveal="120">…</div>
 *
 * Every target on the page shares one IntersectionObserver. `brand-tokens`
 * holds the hidden state and the transition; this file only decides when an
 * element crosses into view and applies its delay.
 */

const SELECTOR = '[data-reveal]';
const REVEALED = 'is-revealed';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** @type {IntersectionObserver | null} */
let observer = null;

/**
 * @param {Element} element
 */
function reveal(element) {
  if (element instanceof HTMLElement) {
    const delay = Number.parseFloat(element.dataset.reveal ?? '') || 0;
    element.style.transitionDelay = `${delay}ms`;
  }

  element.classList.add(REVEALED);
}

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.04 }
  );

  return observer;
}

/**
 * Starts watching every reveal target inside `root`. Safe to call again — the
 * theme editor re-runs it whenever a section is re-rendered.
 *
 * @param {ParentNode} [root]
 */
export function observeReveals(root = document) {
  const elements = root.querySelectorAll(SELECTOR);
  if (!elements.length) return;

  // With motion turned down the hidden state never applies, so there is nothing
  // to wait for. Same when the browser has no observer to give us.
  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
    for (const element of elements) element.classList.add(REVEALED);
    return;
  }

  const io = getObserver();

  for (const element of elements) {
    if (!element.classList.contains(REVEALED)) io.observe(element);
  }
}

// Tells the failsafe in `brand-tokens` that hiding reveal targets is safe.
window.brandRevealReady = true;

observeReveals();

document.addEventListener('shopify:section:load', (event) => {
  if (event.target instanceof Element) observeReveals(event.target);
});
