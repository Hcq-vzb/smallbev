/**
 * Site-wide floating customer service chat widget.
 * Injected independently (no React bundle changes).
 */
(function () {
  'use strict';

  var origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    origSetItem(key, value);
    if (key === 'language') {
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: value } }));
    }
  };

  var WHATSAPP_NUMBER = '8617751189576';

  var i18n = {
    en: {
      agentName: 'KIWL Support',
      fabLabel: 'Open customer support chat',
      closeLabel: 'Close chat',
      greeting: 'Hello! Welcome to KIWL Machine. How can we help you today?',
      intro:
        'We are Suzhou City KIWL Machine Co., Ltd. — a professional beverage filling machinery manufacturer with over 30 years of expertise. We offer complete bottling lines from 2000 to 12000 BPH for water, juice, carbonated drinks, beer, wine and more.',
      quickProducts: 'Our Products',
      quickSolutions: 'Turnkey Solutions',
      quickAbout: 'Why Choose Us',
      quickSales: 'Talk to Sales',
      replyProducts:
        'We manufacture filling equipment for water, juice, carbonated drinks, beer, wine and more — complete bottling lines from 2000 to 12000 BPH.',
      replyProductsLink: 'Browse our products',
      replySolutions:
        'Our turnkey solutions cover water, juice, carbonated drinks, beer and wine production lines — from layout design to installation and commissioning.',
      replySolutionsLink: 'Explore turnkey solutions',
      replyAbout:
        'With 30+ years of experience, advanced manufacturing, ISO-certified quality and global after-sales service, KIWL is a trusted partner worldwide.',
      replyAboutLink: 'Learn more about us',
      replySales:
        'Our sales team is ready to help with quotes, technical questions and project planning. Tap the WhatsApp button below to connect directly!',
      whatsappLabel: 'Chat on WhatsApp',
      typing: 'Typing…',
      pageNames: {
        '/': 'Home',
        '/products': 'Products',
        '/solutions': 'Solutions',
        '/about': 'About Us',
        '/contact': 'Contact',
        '/news': 'News',
        '/video': 'Videos'
      },
      waIntro: 'Hello, I am contacting you from the KIWL Machine website.',
      waSource: 'Source page',
      waPage: 'Page',
      waInquiry: 'Inquiry',
      waProduct: 'Product',
      waClosing: 'Please provide a quote. Thank you!'
    },
    fr: {
      agentName: 'Support KIWL',
      fabLabel: 'Ouvrir le chat support client',
      closeLabel: 'Fermer le chat',
      greeting: 'Bonjour ! Bienvenue chez KIWL Machine. Comment pouvons-nous vous aider ?',
      intro:
        "Nous sommes Suzhou City KIWL Machine Co., Ltd. — fabricant professionnel de machines de remplissage de boissons avec plus de 30 ans d'expertise. Nous proposons des lignes d'embouteillage complètes de 2000 à 12000 BPH pour l'eau, les jus, les boissons gazeuses, la bière, le vin et plus encore.",
      quickProducts: 'Nos Produits',
      quickSolutions: 'Solutions Clé en Main',
      quickAbout: 'Pourquoi Nous Choisir',
      quickSales: 'Parler au Commercial',
      replyProducts:
        "Nous fabriquons des équipements de remplissage pour l'eau, les jus, les boissons gazeuses, la bière, le vin et plus — lignes complètes de 2000 à 12000 BPH.",
      replyProductsLink: 'Voir nos produits',
      replySolutions:
        "Nos solutions clé en main couvrent les lignes de production d'eau, jus, boissons gazeuses, bière et vin — de la conception à l'installation.",
      replySolutionsLink: 'Découvrir nos solutions clé en main',
      replyAbout:
        'Avec plus de 30 ans d\'expérience, une fabrication avancée, une qualité certifiée ISO et un service mondial, KIWL est un partenaire de confiance.',
      replyAboutLink: 'En savoir plus sur nous',
      replySales:
        'Notre équipe commerciale est prête à vous aider pour les devis, questions techniques et planification de projet. Appuyez sur le bouton WhatsApp ci-dessous !',
      whatsappLabel: 'Discuter sur WhatsApp',
      typing: 'Saisie…',
      pageNames: {
        '/': 'Accueil',
        '/products': 'Produits',
        '/solutions': 'Solutions',
        '/about': 'À propos',
        '/contact': 'Contact',
        '/news': 'Actualités',
        '/video': 'Vidéos'
      },
      waIntro: 'Bonjour, je vous contacte depuis le site KIWL Machine.',
      waSource: 'Page source',
      waPage: 'Rubrique',
      waInquiry: 'Sujet',
      waProduct: 'Produit',
      waClosing: 'Merci de me contacter. Cordialement.'
    }
  };

  var state = {
    lang: 'en',
    open: false,
    greeted: false,
    theme: 'light',
    inquiryTopic: ''
  };

  var root = null;
  var panel = null;
  var messagesEl = null;
  var quickEl = null;
  var whatsappBtn = null;
  var titleEl = null;
  var closeBtn = null;
  var fab = null;

  function t(key) {
    var dict = i18n[state.lang] || i18n.en;
    return dict[key] || i18n.en[key] || key;
  }

  function getLang() {
    var lang = localStorage.getItem('language');
    return lang === 'fr' ? 'fr' : 'en';
  }

  function getTheme() {
    var el = document.documentElement;
    if (el.classList.contains('dark')) return 'dark';
    return 'light';
  }

  function themeColors() {
    if (state.theme === 'dark') {
      return {
        panelBg: '#2a2a2a',
        headerBg: '#1e3a5f',
        text: '#f0f0f0',
        muted: '#aaa',
        botBubble: '#3a3a3a',
        userBubble: '#1e3a5f',
        border: '#444',
        quickBg: '#333',
        quickHover: '#444',
        inputArea: '#222'
      };
    }
    return {
      panelBg: '#ffffff',
      headerBg: '#1e40af',
      text: '#1a1a1a',
      muted: '#666',
      botBubble: '#f1f5f9',
      userBubble: '#dbeafe',
      border: '#e2e8f0',
      quickBg: '#f8fafc',
      quickHover: '#e2e8f0',
      inputArea: '#f8fafc'
    };
  }

  function injectStyles() {
    if (document.getElementById('kiwl-chat-styles')) return;
    var style = document.createElement('style');
    style.id = 'kiwl-chat-styles';
    style.textContent =
      '#kiwl-chat-root{position:fixed;bottom:24px;right:24px;z-index:9999;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5}' +
      '#kiwl-chat-fab{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;background:#2563eb;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .2s,box-shadow .2s}' +
      '#kiwl-chat-fab:hover{transform:scale(1.06);box-shadow:0 6px 20px rgba(0,0,0,.3);background:#1d4ed8}' +
      'a.fixed[href*="wa.me/8617751189576"]:not(#kiwl-chat-wa),a[aria-label="Chat on WhatsApp"].fixed{display:none!important;visibility:hidden!important;pointer-events:none!important}' +
      '#kiwl-chat-panel{display:none;flex-direction:column;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 100px);border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.2);margin-bottom:12px}' +
      '#kiwl-chat-panel.open{display:flex}' +
      '#kiwl-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}' +
      '.kiwl-msg{max-width:85%;padding:10px 14px;border-radius:12px;word-wrap:break-word}' +
      '.kiwl-msg.bot{align-self:flex-start;border-bottom-left-radius:4px}' +
      '.kiwl-msg.user{align-self:flex-end;border-bottom-right-radius:4px}' +
      '.kiwl-msg a{color:#2563eb;text-decoration:underline}' +
      '.kiwl-typing{align-self:flex-start;padding:8px 14px;font-style:italic;opacity:.7}' +
      '#kiwl-chat-quick{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;border-top:1px solid}' +
      '.kiwl-quick-btn{padding:6px 10px;border-radius:16px;border:1px solid;cursor:pointer;font-size:12px;transition:background .15s}' +
      '#kiwl-chat-wa{display:block;text-align:center;padding:12px;color:#fff!important;text-decoration:none!important;font-weight:600;background:#25d366;transition:background .15s}' +
      '#kiwl-chat-wa:hover{background:#1da851}' +
      '#kiwl-chat-wa.highlight{animation:kiwl-pulse 1s ease 2}' +
      '@keyframes kiwl-pulse{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 4px rgba(37,211,102,.5)}}' +
      '@media(max-width:480px){#kiwl-chat-root{bottom:16px;right:16px}#kiwl-chat-panel{width:calc(100vw - 32px);height:calc(100vh - 96px)}}';
    document.head.appendChild(style);
  }

  function applyTheme() {
    state.theme = getTheme();
    var c = themeColors();
    if (!panel) return;
    panel.style.background = c.panelBg;
    panel.style.color = c.text;
    var header = panel.querySelector('#kiwl-chat-header');
    if (header) header.style.background = c.headerBg;
    if (messagesEl) messagesEl.style.background = c.panelBg;
    if (quickEl) {
      quickEl.style.borderColor = c.border;
      quickEl.style.background = c.inputArea;
    }
    panel.querySelectorAll('.kiwl-quick-btn').forEach(function (btn) {
      btn.style.background = c.quickBg;
      btn.style.borderColor = c.border;
      btn.style.color = c.text;
    });
    panel.querySelectorAll('.kiwl-msg.bot').forEach(function (msg) {
      msg.style.background = c.botBubble;
      msg.style.color = c.text;
    });
    panel.querySelectorAll('.kiwl-msg.user').forEach(function (msg) {
      msg.style.background = c.userBubble;
      msg.style.color = c.text;
    });
  }

  function applyLang() {
    state.lang = getLang();
    if (fab) fab.setAttribute('aria-label', t('fabLabel'));
    if (closeBtn) closeBtn.setAttribute('aria-label', t('closeLabel'));
    if (titleEl) titleEl.textContent = t('agentName');
    if (whatsappBtn) {
      var waSpan = whatsappBtn.querySelector('span');
      if (waSpan) waSpan.textContent = t('whatsappLabel');
      else whatsappBtn.textContent = t('whatsappLabel');
      updateWhatsAppLink();
    }
    if (quickEl) {
      var keys = ['quickProducts', 'quickSolutions', 'quickAbout', 'quickSales'];
      var btns = quickEl.querySelectorAll('.kiwl-quick-btn');
      keys.forEach(function (k, i) {
        if (btns[i]) btns[i].textContent = t(k);
      });
    }
  }

  function getNormalizedPath() {
    var path = window.location.pathname || '/';
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path || '/';
  }

  function getProductName() {
    var h1 = document.querySelector('#root h1');
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    var title = document.title || '';
    if (title.indexOf('|') !== -1) title = title.split('|')[0];
    return title.trim();
  }

  function getPageLabel() {
    var path = getNormalizedPath();
    var dict = i18n[state.lang] || i18n.en;
    if (dict.pageNames && dict.pageNames[path]) return dict.pageNames[path];
    if (path.indexOf('/products') === 0) {
      return getProductName() || (state.lang === 'fr' ? 'Produit' : 'Product');
    }
    if (path.indexOf('/solutions') === 0) {
      return getProductName() || (state.lang === 'fr' ? 'Solution' : 'Solution');
    }
    return path;
  }

  function shouldShowProductLine() {
    var path = getNormalizedPath();
    var product = getProductName();
    var pageLabel = getPageLabel();
    if (!product || product === pageLabel) return false;
    if (path === '/' || path === '/about' || path === '/contact' || path === '/news') return false;
    return true;
  }

  function buildWhatsAppMessage() {
    var lines = [t('waIntro'), ''];
    lines.push(t('waSource') + ': ' + window.location.href);
    lines.push(t('waPage') + ': ' + getPageLabel());
    if (state.inquiryTopic) lines.push(t('waInquiry') + ': ' + state.inquiryTopic);
    if (shouldShowProductLine()) lines.push(t('waProduct') + ': ' + getProductName());
    lines.push('', t('waClosing'));
    return lines.join('\n');
  }

  function buildWhatsAppUrl() {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildWhatsAppMessage());
  }

  function updateWhatsAppLink() {
    if (whatsappBtn) whatsappBtn.href = buildWhatsAppUrl();
  }

  function hideLegacyWhatsApp() {
    document.querySelectorAll('a[href*="wa.me/8617751189576"]').forEach(function (link) {
      if (link.id === 'kiwl-chat-wa') return;
      if (link.classList.contains('fixed') || link.getAttribute('aria-label') === 'Chat on WhatsApp') {
        link.style.display = 'none';
        link.setAttribute('aria-hidden', 'true');
        link.setAttribute('tabindex', '-1');
      }
    });
  }

  function scrollMessages() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(text, type, html) {
    var div = document.createElement('div');
    div.className = 'kiwl-msg ' + (type || 'bot');
    var c = themeColors();
    if (type === 'user') {
      div.style.background = c.userBubble;
    } else {
      div.style.background = c.botBubble;
    }
    div.style.color = c.text;
    if (html) {
      div.innerHTML = html;
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    scrollMessages();
    return div;
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'kiwl-typing';
    el.textContent = t('typing');
    el.setAttribute('data-typing', '1');
    messagesEl.appendChild(el);
    scrollMessages();
    return el;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function botReplySequence(messages, delay) {
    delay = delay || 0;
    var idx = 0;
    function next() {
      if (idx >= messages.length) return;
      var msg = messages[idx];
      idx++;
      var typing = showTyping();
      setTimeout(function () {
        removeTyping(typing);
        if (typeof msg === 'string') {
          addMessage(msg, 'bot');
        } else {
          addMessage(null, 'bot', msg.html);
        }
        setTimeout(next, 400);
      }, 900);
    }
    setTimeout(next, delay);
  }

  function sendWelcome() {
    if (state.greeted) return;
    state.greeted = true;
    messagesEl.innerHTML = '';
    botReplySequence([t('greeting'), t('intro')]);
  }

  function handleQuick(action) {
    var userLabel = t(action);
    state.inquiryTopic = userLabel;
    updateWhatsAppLink();
    addMessage(userLabel, 'user');

    if (action === 'quickProducts') {
      botReplySequence([
        t('replyProducts'),
        { html: '<a href="/products">' + t('replyProductsLink') + ' →</a>' }
      ]);
    } else if (action === 'quickSolutions') {
      botReplySequence([
        t('replySolutions'),
        { html: '<a href="/solutions">' + t('replySolutionsLink') + ' →</a>' }
      ]);
    } else if (action === 'quickAbout') {
      botReplySequence([
        t('replyAbout'),
        { html: '<a href="/about">' + t('replyAboutLink') + ' →</a>' }
      ]);
    } else if (action === 'quickSales') {
      botReplySequence([t('replySales')]);
      setTimeout(function () {
        if (whatsappBtn) {
          whatsappBtn.classList.add('highlight');
          setTimeout(function () {
            whatsappBtn.classList.remove('highlight');
          }, 2500);
        }
      }, 1200);
    }
  }

  function openPanel() {
    state.open = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.style.display = 'none';
    updateWhatsAppLink();
    sendWelcome();
    scrollMessages();
  }

  function closePanel() {
    state.open = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.style.display = 'flex';
  }

  function togglePanel() {
    if (state.open) closePanel();
    else openPanel();
  }

  function trackWhatsAppClick() {
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        event_category: 'engagement',
        event_label: 'chat_widget',
        link_url: buildWhatsAppUrl()
      });
    }
  }

  function buildWidget() {
    injectStyles();

    root = document.createElement('div');
    root.id = 'kiwl-chat-root';

    panel = document.createElement('div');
    panel.id = 'kiwl-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Customer support chat');
    panel.setAttribute('aria-hidden', 'true');

    var header = document.createElement('div');
    header.id = 'kiwl-chat-header';
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;padding:14px 16px;color:#fff;';

    titleEl = document.createElement('span');
    titleEl.style.fontWeight = '600';
    header.appendChild(titleEl);

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.style.cssText =
      'background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closePanel);
    header.appendChild(closeBtn);

    messagesEl = document.createElement('div');
    messagesEl.id = 'kiwl-chat-messages';

    quickEl = document.createElement('div');
    quickEl.id = 'kiwl-chat-quick';
    ['quickProducts', 'quickSolutions', 'quickAbout', 'quickSales'].forEach(function (action) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kiwl-quick-btn';
      btn.addEventListener('click', function () {
        handleQuick(action);
      });
      quickEl.appendChild(btn);
    });

    whatsappBtn = document.createElement('a');
    whatsappBtn.id = 'kiwl-chat-wa';
    whatsappBtn.target = '_blank';
    whatsappBtn.rel = 'noopener noreferrer';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true" style="margin-right:8px"></i><span></span>';
    whatsappBtn.addEventListener('click', function () {
      updateWhatsAppLink();
      trackWhatsAppClick();
    });

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(quickEl);
    panel.appendChild(whatsappBtn);

    fab = document.createElement('button');
    fab.id = 'kiwl-chat-fab';
    fab.type = 'button';
    fab.innerHTML = '<i class="fas fa-headset" aria-hidden="true"></i>';
    fab.addEventListener('click', openPanel);

    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    applyLang();
    applyTheme();
  }

  function onLangChange() {
    var prevLang = state.lang;
    applyLang();
    if (state.greeted && prevLang !== state.lang) {
      state.greeted = false;
      if (state.open) sendWelcome();
    }
  }

  function observeTheme() {
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function () {
      applyTheme();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && state.open) {
      closePanel();
      fab.focus();
    }
  }

  function observeLegacyWhatsApp() {
    hideLegacyWhatsApp();
    if (!('MutationObserver' in window)) return;
    var root = document.getElementById('root');
    if (!root) return;
    new MutationObserver(function () {
      hideLegacyWhatsApp();
      if (state.open) updateWhatsAppLink();
    }).observe(root, { childList: true, subtree: true });
  }

  function patchHistory() {
    ['pushState', 'replaceState'].forEach(function (method) {
      var orig = history[method];
      if (!orig) return;
      history[method] = function () {
        var result = orig.apply(this, arguments);
        updateWhatsAppLink();
        return result;
      };
    });
    window.addEventListener('popstate', updateWhatsAppLink);
  }

  function init() {
    buildWidget();
    hideLegacyWhatsApp();
    observeLegacyWhatsApp();
    patchHistory();
    window.addEventListener('languagechange', onLangChange);
    window.addEventListener('storage', function (e) {
      if (e.key === 'language') onLangChange();
    });
    document.addEventListener('keydown', onKeydown);
    observeTheme();
    setTimeout(hideLegacyWhatsApp, 500);
    setTimeout(hideLegacyWhatsApp, 2000);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
