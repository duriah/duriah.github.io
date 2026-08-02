/* Behaviour only. The top bar and footer are static HTML injected at build time
   (site/_nav.html, site/_foot.html); the active nav item is chosen by CSS from
   body[data-page]. What is left here genuinely needs a client: the dark-mode
   preference and the narrow-viewport drawer. */
(function () {
  // Apply persisted theme before render to avoid flash.
  try {
    const saved = localStorage.getItem('ud-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}

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
