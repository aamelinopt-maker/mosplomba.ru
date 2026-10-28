'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('ru-RU', {minimumFractionDigits:2, maximumFractionDigits:2}).format(value);
const products = [
 {id:'optima', name:'Оптима 240', description:'Номерная пластиковая пломба', image:'plastic', category:'plastic', price:5.05, bulk:3.40, terms:'оптима optima 240 пластиковая красная белая'},
 {id:'pn', name:'ПН 12 × 27 мм', description:'Гарантийная пломба-наклейка', image:'labels', category:'labels', price:4.05, bulk:2.45, terms:'пн pn 12 27 наклейка гарантийная'},
 {id:'ekotrek', name:'ЭКОтрэк 255', description:'Номерная контрольная пломба', image:'yellow', category:'plastic', price:3.70, bulk:2.40, terms:'экотрэк экотрек ekotrek 255 пластиковая желтая жёлтая'}
];
const unitPrice = (p, qty) => qty >= 10000 ? p.bulk : p.price;
const normalizeQty = value => Math.max(10, Math.min(1000000, Math.round(Number(value) || 10)));
let cart = {};
try { const stored = JSON.parse(localStorage.getItem('mosplomba-cart') || '{}'); for (const p of products) if (stored?.[p.id]) cart[p.id] = normalizeQty(stored[p.id]); } catch {}
let toastTimeout;
function toast(message) { $('.toast').textContent = message; $('.toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('.toast').classList.remove('show'), 3200); }
function productMarkup(p) { return `<article class="product" data-id="${p.id}"><button type="button" class="product-image" data-zoom="${p.id}" aria-label="Рассмотреть ${p.name} крупным планом"><img src="assets/${p.image}.png" width="1536" height="1024" loading="lazy" alt="${p.name} — ${p.description.toLowerCase()}"><span class="zoom-hint" aria-hidden="true"><svg aria-hidden="true" focusable="false"><use href="#i-zoom"/></svg></span></button><h3>${p.name}</h3><p class="product-description">${p.description}</p><div class="price"><span>${money(p.price)}</span> <small>₽ / шт.</small></div><p class="price-note">Партия от 10 шт. · с НДС</p><p class="wholesale"><b>${money(p.bulk)} ₽ / шт.</b> при заказе от 10 000 шт.</p><p class="product-total" aria-live="polite">За <span>10</span> шт. — <strong>${money(p.price * 10)} ₽</strong></p><div class="product-actions"><div class="stepper"><button type="button" data-step="-1" aria-label="Уменьшить количество ${p.name}" disabled><svg aria-hidden="true" focusable="false"><use href="#i-minus"/></svg></button><input type="number" min="10" max="1000000" value="10" aria-label="Количество ${p.name}"><button type="button" data-step="1" aria-label="Увеличить количество ${p.name}"><svg aria-hidden="true" focusable="false"><use href="#i-plus"/></svg></button></div><button type="button" class="button primary add-cart"><svg aria-hidden="true" focusable="false"><use href="#i-cart"/></svg>В корзину</button></div></article>`; }
$('#product-grid').innerHTML = products.map(productMarkup).join('');
function updateCard(card) {
 const p = products.find(item => item.id === card.dataset.id);
 const input = $('input',card), qty = normalizeQty(input.value);
 input.value = qty;
 $('.price span',card).textContent = money(unitPrice(p,qty));
 $('.product-total span',card).textContent = qty.toLocaleString('ru-RU');
 $('.product-total strong',card).textContent = `${money(unitPrice(p,qty)*qty)} ₽`;
 $('[data-step="-1"]',card).disabled = qty <= 10;
 $('[data-step="1"]',card).disabled = qty >= 1000000;
}
function saveCart() { try { localStorage.setItem('mosplomba-cart', JSON.stringify(cart)); } catch {} updateCart(); }
function updateCart() {
 const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0); $('#cart-count').textContent = count > 99 ? '99+' : count;
 $('.cart-trigger').setAttribute('aria-label', `Открыть корзину: ${count} шт.`);
 const items = products.filter(p => cart[p.id]);
 $('#cart-items').innerHTML = items.length ? items.map(p => `<div class="cart-row"><img src="assets/${p.image}.png" alt="${p.name}" width="90" height="72"><div><h3>${p.name}</h3><p>${cart[p.id]} шт. × ${money(unitPrice(p, cart[p.id]))} ₽</p><button data-remove="${p.id}">Удалить</button></div><strong>${money(unitPrice(p, cart[p.id]) * cart[p.id])} ₽</strong></div>`).join('') : '<p class="empty-cart">В корзине пока пусто. Выберите подходящие пломбы в каталоге.</p>';
 $('#cart-total').textContent = `${money(items.reduce((sum,p) => sum + unitPrice(p,cart[p.id]) * cart[p.id],0))} ₽`;
 $('#cart-checkout').disabled = items.length === 0;
}
$('#product-grid').addEventListener('click', event => {
 const card = event.target.closest('.product'); if (!card) return;
 const p = products.find(item => item.id === card.dataset.id), input = $('input', card);
 const step = event.target.closest('[data-step]');
 if (event.target.closest('[data-zoom]')) { $('#image-preview').src = `assets/${p.image}.png`; $('#image-preview').alt = `${p.name} — изображение модели`; $('#image-title').textContent = p.name; $('#image-dialog').showModal(); }
 if (step) { input.value = normalizeQty(Number(input.value) + Number(step.dataset.step)); updateCard(card); }
 if (event.target.closest('.add-cart')) { const qty = normalizeQty(input.value); input.value = qty; const previous = cart[p.id] || 0; cart[p.id] = normalizeQty(previous + qty); const added = cart[p.id] - previous; updateCard(card); saveCart(); toast(added ? `${p.name}: ${added} шт. добавлено в корзину` : 'Для тиража более 1 000 000 шт. свяжитесь с менеджером'); $('#cart-count').classList.remove('cart-bump'); requestAnimationFrame(() => $('#cart-count').classList.add('cart-bump')); }
});
$('#product-grid').addEventListener('change', event => { if (event.target.matches('input')) updateCard(event.target.closest('.product')); });
$('.cart-trigger').addEventListener('click', () => $('#cart-dialog').showModal());
$('#cart-items').addEventListener('click', event => { const button = event.target.closest('[data-remove]'); if (button) { delete cart[button.dataset.remove]; saveCart(); } });
$$('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
function cartSummary() { return products.filter(p => cart[p.id]).map(p => `${p.name} — ${cart[p.id]} шт., ${money(unitPrice(p,cart[p.id]))} ₽/шт.`).join('\n'); }
const scrollToSection = element => element.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
$('#cart-checkout').addEventListener('click', () => { $('#cart-dialog').close(); $('#task').value = `Прошу рассчитать заказ:\n${cartSummary()}`; $('#quantity').value = Object.values(cart).reduce((a,b) => a+b,0); scrollToSection($('#request')); setTimeout(() => $('#contact').focus({preventScroll:true}), 450); });
$$('[data-task]').forEach(link => link.addEventListener('click', () => { $('#task').value = link.dataset.task; }));
function filterProducts(predicate, label = '') { let count = 0; $$('.product').forEach(card => { const p = products.find(p => p.id === card.dataset.id); card.hidden = !predicate(p); if (!card.hidden) count++; }); $('.no-results').hidden = count > 0; $('.reset-filter').hidden = !label; $('#search-status').hidden = !label; $('#search-status').textContent = label ? `${label} · Найдено: ${count}` : ''; }
$('.search').addEventListener('submit', event => { event.preventDefault(); const query = $('#search-input').value.trim().toLocaleLowerCase('ru'); filterProducts(p => query.split(/\s+/).every(term => p.terms.includes(term)), query ? `Поиск: ${$('#search-input').value.trim()}` : ''); scrollToSection($('#products')); });
$$('[data-category]').forEach(link => link.addEventListener('click', () => filterProducts(p => p.category === link.dataset.category, link.dataset.category === 'plastic' ? 'Пластиковые пломбы' : 'Пломбы-наклейки')));
$('.reset-filter').addEventListener('click', () => { filterProducts(() => true); $('#search-input').value = ''; });
$('.menu-toggle').addEventListener('click', () => { const open = $('.navigation').classList.toggle('open'); $('.menu-toggle').setAttribute('aria-expanded',String(open)); });
$$('.navigation a').forEach(a => a.addEventListener('click', () => { $('.navigation').classList.remove('open'); $('.menu-toggle').setAttribute('aria-expanded','false'); }));
$('#attachment').addEventListener('change', () => { const file = $('#attachment').files[0]; if (file && file.size > 20 * 1024 * 1024) { $('#attachment').value = ''; toast('Выберите файл размером до 20 МБ'); } $('#attachment-name').textContent = $('#attachment').files[0]?.name || 'Прикрепить список или фото'; });
$('#contact').addEventListener('input', () => $('#contact').setCustomValidity(''));
$('#request-form').addEventListener('submit', event => {
 event.preventDefault(); const contact = $('#contact').value.trim();
 const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || /^[+\d\s()\-]+$/.test(contact) && contact.replace(/\D/g,'').length >= 10;
 if (!valid) { $('#contact').setCustomValidity('Укажите корректный email или телефон (не менее 10 цифр).'); $('#contact').reportValidity(); return; }
 const lines = ['Здравствуйте! Прошу подобрать пломбы и рассчитать заказ.', '', `Задача: ${$('#task').value.trim()}`, `Количество: ${$('#quantity').value || 'уточнить'}`, `Контакт: ${contact}`];
 if (Object.keys(cart).length && !$('#task').value.includes('Прошу рассчитать заказ:')) lines.push('', 'Выбранные товары:', cartSummary());
 if ($('#attachment').files[0]) lines.push('', `Приложение: ${$('#attachment').files[0].name} (прикрепить к письму)`);
 const body = lines.join('\n'); $('#request-preview').value = body; $('#send-email').href = `mailto:sales@mosplomba.ru?subject=${encodeURIComponent('Подбор пломб и расчёт заказа')}&body=${encodeURIComponent(body)}`; $('#request-dialog').showModal();
});
$('#copy-request').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#request-preview').value); $('#copy-request').textContent = 'Скопировано'; setTimeout(() => $('#copy-request').textContent = 'Скопировать текст',2000); } catch { $('#request-preview').focus(); $('#request-preview').select(); $('#copy-request').textContent = 'Нажмите Ctrl+C'; } });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
reducedMotion.addEventListener('change', event => { if(event.matches) { document.documentElement.classList.remove('js-motion'); $$('.reveal').forEach(section => section.classList.add('visible')); } });
if (!reducedMotion.matches && 'IntersectionObserver' in window) { document.documentElement.classList.add('js-motion'); const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }),{threshold:.08}); $$('.reveal').forEach(section => observer.observe(section)); }
let scrollQueued = false;
function onScroll() { if (scrollQueued) return; scrollQueued = true; requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; $('.scroll-progress').style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`; $('.header').classList.toggle('scrolled', scrollY > 12); scrollQueued = false; }); }
addEventListener('scroll',onScroll,{passive:true}); onScroll(); updateCart();
const externalLinks = {'data-policy-link':'https://mosplomba.ru/privacy-policy/','data-delivery-link':'https://mosplomba.ru/delivery/','data-contact-link':'https://mosplomba.ru/contacts/','data-document-link':'https://mosplomba.ru/certifications/','data-wb-link':'https://www.wildberries.ru/seller/86654','data-ozon-link':'https://www.ozon.ru/seller/ip-kostina-m-p-484552/'};
for (const [attr,url] of Object.entries(externalLinks)) $$(`[${attr}]`).forEach(a => a.href=url);
$('[data-original="cable"]').href = 'https://mosplomba.ru/catalog/silovye_plomby_zpu/';
