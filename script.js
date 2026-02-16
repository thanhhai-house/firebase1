const state = {
  brands: ["Bosch", "Daikin", "Panasonic"],
  categories: ["Lọc", "Điện", "Cơ khí"],
  suppliers: ["Công ty Minh Long", "Blue Parts JSC", "Vina Industrial"],
  products: [
    {
      sku: "SKU-001",
      name: "Lọc gió cabin",
      brand: "Bosch",
      category: "Lọc",
      oem: "OEM-8891",
      quantity: 72,
      threshold: 20,
      price: 325000,
      location: "Kệ A1",
      image: "https://via.placeholder.com/100x100.png?text=Loc"
    },
    {
      sku: "SKU-002",
      name: "Van điều áp",
      brand: "Panasonic",
      category: "Cơ khí",
      oem: "",
      quantity: 48,
      threshold: 15,
      price: 910000,
      location: "Kệ B2",
      image: "https://via.placeholder.com/100x100.png?text=Van"
    }
  ],
  history: []
};

const menuTabs = document.getElementById("menuTabs");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");
const tabMeta = {
  "tong-quan": ["Tổng quan sản phẩm", "Theo dõi toàn bộ sản phẩm và tìm kiếm nhanh theo SKU/tên."],
  "ton-kho": ["Quản lý tồn kho", "Thêm, bớt, cập nhật vị trí, ảnh và thông tin doanh nghiệp."],
  nhap: ["Nhập kho", "Tăng số lượng tồn theo từng SKU."],
  xuat: ["Xuất kho", "Giảm số lượng tồn theo nghiệp vụ xuất."],
  "lich-su": ["Lịch sử nhập xuất", "Theo dõi nhật ký nhập/xuất đầy đủ."],
  "ban-hang": ["Bán hàng", "Chọn nhiều sản phẩm trong một đơn và xem PDF."],
  "nha-cung-cap": ["Nhà cung cấp", "Danh sách đối tác cung ứng hiện tại."],
  "cau-hinh": ["Cấu hình danh mục", "Thêm/bớt thương hiệu và phân loại sản phẩm."],
};

menuTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-item");
  if (!btn) return;
  document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"));
  document.querySelectorAll(".panel").forEach((i) => i.classList.remove("visible"));
  btn.classList.add("active");
  const tab = btn.dataset.tab;
  document.getElementById(`tab-${tab}`).classList.add("visible");
  pageTitle.textContent = tabMeta[tab][0];
  pageDescription.textContent = tabMeta[tab][1];
});

function currency(v) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

function renderOverview(filter = "") {
  const tbody = document.getElementById("overviewTableBody");
  tbody.innerHTML = "";
  const q = filter.trim().toLowerCase();
  state.products
    .filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
    .forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img class="thumb" src="${p.image || "https://via.placeholder.com/100"}" alt="${p.name}" /></td>
        <td>${p.sku}</td>
        <td>${p.name}</td>
        <td>${p.brand}</td>
        <td>${p.category}</td>
        <td>${p.oem || "-"}</td>
        <td>${p.quantity}</td>
        <td>${p.threshold}</td>
        <td>${currency(p.price)}</td>
        <td>${p.location}</td>
      `;
      tbody.appendChild(tr);
    });
}

function renderInventory() {
  const tbody = document.getElementById("inventoryTableBody");
  tbody.innerHTML = "";
  state.products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td>${p.quantity}</td>
      <td>${p.location}</td>
      <td>
        <button class="ghost" data-edit="${p.sku}">Sửa</button>
        <button class="remove" data-remove="${p.sku}">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => fillForm(btn.dataset.edit));
  });
  tbody.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeProduct(btn.dataset.remove));
  });
}

function renderSelectOptions() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = state.categories.map((c) => `<option value="${c}">${c}</option>`).join("");

  ["importSku", "exportSku"].forEach((id) => {
    const select = document.getElementById(id);
    select.innerHTML = state.products.map((p) => `<option value="${p.sku}">${p.sku} - ${p.name}</option>`).join("");
  });
}

function renderSales() {
  const container = document.getElementById("salesSelection");
  container.innerHTML = "";
  state.products.forEach((p) => {
    const row = document.createElement("div");
    row.className = "sales-item";
    row.innerHTML = `<span>${p.name}</span><input type="number" min="0" max="${p.quantity}" value="0" data-sale="${p.sku}" />`;
    container.appendChild(row);
  });
}

function renderHistory() {
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = "";
  state.history.slice().reverse().forEach((h) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${h.time}</td><td>${h.type}</td><td>${h.sku}</td><td>${h.qty}</td><td>${h.note}</td>`;
    tbody.appendChild(tr);
  });
}

function renderSuppliers() {
  document.getElementById("suppliers").innerHTML = state.suppliers.map((s) => `<li>${s}</li>`).join("");
}

function renderTags() {
  const brandList = document.getElementById("brandList");
  brandList.innerHTML = state.brands
    .map((b) => `<li>${b}<button class="remove" data-brand="${b}">x</button></li>`)
    .join("");
  brandList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      state.brands = state.brands.filter((x) => x !== btn.dataset.brand);
      renderTags();
    };
  });

  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = state.categories
    .map((c) => `<li>${c}<button class="remove" data-category="${c}">x</button></li>`)
    .join("");
  categoryList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      state.categories = state.categories.filter((x) => x !== btn.dataset.category);
      renderTags();
      renderSelectOptions();
    };
  });
}

function fillForm(sku) {
  const p = state.products.find((i) => i.sku === sku);
  if (!p) return;
  document.getElementById("sku").value = p.sku;
  document.getElementById("productName").value = p.name;
  document.getElementById("brand").value = p.brand;
  document.getElementById("category").value = p.category;
  document.getElementById("oem").value = p.oem;
  document.getElementById("quantity").value = p.quantity;
  document.getElementById("threshold").value = p.threshold;
  document.getElementById("price").value = p.price;
  document.getElementById("location").value = p.location;
  toggleOem();
}

function removeProduct(sku) {
  state.products = state.products.filter((p) => p.sku !== sku);
  renderAll();
}

function toggleOem() {
  const isFilter = document.getElementById("category").value === "Lọc";
  document.getElementById("oemWrapper").classList.toggle("hidden", !isFilter);
}

document.getElementById("category").addEventListener("change", toggleOem);
document.getElementById("searchProduct").addEventListener("input", (e) => renderOverview(e.target.value));

document.getElementById("productForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const imageInput = document.getElementById("imageUpload");
  const captureInput = document.getElementById("imageCapture");
  const file = imageInput.files[0] || captureInput.files[0];

  const payload = {
    sku: document.getElementById("sku").value.trim(),
    name: document.getElementById("productName").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    category: document.getElementById("category").value,
    oem: document.getElementById("oem").value.trim(),
    quantity: Number(document.getElementById("quantity").value),
    threshold: Number(document.getElementById("threshold").value),
    price: Number(document.getElementById("price").value),
    location: document.getElementById("location").value.trim(),
    image: "",
  };

  const saveProduct = (image = "") => {
    payload.image = image || state.products.find((p) => p.sku === payload.sku)?.image || "";
    const idx = state.products.findIndex((p) => p.sku === payload.sku);
    if (idx >= 0) {
      state.products[idx] = payload;
    } else {
      state.products.push(payload);
    }
    e.target.reset();
    toggleOem();
    renderAll();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => saveProduct(reader.result);
    reader.readAsDataURL(file);
  } else {
    saveProduct();
  }
});

document.getElementById("resetForm").addEventListener("click", () => {
  document.getElementById("productForm").reset();
  toggleOem();
});

function stockMovement(type, sku, qty) {
  const p = state.products.find((x) => x.sku === sku);
  if (!p) return;
  if (type === "Nhập") p.quantity += qty;
  if (type === "Xuất") p.quantity = Math.max(0, p.quantity - qty);
  state.history.push({
    time: new Date().toLocaleString("vi-VN"),
    type,
    sku,
    qty,
    note: type === "Xuất" && p.quantity <= p.threshold ? "Chạm ngưỡng giới hạn" : "",
  });
  renderAll();
}

document.getElementById("importForm").addEventListener("submit", (e) => {
  e.preventDefault();
  stockMovement("Nhập", document.getElementById("importSku").value, Number(document.getElementById("importQty").value));
  e.target.reset();
});

document.getElementById("exportForm").addEventListener("submit", (e) => {
  e.preventDefault();
  stockMovement("Xuất", document.getElementById("exportSku").value, Number(document.getElementById("exportQty").value));
  e.target.reset();
});

document.getElementById("createInvoice").addEventListener("click", () => {
  const selected = Array.from(document.querySelectorAll("input[data-sale]"))
    .map((i) => ({ sku: i.dataset.sale, qty: Number(i.value) }))
    .filter((i) => i.qty > 0)
    .map((i) => {
      const p = state.products.find((x) => x.sku === i.sku);
      return { ...p, qty: i.qty, total: i.qty * p.price };
    });

  if (!selected.length) {
    alert("Vui lòng chọn ít nhất 1 sản phẩm.");
    return;
  }

  const grand = selected.reduce((s, i) => s + i.total, 0);
  const html = `
    <html><head><title>Đơn hàng</title></head><body style="font-family:Arial;padding:24px;">
      <h2>Đơn bán hàng</h2>
      <p>Ngày tạo: ${new Date().toLocaleString("vi-VN")}</p>
      <table border="1" cellspacing="0" cellpadding="8" width="100%">
        <tr><th>SKU</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
        ${selected
          .map(
            (i) => `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.qty}</td><td>${currency(i.price)}</td><td>${currency(i.total)}</td></tr>`
          )
          .join("")}
      </table>
      <h3 style="text-align:right;">Tổng: ${currency(grand)}</h3>
      <p style="font-size:12px">Sử dụng Save as PDF của trình duyệt để lưu file PDF.</p>
    </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
});

document.getElementById("brandForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const value = document.getElementById("brandInput").value.trim();
  if (value && !state.brands.includes(value)) state.brands.push(value);
  e.target.reset();
  renderTags();
});

document.getElementById("categoryForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const value = document.getElementById("categoryInput").value.trim();
  if (value && !state.categories.includes(value)) state.categories.push(value);
  e.target.reset();
  renderTags();
  renderSelectOptions();
});

function renderAll() {
  renderOverview(document.getElementById("searchProduct").value);
  renderInventory();
  renderSelectOptions();
  renderSales();
  renderHistory();
  renderSuppliers();
  renderTags();
}

renderAll();
toggleOem();
