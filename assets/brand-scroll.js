/**
 * Where the scrolling actually happens.
 *
 * At 990px and up Horizon gives `html` and `body` a fixed height with
 * `overflow: hidden` and scrolls `.page-wrapper` instead. So on desktop
 * `window.scrollY` is pinned at 0 and scroll events never reach `window` —
 * anything scroll-linked has to ask which element is moving. Below that
 * breakpoint the document scrolls normally again.
 */

/**
 * @returns {HTMLElement} The element currently doing the scrolling.
 */
export function getScroller() {
  const wrapper = document.querySelector('.page-wrapper');

  // Only the container that can actually overflow is the scroller — below
  // 990px the wrapper simply grows with its content.
  if (wrapper instanceof HTMLElement && wrapper.scrollHeight > wrapper.clientHeight) {
    return wrapper;
  }

  return /** @type {HTMLElement} */ (document.scrollingElement ?? document.documentElement);
}

/**
 * @returns {number} How far the page has been scrolled, in px.
 */
export function getScrollTop() {
  return getScroller().scrollTop;
}

/**
 * @param {number} top - Position to scroll to, in px.
 * @param {ScrollBehavior} [behavior]
 */
export function scrollTo(top, behavior = 'auto') {
  getScroller().scrollTo({ top, behavior });
}

/**
 * Scroll events do not bubble, so a listener on `document` only sees them
 * during the capture phase. Listening there catches both the document and
 * `.page-wrapper` without having to care which is in play, including across a
 * resize that swaps one for the other.
 *
 * @param {() => void} handler
 * @returns {() => void} Call to stop listening.
 */
export function onScroll(handler) {
  document.addEventListener('scroll', handler, { passive: true, capture: true });

  return () => document.removeEventListener('scroll', handler, { capture: true });
}
