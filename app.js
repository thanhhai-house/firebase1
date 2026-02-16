const appState = {
  brands: ["Bosch", "3M", "Total"],
  categories: ["Lọc", "Phụ tùng", "Dầu nhớt"],
  locations: ["Kệ A1", "Kệ B2", "Kho lạnh"],
  products: [
    {
      sku: "SKU-001",
      name: "Lọc dầu động cơ",
      brand: "Bosch",
      category: "Lọc",
      oem: "OEM-7781",
      quantity: 20,
      threshold: 8,
      price: 350000,
      location: "Kệ A1",
      image: ""
    }
  ],
  movements: [],
  suppliers: [],
  latestInvoice: null
};

const byId = (id) => document.getElementById(id);
const money = (value) => Number(value || 0).toLocaleString("vi-VN");

function initNavigation() {
  document.querySelectorAll(".menu-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".menu-btn").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
      button.classList.add("active");
      byId(button.dataset.screen).classList.add("active");
    });
  });

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      byId(`tab-${button.dataset.tab}`).classList.add("active");
    });
  });
}

function renderSelect(selectId, values, placeholder) {
  const select = byId(selectId);
  select.innerHTML = values.map((item) => `<option value="${item}">${item}</option>`).join("");
  if (!values.length) {
    select.innerHTML = `<option>${placeholder}</option>`;
  }
}

function renderMasterData() {
  renderSelect("brand-select", appState.brands, "Chưa có thương hiệu");
  renderSelect("category-select", appState.categories, "Chưa có phân loại");
  renderSelect("location-select", appState.locations, "Chưa có vị trí");
}

function renderProductTable(containerId, data) {
  const target = byId(containerId);
  if (!data.length) {
    target.innerHTML = "<p>Chưa có sản phẩm.</p>";
    return;
  }

  target.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SKU</th><th>Tên</th><th>Thương hiệu</th><th>Phân loại</th><th>OEM</th><th>SL</th><th>Ngưỡng</th><th>Giá</th><th>Vị trí</th><th>Ảnh</th><th>Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (product) => `
              <tr>
                <td>${product.sku}</td>
                <td>${product.name}</td>
                <td>${product.brand}</td>
                <td>${product.category}</td>
                <td>${product.oem || "-"}</td>
                <td class="${product.quantity <= product.threshold ? "warning" : ""}">${product.quantity}</td>
                <td>${product.threshold}</td>
                <td>${money(product.price)}đ</td>
                <td>${product.location}</td>
                <td>${product.image ? `<img src="${product.image}" alt="${product.name}" width="40" height="40"/>` : "-"}</td>
                <td><button class="mini-btn danger" data-delete="${product.sku}">Bớt</button></td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  target.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.products = appState.products.filter((product) => product.sku !== button.dataset.delete);
      syncAllViews();
    });
  });
}

function renderMovementHistory() {
  const target = byId("movement-history");
  if (!appState.movements.length) {
    target.innerHTML = "<p>Chưa có lịch sử nhập/xuất.</p>";
    return;
  }
  target.innerHTML = `
    <h3>Lịch sử nhập xuất</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Thời gian</th><th>Loại</th><th>SKU</th><th>Số lượng</th></tr></thead>
        <tbody>
          ${appState.movements
            .map(
              (record) => `<tr><td>${record.time}</td><td>${record.type}</td><td>${record.sku}</td><td>${record.quantity}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSkuSelectors() {
  const options = appState.products.map((product) => `<option value="${product.sku}">${product.sku} - ${product.name}</option>`).join("");
  ["import-sku", "export-sku"].forEach((id) => {
    byId(id).innerHTML = options || "<option>Không có SKU</option>";
  });
  document.querySelectorAll(".sale-sku").forEach((select) => {
    select.innerHTML = options || "<option>Không có SKU</option>";
  });
}

function renderSuppliers() {
  const target = byId("supplier-list");
  if (!appState.suppliers.length) {
    target.innerHTML = "<p>Chưa có nhà cung cấp.</p>";
    return;
  }
  target.innerHTML = `
    <h3>Danh sách nhà cung cấp</h3>
    <ul>
      ${appState.suppliers.map((item) => `<li><strong>${item.name}</strong> - ${item.phone} - ${item.email}</li>`).join("")}
    </ul>
  `;
}

function setupMasterDataButtons() {
  const configs = [
    ["brand", "brands"],
    ["category", "categories"],
    ["location", "locations"]
  ];

  configs.forEach(([name, stateKey]) => {
    byId(`add-${name}`).addEventListener("click", () => {
      const value = window.prompt(`Nhập ${name} mới:`);
      if (value && !appState[stateKey].includes(value)) {
        appState[stateKey].push(value);
        renderMasterData();
      }
    });

    byId(`remove-${name}`).addEventListener("click", () => {
      const select = byId(`${name}-select`);
      appState[stateKey] = appState[stateKey].filter((item) => item !== select.value);
      renderMasterData();
    });
  });
}

function setupProductForm() {
  const form = byId("product-form");
  const categorySelect = byId("category-select");
  const oemField = byId("oem-field");
  const readImage = (fileInput) => {
    const file = fileInput.files[0];
    if (!file) return "";
    return URL.createObjectURL(file);
  };

  categorySelect.addEventListener("change", () => {
    oemField.classList.toggle("hidden", categorySelect.value !== "Lọc");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const uploadedImage = readImage(byId("upload-image")) || readImage(byId("camera-image"));

    const product = {
      sku: data.get("sku"),
      name: data.get("name"),
      brand: data.get("brand"),
      category: data.get("category"),
      oem: data.get("oem"),
      quantity: Number(data.get("quantity")),
      threshold: Number(data.get("threshold")),
      price: Number(data.get("price")),
      location: data.get("location"),
      image: uploadedImage
    };

    const existing = appState.products.findIndex((item) => item.sku === product.sku);
    if (existing >= 0) {
      appState.products[existing] = { ...appState.products[existing], ...product };
    } else {
      appState.products.push(product);
    }

    form.reset();
    oemField.classList.add("hidden");
    syncAllViews();
  });
}

function updateInventory(type, sku, quantity) {
  const product = appState.products.find((item) => item.sku === sku);
  if (!product) return;
  if (type === "Xuất" && product.quantity < quantity) {
    window.alert("Số lượng tồn kho không đủ để xuất.");
    return;
  }

  product.quantity += type === "Nhập" ? quantity : -quantity;
  appState.movements.unshift({
    time: new Date().toLocaleString("vi-VN"),
    type,
    sku,
    quantity
  });
  syncAllViews();
}

function setupImportExportForms() {
  byId("import-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    updateInventory("Nhập", data.get("sku"), Number(data.get("quantity")));
    event.target.reset();
  });

  byId("export-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    updateInventory("Xuất", data.get("sku"), Number(data.get("quantity")));
    event.target.reset();
  });
}

function setupOverviewSearch() {
  byId("overview-search").addEventListener("input", (event) => {
    const term = event.target.value.toLowerCase().trim();
    const filtered = appState.products.filter(
      (item) => item.sku.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
    );
    renderProductTable("overview-table", filtered);
  });
}

function setupSuppliers() {
  byId("supplier-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    appState.suppliers.push({
      name: data.get("name"),
      phone: data.get("phone"),
      email: data.get("email")
    });
    event.target.reset();
    renderSuppliers();
  });
}

function addSaleRow() {
  const template = byId("sale-row-template");
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector(".remove-sale-row").addEventListener("click", () => {
    row.remove();
  });
  byId("sales-items").appendChild(row);
  renderSkuSelectors();
}

function setupSales() {
  byId("add-sale-row").addEventListener("click", addSaleRow);
  addSaleRow();

  byId("sales-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const customer = event.target.customer.value;
    const rows = [...document.querySelectorAll(".sales-row")];
    const items = rows
      .map((row) => ({ sku: row.querySelector(".sale-sku").value, quantity: Number(row.querySelector(".sale-qty").value) }))
      .filter((item) => item.sku && item.quantity > 0);

    if (!items.length) {
      window.alert("Vui lòng chọn ít nhất 1 sản phẩm.");
      return;
    }

    const detail = items.map((entry) => {
      const product = appState.products.find((item) => item.sku === entry.sku);
      return {
        ...entry,
        name: product?.name || "",
        unitPrice: product?.price || 0,
        lineTotal: (product?.price || 0) * entry.quantity
      };
    });

    appState.latestInvoice = {
      id: `INV-${Date.now()}`,
      customer,
      createdAt: new Date().toLocaleString("vi-VN"),
      items: detail,
      total: detail.reduce((sum, item) => sum + item.lineTotal, 0)
    };

    detail.forEach((item) => updateInventory("Xuất", item.sku, item.quantity));
    renderSalesPreview();
  });
}

function renderSalesPreview() {
  const target = byId("sales-preview");
  const invoice = appState.latestInvoice;
  if (!invoice) {
    target.innerHTML = "<p>Chưa có đơn hàng nào.</p>";
    return;
  }

  target.innerHTML = `
    <h3>Đơn hàng ${invoice.id}</h3>
    <p>Khách hàng: <strong>${invoice.customer}</strong> | Thời gian: ${invoice.createdAt}</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>SKU</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
        <tbody>
          ${invoice.items
            .map((item) => `<tr><td>${item.sku}</td><td>${item.name}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}đ</td><td>${money(item.lineTotal)}đ</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
    <p><strong>Tổng cộng: ${money(invoice.total)}đ</strong></p>
    <div class="sales-preview-actions">
      <button class="primary" id="view-pdf">Xem PDF đơn hàng</button>
    </div>
  `;

  byId("view-pdf").addEventListener("click", () => {
    const html = `
      <html>
      <head><title>${invoice.id}</title><style>body{font-family:Arial;padding:24px;} table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;}</style></head>
      <body>
        <h2>HÓA ĐƠN ${invoice.id}</h2>
        <p>Khách hàng: ${invoice.customer}</p>
        <p>Ngày tạo: ${invoice.createdAt}</p>
        <table>
          <thead><tr><th>SKU</th><th>Tên</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>${invoice.items
            .map((item) => `<tr><td>${item.sku}</td><td>${item.name}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}đ</td><td>${money(item.lineTotal)}đ</td></tr>`)
            .join("")}</tbody>
        </table>
        <h3>Tổng: ${money(invoice.total)}đ</h3>
      </body>
      </html>
    `;
    const popup = window.open("", "_blank");
    popup.document.write(html);
    popup.document.close();
    popup.focus();
  });
}

function syncAllViews() {
  renderProductTable("inventory-table", appState.products);
  renderProductTable("overview-table", appState.products);
  renderMovementHistory();
  renderSkuSelectors();
  renderSalesPreview();
}

function bootstrap() {
  initNavigation();
  renderMasterData();
  setupMasterDataButtons();
  setupProductForm();
  setupImportExportForms();
  setupOverviewSearch();
  setupSuppliers();
  setupSales();
  renderSuppliers();
  syncAllViews();
}

bootstrap();
