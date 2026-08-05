/* Behaviour only. The top bar and footer are static HTML injected at build time
   (_partials/nav.html, _partials/foot.html); the active nav item is chosen by CSS
   from :root[data-page]. What is left here genuinely needs a client: the dark-mode
   preference and the narrow-viewport drawer. */
(function () {
  // The theme is resolved by an inline <head> script (see include-in-header in
  // _quarto.yml) so it lands before first paint; doing it here would be too late,
  // since this file loads at the end of <body>. Only the toggle below is left.

  // Hamburger toggle (narrow viewports).
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.nav-drawer');
  if (toggle && drawer) {
    const setOpen = (open) => {
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(drawer.hidden));
    drawer.addEventListener('click', (e) => { if (e.target.tagName === 'A') setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    // The hamburger only exists below 900px (site.css), so widening the window
    // with the drawer open left it painted with nothing left to close it.
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });

    // Position drawer right under the bar.
    const positionDrawer = () => {
      const bar = document.querySelector('.site-bar');
      if (bar) drawer.style.top = (bar.getBoundingClientRect().bottom) + 'px';
    };
    positionDrawer();
    window.addEventListener('resize', positionDrawer);
    window.addEventListener('scroll', positionDrawer);
  }

  // Section rail, used by Publications and Work. Guarded like the drawer
  // above, since site.js is loaded on every page and the rail exists on two.
  const rail = document.querySelector('.rs-toc');
  if (rail) {
    // Below 1240px the rail is a strip stuck under the site bar, so it needs the
    // bar's height. That height is not one number: the wordmark tagline is
    // dropped between 901 and 1120px, and it changes again when the webfont
    // swaps in. Publish the measured value instead of hard-coding one per
    // breakpoint. ResizeObserver catches the font swap, which `resize` misses.
    const bar = document.querySelector('.site-bar');
    if (bar && 'ResizeObserver' in window) {
      new ResizeObserver(() => {
        document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px');
      }).observe(bar);
    }

    const links = Array.from(rail.querySelectorAll('a'));
    // Deliberately unfiltered: a href with no matching section should throw on
    // the first sync rather than quietly leave that entry inert forever.
    const sections = links.map((a) => document.querySelector(a.getAttribute('href')));
    let queued = false;

    const syncRail = () => {
      queued = false;
      // The active section is the last one whose top has crossed the upper third
      // of the viewport. At the very bottom of the page no further section can
      // cross that line, so the final one is claimed explicitly — otherwise the
      // short last section never lights up.
      const line = window.innerHeight * 0.35;
      let current = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= line) current = i;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections.length - 1;
      }
      // The strip form hides the page-title entry, since it sits directly above
      // the H1 it would name. At the top of the page that entry is the active
      // one, so without this nothing at all reads as selected. offsetParent is
      // null exactly when an ancestor is display:none, so this asks the layout
      // rather than duplicating the breakpoint here.
      while (current < links.length - 1 && links[current].offsetParent === null) {
        current += 1;
      }
      links.forEach((a, i) => {
        if (i === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    const queueRail = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(syncRail);
    };

    syncRail();
    window.addEventListener('scroll', queueRail, { passive: true });
    window.addEventListener('resize', queueRail);
  }

  // Theme toggle (light/dark). The swapped sun/moon icon is the only cue a
  // sighted user needs, but it says nothing to a screen reader, so the buttons
  // also carry aria-pressed — set here rather than in the boot script in
  // _quarto.yml, which runs in <head> before either button exists.
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const syncPressed = (theme) => {
    themeToggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  };
  syncPressed(document.documentElement.getAttribute('data-theme'));
  themeToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      syncPressed(next);
      try { localStorage.setItem('ud-theme', next); } catch (e) {}
    });
  });
})();
