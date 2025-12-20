# SEO Optimization Design for Pongo.sh

**Date:** 2025-12-19
**Goal:** Optimize Next.js App Directory pages for search engine visibility and public discovery

## Overview

This design implements comprehensive SEO optimization for Pongo.sh. The strategy promotes public status pages through selective indexing while protecting private dashboards and monitors from search engines.

## Current State

### Existing SEO Setup
- ✅ Root layout includes basic metadata (title template, description, keywords, OpenGraph, Twitter)
- ✅ Monitors, dashboards, and docs pages include metadata
- ✅ Viewport and theme configuration complete
- ❌ Robots.txt absent
- ❌ Sitemap absent
- ❌ Structured data (JSON-LD) absent
- ❌ Open Graph images absent
- ❌ Home page lacks specific metadata
- ❌ Dynamic routes lack metadata

### Page Inventory
**Static Pages:**
- `/` - Home/Overview
- `/docs` - Documentation
- `/monitors` - Monitors list
- `/dashboards` - Dashboards list
- `/alerts` - Alerts page
- `/settings/*` - Settings pages
- `/login` - Login page

**Dynamic Pages:**
- `/dashboards/[id]` - Dashboard detail (private)
- `/monitors/[id]` - Monitor detail (private)
- `/shared/[slug]` - Public status pages (public)
- `/dashboards/[id]/incidents` - Incidents (private)
- `/dashboards/[id]/announcements` - Announcements (private)

## Design Strategy

### 1. Metadata Strategy

**Three-Tier Approach:**

#### Tier 1 - Public Marketing Pages (Fully Optimized)
- `/` (home) - Add comprehensive hero metadata
- `/docs` - Enhanced documentation metadata
- `/shared/[slug]` - Dynamic metadata for each public status page

#### Tier 2 - Public Listing Pages (Standard SEO)
- `/monitors` - Basic metadata exists ✓
- `/dashboards` - Basic metadata exists ✓
- `/alerts`, `/settings/*` - Add metadata

#### Tier 3 - Private Detail Pages (Blocked from Indexing)
- `/dashboards/[id]` - Add `robots: { index: false }`
- `/monitors/[id]` - Add `robots: { index: false }`
- `/login` - Add `robots: { index: false }`

**Key Improvements:**
1. Unique titles and descriptions for all pages
2. Content-based metadata generation for dynamic routes
3. Enhanced OpenGraph and Twitter cards
4. Canonical URLs for all pages
5. Proper robots directives

### 2. Structured Data (JSON-LD)

**Purpose:** Rich snippets in search results improve visibility and click-through rates.

#### Organization Schema (Root Layout)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pongo.sh",
  "description": "Self-hosted uptime monitoring",
  "url": "https://pongo.sh",
  "logo": "https://pongo.sh/logo.png",
  "sameAs": ["https://github.com/TimMikeladze/pongo"]
}
```

#### SoftwareApplication Schema (Home Page)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Pongo",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "operatingSystem": "Linux, macOS, Windows"
}
```

#### WebSite Schema (Public Status Pages)
For each public dashboard:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{Dashboard Name} - Status",
  "description": "Real-time uptime monitoring for {Dashboard Name}",
  "url": "https://pongo.sh/shared/{slug}"
}
```

**Implementation:**
- Add `<script type="application/ld+json">` to page components
- Server-side rendering exposes schema to crawlers immediately
- Validate with Google's Rich Results Test

### 3. Sitemap & Robots.txt

#### Sitemap Strategy

**File:** `app/sitemap.ts`

Next.js auto-generates `/sitemap.xml` from this file.

**Included Pages:**

1. **Static pages** (high priority):
   - `/` - priority: 1.0, changefreq: weekly
   - `/docs` - priority: 0.8, changefreq: monthly
   - `/monitors` - priority: 0.6, changefreq: weekly
   - `/dashboards` - priority: 0.6, changefreq: weekly

2. **Dynamic public pages:**
   - `/shared/[slug]` - Database query finds all `isPublic: true` dashboards
   - Dynamic URL generation
   - Priority: 0.7, changefreq: daily (status pages update frequently)

**Excluded Pages:**
- All private routes (`/dashboards/[id]`, `/monitors/[id]`, `/login`, `/settings/*`)

#### Robots.txt Strategy

**File:** `app/robots.ts`

Next.js auto-generates `/robots.txt`.

```
User-agent: *
Allow: /
Disallow: /dashboards/
Disallow: /monitors/
Disallow: /settings/
Disallow: /alerts
Disallow: /login

Sitemap: https://pongo.sh/sitemap.xml
```

**Benefits:**
- Search engines discover all public pages automatically
- Private data remains protected
- Dashboard changes trigger automatic sitemap updates

### 4. Open Graph Images & Technical SEO

#### Open Graph Images

**Current state:** OG images absent

**Recommendation:**

1. **Default OG image** (root layout):
   - Use existing `/banner.png`
   - Dimensions: 1200x630px (optimal for social sharing)
   - All pages inherit this image

2. **Dynamic OG images** for `/shared/[slug]` (optional/future):
   - Custom images display dashboard name and current status
   - Next.js Image Generation API (`@vercel/og`) generates images
   - Route: `/api/og/[slug]`
   - MVP excludes this feature; add later if needed

#### Technical SEO Improvements

1. **Canonical URLs** - Add to all pages:
   ```ts
   alternates: {
     canonical: 'https://pongo.sh/current-path'
   }
   ```

2. **Language declaration** - Complete ✓:
   ```html
   <html lang="en">
   ```

3. **Viewport & theme** - Complete ✓

4. **Performance:**
   - Next.js 16 handles all optimizations
   - No additional changes required

#### Out of Scope

**Excluded features:**
- Multi-language support (single locale only)
- AMP pages (Next.js delivers fast rendering)
- Breadcrumb schema (navigation structure is flat)

## Implementation Plan Summary

### Phase 1: Foundation
1. Add metadata to home page
2. Create robots.ts
3. Create sitemap.ts with static pages
4. Add default OG image to root layout

### Phase 2: Dynamic Pages
1. Add dynamic metadata to `/shared/[slug]`
2. Add dynamic sitemap entries for public dashboards
3. Add structured data to public pages

### Phase 3: Private Pages
1. Add `robots: { index: false }` to all private routes
2. Add metadata to remaining pages (alerts, settings)

### Phase 4: Structured Data
1. Add Organization schema to root layout
2. Add SoftwareApplication schema to home page
3. Add WebSite schema to public status pages

### Phase 5: Validation
1. Test with Google Rich Results Test
2. Validate sitemap.xml
3. Verify robots.txt
4. Verify proper metadata for all pages

## Success Metrics

- ✅ Unique titles and descriptions exist for all public pages
- ✅ `noindex` directive protects all private pages
- ✅ Sitemap includes all public pages
- ✅ Robots.txt blocks all private routes
- ✅ Google's Rich Results Test validates structured data
- ✅ Social share previews display OG images correctly

## Technical Notes

- **Next.js Version:** 16.0.10
- **Metadata API:** Next.js App Router Metadata API
- **Sitemap Generation:** Next.js built-in sitemap support
- **Robots.txt:** Next.js built-in robots support
- **Database:** Sitemap generation requires database query for public dashboards

## References

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Schema.org Documentation](https://schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
