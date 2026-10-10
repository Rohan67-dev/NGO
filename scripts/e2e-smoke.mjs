// Live end-to-end journey through the Vite dev-server proxy (same path the browser uses).
const BASE = process.argv[2] || 'http://localhost:5173/api';
let pass = 0, fail = 0;
const results = [];

async function api(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  const text = await res.text();
  if (raw) return { status: res.status, text };
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { text }; }
  return { status: res.status, data: json.data, message: json.message, json };
}

function check(name, cond, detail = '') {
  if (cond) { pass++; results.push(`PASS  ${name}`); }
  else { fail++; results.push(`FAIL  ${name} ${detail}`); }
}

const addr = { fullName: 'E2E Customer', phone: '+91 90000 11111', addressLine1: '12 MG Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' };

// ---------------- Customer journey ----------------
const site = await api('GET', '/site/info');
check('C01 site info served via proxy', site.status === 200 && !!site.data.name);
const ann = await api('GET', '/announcements');
check('C02 announcement banner content (demo-labelled)', ann.status === 200 && ann.data[0]?.title === 'Demo store');
const cats = await api('GET', '/categories');
check('C03 categories with product counts', cats.status === 200 && cats.data.length >= 3 && cats.data[0].productCount != null);
const featured = await api('GET', '/products/featured');
check('C04 featured products', featured.status === 200 && featured.data.length > 0);
const search = await api('GET', '/products?query=bamboo&sortBy=price&sortDir=asc');
check('C05 search finds bamboo product', search.data?.content?.[0]?.name?.toLowerCase().includes('bamboo'));
const filtered = await api('GET', `/products?categoryId=${cats.data[0].id}&maxPrice=700&inStock=true`);
check('C06 category + price + stock filters', filtered.status === 200 && filtered.data.content.every(p => p.categoryId === cats.data[0].id && (p.discountPrice ?? p.price) <= 700 && p.stockQuantity > 0));
const empty = await api('GET', '/products?query=%25%27%22%3Cscript%3E');
check('C07 special-character search returns empty, no error', empty.status === 200 && empty.data.totalElements === 0);
const slug = featured.data[0].slug;
const detail = await api('GET', `/products/${slug}`);
check('C08 product detail', detail.status === 200 && detail.data.slug === slug);
const related = await api('GET', `/products/${slug}/related`);
check('C09 related products', related.status === 200 && Array.isArray(related.data));
check('C10 unknown product -> 404', (await api('GET', '/products/no-such-thing')).status === 404);

check('C11 guest add-to-cart -> 401 (UI redirects to login)', (await api('POST', '/cart/items', { body: { productId: detail.data.id, quantity: 1 } })).status === 401);

const email = `e2e${Date.now()}@test.org`;
const reg = await api('POST', '/auth/register', { body: { firstName: 'E2E', lastName: 'Customer', email, password: 'secret123', phone: '+91 90000 11111' } });
check('C12 register', reg.status === 200 && !!reg.data.token);
const login = await api('POST', '/auth/login', { body: { email: email.toUpperCase(), password: 'secret123' } });
check('C13 login (case-insensitive email)', login.status === 200);
const tok = login.data.token;
check('C14 /auth/me', (await api('GET', '/auth/me', { token: tok })).data.email === email);

const wishAdd = await api('POST', `/wishlist/${detail.data.id}`, { token: tok });
const wish = await api('GET', '/wishlist', { token: tok });
check('C15 wishlist add + list', wishAdd.status === 200 && wish.data.some(p => p.id === detail.data.id));

const add = await api('POST', '/cart/items', { token: tok, body: { productId: detail.data.id, quantity: 1 } });
check('C16 add to cart', add.status === 200 && add.data.totalItems === 1);
const itemId = add.data.items[0].id;
const unit = add.data.items[0].unitPrice;
const expectedUnit = detail.data.discountPrice ?? detail.data.price;
check('C17 cart charges the effective (discount) price', unit === expectedUnit, `${unit} vs ${expectedUnit}`);
const upd = await api('PUT', `/cart/items/${itemId}?quantity=2`, { token: tok });
check('C18 update quantity + totals recalculated', upd.data.totalItems === 2 && Math.abs(upd.data.subtotal - unit * 2) < 0.001);
const tooMany = await api('PUT', `/cart/items/${itemId}?quantity=9999`, { token: tok });
check('C19 quantity above stock rejected with message', tooMany.status === 400 && /available|Maximum/.test(tooMany.message));
check('C20 cart totals = subtotal + shipping + tax', Math.abs(upd.data.totalAmount - (upd.data.subtotal + upd.data.shippingAmount + upd.data.taxAmount)) < 0.001);

const badOrder = await api('POST', '/orders', { token: tok, body: { shippingAddress: { ...addr, phone: 'abc' } } });
check('C21 checkout validates address', badOrder.status === 400);
const order = await api('POST', '/orders', { token: tok, body: { shippingAddress: addr, saveAddress: true } });
check('C22 order created server-side (PENDING)', order.status === 200 && order.data.orderStatus === 'PENDING' && order.data.paymentStatus === 'PENDING');
check('C23 order total matches cart total', Math.abs(order.data.totalAmount - upd.data.totalAmount) < 0.001);
const again = await api('POST', '/orders', { token: tok, body: { shippingAddress: addr } });
check('C24 double-submit reuses the same order', again.data.id === order.data.id);
const cfg = await api('GET', '/payments/config', { token: tok });
check('C25 payment config reports gateway not configured', cfg.data.onlinePaymentAvailable === false);
const init = await api('POST', `/payments/initiate/${order.data.id}`, { token: tok });
check('C26 payment start refused honestly (503) without credentials', init.status === 503 && /not configured/i.test(init.message));
const fake = await api('POST', '/payments/verify', { token: tok, body: { orderId: order.data.id, razorpayOrderId: 'rzp_ord_1', razorpayPaymentId: 'pay_demo_1', razorpaySignature: 'sig_demo_1' } });
const after = await api('GET', `/orders/${order.data.id}`, { token: tok });
check('C27 old demo "fake verify" no longer marks paid', fake.status >= 400 && after.data.paymentStatus !== 'PAID');
check('C28 cart kept until payment succeeds', (await api('GET', '/cart', { token: tok })).data.totalItems === 2);
const addrs = await api('GET', '/addresses', { token: tok });
check('C29 address saved to address book', addrs.data.length === 1 && addrs.data[0].isDefault === true);
const hist = await api('GET', '/orders', { token: tok });
check('C30 order history lists the order with item snapshot', hist.data[0].id === order.data.id && hist.data[0].items[0].productName === detail.data.name);

// another customer cannot see it
const other = await api('POST', '/auth/register', { body: { firstName: 'O', lastName: 'X', email: `other${Date.now()}@test.org`, password: 'secret123' } });
check('C31 other customer cannot read the order (IDOR)', (await api('GET', `/orders/${order.data.id}`, { token: other.data.token })).status === 404);
check('C32 other customer cannot cancel the order', (await api('POST', `/orders/${order.data.id}/cancel`, { token: other.data.token })).status === 404);
check('C33 customer cannot call admin APIs', (await api('GET', '/admin/orders', { token: tok })).status === 403);

const prof = await api('PUT', '/auth/me', { token: tok, body: { firstName: 'Edited', lastName: 'Customer', phone: '+91 90000 22222' } });
check('C34 profile update', prof.data.firstName === 'Edited');
const contact = await api('POST', '/contact', { body: { name: 'Visitor', email: 'v@test.org', subject: 'Bulk order', message: 'Do you take bulk orders?' } });
check('C35 contact form submit', contact.status === 200);

// ---------------- Admin journey ----------------
const admin = (await api('POST', '/auth/login', { body: { email: 'admin@ngo.org', password: 'admin123' } })).data.token;
const dash = await api('GET', '/admin/analytics', { token: admin });
check('A01 dashboard analytics from DB', dash.status === 200 && dash.data.totalOrders >= 1 && dash.data.pendingPaymentOrders >= 1 && dash.data.newContactMessages >= 1);
const plist = await api('GET', '/admin/products?size=100', { token: admin });
check('A02 admin product list (all statuses)', plist.status === 200 && plist.data.totalElements >= 4);
const p0 = plist.data.content.find(p => p.id === detail.data.id);
const edited = await api('PUT', `/admin/products/${p0.id}`, { token: admin, body: {
  name: p0.name, description: p0.description, shortDescription: p0.shortDescription, price: p0.price, discountPrice: p0.discountPrice,
  sku: p0.sku, stockQuantity: 5, categoryId: p0.categoryId, impactDescription: p0.impactDescription, featured: p0.featured,
  imageUrls: p0.imageUrls, material: 'Jute', dimensions: '40 x 35 cm', colour: 'Natural', hsnCode: '4202', gstRate: 5 } });
check('A03 edit product (stock + catalogue fields)', edited.status === 200 && edited.data.material === 'Jute');
const pub = await api('GET', `/products/${p0.slug}`);
check('A04 storefront reflects admin edit', pub.data.stockQuantity === 5 && pub.data.dimensions === '40 x 35 cm' && pub.data.gstRate === 5);
const hide = await api('PUT', `/admin/products/${p0.id}`, { token: admin, body: { ...edited.data, status: 'INACTIVE', categoryId: p0.categoryId } });
check('A05 deactivate product', hide.data.status === 'INACTIVE');
check('A06 inactive product hidden from storefront', (await api('GET', `/products/${p0.slug}`)).status === 404);
const custCart = await api('GET', '/cart', { token: tok });
check('A07 customer cart flags now-unavailable item', custCart.data.hasUnavailableItems === true);
check('A08 checkout blocked for unavailable item', (await api('POST', '/orders', { token: tok, body: { shippingAddress: addr } })).status === 400);
await api('PUT', `/admin/products/${p0.id}`, { token: admin, body: { ...edited.data, status: 'ACTIVE', categoryId: p0.categoryId } });
check('A09 reactivate product', (await api('GET', `/products/${p0.slug}`)).status === 200);

const newCat = await api('POST', '/admin/categories', { token: admin, body: { name: `Warli Art ${Date.now()}`, description: 'Hand-painted Warli items' } });
check('A10 create category', newCat.status === 200);
const created = await api('POST', '/admin/products', { token: admin, body: { name: 'E2E Warli Wall Plate', price: 650, sku: `E2E-${Date.now()}`, stockQuantity: 2, categoryId: newCat.data.id, imageUrls: [] } });
check('A11 create product in new category', created.status === 200 && created.data.status === 'ACTIVE');
check('A12 new product searchable on storefront', (await api('GET', '/products?query=wall%20plate')).data.totalElements >= 1);
check('A13 non-empty category delete refused (409)', (await api('DELETE', `/admin/categories/${newCat.data.id}`, { token: admin })).status === 409);
const del = await api('DELETE', `/admin/products/${created.data.id}`, { token: admin });
check('A14 never-ordered product deleted', del.status === 200 && /deleted/.test(del.message));
check('A15 empty category delete allowed', (await api('DELETE', `/admin/categories/${newCat.data.id}`, { token: admin })).status === 200);
const archived = await api('DELETE', `/admin/products/${p0.id}`, { token: admin });
check('A16 ordered product archived, not deleted', archived.status === 200 && /archived/.test(archived.message));
check('A17 order history intact after archive', (await api('GET', '/orders', { token: tok })).data[0].items[0].productName === p0.name);
await api('PUT', `/admin/products/${p0.id}`, { token: admin, body: { ...edited.data, status: 'ACTIVE', categoryId: p0.categoryId } });

const csv = 'SKU,Product Title,Category,Selling Price,GST %,HSN Code,Material,Size,Stock,Artisan Cluster\n'
  + `E2E-CSV-${Date.now()},Warli Painted Bamboo Tray,Warli Merchandise,"1,150",12%,4602,Bamboo,30x20 cm,4,Dahanu\n`;
const fd = new FormData(); fd.append('file', new Blob([csv], { type: 'text/csv' }), 'catalogue.csv');
const imp = await api('POST', '/admin/products/import?dryRun=false', { token: admin, body: fd });
check('A18 CSV catalogue import', imp.status === 200 && imp.data.created === 1 && imp.data.extraColumns.includes('Artisan Cluster'));
const tray = await api('GET', '/products?query=bamboo%20tray');
check('A19 imported product live with catalogue fields', tray.data.content[0]?.price === 1150 && tray.data.content[0]?.extraAttributes?.['Artisan Cluster'] === 'Dahanu');
const exp = await api('GET', '/admin/products/export', { token: admin, raw: true });
check('A20 CSV export', exp.status === 200 && exp.text.startsWith('Sr No,SKU'));

const orders = await api('GET', '/admin/orders?query=' + encodeURIComponent(email), { token: admin });
check('A21 admin order search by customer email', orders.data.content.some(o => o.id === order.data.id));
const ship = await api('PUT', `/admin/orders/${order.data.id}/status`, { token: admin, body: { orderStatus: 'SHIPPED', trackingNumber: 'X1' } });
check('A22 unpaid order cannot be shipped', ship.status === 400);
const cancel = await api('PUT', `/admin/orders/${order.data.id}/status`, { token: admin, body: { orderStatus: 'CANCELLED' } });
check('A23 admin cancels unpaid order', cancel.status === 200 && cancel.data.orderStatus === 'CANCELLED');
check('A24 customer sees cancelled status', (await api('GET', `/orders/${order.data.id}`, { token: tok })).data.orderStatus === 'CANCELLED');

const metric = await api('POST', '/admin/impact/metrics', { token: admin, body: { title: 'E2E Metric', value: 42, unit: 'People', icon: 'Users', active: true } });
check('A25 add impact metric (was 404 before repair)', metric.status === 200);
check('A26 metric visible publicly', (await api('GET', '/impact/metrics')).data.some(m => m.title === 'E2E Metric'));
await api('DELETE', `/admin/impact/metrics/${metric.data.id}`, { token: admin });
const story = await api('POST', '/admin/stories', { token: admin, body: { title: 'E2E Draft', excerpt: 'x', content: 'y', published: false } });
check('A27 draft story hidden publicly', (await api('GET', `/stories/${story.data.slug}`)).status === 404);
const pubStory = await api('PUT', `/admin/stories/${story.data.id}`, { token: admin, body: { title: 'E2E Draft', excerpt: 'x', content: 'y', published: true } });
check('A28 publishing makes it public', pubStory.status === 200 && (await api('GET', `/stories/${story.data.slug}`)).status === 200);
await api('DELETE', `/admin/stories/${story.data.id}`, { token: admin });
const camp = await api('POST', '/admin/campaigns', { token: admin, body: { title: 'E2E Campaign', description: 'd', targetAmount: 1000, status: 'ACTIVE' } });
check('A29 campaign create + public detail page data', camp.status === 200 && (await api('GET', `/campaigns/${camp.data.slug}`)).status === 200);
await api('DELETE', `/admin/campaigns/${camp.data.id}`, { token: admin });
const msgs = await api('GET', '/admin/contact-messages?status=NEW', { token: admin });
check('A30 contact inbox shows message', msgs.data.content.some(m => m.subject === 'Bulk order'));

// ---------------- Errors / hardening ----------------
const bad = await api('GET', '/products?sortBy=hacked');
check('R01 invalid sort -> 400 without internals', bad.status === 400 && !/hibernate|org\./i.test(bad.message));
const nf = await api('GET', '/nope');
check('R02 unknown endpoint -> JSON 401/404 (no stack trace)', [401, 404].includes(nf.status) && !/Exception/.test(JSON.stringify(nf.json)));
check('R03 webhook rejected while secret unset', (await api('POST', '/payments/webhook', { body: {} })).status === 503);

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
