import { Component } from '@theme/component';

/**
 * The sort control on the shop page.
 *
 * Filtering is done with plain links, so it needs no JavaScript at all and the
 * result is a shareable URL. Sorting is a select, which has nothing to submit
 * it — this does that on change. The form keeps a submit button for anyone
 * without JavaScript, hidden until it is focused.
 *
 * @typedef {object} Refs
 * @property {HTMLSelectElement} [sort] - The sort control.
 *
 * @extends {Component<Refs>}
 */
class BrandCollection extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.refs.sort?.addEventListener('change', this.#onSort);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.refs.sort?.removeEventListener('change', this.#onSort);
  }

  #onSort = () => {
    this.refs.sort?.form?.submit();
  };
}

if (!customElements.get('brand-collection')) {
  customElements.define('brand-collection', BrandCollection);
}
