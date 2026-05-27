# FrameSnap — Deployment & SEO Guide

## 🏗️ Architecture

This is a **100% static site** — one HTML file, no backend server.  
All video processing runs client-side using **FFmpeg.wasm**.

Benefits:
- Zero server costs (host free on Netlify/Vercel/GitHub Pages)
- No data privacy concerns — nothing is uploaded
- No backend to maintain, no DB, no API keys

---

## 🚀 Deploy in 5 Minutes (Free)

### Option A — Netlify (Recommended)

1. Go to https://netlify.com and sign up free
2. Drag your `index.html` file into the Netlify dashboard
3. Your site is live instantly at `https://random-name.netlify.app`
4. Add a custom domain in Settings → Domain Management

**Headers required** — create a `netlify.toml` in the same folder:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

> These headers are REQUIRED for FFmpeg.wasm SharedArrayBuffer support. Without them, conversion will fail.

---

### Option B — Vercel

1. Go to https://vercel.com → New Project → Upload files
2. Create a `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

---

### Option C — GitHub Pages

1. Create a GitHub repo, push `index.html`
2. Go to Settings → Pages → Deploy from main branch
3. **Note:** GitHub Pages does NOT support custom headers.  
   Use a service worker workaround from: https://github.com/nicolo-ribaudo/coi-serviceworker

Add this before `</body>` in your HTML:
```html
<script src="coi-serviceworker.min.js"></script>
```

---

### Option D — Self-hosted (VPS / Apache / Nginx)

Add to your site config:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## 🔍 SEO Strategy (Complete)

### Built-in SEO (already in the HTML file)
- ✅ Optimized `<title>` tag with primary keyword
- ✅ Meta description (155 chars, includes key terms)
- ✅ Meta keywords tag
- ✅ Open Graph tags (Facebook/LinkedIn sharing)
- ✅ Twitter Card tags (large image)
- ✅ Schema.org JSON-LD (WebApplication structured data)
- ✅ Semantic HTML5 (`<main>`, `<header>`, `<footer>`, `<section>`, `aria-*`)
- ✅ `<h1>` with primary keyword
- ✅ FAQ section (can appear as rich snippets)
- ✅ Internal anchor navigation

### What to update before going live

1. Replace `https://yourdomain.com/` everywhere with your actual domain
2. Create an `og-image.png` (1200×630px) showing your tool — add to root folder
3. Add a `favicon.ico` or `<link rel="icon">` to the `<head>`

---

### Off-page SEO Checklist

#### 1. Submit to search engines
- Google Search Console: https://search.google.com/search-console
  - Add your domain → verify → submit sitemap
- Bing Webmaster: https://www.bing.com/webmasters

#### 2. Create a sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

#### 3. Create a robots.txt
```
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
```

#### 4. Target keywords (ranked by difficulty)
| Keyword | Monthly Searches | Difficulty |
|---|---|---|
| video to jpg | 40K | Medium |
| video to jpeg converter | 12K | Medium |
| extract frames from video | 18K | Medium |
| mp4 to jpg | 9K | Low |
| free video frame extractor | 5K | Low |
| ezgif alternative | 3K | Low |
| video to image sequence | 4K | Low |
| convert video to jpg online free | 6K | Low |

#### 5. Build backlinks
- Submit to Product Hunt (free tools get great exposure)
- Post on Reddit: r/webdev, r/VideoEditing, r/software
- List on AlternativeTo.net as an EZGif alternative
- List on Slant.co
- Write a blog post: "Best Free Video to JPG Converters"

#### 6. Page speed
- The HTML file loads all JS from CDN asynchronously
- FFmpeg.wasm only loads when user clicks Convert (lazy-loaded)
- Add to `<head>` for faster CDN preconnect:
```html
<link rel="preconnect" href="https://unpkg.com">
<link rel="dns-prefetch" href="https://unpkg.com">
```

---

## 🧩 Do You Need Claude Code?

**Short answer: No.** This is a single HTML file.

**But Claude Code would help if you want to:**
- Add a Node.js backend (for server-side FFmpeg processing of large files)
- Build a multi-page site with a blog for SEO content
- Add a database for user accounts / saved conversions
- Set up a CI/CD pipeline with automated testing
- Add analytics (Plausible, Google Analytics)

**For the current single-file static version:**
- Just open `index.html` in a code editor (VS Code)
- Edit and deploy as described above
- No build step needed

---

## 📈 Monetization Options (once traffic grows)

1. **Remove ads for Pro users** — keep a banner or small ad unit for free users
2. **Pro tier** — cloud processing for very large files, batch uploads
3. **API** — let developers use your conversion engine
4. **Affiliate links** — recommend paid video editing tools
5. **Sponsored features** — watermark-free export as a free feature, sponsored by a brand

---

## 🛠️ Next Feature Ideas

- [ ] Video to PNG extractor (just change output format in FFmpeg args)
- [ ] Video to GIF converter
- [ ] Image sequence back to video
- [ ] Bulk frame download with custom naming
- [ ] Frame timestamp overlay
- [ ] Mobile app (PWA wrapper with Capacitor)
