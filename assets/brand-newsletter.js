import { Component } from '@theme/component';

/**
 * Client-side check on the newsletter address.
 *
 * Native validation would do the checking, but it announces itself in a browser
 * bubble with the browser's own wording. The design calls for the message in
 * the form, in the brand's error red, so the form carries `novalidate` and the
 * check happens here.
 *
 * The sent state is Shopify's — the form posts, and the section re-renders with
 * the confirmation panel.
 *
 * @typedef {object} Refs
 * @property {HTMLInputElement} [email] - The address field.
 * @property {HTMLElement} [error] - Where the message goes.
 *
 * @extends {Component<Refs>}
 */

// Deliberately loose. The address is confirmed by the email actually arriving,
// so anything stricter only rejects addresses that turn out to be valid.
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class BrandNewsletter extends Component {
  /** @type {HTMLFormElement | null} */
  #form = null;

  connectedCallback() {
    super.connectedCallback();

    // Shopify's form tag wraps this element, so the form is an ancestor rather
    // than something we can hold a ref to.
    this.#form = this.closest('form');
    this.#form?.addEventListener('submit', this.#onSubmit);
    this.refs.email?.addEventListener('input', this.#clearError);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#form?.removeEventListener('submit', this.#onSubmit);
    this.refs.email?.removeEventListener('input', this.#clearError);
  }

  /** @param {SubmitEvent} event */
  #onSubmit = (event) => {
    const { email, error } = this.refs;
    if (!email) return;

    if (LOOKS_LIKE_EMAIL.test(email.value.trim())) return;

    event.preventDefault();

    if (error) {
      error.hidden = false;
      error.textContent = this.dataset.errorMessage ?? '';
    }

    email.setAttribute('aria-invalid', 'true');
    email.focus();
  };

  #clearError = () => {
    const { email, error } = this.refs;

    if (error) error.hidden = true;
    email?.removeAttribute('aria-invalid');
  };
}

if (!customElements.get('brand-newsletter')) {
  customElements.define('brand-newsletter', BrandNewsletter);
}
