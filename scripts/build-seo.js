/**
 * Generates SEO-optimized static HTML for GitHub Pages.
 * - Main routes: React SPA + visible footer with internal links
 * - Landing pages: full static content per product/solution category
 */
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../seo/keywords.json'), 'utf8'));
const { site, pages, keywordPyramid } = config;
const clusters = keywordPyramid.tier2_category.clusters;
const today = new Date().toISOString().split('T')[0];
const rootDir = path.join(__dirname, '..');

function titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function landingRoute(cluster) {
  const base = cluster.page === '/solutions' ? '/solutions' : '/products';
  return base + '/' + cluster.slug;
}

function trunc(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function ga4Scripts() {
  if (site.ga4Id && site.ga4Id !== 'G-XXXXXXXXXX') {
    return `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4Id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${site.ga4Id}', { anonymize_ip: true });
  </script>`;
  }
  return '\n  <!-- GA4: set ga4Id in seo/keywords.json -->';
}

const sharedHeadExtra = `
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="apple-touch-icon" href="/assets/favicon.png">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></noscript>`;

const themeScript = `
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
  </script>`;

const staticStyles = `
  <style>
    html, body { margin: 0; padding: 0; width: 100%; }
    html.light, html.light body { background: #fff; color: #1a1a1a; }
    html.dark, html.dark body { background: #1a1a1a; color: #f0f0f0; }
    #site-footer, .static-page { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
    #site-footer { border-top: 1px solid #e2e8f0; padding: 2rem 1.5rem; margin-top: 2rem; background: #f8fafc; font-size: 0.9rem; }
    html.dark #site-footer { background: #222; border-color: #444; }
    #site-footer h2 { font-size: 1rem; margin: 0 0 0.75rem; }
    #site-footer ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; }
    #site-footer a { color: #2563eb; text-decoration: none; }
    #site-footer a:hover { text-decoration: underline; }
    .static-page { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
    .static-page header { border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    html.dark .static-page header { border-color: #444; }
    .static-page nav ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.9rem; }
    .static-page nav a { color: #2563eb; text-decoration: none; }
    .static-page nav a:hover { text-decoration: underline; }
    .static-page h1 { font-size: 1.75rem; margin: 0 0 1rem; line-height: 1.3; }
    .static-page h2 { font-size: 1.2rem; margin: 1.5rem 0 0.75rem; }
    .static-page p { margin: 0 0 1rem; }
    .static-page ul { margin: 0 0 1rem; padding-left: 1.25rem; }
    .static-page .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
    html.dark .static-page .meta { color: #94a3b8; }
    .static-page .cta { display: inline-block; background: #2563eb; color: #fff !important; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 0.5rem; }
    .static-page .cta:hover { background: #1d4ed8; text-decoration: none; }
    .static-page .breadcrumb { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
    .static-page .breadcrumb a { color: #2563eb; text-decoration: none; }
    .related-links { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; padding: 0; }
    .related-links li a { display: inline-block; padding: 0.35rem 0.75rem; background: #f1f5f9; border-radius: 4px; color: #334155; text-decoration: none; font-size: 0.85rem; }
    html.dark .related-links li a { background: #333; color: #e2e8f0; }
  </style>`;

function buildBreadcrumbs(route, labels) {
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: site.url + '/' }];
  labels.forEach((label, i) => {
    const segments = route.split('/').filter(Boolean);
    const partial = '/' + segments.slice(0, i + 1).join('/');
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: label,
      item: site.url + partial
    });
  });
  return items;
}

function orgBlock() {
  return {
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
      telephone: site.phone,
      availableLanguage: ['English', 'Chinese']
    }
  };
}

function buildJsonLd(route, page, opts) {
  opts = opts || {};
  const url = site.url + (route === '/' ? '/' : route);
  const graph = [orgBlock(), {
    '@type': 'WebSite',
    '@id': site.url + '/#website',
    url: site.url,
    name: site.name,
    publisher: { '@id': site.url + '/#organization' },
    inLanguage: site.locale
  }];

  if (opts.breadcrumbLabels) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: buildBreadcrumbs(route, opts.breadcrumbLabels)
    });
  } else if (route !== '/') {
    const name = route.slice(1).split('/').pop().replace(/-/g, ' ');
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: buildBreadcrumbs(route, [titleCase(name)])
    });
  } else {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: buildBreadcrumbs('/', [])
    });
  }

  if (opts.product) {
    graph.push({
      '@type': 'Product',
      '@id': url + '#product',
      name: titleCase(opts.product.keyword),
      description: opts.product.intro,
      brand: { '@type': 'Brand', name: 'KIWL' },
      manufacturer: { '@id': site.url + '/#organization' },
      category: 'Beverage Filling Equipment',
      url: url
    });
  }

  const pageType = opts.product ? 'WebPage' : (route === '/products' || route === '/solutions' ? 'CollectionPage' : 'WebPage');
  graph.push({
    '@type': pageType,
    '@id': url + '#webpage',
    url: url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': site.url + '/#website' },
    inLanguage: site.locale,
    ...(route === '/' ? { about: { '@id': site.url + '/#organization' }, primaryImageOfPage: site.url + '/assets/og-image.jpg' } : {})
  });

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

function buildFooter() {
  const productLinks = clusters
    .filter(c => c.page === '/products')
    .map(c => `<li><a href="${landingRoute(c)}">${titleCase(c.keyword)}</a></li>`)
    .join('\n          ');

  const solutionLinks = clusters
    .filter(c => c.page === '/solutions')
    .map(c => `<li><a href="${landingRoute(c)}">${titleCase(c.keyword)}</a></li>`)
    .join('\n          ');

  return `
  <footer id="site-footer">
    <h2>Beverage Filling Equipment</h2>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">All Products</a></li>
      ${productLinks}
      <li><a href="/solutions">Solutions</a></li>
      ${solutionLinks}
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </footer>`;
}

function buildHead(route, page, jsonLd) {
  const url = site.url + (route === '/' ? '/' : route);
  return `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="author" content="${site.company}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.url}/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description}">
  <meta name="twitter:image" content="${site.url}/assets/og-image.jpg">
  ${sharedHeadExtra}
  <script type="application/ld+json">${jsonLd}</script>
  ${staticStyles}
  ${themeScript}
</head>`;
}

function buildSpaHtml(route, page) {
  const jsonLd = buildJsonLd(route, page);
  return `${buildHead(route, page, jsonLd)}
<body>
  <div id="root"></div>
  ${buildFooter()}
  <script defer src="/bundle.js"></script>
  <script defer src="/seo-enhance.js"></script>
  <script defer src="/chat-widget.js"></script>${ga4Scripts()}
</body>
</html>`;
}

function buildLandingHtml(cluster) {
  const route = landingRoute(cluster);
  const parentLabel = cluster.page === '/solutions' ? 'Solutions' : 'Products';
  const parentRoute = cluster.page;

  const page = {
    title: trunc(titleCase(cluster.keyword) + ' | KIWL ' + cluster.bph, 60),
    description: trunc(
      'KIWL ' + cluster.keyword + ' (' + cluster.bph + '). ' +
      cluster.intro.split('.')[0] + '. Request a free quote.',
      155
    ),
    h1: titleCase(cluster.keyword)
  };

  const jsonLd = buildJsonLd(route, page, {
    product: cluster,
    breadcrumbLabels: [parentLabel, page.h1]
  });

  const features = cluster.features.map(f => `<li>${f}</li>`).join('\n        ');
  const related = cluster.related
    .map(r => `<li>${r}</li>`)
    .join('\n        ');

  const synonymLine = cluster.synonyms && cluster.synonyms.length
    ? `<p>Also searched as: ${cluster.synonyms.join(', ')}.</p>`
    : '';

  const longtailSection = cluster.longtails && cluster.longtails.length
    ? `<h2>Popular Models &amp; Capacities</h2>
        <ul>${cluster.longtails.map(k => `<li>${k}</li>`).join('\n          ')}</ul>`
    : '';

  const siblingLinks = clusters
    .filter(c => c.slug !== cluster.slug)
    .map(c => `<li><a href="${landingRoute(c)}">${titleCase(c.keyword)}</a></li>`)
    .join('\n          ');

  return `${buildHead(route, page, jsonLd)}
<body>
  <article class="static-page">
    <header>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li><a href="/solutions">Solutions</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </header>
    <p class="breadcrumb"><a href="/">Home</a> › <a href="${parentRoute}">${parentLabel}</a> › ${page.h1}</p>
    <h1>${page.h1}</h1>
    <p class="meta">Capacity: ${cluster.bph} · Manufacturer: ${site.company}</p>
    <p>${cluster.intro}</p>
    ${synonymLine}
    <h2>Key Features</h2>
    <ul>${features}</ul>
    ${longtailSection}
    <h2>Applications</h2>
    <ul>${related}</ul>
    <p><a class="cta" href="/contact">Request a Free Quote</a> &nbsp; <a href="${parentRoute}">View all ${parentLabel.toLowerCase()}</a></p>
    <h2>Related Equipment</h2>
    <ul class="related-links">${siblingLinks}</ul>
  </article>
  ${buildFooter()}
  <script defer src="/chat-widget.js"></script>${ga4Scripts()}
</body>
</html>`;
}

function writeHtml(route, html) {
  if (route === '/') {
    fs.writeFileSync(path.join(rootDir, 'index.html'), html);
    console.log('Generated: index.html');
  } else {
    const dir = path.join(rootDir, route.slice(1));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log('Generated: ' + route + '/index.html');
  }
}

// Main SPA pages
Object.entries(pages).forEach(([route, page]) => {
  writeHtml(route, buildSpaHtml(route, page));
});

// Product & solution landing pages
const landingRoutes = [];
clusters.forEach(cluster => {
  const route = landingRoute(cluster);
  landingRoutes.push(route);
  writeHtml(route, buildLandingHtml(cluster));
});

// Sitemap — all routes
const allRoutes = Object.keys(pages).concat(landingRoutes);
const sitemapUrls = allRoutes.map(route => {
  const loc = site.url + (route === '/' ? '/' : route);
  let priority = '0.7';
  if (route === '/') priority = '1.0';
  else if (route === '/products') priority = '0.9';
  else if (route === '/contact') priority = '0.8';
  else if (route.startsWith('/products/') || route.startsWith('/solutions/')) priority = '0.85';

  const changefreq = route === '/' || route === '/news' || route === '/products' ? 'weekly' : 'monthly';
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n');

fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>`);
console.log('Generated: sitemap.xml (' + allRoutes.length + ' URLs)');

console.log('\nSummary:');
console.log('  Main pages:', Object.keys(pages).length);
console.log('  Landing pages:', landingRoutes.length);
console.log('  Total sitemap URLs:', allRoutes.length);
