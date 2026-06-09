/**
 * Post-load SEO & performance enhancements (works without React source access).
 * - Lazy-load below-fold images
 * - Track outbound mailto clicks for GA4
 * - Inject contact form on /contact if no form exists
 */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function lazyLoadImages() {
    var images = document.querySelectorAll('img:not([loading])');
    images.forEach(function (img, index) {
      if (index > 1) {
        img.loading = 'lazy';
        img.decoding = 'async';
      } else {
        img.fetchPriority = 'high';
      }
      if (!img.width && img.naturalWidth) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      }
    });
  }

  function applyOptimizedImages(map) {
    if (!map) return;
    function rewriteImg(img) {
      var src = img.getAttribute('src') || '';
      Object.keys(map).forEach(function (orig) {
        if (src.indexOf(orig) !== -1 || src.endsWith(orig.slice(1))) {
          img.src = map[orig];
        }
      });
    }
    document.querySelectorAll('img').forEach(rewriteImg);
    if ('MutationObserver' in window) {
      var root = document.getElementById('root');
      if (root) {
        new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
              if (node.nodeName === 'IMG') rewriteImg(node);
              if (node.querySelectorAll) node.querySelectorAll('img').forEach(rewriteImg);
            });
          });
        }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
      }
    }
  }

  function loadImageMap() {
    fetch('/image-map.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(applyOptimizedImages)
      .catch(function () {});
  }

  function observeNewImages() {
    if (!('MutationObserver' in window)) return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeName === 'IMG') lazyLoadImages();
          if (node.querySelectorAll) {
            var imgs = node.querySelectorAll('img');
            if (imgs.length) lazyLoadImages();
          }
        });
      });
    });
    var root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });
  }

  function trackMailtoClicks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="mailto:"]');
      if (link && typeof gtag === 'function') {
        gtag('event', 'contact_click', {
          event_category: 'engagement',
          event_label: 'mailto',
          link_url: link.href
        });
      }
    });
  }

  function enhanceContactPage() {
    if (window.location.pathname !== '/contact') return;

    setTimeout(function () {
      var root = document.getElementById('root');
      if (!root || root.querySelector('form[data-seo-form]')) return;
      if (root.querySelector('form')) return;

      var mailtoLinks = root.querySelectorAll('a[href^="mailto:"]');
      if (!mailtoLinks.length) return;

      var email = mailtoLinks[0].href.replace('mailto:', '').split('?')[0];
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'max-width:600px;margin:2rem auto;padding:0 1rem;';
      wrapper.innerHTML =
        '<form data-seo-form action="https://formsubmit.co/' + email + '" method="POST" style="background:#f8f9fa;padding:2rem;border-radius:8px;">' +
        '<input type="hidden" name="_subject" value="New Inquiry from smallbeveragemachinery.com">' +
        '<input type="hidden" name="_captcha" value="false">' +
        '<input type="text" name="_honey" style="display:none">' +
        '<input type="hidden" name="_next" value="https://smallbeveragemachinery.com/contact?sent=1">' +
        '<h3 style="margin-top:0">Request a Quote</h3>' +
        '<p style="color:#666;margin-bottom:1.5rem">Fill in your details and our team will respond within 24 hours.</p>' +
        '<label style="display:block;margin-bottom:1rem">Name *<br><input type="text" name="name" required style="width:100%;padding:0.5rem;margin-top:0.25rem;border:1px solid #ddd;border-radius:4px"></label>' +
        '<label style="display:block;margin-bottom:1rem">Email *<br><input type="email" name="email" required style="width:100%;padding:0.5rem;margin-top:0.25rem;border:1px solid #ddd;border-radius:4px"></label>' +
        '<label style="display:block;margin-bottom:1rem">Product Interest<br><select name="product" style="width:100%;padding:0.5rem;margin-top:0.25rem;border:1px solid #ddd;border-radius:4px">' +
        '<option value="Water Filling Machine">Water Filling Machine</option>' +
        '<option value="Juice Bottling Line">Juice Bottling Line</option>' +
        '<option value="Carbonated Drink Filler">Carbonated Drink Filler</option>' +
        '<option value="Beer Filling Machine">Beer Filling Machine</option>' +
        '<option value="Turnkey Bottling Line">Turnkey Bottling Line</option>' +
        '<option value="Other">Other</option></select></label>' +
        '<label style="display:block;margin-bottom:1rem">Message *<br><textarea name="message" required rows="4" style="width:100%;padding:0.5rem;margin-top:0.25rem;border:1px solid #ddd;border-radius:4px"></textarea></label>' +
        '<button type="submit" style="background:#2563eb;color:#fff;padding:0.75rem 2rem;border:none;border-radius:4px;cursor:pointer;font-size:1rem">Send Inquiry</button>' +
        '</form>';

      root.appendChild(wrapper);

      if (new URLSearchParams(window.location.search).get('sent') === '1') {
        var notice = document.createElement('p');
        notice.style.cssText = 'text-align:center;color:#16a34a;font-weight:600;padding:1rem;';
        notice.textContent = 'Thank you! Your inquiry has been sent successfully.';
        root.insertBefore(notice, wrapper);
      }
    }, 1500);
  }

  onReady(function () {
    loadImageMap();
    lazyLoadImages();
    observeNewImages();
    trackMailtoClicks();
    enhanceContactPage();
  });
})();
