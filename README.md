# Portfolio

**Live: [naderabsy.com](https://naderabsy.com)**

My personal site.

A static, dependency-free portfolio: hand-written HTML, CSS and JavaScript, no framework
and no build step.

## Features

- **Light/dark theme** that follows the OS by default and remembers an explicit choice
- **Scroll-reveal animations** via `IntersectionObserver`, disabled under `prefers-reduced-motion`
- **Active navigation** that tracks the section in view
- **Accessible** — skip link, ARIA on the mobile nav, keyboard navigation, focus-visible rings
- **Structured data** — `Person`, `ProfilePage` and `ScholarlyArticle` JSON-LD

## Lighthouse

| Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|
| 91 | 100 | 100 | 100 |

## Structure

```
index.html        The page
style.css         Design tokens, light/dark, responsive
script.js         Theme toggle, scroll reveal, nav, mobile menu
netlify.toml      Redirects, cache and security headers
robots.txt        Crawler rules
sitemap.xml       Sitemap
cv/resume.html    CV source — print to PDF from a browser to regenerate
assets/           Images and CV
```

## Running it

No build step. Serve the directory:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deployment

Deployed on Netlify from `main`. `netlify.toml` handles the www→apex redirect, asset caching
and security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy).

---

Built by [Nader Absy](https://naderabsy.com)
