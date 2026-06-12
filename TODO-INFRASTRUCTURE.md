# Pending Infrastructure Tasks

## Step 7: Cloudflare Proxy (BLOCKED — needs own domain)

**Status:** Waiting for `reportafrica.com` domain purchase
**When:** Once domain is purchased and DNS is controlled by us

**Setup steps:**
1. Sign up at cloudflare.com (free tier)
2. Add domain → point nameservers to Cloudflare
3. Enable proxy (orange cloud) on API subdomain
4. Enable "Under Attack Mode" API toggle from admin dashboard
5. Configure WAF rules for API endpoints

**Code needed:**
- Admin endpoint: `PATCH /api/v1/admin/cloudflare/attack-mode` → calls Cloudflare API
- Env vars: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`
- Install `node-fetch` or use built-in fetch to call Cloudflare API

**Current protection (without Cloudflare):**
- Nginx rate limiting
- NestJS ThrottlerModule (per-IP rate limits)
- AWS Security Groups (port-level)

---

## Other notes:
- Current API URL: https://34-242-14-140.nip.io/api/v1
- nip.io domains can't use Cloudflare (don't own DNS)
- Once we have our own domain, also set up: SSL via Cloudflare, CDN caching for static assets

## Step 9: Backup Hardening (PARTIALLY BLOCKED)

**RDS backup retention:** BLOCKED at 1 day (free tier limit — FreeTierRestrictionError)
**S3 versioning:** Already enabled ✅
**AMI backup:** Created 2026-06-12 (ami-0066c0976f0f4017f) ✅

**When budget allows:** Upgrade RDS to 7-day retention ($0 if still under 20GB backup, but requires paid account plan)

---

## Future Monetization Features (Build Later)

### Phase 2 — Build when 10k+ active users
| Feature | Revenue Model | Prerequisite |
|---------|--------------|---------------|
| Report-to-Earn (ad revenue split 60/40) | Ad revenue sharing | Need real advertisers paying first |
| Community Bounties (Solve-and-Earn) | 15% commission on bounty payouts | Need NGO/org partnerships |
| Telco Data Bundles for Reporters | Revenue share from MTN/Airtel | Business partnership deal |
| Micro-Insurance Referrals | Commission per policy sold | Partner with Leadway/AXA Mansard |

### Phase 3 — Build when data density is high
| Feature | Revenue Model | Prerequisite |
|---------|--------------|---------------|
| Civic Insight Risk API (Insurance/Logistics) | Monthly API subscription | 50k+ verified reports |
| Real Estate Livability Scores | B2B API licensing | Neighborhood-level data density |
| Political Sentiment Dashboard | Seasonal subscription | Election cycle timing |
| Credit Scoring Alternative Data (Fintechs) | Fee per credit check | Regulatory approval + trust data |
| Government Response Dashboard (full SaaS) | Annual license per LGA | Sales team + gov relationships |

### Phase 4 — Long-term
| Feature | Revenue Model | Prerequisite |
|---------|--------------|---------------|
| Urban Planning Consulting Data | Project fees | Massive dataset |
| Retail Site Selection Analytics | Data subscription | Years of data |
| CSR Impact Dashboards | Management fees | Corporate sales |
| Supply Chain Brand Watch | Monthly retainer | Brand partnerships |
| White-Label Licensing | Licensing + maintenance fees | Product maturity |
| Fix-It Contractor Marketplace | 5-10% commission | Contractor vetting |
| Legal Aid Connect | Lead gen fees | Lawyer network |
| Event Coverage Channels | One-time fee per event | Event org partnerships |
