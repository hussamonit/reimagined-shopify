# Critical workflow rules

This theme is connected to Shopify through the GitHub integration. Files reach the store via the git branch, not through the Shopify CLI.

- **NEVER** run `shopify theme push`
- **NEVER** run `shopify theme pull`
- `shopify theme dev` is the only Shopify CLI command allowed (local preview only)
- Use git for all syncing: `git pull` at the start of a session, `git push` at the end
- Shopify commits theme-editor changes back to the branch automatically, so **always `git pull` before starting work**
