/* Inject shared nav + footer into each page based on body[data-page]. */
(function () {
  // Apply persisted theme before render to avoid flash.
  try {
    const saved = localStorage.getItem('ud-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}

  const PAGE = document.body.dataset.page || 'home';

  const NAV = [
    { key: 'home',     label: 'Home',                     href: 'index.html' },
    { key: 'projects', label: 'Projects',                 href: 'projects.html' },
    { key: 'research', label: 'Research & Publications',  href: 'research.html' },
    { key: 'lab',      label: 'Lab',                      href: 'lab.html' },
    { key: 'talks',    label: 'Talks & Teaching',         href: 'talks.html' },
    { key: 'contact',  label: 'Contact',                  href: 'contact.html' },
  ];

  // Split nav: first three on the left, last three on the right; wordmark in the middle.
  const left  = NAV.slice(0, 3);
  const right = NAV.slice(3);

  const link = (n) =>
    `<a href="${n.href}"${n.key === PAGE ? ' class="on"' : ''}>${n.label}</a>`;

  const SUN  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.85 1.85M17.15 17.15 19 19M5 19l1.85-1.85M17.15 6.85 19 5"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.8 6.8 0 0 0 9.7 9.7z"/></svg>';
  const themeBtn = `<button class="theme-toggle" aria-label="Toggle dark mode" type="button"><span class="ico-light">${MOON}</span><span class="ico-dark">${SUN}</span></button>`;

  const bar = `
    <header class="site-bar">
      <nav class="nav-l">${left.map(link).join('')}</nav>
      <a class="mark" href="index.html" style="text-decoration:none">
        Uriah Daugaard
        <span class="b">bioinformatics &middot; ecology &middot; pipelines</span>
      </a>
      <nav class="nav-r">${right.map(link).join('')}${themeBtn}</nav>
      <div class="bar-tools">
        ${themeBtn}
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <div class="nav-drawer" hidden>
      <nav>${NAV.map(link).join('')}</nav>
    </div>`;

  const foot = `
    <footer class="site-foot">
      <div class="l">&copy; Uriah Daugaard &middot; 2026</div>
      <div class="c" aria-hidden="true"></div>
      <div class="r">
        <a href="mailto:uriah.daugaard@cybiome.com">email</a>
        <a href="https://github.com/duriah" target="_blank" rel="noopener">github</a>
        <a href="https://www.linkedin.com/in/uriah-daugaard-8280681b1/" target="_blank" rel="noopener">linkedin</a>
        <a href="https://orcid.org/0000-0003-4092-717X" target="_blank" rel="noopener">orcid</a>
      </div>
    </footer>`;

  // Insert bar at the top, footer at the bottom.
  const barHolder = document.querySelector('[data-mount="bar"]');
  const footHolder = document.querySelector('[data-mount="foot"]');
  if (barHolder) barHolder.outerHTML = bar;
  if (footHolder) footHolder.outerHTML = foot;

  // Hamburger toggle (narrow viewports).
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.nav-drawer');
  if (toggle && drawer) {
    const setOpen = (open) => {
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', () => setOpen(drawer.hidden));
    drawer.addEventListener('click', (e) => { if (e.target.tagName === 'A') setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    // Position drawer right under the bar.
    const positionDrawer = () => {
      const bar = document.querySelector('.site-bar');
      if (bar) drawer.style.top = (bar.getBoundingClientRect().bottom) + 'px';
    };
    positionDrawer();
    window.addEventListener('resize', positionDrawer);
    window.addEventListener('scroll', positionDrawer);
  }

  // Theme toggle (light/dark).
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('ud-theme', next); } catch (e) {}
    });
  });
})();
