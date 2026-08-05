import { Component } from '@theme/component';

/**
 * The size table and the jersey beside it.
 *
 * Choosing a row makes the diagram read out that size's measurements against
 * its A and B dimension lines. The table is the source; the diagram only
 * reports what the chosen row already says, so there is nothing to keep in
 * sync.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement[]} [rows] - One per size.
 * @property {HTMLElement} [chest] - Value against dimension A.
 * @property {HTMLElement} [length] - Value against dimension B.
 * @property {HTMLElement} [showing] - Names the size being shown.
 *
 * @extends {Component<Refs>}
 */
class BrandSizeGuide extends Component {
  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#onClick);

    // One row arrives already marked, so the diagram is never blank before
    // anything is pressed. Falling back to the first covers a named opening
    // size that does not match any row.
    const rows = this.refs.rows ?? [];
    const current = rows.find((row) => row.getAttribute('aria-current') === 'true') ?? rows[0];
    if (current) this.#show(current);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
  }

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    const row = /** @type {HTMLElement | null} */ (event.target)?.closest?.('[data-size]');
    if (!(row instanceof HTMLButtonElement)) return;

    event.preventDefault();
    this.#show(row);
  };

  /** @param {HTMLButtonElement} row */
  #show(row) {
    const { rows, chest, length, showing } = this.refs;

    for (const option of rows ?? []) {
      option.setAttribute('aria-current', String(option === row));
    }

    if (chest) chest.textContent = row.dataset.chest ?? '';
    if (length) length.textContent = row.dataset.length ?? '';
    if (showing && showing.dataset.template) {
      showing.textContent = showing.dataset.template.replace('[size]', row.dataset.size ?? '');
    }
  }
}

if (!customElements.get('brand-size-guide')) {
  customElements.define('brand-size-guide', BrandSizeGuide);
}
