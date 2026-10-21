// PCS website behaviour. Every section reads fine without this file.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Swap text in place with a short blur crossfade; nothing around it moves.
  const flip = (els, update) => {
    if (reduced.matches) { update(); return; }
    els.forEach((el) => el.classList.add('is-flipping'));
    setTimeout(() => {
      update();
      els.forEach((el) => el.classList.remove('is-flipping'));
    }, 140);
  };

  // Mobile menu
  const toggle = $('.masthead__toggle');
  const nav = $('#site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  // Hero: switch the model, keep the records
  const models = {
    gemini: { name: 'Gemini', dest: 'Google receives only the records you allow it to use.' },
    gpt: { name: 'GPT', dest: 'OpenAI receives only the records you allow it to use.' },
    llama: { name: 'Llama', dest: 'Meta receives only the records you allow it to use.' },
    local: { name: 'a local model', dest: 'It runs on this PC. Optional online tools have their own settings.' },
  };
  const modelButtons = $$('.app__models button');
  const modelName = $('[data-model-name]');
  const modelDest = $('[data-model-dest]');
  modelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const model = models[button.dataset.model];
      if (!model || button.getAttribute('aria-pressed') === 'true') return;
      modelButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      flip([modelName.parentElement, modelDest], () => {
        modelName.textContent = model.name;
        modelDest.textContent = model.dest;
      });
    });
  });

  // Showcase: tabs that swap the plate. Pointing previews, clicking or arrow keys select.
  const tablist = $('.showcase__tabs');
  if (tablist) {
    const tabs = $$('[role="tab"]', tablist);
    const plates = $$('[data-plate]');
    const zoom = $('.showcase__zoom');
    const shots = {
      conversation: ['screenshots/pcs-conversation-0114.png', 'Enlarge the Conversation screenshot'],
      library: ['screenshots/pcs-library-0114.png', 'Enlarge the Library screenshot'],
      map: ['screenshots/pcs-map-0114.png', 'Enlarge the Map screenshot'],
    };
    const showPlate = (key) => {
      plates.forEach((img) => img.classList.toggle('is-active', img.dataset.plate === key));
      zoom.dataset.enlarge = shots[key][0];
      zoom.setAttribute('aria-label', shots[key][1]);
    };
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
      showPlate(tab.dataset.tab);
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    tabs.forEach((tab) => tab.addEventListener('pointerenter', () => { if (fine.matches) showPlate(tab.dataset.tab); }));
    tablist.addEventListener('pointerleave', () => {
      const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
      if (current) showPlate(current.dataset.tab);
    });
  }

  // Screenshot viewer
  const viewer = $('.viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const img = $('img', viewer);
    $$('[data-enlarge]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const inner = trigger.querySelector('img.is-active') || trigger.querySelector('img');
        img.src = trigger.dataset.enlarge;
        img.alt = inner ? inner.alt : '';
        viewer.showModal();
      });
    });
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
    // Guides: links to a full-size screenshot open in the same viewer.
    $$('a[data-image-preview]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const inner = link.querySelector('img');
        img.src = link.getAttribute('href');
        img.alt = inner ? inner.alt : link.textContent.trim();
        viewer.showModal();
      });
    });
  }

  // Map demo: each part of the rendered Map is a piece of the product's interface
  const mapHost = $('[data-pcs-map]');
  if (mapHost) {
    const markParts = () => {
      if (!mapHost.children.length) return false;
      Array.from(mapHost.children).forEach((part) => part.setAttribute('data-ui', ''));
      mapHost.removeAttribute('data-ui');
      return true;
    };
    markParts();
    new MutationObserver(markParts).observe(mapHost, { childList: true });
  }

  // Guides: tab groups such as the connection chooser
  $$('[data-tabs]').forEach((group) => {
    const tabs = $$('[role="tab"]', group);
    const activate = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        activate(tabs[(to + tabs.length) % tabs.length], true);
      });
    });
    if (tabs.length) activate(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
  });

  // Guides: mark the contents entry for the section being read
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length) {
    const byId = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const headings = Array.from(byId.keys()).map((id) => document.getElementById(id)).filter(Boolean);
    const mark = (id) => tocLinks.forEach((a) => a.classList.toggle('is-current', a === byId.get(id)));
    // The current section is the last heading that has reached the top third; before the first, the first.
    const update = () => {
      const line = window.innerHeight * 0.3;
      const passed = headings.filter((h) => h.getBoundingClientRect().top <= line);
      mark((passed[passed.length - 1] || headings[0]).id);
    };
    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    }, { passive: true });
    if (headings[0]) update();
  }

  // Download: what you need for the model you pick
  const needs = {
    gemini: 'You’ll need a Google API key. API use is billed by Google, separately from any Gemini subscription.',
    gpt: 'You’ll need an OpenAI API key. API use is billed separately from a ChatGPT subscription.',
    llama: 'You’ll need Meta API access with its own key and billing.',
    local: 'The recommended setup uses a compatible NVIDIA GPU. The model and its components download separately.',
  };
  const choice = $('#model-choice');
  const need = $('#model-need');
  if (choice && need) {
    choice.value = 'gemini';
    need.textContent = needs.gemini;
    choice.addEventListener('change', () => flip([need], () => { need.textContent = needs[choice.value]; }));
  }

  // FAQ: one card open at a time
  const cards = $$('.card');
  cards.forEach((card) => {
    const button = $('.card__toggle', card);
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') !== 'true';
      cards.forEach((other) => {
        const on = opening && other === card;
        other.classList.toggle('is-open', on);
        $('.card__toggle', other).setAttribute('aria-expanded', String(on));
      });
    });
  });

  // Bug coupon: fold the version fields into the issue body
  const coupon = $('.coupon');
  if (coupon) {
    coupon.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = $('#bug-title').value.trim();
      const body = [
        $('#bug-body').value.trim(),
        '',
        `Version: ${$('#bug-version').value.trim() || 'not given'}`,
        `Windows: ${$('#bug-windows').value.trim() || 'not given'}`,
      ].join('\n');
      const url = new URL(coupon.action);
      url.searchParams.set('title', title);
      url.searchParams.set('body', body);
      window.open(url.toString(), '_blank', 'noopener');
    });
  }

  // Entrances: once, as each part comes into view
  $$('.prose > h2, .prose > figure, .start-content > :is(section, aside) h2, .start-content figure').forEach((el) => el.setAttribute('data-reveal', ''));
  $$('.wall__grid > li').forEach((el, i) => { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', `${(i % 4) * 70}ms`); });
  $$('.sheet__group').forEach((el, i) => { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', `${120 + i * 80}ms`); });
  const targets = $$('[data-reveal], [data-grow]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
})();
