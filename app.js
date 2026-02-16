const STORAGE_KEY = "enterprise-wms-data-v1";
const MAX_CAPACITY = 10000;

const defaultData = {
  items: [
    { sku: "RM-CPU-001", name: "Intel Xeon Gold", category: "Linh kiện", quantity: 320, threshold: 80, unitPrice: 9200000 },
    { sku: "RM-RAM-016", name: "RAM ECC 16GB", category: "Linh kiện", quantity: 640, threshold: 120, unitPrice: 1650000 },
    { sku: "NW-SW-024", name: "Switch Layer 3 24 Port", category: "Thiết bị mạng", quantity: 28, threshold: 15, unitPrice: 14200000 },
    { sku: "SRV-PSU-750", name: "Nguồn Server 750W", category: "Phụ kiện", quantity: 42, threshold: 30, unitPrice: 2900000 }
  ],
  movements: [
    { id: crypto.randomUUID(), sku: "NW-SW-024", type: "out", qty: 4, note: "SO-2026-00031", createdAt: new Date().toISOString() }
  ]
};

const state = loadData();

const inventoryTable = document.getElementById("inventoryTable");
const movementList = document.getElementById("movementList");
const movementSku = document.getElementById("movementSku");
const itemForm = document.getElementById("itemForm");
const movementForm = document.getElementById("movementForm");
const searchInput = document.getElementById("searchInput");

const totalSku = document.getElementById("totalSku");
const totalStock = document.getElementById("totalStock");
const inventoryValue = document.getElementById("inventoryValue");
const lowStockCount = document.getElementById("lowStockCount");
const capacityText = document.getElementById("capacityText");
const capacityBar = document.getElementById("capacityBar");
const capacityInfo = document.getElementById("capacityInfo");

document.getElementById("exportBtn").addEventListener("click", exportCsv);
itemForm.addEventListener("submit", handleAddItem);
movementForm.addEventListener("submit", handleMovement);
searchInput.addEventListener("input", render);

render();

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(defaultData);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filteredItems = state.items.filter((item) => {
    if (!keyword) return true;
    return [item.sku, item.name, item.category].some((v) => v.toLowerCase().includes(keyword));
  });

  inventoryTable.innerHTML = filteredItems
    .map((item) => {
      const low = item.quantity <= item.threshold;
      return `
        <tr>
          <td>${item.sku}</td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td class="${low ? "low-stock" : ""}">${formatNumber(item.quantity)}</td>
          <td>${formatNumber(item.threshold)}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
        </tr>
      `;
    })
    .join("");

  movementSku.innerHTML = state.items
    .map((item) => `<option value="${item.sku}">${item.sku} - ${item.name}</option>`)
    .join("");

  const movementUi = [...state.movements]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(
      (mv) => `
      <li>
        <div><strong>${mv.sku}</strong> • ${formatNumber(mv.qty)} đơn vị • ${formatDate(mv.createdAt)}</div>
        <div>
          <span class="tag ${mv.type}">${mv.type === "in" ? "Nhập kho" : "Xuất kho"}</span>
          <span>${mv.note || "Không có ghi chú"}</span>
        </div>
      </li>
    `
    )
    .join("");

  movementList.innerHTML = movementUi || "<li>Chưa có giao dịch.</li>";

  const totalQty = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalVal = state.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const lowCount = state.items.filter((item) => item.quantity <= item.threshold).length;
  const capacityRate = Math.min((totalQty / MAX_CAPACITY) * 100, 100);

  totalSku.textContent = formatNumber(state.items.length);
  totalStock.textContent = formatNumber(totalQty);
  inventoryValue.textContent = formatCurrency(totalVal);
  lowStockCount.textContent = formatNumber(lowCount);

  capacityText.textContent = `${capacityRate.toFixed(1)}% sử dụng`;
  capacityBar.style.width = `${capacityRate}%`;
  capacityInfo.textContent = `${formatNumber(totalQty)}/${formatNumber(MAX_CAPACITY)} đơn vị`;

  persist();
}

function handleAddItem(event) {
  event.preventDefault();
  const sku = document.getElementById("sku").value.trim().toUpperCase();
  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value.trim();
  const quantity = Number(document.getElementById("quantity").value);
  const threshold = Number(document.getElementById("threshold").value);
  const unitPrice = Number(document.getElementById("unitPrice").value);

  if (state.items.some((item) => item.sku === sku)) {
    alert("SKU đã tồn tại, vui lòng dùng SKU khác.");
    return;
  }

  state.items.push({ sku, name, category, quantity, threshold, unitPrice });
  itemForm.reset();
  render();
}

function handleMovement(event) {
  event.preventDefault();
  const sku = document.getElementById("movementSku").value;
  const type = document.getElementById("movementType").value;
  const qty = Number(document.getElementById("movementQty").value);
  const note = document.getElementById("movementNote").value.trim();

  const item = state.items.find((i) => i.sku === sku);
  if (!item) return;

  if (type === "out" && item.quantity < qty) {
    alert("Số lượng xuất vượt quá tồn kho hiện tại.");
    return;
  }

  item.quantity += type === "in" ? qty : -qty;
  state.movements.push({
    id: crypto.randomUUID(),
    sku,
    type,
    qty,
    note,
    createdAt: new Date().toISOString()
  });

  movementForm.reset();
  render();
}

function exportCsv() {
  const rows = ["SKU,Tên sản phẩm,Danh mục,Tồn kho,Ngưỡng,Đơn giá"]; 
  for (const item of state.items) {
    rows.push(
      [item.sku, item.name, item.category, item.quantity, item.threshold, item.unitPrice]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",")
    );
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(iso));
}
