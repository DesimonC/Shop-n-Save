# Shop-n-Save

Database-first UK grocery comparison app for DesK Apps.

## Foundation committed on feature/database-first-mvp
- Supabase migration: products, five retailers, dated price observations, shared lookup queue, weekly comparisons, immutable price snapshots, row-level security.
- JavaScript comparison logic: seven-day freshness, fourteen-day historical threshold, cheapest complete supermarket, split-by-store lists, and personal discounts.
- Shared lookup planner with maximum 25 products and validation of price source metadata.

## Setup required
1. Select the intended Supabase project and apply `supabase/migrations/202611170001_shop_n_save.sql`. **Not yet applied.**
2. Add authenticated server endpoints enforcing one new comparison per user per Monday-starting week, maximum 25 distinct products, and snapshotting saved results.
3. Add an asynchronous deduplicated lookup worker, rate limiting, retries and approved source adapters. Never scrape a retailer without confirming permission to reuse its data.
4. Connect frontend and saved lists to Supabase; publish on Netlify when tested.
5. Evaluate Open Prices (ODbL) and Yappman free daily basket (CC BY 4.0), checking attribution, share-alike, product coverage and licence compatibility before importing.

No live external price ingestion or database connection has been activated yet. Do not treat historical prices or mismatched packs as current exact matches. Keep service-role credentials on the server.
