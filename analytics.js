/* Cookie choice + Google Analytics 4 (UK GDPR / EU rules: analytics cookies need consent).
   Nothing from Google loads until the visitor presses Accept. Decline removes any Analytics cookies.
   The notice is #cookie in template.html; [data-cookie-settings] buttons reopen it.
   Events (only sent after Accept): book_open, form_sent (city, service, via), instagram_click, review_click, language_switch. */
(() => {
  const GA_ID = 'G-KYM0XEM42K';           // Pia's GA4 Measurement ID (not secret)
  const KEY = 'pm-consent';                // "yes" or "no", stored on this device only
  const ck = document.getElementById('cookie');
  let on = false;

  const load = () => {
    if (on) return; on = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  };
  const track = (name, params) => { if (on && window.gtag) gtag('event', name, Object.assign({ page: location.pathname }, params || {})); };

  const clearGa = () => {
    const host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').map(x => x.split('=')[0].trim()).filter(n => /^_ga/.test(n)).forEach(n =>
      ['', '; domain=' + host, '; domain=.' + host].forEach(d => { document.cookie = n + '=; Max-Age=0; path=/' + d; }));
  };
  const choose = yes => {
    try { localStorage.setItem(KEY, yes ? 'yes' : 'no'); } catch (e) {}
    ck.classList.remove('show');
    if (yes) load();
    else if (on) { clearGa(); location.reload(); }   // stop Analytics that was already running on this page
    else clearGa();
  };

  let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'yes') load();
  if (ck) {
    if (!saved) setTimeout(() => ck.classList.add('show'), 1200);
    ck.addEventListener('click', ev => { const b = ev.target.closest('[data-c]'); if (b) choose(b.dataset.c === 'yes'); });
  }
  document.addEventListener('click', ev => {
    if (ev.target.closest('[data-cookie-settings]')) { ev.preventDefault(); if (ck) ck.classList.add('show'); }
  });

  // ---- events ----
  document.addEventListener('click', ev => {
    const a = ev.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (/ig\.me|instagram\.com/i.test(h)) track('instagram_click');
    else if (/g\.page|google\.[a-z.]+\/maps|maps\.app\.goo\.gl/i.test(h)) track('review_click');
    else if (a.closest('.langs') && a.hreflang) track('language_switch', { to: a.hreflang });
  }, true);

  const sheet = document.getElementById('sheet'), form = document.getElementById('book-form');
  if (sheet) {
    let wasOpen = false;
    new MutationObserver(() => {
      const open = sheet.classList.contains('open');
      if (open && !wasOpen) track('book_open');
      wasOpen = open;
    }).observe(sheet, { attributes: true, attributeFilter: ['class'] });
    const done = sheet.querySelector('.done');
    if (done && form) new MutationObserver(() => {
      if (done.hidden) return;
      const v = n => (form.querySelector(`[name="${n}"]:checked`) || {}).value || '';
      const city = v('city') === '__other' ? 'other' : v('city');   // the typed-in city is not sent to Google
      track('form_sent', { city, service: v('service'), via: v('via') });
    }).observe(done, { attributes: true, attributeFilter: ['hidden'] });
  }
})();
