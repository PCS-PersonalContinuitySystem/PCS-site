/* Progressive enhancements only. Content, downloads, FAQs and image hrefs remain HTML. */
(() => {
  'use strict';
  function initialize() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-navigation');
  if (toggle && nav && window.matchMedia) {
    const narrow = window.matchMedia('(max-width: 879px)');
    const closeMenu = (returnFocus = false) => {
      const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      if (returnFocus && wasOpen) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu(true);
        event.preventDefault();
      }
    });
    document.addEventListener('click', (event) => {
      if (narrow.matches && !nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    const onSize = () => closeMenu();
    if (narrow.addEventListener) narrow.addEventListener('change', onSize);
    else narrow.addListener(onSize);
    closeMenu();
    // With JS unavailable the menu is not collapsed, so links are never inaccessible.
    document.documentElement.classList.add('site-enhanced');
  }

  if (!('HTMLDialogElement' in window) || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
  const links = [...document.querySelectorAll('a[data-image-preview]')];
  if (!links.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'image-preview-dialog';
  dialog.setAttribute('aria-labelledby', 'image-preview-title');
  const toolbar = document.createElement('div');
  toolbar.className = 'image-preview-toolbar';
  const title = document.createElement('h2');
  title.id = 'image-preview-title';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'image-preview-close';
  close.textContent = 'Close';
  close.setAttribute('aria-label', 'Close image preview');
  const original = document.createElement('a');
  original.className = 'image-preview-original';
  original.textContent = 'Open full-size image';
  const figure = document.createElement('figure');
  const image = document.createElement('img');
  image.alt = '';
  const caption = document.createElement('figcaption');
  figure.append(image, caption);
  toolbar.append(title, original, close);
  dialog.append(toolbar, figure);
  document.body.append(dialog);
  let opener = null;
  let previousOverflow = '';
  const finish = () => {
    document.body.style.overflow = previousOverflow;
    if (opener) {
      opener.setAttribute('aria-expanded', 'false');
      opener.focus({preventScroll: true});
    }
    image.removeAttribute('src');
    opener = null;
  };
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const first = original, last = close;
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      last.focus(); event.preventDefault();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      first.focus(); event.preventDefault();
    }
  });
  dialog.addEventListener('close', finish);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  for (const link of links) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-expanded', 'false');
    link.addEventListener('click', (event) => {
      // Modified clicks retain ordinary open-in-new-tab/download behavior.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const source = link.querySelector('img');
      if (!source || !source.complete || !source.naturalWidth) return;
      const text = link.closest('figure')?.querySelector('figcaption')?.textContent.trim().replace(/\s+/g, ' ') || source.alt;
      title.textContent = 'PCS interface preview';
      caption.textContent = text;
      image.alt = source.alt;
      image.src = source.currentSrc || source.src;
      original.href = link.href;
      opener = link;
      previousOverflow = document.body.style.overflow;
      try {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        link.setAttribute('aria-expanded', 'true');
        close.focus();
        event.preventDefault();
      } catch (_) {
        // Keep the ordinary image link if the enhancement cannot open.
        opener = null;
        image.removeAttribute('src');
      }
    });
  }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})();
