'use client';

const id = 'dish-search-keyboard';

// Keep an editable field focused across the route change. On iPhone the
// keyboard must first be requested synchronously from the user's tap.
export function beginDishSearchFocus() {
  document.getElementById(id)?.remove();
  const input = document.createElement('input');
  input.id = id;
  input.type = 'search';
  input.setAttribute('aria-label', 'ابحث في قائمة الطعام');
  input.tabIndex = -1;
  input.style.cssText = 'position:fixed;top:25%;left:16px;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none;';
  document.body.appendChild(input);
  input.focus({ preventScroll: true });
  const timeout = window.setTimeout(() => input.remove(), 15000);
  input.addEventListener('blur', () => { window.clearTimeout(timeout); input.remove(); }, { once: true });
}

export function finishDishSearchFocus(input) {
  const pending = document.getElementById(id);
  const value = pending?.value || '';
  input?.focus({ preventScroll: true });
  pending?.remove();
  return value;
}
