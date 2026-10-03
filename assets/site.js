/* Progressive enhancements only; content and ordinary links stay in HTML. */
(() => {
 'use strict';
 document.documentElement.classList.add('js');
 const menu = document.querySelector('.menu-button');
 const nav = document.querySelector('#site-nav');
 if (menu && nav) {
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); menu.focus(); } });
 }
 document.querySelectorAll('[data-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role=tab]')];
  const activate = (tab, focus = false) => {
   tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; const panel = document.getElementById(item.getAttribute('aria-controls')); if (panel) panel.hidden = !selected; });
   if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
   tab.addEventListener('click', () => activate(tab));
   tab.addEventListener('keydown', event => { let next = index; if (event.key === 'ArrowRight') next = (index + 1) % tabs.length; else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = tabs.length - 1; else return; event.preventDefault(); activate(tabs[next], true); });
  });
  if (tabs.length) activate(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
 });
 const dialog = document.querySelector('.image-dialog');
 if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('a[data-image-preview]').forEach(link => link.addEventListener('click', event => {
   event.preventDefault(); const image = link.querySelector('img'); const target = dialog.querySelector('img'); target.src = link.href; target.alt = image?.alt || 'PCS application screenshot'; dialog.querySelector('p').textContent = target.alt; dialog.showModal();
  }));
  dialog.querySelector('.image-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
 }
})();
