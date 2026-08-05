# Critical workflow rules

This theme is connected to Shopify through the GitHub integration. Files reach the store via the git branch, not through the Shopify CLI.

- **NEVER** run `shopify theme push`
- **NEVER** run `shopify theme pull`
- `shopify theme dev` is the only Shopify CLI command allowed (local preview only)
- Use git for all syncing: `git pull` at the start of a session, `git push` at the end
- Shopify commits theme-editor changes back to the branch automatically, so **always `git pull` before starting work**

## What reaches the store, and when

- **Nothing on Shopify changes until you `git push`.** Committing alone does nothing to the
  storefront. The theme editor and the live storefront only ever show what has been pushed.
- **`git pull` immediately after asking the owner to change anything in the Shopify editor.**
  Editor changes are committed back to the branch by Shopify, and working on a stale copy
  will conflict with them.
- **Only push working states.** The branch history doubles as the store's version history, so
  every commit that lands on `origin/main` should be a version worth rolling back to. Verify
  locally with `shopify theme dev` first, then push.
- Local preview (`shopify theme dev`) and the Shopify theme editor are **not** the same thing.
  The dev server serves the working tree; the editor serves what is on Shopify. If they
  disagree, the difference is unpushed work.

## Horizon gotcha: the page is not what scrolls

At 990px and up, Horizon gives `html` and `body` a fixed height with `overflow: hidden` and
scrolls `.page-wrapper` instead. So on desktop `window.scrollY` is always 0 and scroll events
never reach `window`. Anything scroll-linked must go through `assets/brand-scroll.js`, and
scroll locking must use Horizon's `scroll-lock` attribute on `<html>`.
