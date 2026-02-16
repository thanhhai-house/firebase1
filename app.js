const STORAGE_KEY_PRODUCTS = 'oem_products';
const STORAGE_KEY_SALES = 'oem_sales_history';

const initialProducts = [
  {
    code: 'SP-001',
    name: 'Bugi đánh lửa',
    image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
    oem: ['06A905115D', '101000063AA']
  },
  {
    code: 'SP-002',
    name: 'Lọc dầu động cơ',
    image: 'https://images.unsplash.com/photo-1613214150403-b48f0abf8ee9?auto=format&fit=crop&w=600&q=80',
    oem: ['90915-YZZE1', '04152-37010']
  }
];

const $ = (id) => document.getElementById(id);

function getProducts() {
  const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  return raw ? JSON.parse(raw) : initialProducts;
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

function getSalesHistory() {
  const raw = localStorage.getItem(STORAGE_KEY_SALES);
  return raw ? JSON.parse(raw) : [];
}

function saveSalesHistory(history) {
  localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(history));
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $(btn.dataset.tab).classList.add('active');
    });
  });
}

function renderOverview() {
  const term = $('oemSearch').value.trim().toLowerCase();
  const products = getProducts();
  const matches = term
    ? products.filter((p) => p.oem.some((item) => item.toLowerCase().includes(term)))
    : products;

  const container = $('overviewResults');
  if (!matches.length) {
    container.innerHTML = '<p>Không tìm thấy mã OEM thay thế phù hợp.</p>';
    return;
  }

  container.innerHTML = matches
    .map(
      (p) => `
      <article class="card">
        <img class="product-thumb" src="${p.image}" alt="${p.name}" />
        <strong>${p.name}</strong>
        <div class="small">Mã SP: ${p.code}</div>
        <div>${p.oem.map((item) => `<span class="oem-chip">${item}</span>`).join('')}</div>
        <button class="primary" data-image="${p.image}" style="margin-top:8px;">Xem ảnh popup</button>
      </article>
    `
    )
    .join('');

  container.querySelectorAll('button[data-image]').forEach((btn) => {
    btn.addEventListener('click', () => openPopup(btn.dataset.image));
  });
}

function renderSales() {
  const products = getProducts();
  const list = $('salesProductList');
  if (!products.length) {
    list.innerHTML = '<p>Chưa có sản phẩm. Vui lòng nhập hàng trước.</p>';
    return;
  }

  list.innerHTML = products
    .map(
      (p, idx) => `
      <label class="sales-item">
        <input type="checkbox" data-role="pick" data-code="${p.code}" />
        <span>
          <strong>${p.name}</strong>
          <span class="small"> (${p.code})</span>
        </span>
        <input type="number" data-role="qty" data-code="${p.code}" min="1" value="1" aria-label="Số lượng ${idx + 1}" />
      </label>
    `
    )
    .join('');
}

function renderHistory() {
  const history = getSalesHistory();
  const list = $('historyList');

  if (!history.length) {
    list.innerHTML = '<p>Chưa có lịch sử bán hàng.</p>';
    return;
  }

  list.innerHTML = history
    .slice()
    .reverse()
    .map((order) => {
      const items = order.items
        .map((item) => `<li>${item.name} (${item.code}) - SL: ${item.qty}</li>`)
        .join('');
      return `
        <article class="history-item">
          <div><strong>Đơn #${order.id}</strong></div>
          <div class="small">${new Date(order.createdAt).toLocaleString('vi-VN')}</div>
          <ul>${items}</ul>
        </article>
      `;
    })
    .join('');
}

function addOemField(value = '') {
  const row = document.createElement('div');
  row.className = 'inline-between';
  row.innerHTML = `
    <input class="oem-input" placeholder="Mã OEM thay thế" value="${value}" />
    <button type="button" class="remove-oem">Xóa</button>
  `;
  row.querySelector('.remove-oem').addEventListener('click', () => row.remove());
  $('oemFields').appendChild(row);
}

function handleInventorySubmit(e) {
  e.preventDefault();

  const code = $('productCode').value.trim();
  const name = $('productName').value.trim();
  const image = $('productImage').value.trim();
  const oem = [...document.querySelectorAll('.oem-input')]
    .map((i) => i.value.trim())
    .filter(Boolean);

  if (!code || !name || !image || !oem.length) {
    $('inventoryMessage').textContent = 'Vui lòng nhập đủ thông tin và ít nhất 1 mã OEM thay thế.';
    return;
  }

  const products = getProducts();
  const existedIndex = products.findIndex((p) => p.code === code);
  const payload = { code, name, image, oem };

  if (existedIndex >= 0) {
    products[existedIndex] = payload;
  } else {
    products.push(payload);
  }

  saveProducts(products);
  $('inventoryMessage').textContent = 'Đã lưu sản phẩm và mã OEM thay thế.';

  $('inventoryForm').reset();
  $('oemFields').innerHTML = '';
  addOemField();

  renderOverview();
  renderSales();
}

function handleSaveOrder() {
  const picks = [...document.querySelectorAll('input[data-role="pick"]:checked')];
  if (!picks.length) {
    $('salesMessage').textContent = 'Hãy chọn ít nhất một sản phẩm cho đơn hàng.';
    return;
  }

  const productsByCode = Object.fromEntries(getProducts().map((p) => [p.code, p]));
  const items = picks.map((pick) => {
    const code = pick.dataset.code;
    const qtyInput = document.querySelector(`input[data-role="qty"][data-code="${code}"]`);
    return {
      code,
      name: productsByCode[code]?.name || code,
      qty: Math.max(1, Number(qtyInput.value) || 1)
    };
  });

  const history = getSalesHistory();
  const order = {
    id: history.length + 1,
    createdAt: new Date().toISOString(),
    items
  };
  history.push(order);
  saveSalesHistory(history);

  $('salesMessage').textContent = `Đã lưu đơn hàng #${order.id} (${items.length} sản phẩm).`;
  document.querySelectorAll('input[data-role="pick"]').forEach((el) => (el.checked = false));
  renderHistory();
}

function openPopup(imageUrl) {
  $('popupImage').src = imageUrl;
  $('imagePopup').classList.remove('hidden');
}

function closePopup() {
  $('imagePopup').classList.add('hidden');
}

function init() {
  if (!localStorage.getItem(STORAGE_KEY_PRODUCTS)) {
    saveProducts(initialProducts);
  }

  setupTabs();
  $('oemSearch').addEventListener('input', renderOverview);
  $('addOemFieldBtn').addEventListener('click', () => addOemField());
  $('inventoryForm').addEventListener('submit', handleInventorySubmit);
  $('saveOrderBtn').addEventListener('click', handleSaveOrder);
  $('closePopup').addEventListener('click', closePopup);
  $('imagePopup').addEventListener('click', (e) => {
    if (e.target.id === 'imagePopup') closePopup();
  });

  addOemField();
  renderOverview();
  renderSales();
  renderHistory();
}

init();
