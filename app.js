const MENU_ITEMS = [
  { id: "overview", label: "Tổng quan" },
  { id: "inventory", label: "Tồn kho" },
  { id: "import", label: "Nhập" },
  { id: "export", label: "Xuất" },
  { id: "history", label: "Lịch sử nhập xuất" },
  { id: "sales", label: "Bán hàng" },
  { id: "suppliers", label: "Nhà cung cấp" }
];

const state = {
  products: [],
  categories: ["Lọc", "Điện", "Dầu nhớt"],
  history: [],
  suppliers: [],
  saleItems: []
};

const storageKey = "quanLyKhoDataV1";

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  Object.assign(state, parsed);
}

function buildMenu() {
  const menu = document.getElementById("menu");
  menu.innerHTML = "";
  MENU_ITEMS.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.classList.toggle("active", index === 0);
    btn.onclick = () => showPage(item.id, btn);
    menu.appendChild(btn);
  });
}

function showPage(id, activeBtn) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".menu button").forEach((b) => b.classList.remove("active"));
  activeBtn.classList.add("active");
}

function renderCategories() {
  const category = document.getElementById("category");
  category.innerHTML = state.categories.map((c) => `<option value="${c}">${c}</option>`).join("");
  category.onchange = toggleOem;
}

function toggleOem() {
  const selected = document.getElementById("category").value;
  const oemField = document.getElementById("oemField");
  oemField.classList.toggle("hidden", selected !== "Lọc");
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  toggleOem();
}

async function onSaveProduct(event) {
  event.preventDefault();
  const id = document.getElementById("productId").value || uid();
  const imageInput = document.getElementById("imageFile");
  const cameraInput = document.getElementById("cameraCapture");

  let image = "";
  const file = imageInput.files[0] || cameraInput.files[0];
  if (file) image = await fileToBase64(file);

  const product = {
    id,
    sku: document.getElementById("sku").value.trim(),
    name: document.getElementById("name").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    category: document.getElementById("category").value,
    oem: document.getElementById("oem").value.trim(),
    quantity: Number(document.getElementById("quantity").value),
    threshold: Number(document.getElementById("threshold").value),
    price: Number(document.getElementById("price").value),
    location: document.getElementById("location").value.trim(),
    image
  };

  const existing = state.products.find((p) => p.id === id);
  if (existing) {
    Object.assign(existing, product, { image: image || existing.image });
  } else {
    state.products.push(product);
  }

  saveState();
  resetProductForm();
  renderAll();
}

function renderInventoryTable() {
  const tbody = document.getElementById("inventoryTable");
  tbody.innerHTML = state.products
    .map(
      (p) => `<tr>
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>${p.brand}</td>
      <td>${p.category}</td>
      <td>${p.location}</td>
      <td>${p.quantity}</td>
      <td>
        <button class="secondary" data-edit="${p.id}">Sửa</button>
        <button class="danger" data-delete="${p.id}">Xóa</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () => {
      const product = state.products.find((p) => p.id === btn.dataset.edit);
      if (!product) return;
      document.getElementById("productId").value = product.id;
      document.getElementById("sku").value = product.sku;
      document.getElementById("name").value = product.name;
      document.getElementById("brand").value = product.brand;
      document.getElementById("category").value = product.category;
      document.getElementById("oem").value = product.oem || "";
      document.getElementById("quantity").value = product.quantity;
      document.getElementById("threshold").value = product.threshold;
      document.getElementById("price").value = product.price;
      document.getElementById("location").value = product.location;
      toggleOem();
    };
  });

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = () => {
      state.products = state.products.filter((p) => p.id !== btn.dataset.delete);
      saveState();
      renderAll();
    };
  });
}

function renderOverview() {
  const q = document.getElementById("overviewSearch").value.toLowerCase().trim();
  const filtered = state.products.filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  document.getElementById("overviewTable").innerHTML = filtered
    .map(
      (p) => `<tr>
      <td>${p.image ? `<img src="${p.image}" alt="${p.name}">` : "-"}</td>
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>${p.brand}</td>
      <td>${p.category}</td>
      <td>${p.oem || "-"}</td>
      <td>${p.quantity}</td>
      <td>${formatMoney(p.price)}</td>
      <td>${p.location}</td>
    </tr>`
    )
    .join("");

  const lowStock = state.products.filter((p) => p.quantity <= p.threshold).length;
  const totalStock = state.products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = state.products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  document.getElementById("overviewStats").innerHTML = `
    <div class="card"><strong>${state.products.length}</strong><br/>Mặt hàng</div>
    <div class="card"><strong>${totalStock}</strong><br/>Tổng tồn</div>
    <div class="card"><strong>${lowStock}</strong><br/>Sắp hết hàng</div>
    <div class="card"><strong>${formatMoney(totalValue)}</strong><br/>Giá trị kho</div>
  `;
}

function populateProductSelects() {
  const options = state.products
    .map((p) => `<option value="${p.id}">${p.sku} - ${p.name} (${p.quantity})</option>`)
    .join("");
  ["importProduct", "exportProduct", "saleProduct"].forEach((id) => {
    document.getElementById(id).innerHTML = options || "<option>Chưa có sản phẩm</option>";
  });
}

function logHistory(type, product, qty, note = "") {
  state.history.unshift({ id: uid(), type, product, qty, note, at: new Date().toLocaleString("vi-VN") });
}

function renderHistory() {
  document.getElementById("historyTable").innerHTML = state.history
    .map(
      (h) => `<tr><td>${h.at}</td><td>${h.type}</td><td>${h.product}</td><td>${h.qty}</td><td>${h.note || "-"}</td></tr>`
    )
    .join("");
}

function updateStock(productId, qtyChange, type, note) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return alert("Sản phẩm không tồn tại");
  if (product.quantity + qtyChange < 0) return alert("Số lượng tồn không đủ");
  product.quantity += qtyChange;
  logHistory(type, `${product.sku} - ${product.name}`, Math.abs(qtyChange), note);
  saveState();
  renderAll();
}

function initImportExport() {
  document.getElementById("importForm").onsubmit = (e) => {
    e.preventDefault();
    updateStock(
      document.getElementById("importProduct").value,
      Number(document.getElementById("importQty").value),
      "Nhập",
      document.getElementById("importNote").value
    );
    e.target.reset();
  };

  document.getElementById("exportForm").onsubmit = (e) => {
    e.preventDefault();
    updateStock(
      document.getElementById("exportProduct").value,
      -Number(document.getElementById("exportQty").value),
      "Xuất",
      document.getElementById("exportNote").value
    );
    e.target.reset();
  };
}

function renderSaleItems() {
  const tbody = document.getElementById("saleItemsTable");
  tbody.innerHTML = state.saleItems
    .map(
      (item) => `<tr>
      <td>${item.sku} - ${item.name}</td>
      <td>${item.qty}</td>
      <td>${formatMoney(item.price)}</td>
      <td>${formatMoney(item.qty * item.price)}</td>
      <td><button class="danger" data-remove-sale="${item.productId}">Xóa</button></td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-remove-sale]").forEach((btn) => {
    btn.onclick = () => {
      state.saleItems = state.saleItems.filter((i) => i.productId !== btn.dataset.removeSale);
      renderSaleItems();
      renderInvoicePreview();
    };
  });

  const total = state.saleItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  document.getElementById("saleTotal").textContent = `Tổng: ${formatMoney(total)}`;
}

function renderInvoicePreview() {
  const orderCode = document.getElementById("orderCode").value || `DH-${Date.now().toString().slice(-6)}`;
  const customer = document.getElementById("customerName").value || "Khách lẻ";
  const note = document.getElementById("saleNote").value || "-";
  const rows = state.saleItems
    .map(
      (i, idx) => `<tr><td>${idx + 1}</td><td>${i.sku} - ${i.name}</td><td>${i.qty}</td><td>${formatMoney(i.price)}</td><td>${formatMoney(
        i.qty * i.price
      )}</td></tr>`
    )
    .join("");
  const total = state.saleItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  document.getElementById("invoicePreview").innerHTML = `
    <h3>HÓA ĐƠN BÁN HÀNG</h3>
    <p><strong>Mã đơn:</strong> ${orderCode}</p>
    <p><strong>Khách hàng:</strong> ${customer}</p>
    <p><strong>Ghi chú:</strong> ${note}</p>
    <table>
      <thead><tr><th>#</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
      <tbody>${rows || "<tr><td colspan='5'>Chưa có sản phẩm</td></tr>"}</tbody>
    </table>
    <p class="total">Tổng thanh toán: ${formatMoney(total)}</p>
  `;
}

function openInvoicePdfView() {
  const printWindow = window.open("", "_blank");
  const html = `
    <html>
      <head><title>PDF đơn hàng</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}h1{margin:0 0 12px}</style></head>
      <body>${document.getElementById("invoicePreview").innerHTML}<script>window.onload=()=>window.print()</script></body>
    </html>`;
  printWindow.document.write(html);
  printWindow.document.close();
}

function initSales() {
  document.getElementById("addSaleItem").onclick = () => {
    const productId = document.getElementById("saleProduct").value;
    const qty = Number(document.getElementById("saleQty").value || 0);
    const product = state.products.find((p) => p.id === productId);
    if (!product || qty <= 0) return;
    const existing = state.saleItems.find((i) => i.productId === productId);
    if (existing) existing.qty += qty;
    else state.saleItems.push({ productId, sku: product.sku, name: product.name, qty, price: product.price });
    renderSaleItems();
    renderInvoicePreview();
  };

  document.getElementById("saleForm").onsubmit = (e) => {
    e.preventDefault();
    if (!state.saleItems.length) return alert("Vui lòng thêm sản phẩm vào đơn");
    for (const item of state.saleItems) {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product || product.quantity < item.qty) return alert(`Không đủ tồn cho ${item.name}`);
    }
    state.saleItems.forEach((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      product.quantity -= item.qty;
      logHistory("Bán hàng", `${product.sku} - ${product.name}`, item.qty, `Đơn ${document.getElementById("orderCode").value || "N/A"}`);
    });
    state.saleItems = [];
    saveState();
    renderAll();
    e.target.reset();
    renderInvoicePreview();
  };

  document.getElementById("viewInvoice").onclick = openInvoicePdfView;
  ["orderCode", "customerName", "saleNote"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderInvoicePreview);
  });
}

function initSuppliers() {
  document.getElementById("supplierForm").onsubmit = (e) => {
    e.preventDefault();
    state.suppliers.push({
      id: uid(),
      name: document.getElementById("supplierName").value,
      contact: document.getElementById("supplierContact").value,
      category: document.getElementById("supplierCategory").value
    });
    saveState();
    e.target.reset();
    renderSuppliers();
  };
}

function renderSuppliers() {
  document.getElementById("supplierList").innerHTML = state.suppliers
    .map((s) => `<li><strong>${s.name}</strong><br/>Liên hệ: ${s.contact || "-"}<br/>Cung cấp: ${s.category || "-"}</li>`)
    .join("");
}

function initCategoryActions() {
  document.getElementById("addCategoryBtn").onclick = () => {
    const value = document.getElementById("newCategory").value.trim();
    if (!value || state.categories.includes(value)) return;
    state.categories.push(value);
    saveState();
    renderCategories();
    document.getElementById("newCategory").value = "";
  };

  document.getElementById("removeCategoryBtn").onclick = () => {
    const current = document.getElementById("category").value;
    if (current === "Lọc") return alert("Không thể xóa phân loại mặc định Lọc");
    state.categories = state.categories.filter((c) => c !== current);
    state.products = state.products.map((p) => (p.category === current ? { ...p, category: "Lọc" } : p));
    saveState();
    renderAll();
  };
}

function renderAll() {
  renderCategories();
  toggleOem();
  renderOverview();
  renderInventoryTable();
  populateProductSelects();
  renderHistory();
  renderSaleItems();
  renderInvoicePreview();
  renderSuppliers();
}

function init() {
  loadState();
  buildMenu();
  renderCategories();
  document.getElementById("productForm").onsubmit = onSaveProduct;
  document.getElementById("resetProductForm").onclick = resetProductForm;
  document.getElementById("overviewSearch").addEventListener("input", renderOverview);
  initImportExport();
  initSales();
  initSuppliers();
  initCategoryActions();
  renderAll();
}

init();
