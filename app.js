const tabs = document.querySelectorAll('.tab');
const menuItems = document.querySelectorAll('.menu-item');
const pageTitle = document.getElementById('page-title');

const productForm = document.getElementById('product-form');
const categorySelect = document.getElementById('category-select');
const oemLabel = document.getElementById('oem-label');
const imageUpload = document.getElementById('image-upload');
const previewImage = document.getElementById('preview-image');
const clearImageButton = document.getElementById('clear-image');

const inventoryBody = document.getElementById('inventory-body');
const overviewBody = document.getElementById('overview-body');
const historyBody = document.getElementById('history-body');

const importForm = document.getElementById('import-form');
const exportForm = document.getElementById('export-form');
const salesForm = document.getElementById('sales-form');

const totalProductsEl = document.getElementById('stat-total-products');
const totalStockEl = document.getElementById('stat-total-stock');
const lowStockEl = document.getElementById('stat-low-stock');
const stockValueEl = document.getElementById('stat-stock-value');

const camera = document.getElementById('camera');
const cameraCanvas = document.getElementById('camera-canvas');
const startCameraButton = document.getElementById('start-camera');
const capturePhotoButton = document.getElementById('capture-photo');

let cameraStream;
let activeImage = '';

const products = [];
const historyLogs = [];

menuItems.forEach((button) => {
  button.addEventListener('click', () => {
    menuItems.forEach((item) => item.classList.remove('active'));
    tabs.forEach((tab) => tab.classList.remove('active'));

    button.classList.add('active');
    const tabId = button.dataset.tab;
    document.getElementById(tabId).classList.add('active');
    pageTitle.textContent = button.textContent;
  });
});

categorySelect.addEventListener('change', () => {
  const isFilter = categorySelect.value === 'Lọc';
  oemLabel.classList.toggle('hidden', !isFilter);
  oemLabel.querySelector('input').required = isFilter;
});

imageUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    activeImage = String(reader.result);
    previewImage.src = activeImage;
  };
  reader.readAsDataURL(file);
});

clearImageButton.addEventListener('click', () => {
  activeImage = '';
  previewImage.src = '';
  imageUpload.value = '';
});

startCameraButton.addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Trình duyệt không hỗ trợ camera.');
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = cameraStream;
  } catch (error) {
    alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
  }
});

capturePhotoButton.addEventListener('click', () => {
  if (!cameraStream) {
    alert('Vui lòng mở camera trước khi chụp ảnh.');
    return;
  }

  const ctx = cameraCanvas.getContext('2d');
  cameraCanvas.width = camera.videoWidth || 640;
  cameraCanvas.height = camera.videoHeight || 480;
  ctx.drawImage(camera, 0, 0, cameraCanvas.width, cameraCanvas.height);
  activeImage = cameraCanvas.toDataURL('image/png');
  previewImage.src = activeImage;
});

productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const sku = String(formData.get('sku')).trim();

  if (products.some((item) => item.sku === sku)) {
    alert('SKU đã tồn tại. Vui lòng sử dụng SKU khác.');
    return;
  }

  const product = {
    sku,
    name: String(formData.get('name')).trim(),
    brand: String(formData.get('brand')).trim(),
    category: String(formData.get('category')).trim(),
    oem: String(formData.get('oem') || '').trim(),
    quantity: Number(formData.get('quantity')),
    threshold: Number(formData.get('threshold')),
    price: Number(formData.get('price')),
    location: String(formData.get('location')).trim(),
    image: activeImage,
  };

  products.push(product);
  historyLogs.unshift(makeLog('THÊM SẢN PHẨM', product.sku, product.quantity, 'Khởi tạo tồn kho'));

  renderAll();
  productForm.reset();
  activeImage = '';
  previewImage.src = '';
  oemLabel.classList.add('hidden');
});

importForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleStockChange(event.target, 'NHẬP');
});

exportForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleStockChange(event.target, 'XUẤT');
});

salesForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleStockChange(event.target, 'BÁN HÀNG');
});

function handleStockChange(form, type) {
  const formData = new FormData(form);
  const sku = String(formData.get('sku')).trim();
  const quantity = Number(formData.get('quantity'));

  const product = products.find((item) => item.sku === sku);
  if (!product) {
    alert(`Không tìm thấy sản phẩm với SKU: ${sku}`);
    return;
  }

  if ((type === 'XUẤT' || type === 'BÁN HÀNG') && product.quantity < quantity) {
    alert('Số lượng tồn kho không đủ để thực hiện thao tác.');
    return;
  }

  if (type === 'NHẬP') product.quantity += quantity;
  if (type === 'XUẤT' || type === 'BÁN HÀNG') product.quantity -= quantity;

  historyLogs.unshift(makeLog(type, sku, quantity, `Cập nhật tồn kho ${product.location}`));
  renderAll();
  form.reset();
}

function makeLog(type, sku, quantity, note) {
  return {
    date: new Date().toLocaleString('vi-VN'),
    type,
    sku,
    quantity,
    note,
  };
}

function removeProduct(sku) {
  const index = products.findIndex((item) => item.sku === sku);
  if (index < 0) return;

  const [removed] = products.splice(index, 1);
  historyLogs.unshift(makeLog('XÓA SẢN PHẨM', removed.sku, removed.quantity, 'Xóa khỏi danh mục'));
  renderAll();
}

function renderAll() {
  renderInventory();
  renderOverview();
  renderHistory();
  renderStats();
}

function renderInventory() {
  inventoryBody.innerHTML = products
    .map(
      (item) => `
        <tr>
          <td>${item.sku}</td>
          <td>${item.name}</td>
          <td>${item.location}</td>
          <td>${item.quantity}</td>
          <td><button class="remove" data-remove="${item.sku}">Xóa</button></td>
        </tr>`
    )
    .join('');

  inventoryBody.querySelectorAll('button[data-remove]').forEach((button) => {
    button.addEventListener('click', () => removeProduct(button.dataset.remove));
  });
}

function renderOverview() {
  overviewBody.innerHTML = products
    .map(
      (item) => `
        <tr>
          <td>${item.image ? `<img class="thumb" src="${item.image}" alt="${item.name}">` : '-'}</td>
          <td>${item.sku}</td>
          <td>${item.name}</td>
          <td>${item.brand}</td>
          <td>${item.category}</td>
          <td>${item.oem || '-'}</td>
          <td>${item.quantity}</td>
          <td>${item.threshold}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${item.location}</td>
        </tr>`
    )
    .join('');
}

function renderHistory() {
  historyBody.innerHTML = historyLogs
    .map(
      (log) => `
        <tr>
          <td>${log.date}</td>
          <td>${log.type}</td>
          <td>${log.sku}</td>
          <td>${log.quantity}</td>
          <td>${log.note}</td>
        </tr>`
    )
    .join('');
}

function renderStats() {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = products.filter((item) => item.quantity <= item.threshold).length;
  const stockValue = products.reduce((sum, item) => sum + item.price * item.quantity, 0);

  totalProductsEl.textContent = String(totalProducts);
  totalStockEl.textContent = String(totalStock);
  lowStockEl.textContent = String(lowStock);
  stockValueEl.textContent = formatCurrency(stockValue);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

renderAll();
