import { Component } from '@theme/component';

/**
 * Checks the contact form before it is sent.
 *
 * Shopify handles the sending and the sent state; this only stops a message
 * going out with nothing useful in it, and says so in the page rather than in a
 * browser bubble.
 *
 * @typedef {object} Refs
 * @property {HTMLInputElement} [name] - Sender's name.
 * @property {HTMLInputElement} [email] - Sender's address.
 * @property {HTMLTextAreaElement} [message] - The message.
 * @property {HTMLElement} [error] - Where the complaint goes.
 *
 * @extends {Component<Refs>}
 */

/** Deliberately loose — an address is confirmed by the reply arriving. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Short enough to be a slip of the keyboard rather than a message. */
const SHORTEST_MESSAGE = 5;

class BrandContact extends Component {
  /** @type {HTMLFormElement | null} */
  #form = null;

  connectedCallback() {
    super.connectedCallback();

    // Shopify's form tag wraps this element, so the form is an ancestor.
    this.#form = this.closest('form');
    this.#form?.addEventListener('submit', this.#onSubmit);
    this.addEventListener('input', this.#clearError);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#form?.removeEventListener('submit', this.#onSubmit);
    this.removeEventListener('input', this.#clearError);
  }

  /** @param {SubmitEvent} event */
  #onSubmit = (event) => {
    const { name, email, message } = this.refs;

    /** @type {[HTMLElement | undefined, boolean][]} */
    const checks = [
      [name, (name?.value ?? '').trim().length > 0],
      [email, LOOKS_LIKE_EMAIL.test((email?.value ?? '').trim())],
      [message, (message?.value ?? '').trim().length >= SHORTEST_MESSAGE],
    ];

    const firstBad = checks.find(([field, ok]) => field && !ok)?.[0];
    if (!firstBad) return;

    event.preventDefault();

    const { error } = this.refs;
    if (error) {
      error.hidden = false;
      error.textContent = this.dataset.errorMessage ?? '';
    }

    firstBad.setAttribute('aria-invalid', 'true');
    firstBad.focus();
  };

  #clearError = () => {
    const { error } = this.refs;
    if (error) error.hidden = true;

    for (const field of [this.refs.name, this.refs.email, this.refs.message]) {
      field?.removeAttribute('aria-invalid');
    }
  };
}

if (!customElements.get('brand-contact')) {
  customElements.define('brand-contact', BrandContact);
}
