/**
 * Generates SEO-optimized index.html for each route.
 * Pyramid keyword structure aligned with Google Helpful Content & E-E-A-T guidelines.
 */
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../seo/keywords.json'), 'utf8'));
const { site, pages, keywordPyramid } = config;
const today = new Date().toISOString().split('T')[0];

function buildJsonLd(route, page) {
  const url = site.url + (route === '/' ? '' : route);
  const base = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': site.url + '/#organization',
        name: site.company,
        url: site.url,
        logo: site.url + '/assets/favicon.png',
        description: 'Professional beverage filling machine manufacturer with 30+ years experience in bottling line equipment.',
        foundingDate: '1993',
        areaServed: 'Worldwide',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          email: site.email,
          availableLanguage: ['English', 'Chinese']
        },
        knowsAbout: keywordPyramid.tier1_pillar.secondary.concat(
          keywordPyramid.tier2_category.clusters.map(c => c.keyword)
        )
      },
      {
        '@type': 'WebSite',
        '@id': site.url + '/#website',
        url: site.url,
        name: site.name,
        publisher: { '@id': site.url + '/#organization' },
        inLanguage: site.locale
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: buildBreadcrumbs(route)
      }
    ]
  };

  if (route === '/') {
    base['@graph'].push({
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url: url,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': site.url + '/#website' },
      about: { '@id': site.url + '/#organization' },
      primaryImageOfPage: site.url + '/assets/og-image.jpg',
      inLanguage: site.locale
    });
  } else if (route === '/products') {
    base['@graph'].push({
      '@type': 'CollectionPage',
      '@id': url + '#webpage',
      url: url,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': site.url + '/#website' },
      about: keywordPyramid.tier2_category.clusters
        .filter(c => c.page === '/products')
        .map(c => ({ '@type': 'Thing', name: c.keyword }))
    });
  } else {
    base['@graph'].push({
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url: url,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': site.url + '/#website' }
    });
  }

  return JSON.stringify(base, null, 2);
}

function buildBreadcrumbs(route) {
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: site.url + '/' }];
  if (route !== '/') {
    const name = route.slice(1).charAt(0).toUpperCase() + route.slice(2);
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: name,
      item: site.url + route
    });
  }
  return items;
}

function buildCrawlerContent(route, page) {
  const tier2Links = keywordPyramid.tier2_category.clusters
    .map(c => `<li><a href="${c.page}">${c.keyword}</a></li>`)
    .join('\n        ');

  const longtailList = keywordPyramid.tier3_longtail.keywords
    .slice(0, 8)
    .map(k => `<li>${k}</li>`)
    .join('\n        ');

  return `
  <div id="seo-content" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
    <header>
      <h1>${page.h1}</h1>
      <p>${page.description}</p>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/solutions">Solutions</a></li>
          <li><a href="/video">Videos</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/news">News</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <section aria-label="Product categories">
        <h2>Beverage Filling Equipment Categories</h2>
        <ul>${tier2Links}</ul>
      </section>
      <section aria-label="Popular models">
        <h2>Popular Bottling Line Models</h2>
        <ul>${longtailList}</ul>
      </section>
    </main>
  </div>`;
}

function buildHtml(route, page) {
  const url = site.url + (route === '/' ? '/' : route);
  const jsonLd = buildJsonLd(route, page);
  const crawlerContent = buildCrawlerContent(route, page);

  return `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="keywords" content="${page.keywords}">
  <meta name="author" content="${site.company}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${url}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.url}/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description}">
  <meta name="twitter:image" content="${site.url}/assets/og-image.jpg">

  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="apple-touch-icon" href="/assets/favicon.png">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></noscript>

  <script type="application/ld+json">${jsonLd}</script>

  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    html.light, html.light body { background-color: #ffffff !important; color: #000000; }
    html.dark, html.dark body { background-color: #1a1a1a !important; color: #ffffff; }
  </style>
  <script>
    (function() {
      var isInIframe = window.self !== window.top;
      function applyThemeToDOM(theme) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
      if (isInIframe) {
        window.addEventListener('message', function(event) {
          if (event.data && typeof event.data.theme === 'string') {
            var theme = event.data.theme;
            if (theme === 'light' || theme === 'dark') applyThemeToDOM(theme);
          }
        });
      } else {
        applyThemeToDOM('light');
      }
    })();
  </script>
</head>
<body>
  ${crawlerContent}
  <div id="root"></div>
  <script defer src="/bundle.js"></script>
  <script defer src="/seo-enhance.js"></script>
  ${site.ga4Id && site.ga4Id !== 'G-XXXXXXXXXX' ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4Id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${site.ga4Id}', { anonymize_ip: true });
  </script>` : `<!-- GA4: Replace G-XXXXXXXXXX in seo/keywords.json with your Measurement ID -->`}
</body>
</html>`;
}

// Generate HTML files
const rootDir = path.join(__dirname, '..');

Object.entries(pages).forEach(([route, page]) => {
  const html = buildHtml(route, page);
  if (route === '/') {
    fs.writeFileSync(path.join(rootDir, 'index.html'), html);
    console.log('Generated: index.html');
  } else {
    const dir = path.join(rootDir, route.slice(1));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log('Generated: ' + route + '/index.html');
  }
});

// Generate sitemap
const sitemapUrls = Object.keys(pages).map(route => {
  const loc = site.url + (route === '/' ? '/' : route);
  const priority = route === '/' ? '1.0' : route === '/products' ? '0.9' : route === '/contact' ? '0.8' : '0.7';
  const changefreq = route === '/' || route === '/news' || route === '/products' ? 'weekly' : 'monthly';
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>`;

fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemap);
console.log('Generated: sitemap.xml');

console.log('\nKeyword pyramid tiers:');
console.log('  Tier 1 (Pillar):', keywordPyramid.tier1_pillar.primary);
console.log('  Tier 2 (Category):', keywordPyramid.tier2_category.clusters.length, 'clusters');
console.log('  Tier 3 (Long-tail):', keywordPyramid.tier3_longtail.keywords.length, 'keywords');
