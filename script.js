const STORAGE_KEY = 'inventory-manager-data-v1';

const defaultData = {
  products: [],
  suppliers: [{ id: crypto.randomUUID(), name: 'Nhà cung cấp mặc định', contact: '0123456789' }],
  transactions: []
};

const state = loadState();

initMenu();
renderAll();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  try {
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initMenu() {
  const buttons = document.querySelectorAll('.menu-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelector('.menu-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      document.querySelector('.view.active')?.classList.remove('active');
      document.getElementById(btn.dataset.view).classList.add('active');
    });
  });
}

function renderAll() {
  renderOverview();
  renderInventory();
  renderInbound();
  renderOutbound();
  renderSuppliers();
  saveState();
}

function renderOverview() {
  const totalStock = state.products.reduce((sum, p) => sum + p.stock, 0);
  const totalProducts = state.products.length;
  const totalSuppliers = state.suppliers.length;
  const totalMoves = state.transactions.length;

  document.getElementById('overview').innerHTML = `
    <h2>Tổng quan</h2>
    <div class="grid">
      <article class="kpi"><div class="value">${totalProducts}</div><div class="label">Sản phẩm</div></article>
      <article class="kpi"><div class="value">${totalStock}</div><div class="label">Tồn kho</div></article>
      <article class="kpi"><div class="value">${totalSuppliers}</div><div class="label">Nhà cung cấp</div></article>
      <article class="kpi"><div class="value">${totalMoves}</div><div class="label">Lượt nhập/xuất</div></article>
    </div>
  `;
}

function renderInventory() {
  const root = document.getElementById('inventory');
  root.innerHTML = `
    <h2>Tồn kho</h2>
    <div class="card">
      <h3>Thêm sản phẩm</h3>
      <form id="product-form" class="grid">
        <label>Tên sản phẩm<input name="name" required /></label>
        <label>Thương hiệu<input name="brand" required /></label>
        <label>Phân loại<input name="category" required /></label>
        <label>Vị trí<input name="location" required /></label>
        <label>Tồn ban đầu<input name="stock" type="number" min="0" value="0" required /></label>
        <label>Ảnh sản phẩm<input name="image" type="file" accept="image/*" /></label>
      </form>
      <div class="actions">
        <button id="add-product">Thêm sản phẩm</button>
      </div>
    </div>

    <div class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ảnh</th><th>Tên</th><th>Thương hiệu</th><th>Phân loại</th><th>Vị trí</th><th>Tồn kho</th><th>Hành động</th>
          </tr>
        </thead>
        <tbody id="product-tbody"></tbody>
      </table>
    </div>
  `;

  const tbody = root.querySelector('#product-tbody');
  const template = document.getElementById('product-row-template');
  for (const product of state.products) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector('.product-thumb').src = product.image || '';
    row.querySelector('.name').textContent = product.name;
    row.querySelector('.brand').textContent = product.brand;
    row.querySelector('.category').textContent = product.category;
    row.querySelector('.location').textContent = product.location;
    row.querySelector('.stock').textContent = String(product.stock);
    row.querySelector('.remove').addEventListener('click', () => {
      state.products = state.products.filter((p) => p.id !== product.id);
      renderAll();
    });
    tbody.appendChild(row);
  }

  root.querySelector('#add-product').addEventListener('click', async () => {
    const form = root.querySelector('#product-form');
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const brand = String(formData.get('brand') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const location = String(formData.get('location') || '').trim();
    const stock = Number(formData.get('stock') || 0);
    const imageFile = form.querySelector('input[name="image"]').files[0];

    if (!name || !brand || !category || !location || Number.isNaN(stock) || stock < 0) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm hợp lệ.');
      return;
    }

    const image = imageFile ? await fileToDataUrl(imageFile) : '';
    state.products.push({ id: crypto.randomUUID(), name, brand, category, location, stock, image });
    renderAll();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderInbound() {
  const root = document.getElementById('inbound');
  root.innerHTML = renderMoveTemplate('in', 'Nhập kho');
  attachMoveHandlers(root, 'in');
}

function renderOutbound() {
  const root = document.getElementById('outbound');
  root.innerHTML = renderMoveTemplate('out', 'Xuất kho');
  attachMoveHandlers(root, 'out');
}

function renderMoveTemplate(type, title) {
  const options = state.products.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
  const rows = state.transactions
    .filter((t) => t.type === type)
    .map((t) => {
      const product = state.products.find((p) => p.id === t.productId);
      return `<tr><td>${new Date(t.at).toLocaleString('vi-VN')}</td><td>${product?.name || 'Đã xóa'}</td><td>${t.qty}</td></tr>`;
    })
    .join('');

  return `
    <h2>${title}</h2>
    <div class="card">
      <div class="grid">
        <label>Sản phẩm<select id="move-product">${options}</select></label>
        <label>Số lượng<input id="move-qty" type="number" min="1" value="1" /></label>
      </div>
      <div class="actions"><button id="save-move">Lưu ${title.toLowerCase()}</button></div>
    </div>
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Thời gian</th><th>Sản phẩm</th><th>Số lượng</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function attachMoveHandlers(root, type) {
  root.querySelector('#save-move').addEventListener('click', () => {
    const productId = root.querySelector('#move-product').value;
    const qty = Number(root.querySelector('#move-qty').value);
    const product = state.products.find((p) => p.id === productId);

    if (!product || Number.isNaN(qty) || qty <= 0) {
      alert('Dữ liệu không hợp lệ.');
      return;
    }

    if (type === 'out' && product.stock < qty) {
      alert('Không đủ tồn kho để xuất.');
      return;
    }

    if (type === 'in') product.stock += qty;
    if (type === 'out') product.stock -= qty;

    state.transactions.push({ id: crypto.randomUUID(), type, productId, qty, at: Date.now() });
    renderAll();
  });
}

function renderSuppliers() {
  const root = document.getElementById('suppliers');
  const rows = state.suppliers.map((s) => `
    <tr>
      <td>${s.name}</td>
      <td>${s.contact}</td>
      <td><button class="danger" data-id="${s.id}">Xóa</button></td>
    </tr>
  `).join('');

  root.innerHTML = `
    <h2>Nhà cung cấp</h2>
    <div class="card">
      <form id="supplier-form" class="grid">
        <label>Tên nhà cung cấp<input name="name" required /></label>
        <label>Liên hệ<input name="contact" required /></label>
      </form>
      <div class="actions"><button id="add-supplier">Thêm nhà cung cấp</button></div>
    </div>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>Tên</th><th>Liên hệ</th><th>Hành động</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  root.querySelector('#add-supplier').addEventListener('click', () => {
    const formData = new FormData(root.querySelector('#supplier-form'));
    const name = String(formData.get('name') || '').trim();
    const contact = String(formData.get('contact') || '').trim();
    if (!name || !contact) {
      alert('Vui lòng nhập đủ thông tin nhà cung cấp.');
      return;
    }
    state.suppliers.push({ id: crypto.randomUUID(), name, contact });
    renderAll();
  });

  root.querySelectorAll('button.danger').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.suppliers = state.suppliers.filter((s) => s.id !== btn.dataset.id);
      renderAll();
    });
  });
}
