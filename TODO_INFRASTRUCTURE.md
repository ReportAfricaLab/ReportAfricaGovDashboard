# TODO — Infrastructure & Features

## Pending Features

### Banner Ad System (Phase 2 — after Promo Challenges)
- [ ] Ad entity (table: `ads`) — advertiser, image_url, link, placement, impressions, clicks, budget, status
- [ ] Ad management API (CRUD, targeting by country/category)
- [ ] Impression & click tracking endpoints
- [ ] Ad rotation logic (fill existing placeholder slots in feed + report pages)
- [ ] Advertiser dashboard (create ad, set budget, view performance)
- [ ] Admin panel: approve/reject ads
- [ ] Paystack payment for ad campaigns (CPM or flat monthly)
- [ ] Replace current "Ad Space Available" mockups with real ads from DB

### Navigation Fixes
- [ ] Add `/business` link to main nav (feed sidebar + mobile menu)
- [ ] Add `/challenges` link to main nav (after building promo challenges)

### Misc
- [ ] OG meta tags for other pages (donations/campaign, elections)
- [ ] Sentry config cleanup (move to instrumentation.ts per warnings)
- [ ] npm audit fix for 99 vulnerabilities
